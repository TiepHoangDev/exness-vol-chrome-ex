<template>
  <div 
    ref="panelRef" 
    class="ex-panel" 
    :style="{ left: position.left + 'px', top: position.top + 'px' }"
  >
    <!-- Header -->
    <div class="ex-header" @mousedown="startDrag">
      <span class="title">Exness Vue Stats</span>
      <div class="controls">
        <span @click="isMinimized = !isMinimized" class="minimize-btn">
          {{ isMinimized ? '+' : '_' }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div v-if="!isMinimized" class="ex-content">
      <div class="stat-row">
        <span class="label">BUY Vol:</span>
        <span class="value text-buy">{{ stats.buyVol.toFixed(2) }}</span>
      </div>
      <div class="stat-row">
        <span class="label">Avg Buy:</span>
        <span class="value text-buy">{{ stats.avgBuy.toFixed(5) }}</span>
      </div>
      <div class="stat-row">
        <span class="label">SELL Vol:</span>
        <span class="value text-sell">{{ stats.sellVol.toFixed(2) }}</span>
      </div>
      <div class="stat-row">
        <span class="label">Avg Sell:</span>
        <span class="value text-sell">{{ stats.avgSell.toFixed(5) }}</span>
      </div>
      <div class="stat-row">
        <span class="label">Break Even:</span>
        <span class="value text-neutral">{{ stats.avgBreakEven.toFixed(5) }}</span>
      </div>
      
      <div class="status-bar">
        <span :class="['status-dot', isPolling ? 'active' : '']"></span>
        {{ isPolling ? 'Live' : 'Stopped' }}
      </div>
    </div>

    <!-- Actions -->
    <div v-if="!isMinimized" class="ex-actions">
      <button @click="reload" class="btn">Reload</button>
      <button @click="callApi1" class="btn">API 1</button>
      <button @click="callApi2" class="btn">API 2</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const TARGET_URL = "https://rtapi-sg.eccweb.mobi/rtapi/mt5/real20/v1/accounts/159731832/positions";
const POLL_INTERVAL = 5000;

// State
const isMinimized = ref(false);
const isPolling = ref(false);
const panelRef = ref(null);
const position = reactive({ left: 100, top: 100 });
const stats = reactive({
  buyVol: 0, avgBuy: 0,
  sellVol: 0, avgSell: 0,
  avgBreakEven: 0
});

let pollTimer = null;

// --- Lifecycle ---
onMounted(() => {
  loadPosition();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

// --- Logic ---
function getToken() {
  const matches = document.cookie.match(/(?:^|;\s*)JWT=([^;]+)/);
  return matches ? matches[1] : null;
}

function startPolling() {
  if (pollTimer) return;
  fetchData();
  pollTimer = setInterval(fetchData, POLL_INTERVAL);
  isPolling.value = true;
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  isPolling.value = false;
}

function reload() {
  stopPolling();
  startPolling();
}

function fetchData() {
  const token = getToken();
  if (!token) return;

  // Gọi qua Background Script
  chrome.runtime.sendMessage(
    { action: "fetchData", url: TARGET_URL, token },
    (response) => {
      if (response && response.success) {
        processData(response.data);
      }
    }
  );
}

function processData(data) {
  if (!data || !Array.isArray(data.positions)) return;

  const positions = data.positions.map(p => ({
    ...p,
    volume: Number(p.volume) || 0,
    open_price: Number(p.open_price) || 0
  }));

  const buys = positions.filter(p => p.type === 0);
  const sells = positions.filter(p => p.type === 1);

  const buyVol = buys.reduce((s, p) => s + p.volume, 0);
  const sellVol = sells.reduce((s, p) => s + p.volume, 0);

  const buyValue = buys.reduce((s, p) => s + p.volume * p.open_price, 0);
  const sellValue = sells.reduce((s, p) => s + p.volume * p.open_price, 0);

  stats.buyVol = buyVol;
  stats.sellVol = sellVol;
  stats.avgBuy = buyVol ? buyValue / buyVol : 0;
  stats.avgSell = sellVol ? sellValue / sellVol : 0;

  if (buyVol && sellVol) {
    const totalVol = buyVol + sellVol;
    stats.avgBreakEven = (stats.avgBuy * buyVol + stats.avgSell * sellVol) / totalVol;
  } else {
    stats.avgBreakEven = buyVol ? stats.avgBuy : stats.avgSell;
  }
}

function callApi1() {
  alert("API 1 called!");
}

function callApi2() {
  alert("API 2 called!");
}

// --- Draggable ---
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let initialPos = { left: 0, top: 0 };

function startDrag(e) {
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

function savePosition() {
  chrome.storage.local.set({ 'vue_panel_pos': { left: position.left, top: position.top } });
}

function loadPosition() {
  chrome.storage.local.get(['vue_panel_pos'], (res) => {
    if (res.vue_panel_pos) {
      position.left = res.vue_panel_pos.left;
      position.top = res.vue_panel_pos.top;
    }
  });
}
</script>

<style scoped>
.ex-panel {
  pointer-events: auto;
  position: fixed;
  z-index: 999999;
  width: 280px;
  background: rgba(20, 24, 35, 0.95);
  color: #e0e0e0;
  border-radius: 8px;
  border: 1px solid #444;
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ex-header {
  padding: 10px 12px;
  background: #2b3144;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3f50;
  font-weight: 700;
}

.title { color: #f0b90b; }
.minimize-btn { cursor: pointer; padding: 0 4px; }
.minimize-btn:hover { color: white; }

.ex-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2c303b;
  padding-bottom: 4px;
}
.stat-row:last-child { border-bottom: none; }

.label { color: #888; }
.value { font-weight: 600; }

.text-buy { color: #0ecb81; }
.text-sell { color: #f6465d; }
.text-neutral { color: #f0b90b; }

.ex-actions {
  padding: 8px 12px;
  background: #1f232e;
  border-top: 1px solid #3a3f50;
  display: flex;
  gap: 6px;
}

.btn {
  flex: 1;
  background: #3a4055;
  color: #fff;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: 0.2s;
}
.btn:hover { background: #4e566d; }

.status-bar {
  font-size: 10px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.status-dot {
  width: 6px; height: 6px; background: #555; border-radius: 50%;
}
.status-dot.active { background: #0ecb81; box-shadow: 0 0 4px #0ecb81; }
</style>
