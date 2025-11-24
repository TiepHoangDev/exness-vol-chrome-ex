<template>
  <div class="stats-container">
    <div class="stat-item">
      <span class="label">B:</span>
      <span class="value text-buy">{{ stats.buyVol.toFixed(2) }} (Avg: {{ stats.avgBuy.toFixed(5) }})</span>
    </div>
    <div class="stat-divider">|</div>
    <div class="stat-item">
      <span class="label">S:</span>
      <span class="value text-sell">{{ stats.sellVol.toFixed(2) }} (Avg: {{ stats.avgSell.toFixed(5) }})</span>
    </div>
    <div class="stat-divider">|</div>
    <div class="stat-item">
      <span class="label">BE:</span>
      <span class="value text-neutral">{{ stats.avgBreakEven.toFixed(5) }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  },
});
</script>

<style scoped>
.stats-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-divider {
  color: #444;
}

.label { color: #888; font-weight: 500; }
.value { font-weight: 700; font-size: 15px; }

.text-buy { color: #0ecb81; }
.text-sell { color: #f6465d; }
.text-neutral { color: #f0b90b; }
</style>
