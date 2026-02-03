<template>
  <div v-if="!isMinimized" ref="panelRef" class="ex-panel"
    :style="{ left: position.left + 'px', top: position.top + 'px', '--panel-font-size': fontSize + 'px' }">
    <!-- Header Row -->
    <div class="header-row" @mousedown="startDrag">
      <div class="header-left">
        <img :src="iconUrl" alt="" class="header-icon" />
        <span class="drag-handle">⋮⋮</span>
        <div class="status-indicator">
          <span class="status-dot" :class="{ active: isPolling }"></span>
          <span class="status-text">{{ isPolling ? 'Live' : 'Off' }}</span>
        </div>
        <span class="timer">{{ timeLeft }}s</span>
        <button @click="reload" class="btn-icon" title="Reload" :disabled="isReloading">
          <span :class="{ 'spin': isReloading }">↻</span>
        </button>
      </div>
      <div class="header-right">
        <button @click.stop="decreaseFontSize" class="btn-icon" title="Decrease font size">A-</button>
        <span class="font-size-display">{{ fontSize }}</span>
        <button @click.stop="increaseFontSize" class="btn-icon" title="Increase font size">A+</button>
        <span class="separator">|</span>
        <button @click.stop="toggleConfirm" class="btn-icon btn-confirm" :class="{ 'confirm-off': !confirmEnabled }"
          :title="confirmEnabled ? 'Confirm ON - Click to disable' : 'Confirm OFF - Click to enable'">
          <span class="confirm-text">? Confirm</span>
        </button>
        <button @click.stop="minimize" class="btn-icon" title="Minimize panel">−</button>
      </div>
    </div>

    <!-- Account Info Row -->
    <div class="account-row" v-if="currentAccount.login">
      <div class="account-dropdown-wrapper">
        <select @change="onAccountChange" :value="currentAccount.login" class="account-dropdown">
          <option v-for="acc in allAccounts.filter(a => a.is_active)" :key="acc.account_login"
            :value="acc.account_login">
            #{{ acc.account_login }} {{ acc.name }}
          </option>
        </select>
      </div>
      <button @click="closeAllProfit" class="profit-badge btn-action" title="Close all profit positions">
        PROFIT: +{{ totalProfit.toFixed(2) }}
      </button>
      <button @click="closeAllStopLoss" class="loss-badge btn-action" title="Close all loss positions">
        LOSS: {{ totalLoss.toFixed(2) }}
      </button>
      <button @click="handleCloseAllPositions" :class="(totalProfit + totalLoss) >= 0 ? 'profit-badge' : 'loss-badge'"
        class="btn-close-all-account btn-all" title="Close all positions">
        CLOSE ALL: {{ (totalProfit + totalLoss).toFixed(2) }}
      </button>
    </div>

    <!-- Instruments List -->
    <div class="instruments-container">
      <StatsBar :stats="stats" :closePositions="closePositions" :confirmEnabled="confirmEnabled" />
    </div>
  </div>

  <!-- Minimized Button -->
  <button v-else class="ex-minimized-btn" @click="restore"
    :style="{ left: position.left + 'px', top: position.top + 'px' }" title="Restore panel">
    <img :src="iconUrl" alt="" class="minimized-icon" />
    <span class="minimized-text">ExStats</span>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import StatsBar from '../components/StatsBar.vue';
import { useDraggable } from '../composables/useDraggable';
import { useAccount } from '../composables/useAccount';
import { useTrading } from '../composables/useTrading';

// --- Composables ---
const { position, startDrag } = useDraggable(100, 50);
const { currentAccount, allAccounts, getToken, initAccountInfo, switchAccount } = useAccount();
const { stats, isPolling, timeLeft, totalProfit, totalLoss, startPolling, stopPolling, closeAllProfit, closeAllStopLoss, closePositions } = useTrading(currentAccount, getToken);

// --- Local State ---
const isReloading = ref(false);
const fontSize = ref(Number(localStorage.getItem('exness.extention.fontSize')) || 14);
const confirmEnabled = ref(localStorage.getItem('exness.extention.confirmEnabled') !== 'false');
const isMinimized = ref(localStorage.getItem('exness.extention.minimized') === 'true');

// Base64 SVG icon - inline to avoid CSP issues
const iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjMUMyMDMwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGMEI5MEIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPmV4PC90ZXh0Pgo8L3N2Zz4=';

async function reload() {
  if (isReloading.value) return;

  isReloading.value = true;
  stopPolling();

  await Promise.all([
    initAccountInfo(),
    new Promise(resolve => setTimeout(resolve, 600))
  ]);

  startPolling();
  isReloading.value = false;
}

async function onAccountChange(e) {
  switchAccount(e.target.value);
  await reload();
}

function handleCloseStopLoss() {
  if (confirm('Are you sure you want to close all stop loss positions?')) {
    closeAllStopLoss();
  }
}

function handleCloseAllPositions() {
  const allPositions = stats.value.flatMap(item => item.allPositions);
  if (allPositions.length > 0) {
    if (!confirmEnabled.value || confirm(`Close all ${allPositions.length} position(s)?`)) {
      closePositions(allPositions);
    }
  }
}

function increaseFontSize() {
  if (fontSize.value < 24) {
    fontSize.value += 1;
    localStorage.setItem('exness.extention.fontSize', fontSize.value);
  }
}

