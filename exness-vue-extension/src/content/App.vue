<template>
  <div ref="panelRef" class="ex-panel" :style="{ left: position.left + 'px', top: position.top + 'px' }">
    <!-- Header Row -->
    <div class="header-row" @mousedown="startDrag">
      <div class="header-left">
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
    </div>

    <!-- Account Info Row -->
    <div class="account-row" v-if="currentAccount.login">
      <span class="account-label">ID: {{ currentAccount.login }}</span>
      <button @click="closeAllProfit" class="profit-badge" title="Close all profit positions">
        P: +{{ totalProfit.toFixed(2) }}
      </button>
      <button @click="closeAllStopLoss" class="loss-badge" title="Close all loss positions">
        L: {{ totalLoss.toFixed(2) }}
      </button>
      <button @click="handleCloseAllPositions" class="btn-close-all-account" title="Close all positions">
        Close All: {{ (totalProfit + totalLoss).toFixed(2) }}
      </button>
    </div>

    <!-- Instruments List -->
    <div class="instruments-container">
      <StatsBar :stats="stats" :closePositions="closePositions" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import StatsBar from '../components/StatsBar.vue';
import { useDraggable } from '../composables/useDraggable';
import { useAccount } from '../composables/useAccount';
import { useTrading } from '../composables/useTrading';

// --- Composables ---
const { position, startDrag } = useDraggable(100, 50);
const { currentAccount, getToken, initAccountInfo } = useAccount();
const { stats, isPolling, timeLeft, totalProfit, totalLoss, startPolling, stopPolling, closeAllProfit, closeAllStopLoss, closePositions } = useTrading(currentAccount, getToken);

// --- Local State ---
const isReloading = ref(false);

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

function handleCloseStopLoss() {
  if (confirm('Are you sure you want to close all stop loss positions?')) {
    closeAllStopLoss();
  }
}

function handleCloseAllPositions() {
  const allPositions = stats.value.flatMap(item => item.allPositions);
  if (allPositions.length > 0 && confirm(`Close all ${allPositions.length} position(s)?`)) {
    closePositions(allPositions);
  }
}

// --- Lifecycle ---
onMounted(async () => {
  // useDraggable handles its own loadPosition onMounted
  await initAccountInfo();
  // useTrading watches currentAccount.isReady and auto-starts polling
});

onUnmounted(() => {
  stopPolling();
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
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
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

.account-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #444;
  background: rgba(20, 24, 36, 0.8);
}

.instruments-container {
  padding: 8px;
}

.drag-handle {
  color: #666;
  cursor: move;
  font-size: 12px;
  line-height: 1;
}

.account-label {
  font-size: 13px;
  color: #aaa;
  font-weight: bold;
}

.btn-close-all-account {
  background-color: #555;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 6px 12px;
  font-size: 12px;
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
  font-size: 13px;
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

.loss-badge {
  background-color: #f6465d;
  color: white;
  font-weight: bold;
  font-size: 13px;
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
  font-size: 12px;
  color: #888;
  font-weight: 500;
}


.btn-icon {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  width: 28px;
  height: 28px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.timer {
  color: #888;
  font-size: 12px;
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
</style>
