<template>
  <div class="stats-container">
    <div v-if="stats.length === 0" class="no-data">No positions</div>
    <div v-else class="instrument-list">
      <div v-for="item in stats" :key="item.instrument" class="instrument-row">
        <span class="instrument-name">{{ formatInstrumentName(item.instrument) }}</span>
        <button @click="handleCloseBuy(item)" class="btn-action btn-buy" 
          :disabled="item.buyVol === 0"
          :title="item.buyVol > 0 ? `Close ${item.buyPositions.length} BUY position(s)` : 'No BUY positions'">
          Buy: {{ item.buyVol.toFixed(2) }}
        </button>
        <button @click="handleCloseSell(item)" class="btn-action btn-sell"
          :disabled="item.sellVol === 0"
          :title="item.sellVol > 0 ? `Close ${item.sellPositions.length} SELL position(s)` : 'No SELL positions'">
          Sell: {{ item.sellVol.toFixed(2) }}
        </button>
        <button @click="handleCloseProfit(item.profitPositions)" class="btn-action btn-profit"
          :disabled="item.profitPositions.length === 0"
          :title="`Close ${item.profitPositions.length} profit position(s)`">
          PROFIT: +{{ item.totalProfit.toFixed(2) }}
        </button>
        <button @click="handleCloseLoss(item.lossPositions)" class="btn-action btn-loss"
          :disabled="item.lossPositions.length === 0"
          :title="`Close ${item.lossPositions.length} loss position(s)`">
          LOSS: {{ item.totalLoss.toFixed(2) }}
        </button>
        <button @click="handleCloseAll(item.allPositions)" class="btn-action btn-all"
          :class="(item.totalProfit + item.totalLoss) >= 0 ? 'btn-profit' : 'btn-loss'"
          :title="`Close all ${item.allPositions.length} position(s)`">
          CLOSE ALL: {{ (item.totalProfit + item.totalLoss).toFixed(2) }}
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
  },
  confirmEnabled: {
    type: Boolean,
    default: true
  }
});

function formatInstrumentName(name) {
  if (!name) return '';

  // Try splitting by common delimiters first
  const parts = name.split(/[_\-\/]/);
  if (parts.length >= 2) {
    const first = parts[0].substring(0, 3);
    const second = parts[1].substring(0, 3);
    return `${first}/${second}`;
  }

  // For formats like XAUUSDT, split at 3 characters
  if (name.length >= 6) {
    const first = name.substring(0, 3);
    const second = name.substring(3, 6);
    return `${first}/${second}`;
  }

  return name;
}

function handleCloseBuy(item) {
  if (item.buyPositions.length === 0) return;
  if (!props.confirmEnabled || confirm(`Close ${item.buyPositions.length} BUY position(s) for ${formatInstrumentName(item.instrument)}?`)) {
    props.closePositions(item.buyPositions);
  }
}

function handleCloseSell(item) {
  if (item.sellPositions.length === 0) return;
  if (!props.confirmEnabled || confirm(`Close ${item.sellPositions.length} SELL position(s) for ${formatInstrumentName(item.instrument)}?`)) {
    props.closePositions(item.sellPositions);
  }
}

function handleCloseProfit(positions) {
  if (positions.length === 0) return;
  if (!props.confirmEnabled || confirm(`Close ${positions.length} profit position(s)?`)) {
    props.closePositions(positions);
  }
}

function handleCloseLoss(positions) {
  if (positions.length === 0) return;
  if (!props.confirmEnabled || confirm(`Close ${positions.length} loss position(s)?`)) {
    props.closePositions(positions);
  }
}

function handleCloseAll(positions) {
  if (positions.length === 0) return;
  if (!props.confirmEnabled || confirm(`Close all ${positions.length} position(s)?`)) {
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
  min-width: 90px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-info {
  color: #aaa;
  font-size: 0.9em;
  white-space: nowrap;
  min-width: fit-content;
}

.btn-action {
  border: none;
  border-radius: 3px;
  padding: 6px 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-size: var(--panel-font-size, 14px);
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
}

.btn-profit:hover {
  background-color: #0fb574;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(14, 203, 129, 0.3);
}

.btn-loss {
  background-color: #f6465d;
  color: white;
}

.btn-loss:hover {
  background-color: #e63950;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(246, 70, 93, 0.3);
}

.btn-buy {
  background-color: #2962ff;
  color: white;
}

.btn-buy:hover:not(:disabled) {
  background-color: #1e4bd8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(41, 98, 255, 0.3);
}

.btn-sell {
  background-color: #d32f2f;
  color: white;
}

.btn-sell:hover:not(:disabled) {
  background-color: #b71c1c;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(211, 47, 47, 0.3);
}
</style>
