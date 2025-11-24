import { reactive, onMounted } from 'vue';

export function useDraggable(initialLeft = 100, initialTop = 50) {
  const position = reactive({ left: initialLeft, top: initialTop });
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let initialPos = { left: 0, top: 0 };

  function loadPosition() {
    chrome.storage.local.get(['vue_panel_pos'], (res) => {
      if (res.vue_panel_pos) {
        position.left = res.vue_panel_pos.left;
        position.top = res.vue_panel_pos.top;
      }
    });
  }

  function savePosition() {
    chrome.storage.local.set({ 'vue_panel_pos': { left: position.left, top: position.top } });
  }

  function startDrag(e) {
    // Chỉ drag khi click vào nền header hoặc drag handle, không phải button
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    initialPos = { left: position.left, top: position.top };
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.userSelect = 'none';
  }

  function onDrag(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    position.left = initialPos.left + dx;
    position.top = initialPos.top + dy;
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.userSelect = '';
    savePosition();
  }

  onMounted(() => {
    loadPosition();
  });

  return {
    position,
    startDrag
  };
}