function decreaseFontSize() {
  if (fontSize.value > 10) {
    fontSize.value -= 1;
    localStorage.setItem('exness.extention.fontSize', fontSize.value);
  }
}

function resetFontSize() {
  fontSize.value = 14;
  localStorage.setItem('exness.extention.fontSize', fontSize.value);
}

function toggleConfirm() {
  confirmEnabled.value = !confirmEnabled.value;
  localStorage.setItem('exness.extention.confirmEnabled', confirmEnabled.value);
}

function minimize() {
  isMinimized.value = true;
  localStorage.setItem('exness.extention.minimized', 'true');
}

function restore() {
  isMinimized.value = false;
  localStorage.setItem('exness.extention.minimized', 'false');
}

// --- Settings sync from popup ---
function syncSettingsFromStorage() {
  fontSize.value = Number(localStorage.getItem('exness.extention.fontSize')) || 14;
  confirmEnabled.value = localStorage.getItem('exness.extention.confirmEnabled') !== 'false';
}

// Listen for storage changes (from popup)
window.addEventListener('storage', (e) => {
  if (e.key === 'exness.extention.fontSize' || e.key === 'exness.extention.confirmEnabled') {
    syncSettingsFromStorage();
  }
});

// Also poll for changes since storage event doesn't fire in same tab
let settingsSyncInterval = null;

// --- Lifecycle ---
onMounted(async () => {
  // useDraggable handles its own loadPosition onMounted
  await initAccountInfo();
  // useTrading watches currentAccount.isReady and auto-starts polling

  // Sync settings periodically (for popup changes via scripting API)
  settingsSyncInterval = setInterval(syncSettingsFromStorage, 500);
});

onUnmounted(() => {
  stopPolling();
  if (settingsSyncInterval) clearInterval(settingsSyncInterval);
});
</script>

<style scoped>
.ex-panel {
  pointer-events: auto;
  position: fixed;
  z-index: 999999;
  background: rgba(28, 32, 48, 0.95);
  color: #e0e0e0;
  border-radius: 6px;
  border: 1px solid #444;
  font-family: 'Roboto Mono', monospace;
  font-size: var(--panel-font-size, 14px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  width: auto;
  max-width: 90vw;
}

.ex-panel span,
.ex-panel button {
  font-size: inherit;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #444;
  cursor: move;
  background: rgba(20, 24, 36, 0.95);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.font-size-display {
  color: #888;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.account-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #444;
  background: rgba(20, 24, 36, 0.8);
}

.account-dropdown-wrapper {
  display: flex;
  align-items: center;
}

.account-dropdown {
  background-color: rgba(255, 255, 255, 0.08);
  color: #e0e0e0;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 6px 10px;
  font-family: 'Roboto Mono', monospace;
  font-size: inherit;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.account-dropdown:hover {
  background-color: rgba(255, 255, 255, 0.12);
  border-color: #666;
}

.account-dropdown:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #0ecb81;
  box-shadow: 0 0 4px rgba(14, 203, 129, 0.3);
}

.account-dropdown option {
  background-color: #1c2030;
  color: #e0e0e0;
}

.instruments-container {
  padding: 8px;
}

.drag-handle {
  color: #666;
  cursor: move;
  line-height: 1;
}

.account-label {
  color: #aaa;
  font-weight: bold;
}

.btn-close-all-account {
  background-color: #555;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 6px 12px;
  font-weight: bold;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s;
}

.btn-close-all-account:hover {
  background-color: #666;
  transform: translateY(-1px);
}

.profit-badge {
  background-color: #0ecb81;
  color: white;
  font-weight: bold;
  padding: 6px 10px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.profit-badge:hover {
  background-color: #0fb574;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(14, 203, 129, 0.3);
}

.instrument-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  transition: background 0.2s;
}

.btn-action {
  border: none;
  border-radius: 3px;
  padding: 6px 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}


.loss-badge {
  background-color: #f6465d;
  color: white;
  font-weight: bold;
  padding: 6px 10px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.loss-badge:hover {
  background-color: #e63950;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(246, 70, 93, 0.3);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-text {
  color: #888;
  font-weight: 500;
}


.btn-icon {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  cursor: pointer;
  padding: 4px 6px;
  min-width: 28px;
  height: 28px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-icon:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.btn-icon:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.timer {
  color: #888;
  font-weight: 500;
  padding: 5px 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #555;
  border-radius: 50%;
}

.status-dot.active {
  background: #0ecb81;
  box-shadow: 0 0 6px #0ecb81;
}

.btn-confirm {
  position: relative;
  color: #0ecb81;
  border-color: #0ecb81;
}

.btn-confirm.confirm-off {
  color: #f6465d;
  border-color: #f6465d;
}

.confirm-text {
  font-size: 12px;
  font-weight: bold;
}

.separator {
  color: #444;
  margin: 0 4px;
}

.header-icon {
  width: 18px;
  height: 18px;
  margin-right: 4px;
}

.ex-minimized-btn {
  pointer-events: auto;
  position: fixed;
  z-index: 999999;
  background: rgba(28, 32, 48, 0.95);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimized-icon {
  width: 18px;
  height: 18px;
}

.minimized-text {
  color: #f0b90b;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  font-weight: bold;
  margin-left: 6px;
}

.ex-minimized-btn:hover {
  background: rgba(40, 44, 60, 0.95);
  border-color: #f0b90b;
}
</style>
