<template>
  <div ref="panelRef" class="ex-panel" :style="{ left: position.left + 'px', top: position.top + 'px' }">
    <!-- Header (Drag Handle + Info) -->
    <div class="ex-header" @mousedown="startDrag">
      <div class="drag-handle">⋮⋮</div>

      <div class="account-info" v-if="currentAccount.login">
        ID: {{ currentAccount.login }}
      </div>
      <div v-else>Please login</div>

      <!-- Stats Component -->
      <StatsBar :stats="stats" />

      <!-- Actions (Inline) -->
      <div class="actions-container">
        <button @click="closeAllProfit" class="btn btn-warning" title="Close All Profit">
          CLOSE PROFIT
        </button>
        <button @click="reload" class="btn-icon" title="Reload">
          ↻
        </button>
        <span @click="isMinimized = !isMinimized" class="minimize-btn">
          {{ isMinimized ? '▼' : '▲' }}
        </span>
      </div>
    </div>

    <!-- Expanded Content -->
    <div v-if="!isMinimized" class="ex-details">
      <div class="detail-row">
        <span>Status: {{ isPolling ? 'Live' : 'Stopped' }}</span>
        <span class="status-dot" :class="{ active: isPolling }"></span>
        <span v-if="currentAccount.error" class="error-text">Error: {{ currentAccount.error }}</span>
      </div>
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
const { stats, isPolling, startPolling, stopPolling, closeAllProfit } = useTrading(currentAccount, getToken);

// --- Local State ---
const isMinimized = ref(true);

function reload() {
  stopPolling();
  initAccountInfo(); // Re-check account
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
  white-space: nowrap;
}

.ex-header {
  padding: 6px 10px;
  cursor: move;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
}

.drag-handle {
  color: #666;
  cursor: move;
  font-size: 16px;
  line-height: 1;
}

.account-info {
  font-size: 12px;
  color: #aaa;
  font-weight: bold;
  border-right: 1px solid #444;
  padding-right: 12px;
}

.actions-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #444;
}

.btn-warning {
  background-color: #b45d18;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
}

.btn-warning:hover {
  background-color: #d47225;
}

.btn-icon {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
}

.btn-icon:hover {
  color: white;
}

.minimize-btn {
  cursor: pointer;
  color: #666;
  font-size: 10px;
}

.minimize-btn:hover {
  color: #aaa;
}

.ex-details {
  border-top: 1px solid #444;
  padding: 6px 10px;
  font-size: 11px;
  color: #666;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #555;
  border-radius: 50%;
  margin-left: 4px;
}

.status-dot.active {
  background: #0ecb81;
}

.error-text {
  color: #f6465d;
  margin-left: 8px;
}
</style>
