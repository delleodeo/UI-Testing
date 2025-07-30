<!-- components/MetricCard.vue -->
<script setup>
defineProps({
  title: String,
  value: [String, Number],
  change: Number,
  icon: {} || null,
  color: String,
})
</script>


<template>
  <div class="metric-card">
    <div class="metric-content">
      <div class="metric-header">
        <div class="metric-icon" :class="color">
          <component :is="icon" class="icon" />
        </div>
        <p class="metric-title">{{ title }}</p>
      </div>
      <span class="metric-number">
        {{ value }}
        <span v-if="change" class="metric-change" :class="{ positive: change > 0, negative: change < 0 }">
          {{ change > 0 ? '+' : '' }}{{ change }}%
        </span>
      </span>
    </div>
  </div>
</template>


<style scoped>
.metric-card {
 
  background: #1e293b;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #334155;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-header {
  display: flex;
  gap: 5px;
  align-items: center;
}

.metric-icon {
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50rem;
}

.metric-number {
  font-size: clamp(1.15rem, 2vw, 1.2rem);
  font-weight: 600;
}

.metric-change {
  font-size: 12px;
}

.metric-title {
  font-size: clamp(12.78px, 2vw, 1rem);
  color: rgba(202, 202, 252, 0.596);
}

.icon {
  height: 100%;
  aspect-ratio: 1;
}

.positive {
  color: #16a34a;
}

.negative {
  color: #dc2626;
}

.icon {
  width: 22px;
  aspect-ratio: 1;
  color: white;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}


/* Color classes (feel free to customize or add more) */
.bg-indigo {
  background-color: #6365f1;
}

.bg-green {
  background-color: #22c55e;
}

.bg-yellow {
  background-color: #eab308;
}

.bg-orange {
  background-color: #f97316;
}

.bg-pink {
  background-color: #ec4899;
}
</style>
