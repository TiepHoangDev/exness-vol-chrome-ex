<template>
  <div class="stats-container">
    <div v-if="stats.length === 0" class="no-data">No positions</div>
    <div v-else class="instrument-list">
      <div v-for="item in stats" :key="item.instrument" class="instrument-row">
        <span class="instrument-name">{{ item.instrument }}</span>
        <button 
          @click="handleCloseProfit(item.profitPositions)"
          class="btn-action btn-profit"
          :title="`Close ${item.profitPositions.length} profit position(s)`"
        >
          P: +{{ item.totalProfit.toFixed(2) }}
        </button>
        <button 
          @click="handleCloseLoss(item.lossPositions)"
          class="btn-action btn-loss"
          :title="`Close ${item.lossPositions.length} loss position(s)`"
        >
          L: {{ item.totalLoss.toFixed(2) }}
        </button>
        <button 
          @click="handleCloseAll(item.allPositions)"
          class="btn-action btn-close-all"
          :title="`Close all ${item.allPositions.length} position(s)`"
        >
          Close All: {{ (item.totalProfit + item.totalLoss).toFixed(2) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  stats: {
    type: Array,
    required: true
  },
  closePositions: {
    type: Function,
    required: true
  }
});

function handleCloseProfit(positions) {
  if (confirm(`Close ${positions.length} profit position(s)?`)) {
    props.closePositions(positions);
  }
}

function handleCloseLoss(positions) {
  if (confirm(`Close ${positions.length} loss position(s)?`)) {
    props.closePositions(positions);
  }
}

function handleCloseAll(positions) {
  if (confirm(`Close all ${positions.length} position(s)?`)) {
    props.closePositions(positions);
  }
}
</script>

<style scoped>
.stats-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
}

.stats-container::-webkit-scrollbar {
  width: 6px;
}

.stats-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.stats-container::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.stats-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.no-data {
  color: #666;
  font-size: 12px;
  text-align: center;
  padding: 20px;
}

.instrument-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.instrument-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #444;
  border-radius: 4px;
  transition: background 0.2s;
}

.instrument-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.instrument-name {
  color: #f0b90b;
  font-weight: bold;
  font-size: 14px;
  min-width: 90px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-action {
  border: none;
  border-radius: 3px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action:disabled:hover {
  transform: none;
  box-shadow: none;
}

.btn-profit {
  background-color: #0ecb81;
  color: white;
  min-width: 90px;
}

.btn-profit:hover {
  background-color: #0fb574;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(14, 203, 129, 0.3);
}

.btn-loss {
  background-color: #f6465d;
  color: white;
  min-width: 90px;
}

.btn-loss:hover {
  background-color: #e63950;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(246, 70, 93, 0.3);
}

.btn-close-all {
  background-color: #555;
  color: white;
  min-width: 140px;
}

.btn-close-all:hover {
  background-color: #666;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(85, 85, 85, 0.3);
}
</style>
