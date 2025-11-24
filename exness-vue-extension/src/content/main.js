import { createApp } from 'vue'
import App from './App.vue'

// Hàm khởi tạo
function initExtension() {
  // Kiểm tra xem đã inject chưa để tránh duplicate
  if (document.getElementById('exness-vue-host')) return;

  console.log("[Exness Vue] Starting...");

  const host = document.createElement('div');
  host.id = 'exness-vue-host';
  // Đặt host nằm ngoài luồng layout của trang để không ảnh hưởng
  host.style.position = 'absolute'; 
  host.style.top = '0';
  host.style.left = '0';
  host.style.zIndex = '9999999';
  host.style.pointerEvents = 'none'; // Để click xuyên qua vùng trống
  
  document.body.appendChild(host);

  // Trong App.vue, root element sẽ cần pointer-events: auto để nhận click
  // Đã xử lý trong CSS của App.vue (mặc định div block là auto)

  const app = createApp(App);
  app.mount(host);
}

// Chạy khi trang load xong
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initExtension();
} else {
  window.addEventListener('DOMContentLoaded', initExtension);
}
