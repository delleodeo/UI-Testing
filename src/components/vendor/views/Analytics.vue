<script setup>
import { ref, computed, reactive } from 'vue'
import MetricCard from '../MetricCard.vue'
import {
  ChartBarIcon,
  ShoppingBagIcon,
  CubeIcon,
  InboxIcon,
  StarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline'
import { useVendorDashboardStore } from '../../../stores/vendor/dashboardStores'
import { formatToPHCurrency } from "../../../utils/currencyFormat.js"

const vendorDashboard = useVendorDashboardStore()
const vendorData = computed(() => vendorDashboard.vendor)


const metricCards = computed(() => [
  {
    title: 'Total Revenue',
    value: formatToPHCurrency(vendorData.value?.totalRevenue),
    change: 12.5,
    icon: ChartBarIcon,
    color: 'bg-indigo',
  },
  {
    title: 'Total Orders',
    value: (vendorData.value?.totalOrders || 0).toLocaleString(),
    icon: ShoppingBagIcon,
    color: 'bg-green',
  },
  {
    title: 'Total Products',
    value: (vendorData.value?.totalProducts || 0).toLocaleString(),
    icon: CubeIcon,
    color: 'bg-yellow',
  },
  {
    title: 'Average Ratings',
    value: (vendorData.value?.rating || 0).toFixed(1),
    icon: StarIcon,
    color: 'bg-orange',
  },
  {
    title: "Today's Orders",
    value: (0).toLocaleString(),
    icon: InboxIcon,
    color: 'bg-pink',
  },
  {
    title: 'Pending Orders',
    value: (vendorData.value?.pendingOrders || 0).toLocaleString(),
    icon: InboxIcon,
    color: 'bg-yellow',
  },
])

const growthLabel = 'Average Growth'
const revenuechange = -90;
const growthValue = 12.4
const growthChange = 2.1
const isPositive = growthChange >= 0
const isRevenuePositive = revenuechange >= 0
const changeClass = isPositive ? 'text-green-500' : 'text-red-500'
const changeText = `${isPositive ? '+' : '-'}${growthChange}% from last period`
const changeRevenueText = `${isRevenuePositive ? '+' : ''}${revenuechange}% from last period`

const tooltipStyle = computed(() => ({
  position: 'absolute',
  left: tooltip.x + 'px',
  top: tooltip.y + 'px',
  transform: 'translateX(-60%)',
  zIndex: 50
}))

const showTooltip = (event, value, period) => {
  tooltip.show = true
  tooltip.period = period
  tooltip.value = value
  tooltip.x = event.target.getBoundingClientRect().left + window.scrollX
  tooltip.y = event.target.getBoundingClientRect().top + window.scrollY - 60
}

const hideTooltip = () => {
  tooltip.show = false
}
const tooltip = reactive({
  show: false,
  value: '',
  period: '',
  x: 0,
  y: 0
})


const currentYear = new Date().getFullYear()
const previousYear = currentYear - 1

const rawChartData = computed(() => vendorData.value?.monthlyRevenueComparison || [])

const parseValue = (val) => parseFloat(String(val || '0').replace(/,/g, '')) || 0

const numericMax = computed(() => {
  if (!rawChartData.value.length) return 0
  return Math.max(...rawChartData.value.flatMap(d => [parseValue(d.currentValue), parseValue(d.previousValue)]))
})

const maxCurrent = computed(() => {
  if (!rawChartData.value.length) return 0
  return Math.max(...rawChartData.value.map(d => parseValue(d.currentValue)))
})

const paddedMax = computed(() => {
  const step = 1000
  const max = numericMax.value
  const padding = max < 100000 ? 1 : 1.5
  return Math.ceil((max * padding || step) / step) * step
})

const yAxisSteps = computed(() => {
  const steps = []
  const stepSize = maxCurrent.value < 100000 ? 10000 : 30000
  for (let i = paddedMax.value; i >= 0; i -= stepSize) {
    steps.push(`₱${(i / 1000).toFixed(0)}k`)
  }
  return steps
})

const chartData = computed(() => {
  if (!rawChartData.value.length) return []

  return rawChartData.value.map(d => {
    const currentVal = parseValue(d.currentValue)
    const previousVal = parseValue(d.previousValue)
    const currentHeight = paddedMax.value === 0 ? 0 : Math.max((currentVal / paddedMax.value) * 100, 2)
    const previousHeight = paddedMax.value === 0 ? 0 : Math.max((previousVal / paddedMax.value) * 100, 2)

    // Convert full month to 3-letter abbreviation
    const shortMonth = d.month.slice(0, 3)

    return {
      ...d,
      currentValue: currentVal,
      previousValue: previousVal,
      currentHeight,
      previousHeight,
      shortMonth
    }
  })
})
</script>

<template>
  <div class="dashboard">
    <!-- <header class="mobile-header">
        <div class="mobile-header-content">
          <h1>Dashboard</h1>
          <div class="user-profile-mobile">
            <img
              src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150"
              alt="User" class="user-avatar-mobile">
          </div>
        </div>
      </header> -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- <header class="desktop-header">
            <div class="header-content">
              <h1>Dashboard Overview</h1>
            </div>
          </header> -->

        <div class="dashboard-grid">

          <div class="profile-card">
            <div class="profile-header">
              <img
                src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200"
                alt="Profile" class="profile-image">
              <h3>{{ vendorData?.storeName || "N/A"}}</h3>
              <p class="profile-subtitle">Welcome Back</p>
            </div>
            <div class="profile-stats">
              <div class="stat">
                <span class="stat-number">{{ vendorData?.followers.length || 0}}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ vendorData?.profileViews || 0}}</span>
                <span class="stat-label">Profile Views</span>
              </div>
            </div>
          </div>

          <div class="metrics-grid">
            <MetricCard v-for="(card, index) in metricCards" :key="index" :title="card?.title" :value="card?.value"
              :change="card?.change" :icon="card?.icon" :color="card?.color" />
          </div>

          <div class="analytics-card">
            <div class="analytics-header">
              <div class="analytics-title">
                <h3>Revenue Analytics/Monthly</h3>
                <p>Monthly performance overview</p>
              </div>
            </div>

            <div class="analytics-summary">
              <div class="summary-item">
                <div class="summary-icon revenue">
                  <ArrowTrendingUpIcon />
                </div>
                <div class="summary-content">
                  <span class="summary-label">Total Revenue</span>
                  <span class="summary-value">{{ formatToPHCurrency(vendorData?.currentMonthlyRevenue) }}</span>
                  <span :class="[isRevenuePositive ? 'positive' : 'negative', 'summary-change']">
                    {{ changeRevenueText }}
                  </span>

                </div>
              </div>

              <div class="summary-item">
                <div class="summary-icon growth">
                  <ChartBarIcon />
                </div>
                <div class="summary-content">
                  <span class="summary-label">{{ growthLabel }}</span>
                  <span class="summary-value">{{ growthValue }}%</span>
                  <span :class="[isPositive ? 'positive' : 'negative', 'summary-change']">
                    {{ changeText }}
                  </span>

                </div>
              </div>
            </div>

            <div v-if="rawChartData?.length > 0" class="chart-container">
              <div class="chart-header">
                <h4>Monthly Revenue Comparison</h4>
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-dot current"></span>
                    <span>{{ currentYear }}</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-dot previous"></span>
                    <span>{{ previousYear }}</span>
                  </div>
                </div>
              </div>
              <div class="chart-content">
                <div class="chart-wrapper">
                  <!-- Dynamic Y Axis -->
                  <div class="chart-y-axis">
                    <span v-for="label in yAxisSteps" :key="label" class="y-label">{{ label }}</span>
                  </div>


                  <div class="chart-area">
                    <div class="chart-grid">
                      <div v-for="i in yAxisSteps.length - 1" :key="i" class="grid-line"></div>
                    </div>

                    <div class="chart-bars">
                      <div v-for="(data, index) in chartData" :key="index" class="bar-container">
                        <div class="bar-group">
                          <div class="bar current" :style="{ height: data.currentHeight + '%' }"
                            @mouseenter="showTooltip($event, data.currentValue, '2024')" @mouseleave="hideTooltip">
                          </div>
                          <div class="bar previous" :style="{ height: data.previousHeight + '%' }"
                            @mouseenter="showTooltip($event, data.previousValue, '2023')" @mouseleave="hideTooltip">
                          </div>
                        </div>
                        <span class="bar-label">{{ data?.shortMonth }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Tooltip -->
            <div v-if="tooltip.show" class="chart-tooltip" :style="tooltipStyle">
              <div class="tooltip-content">
                <span class="tooltip-period">{{ tooltip.period }}</span>
                <span class="tooltip-value">${{ formatToPHCurrency(tooltip.value) }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>


<style scoped>
/* Theme-aware Analytics Dashboard */
.dashboard {
  max-height: 100dvh;
  width: 100%;
  flex: 1 1 auto;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  background: transparent;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Header */
.mobile-header {
  display: block;
  background: var(--surface);
  border-bottom: 1px solid var(--border-primary);
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
}

.mobile-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.user-avatar-mobile {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}



/* Main Content */
.main-content {
  flex: 1;
  padding: 1rem 8px;
  padding-bottom: 5rem;
  /* Space for mobile nav */
  overflow-y: auto;
}

.content-wrapper {
  margin: 0 auto;
}

/* Desktop Header - Hidden on mobile */
.desktop-header {
  display: none;
}

/* Dashboard Grid - Mobile Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(aout-fit, 1fr);
  gap: 1rem;
  grid-template-areas:
    "profile"
    "metrics"
    "analytics"
}

/* Profile Card */
.profile-card {
  grid-area: profile;
  background: var(--surface);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid var(--border-primary);
  box-shadow: 0 4px 16px rgba(31, 139, 78, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1f8b4e 0%, #26a65b 100%);
}

.profile-card:hover {
  box-shadow: 0 8px 24px rgba(31, 139, 78, 0.15);
  transform: translateY(-4px);
  border-color: rgba(31, 139, 78, 0.2);
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1.25rem;
  border: 4px solid #1f8b4e;
  box-shadow: 0 4px 16px rgba(31, 139, 78, 0.25);
  transition: transform 0.3s ease;
}

.profile-image:hover {
  transform: scale(1.05);
}

.profile-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.profile-subtitle {
  color: var(--text-tertiary);
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-primary);
}

.stat {
  text-align: center;
  flex: 1;
  padding: 1rem;
  background: rgba(31, 139, 78, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat:hover {
  background: rgba(31, 139, 78, 0.1);
  transform: translateY(-2px);
}

.stat-number {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f8b4e;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-top: 0.5rem;
}

/* Metrics Grid */
.metrics-grid {
  grid-area: metrics;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}



/* Enhanced Analytics Card */
.analytics-card {
  grid-area: analytics;
  background: var(--surface);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid var(--border-primary);
  max-width: 100vw;
  overflow: auto;
  box-shadow: 0 4px 16px rgba(31, 139, 78, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.analytics-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1f8b4e 0%, #26a65b 100%);
}

.analytics-card:hover {
  box-shadow: 0 8px 24px rgba(31, 139, 78, 0.12);
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.analytics-title h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.analytics-title p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.period-select {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.period-select:focus {
  border-color: var(--input-border-focus);
}

.analytics-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (min-width: 640px) {
  .analytics-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(31, 139, 78, 0.05) 0%, rgba(31, 139, 78, 0.02) 100%);
  border: 2px solid var(--border-primary);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.summary-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #1f8b4e 0%, #26a65b 100%);
}

.summary-item:hover {
  background: linear-gradient(135deg, rgba(31, 139, 78, 0.1) 0%, rgba(31, 139, 78, 0.05) 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(31, 139, 78, 0.12);
  border-color: rgba(31, 139, 78, 0.3);
}

.summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
}

.summary-item:hover .summary-icon {
  transform: scale(1.1) rotate(5deg);
}

.summary-icon svg {
  width: 28px;
  height: 28px;
  position: relative;
  z-index: 2;
}

.summary-icon.revenue {
  background: linear-gradient(135deg, #1f8b4e 0%, #26a65b 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
}

.summary-icon.growth {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.summary-change {
  font-size: 0.875rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  width: fit-content;
}

.summary-change.positive {
  color: #1f8b4e;
  background: rgba(31, 139, 78, 0.15);
}

.summary-change.negative {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.15);
}

.chart-container {
  position: relative;
  max-width: 100%;
  overflow: hidden;
}

.chart-content {
  max-width: 100%;
  overflow: auto;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  transition: background 0.15s ease;
}

.legend-item:hover {
  background: var(--surface-hover);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.current {
  background: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.negative {
  color: var(--color-danger);
}

.legend-dot.previous {
  background: var(--color-info);
  box-shadow: 0 0 0 2px var(--color-info-light);
}

.chart-wrapper {
  display: flex;
  gap: 1rem;
  min-width: fit-content;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 240px;
  padding: 0.5rem 0;
}

.y-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-align: right;
  font-weight: 500;
}

.chart-area {
  flex: 1;
  position: relative;
}

.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.grid-line {
  height: 1px;
  background: var(--border-secondary);
  width: 100%;
  opacity: 0.5;
}

.chart-bars {
  display: flex;
  gap: 0.5rem;
  height: 240px;
  padding: 2rem 0;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;

}

.bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.bar-group {
  display: flex;
  gap: 2px;
  align-items: end;
  width: 100%;
  height: 200px;
}

.bar {
  flex: 1;
  min-height: 8px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  width: 12px;
  border-radius: 4px;
  transition: height 0.3s;
}

.bar:hover {
  opacity: 0.85;
  transform: scaleY(1.02);
}

.bar.current {
  background: linear-gradient(180deg, #1f8b4e, #166b3c);
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
  border: 1px solid rgba(31, 139, 78, 0.2);
}

.bar.previous {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-align: center;
  margin-top: 0.5rem;
  font-weight: 500;
}

.chart-tooltip {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-size: 0.75rem;
  pointer-events: none;
  z-index: 10;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-period {
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tooltip-value {
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.875rem;
}

/* Calendar - Now at bottom */
.calendar-card {
  grid-area: calendar;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--border-primary);
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.2s ease;
}

.calendar-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.calendar-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
  border-color: var(--color-primary);
}

.nav-btn:active {
  transform: scale(0.95);
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.current-month {
  font-size: 0.875rem;
  color: var(--text-secondary);
  min-width: 120px;
  font-weight: 600;
  text-align: center;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 600;
  padding: 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid transparent;
}

.calendar-day:hover {
  background: var(--surface-hover);
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.calendar-day.other-month {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.calendar-day.today {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.calendar-day.selected {
  background: var(--color-success);
  color: white;
  font-weight: 600;
  box-shadow: 0 0 0 2px var(--color-success-light);
}

.event-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 4px;
  height: 4px;
  background: var(--color-warning);
  border-radius: 50%;
  box-shadow: 0 0 4px var(--color-warning);
}

/* Mobile Bottom Navigation */
/* .mobile-nav {
  display: flex;
  background: #1e293b;
  border-top: 1px solid #334155;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
} */

/* .mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  text-decoration: none;
  color: #64748b;
  transition: color 0.2s;
  gap: 0.25rem;
} */

/* .mobile-nav-item:hover,
.mobile-nav-item.active {
  color: #3b82f6;
} */

/* .mobile-nav-icon {
  width: 20px;
  height: 20px;
}

.mobile-nav-item span {
  font-size: 0.75rem;
  font-weight: 500;
} */

/* Tablet Styles */
@media (min-width: 640px) {
  .profile-card {
    display: flex;
    flex-direction: column;
  }

  .main-content {
    padding: 1rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    gap: 1.5rem;
    grid-template-areas:
      "profile metrics"
      "analytics analytics"
      "calendar calendar";
  }
}

/* Desktop Styles */
@media (min-width: 1024px) {
  .dashboard {
    flex-direction: row;
  }


  .mobile-header {
    display: none;
  }

  /* Show desktop header */
  .desktop-header {
    display: block;
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-content h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .user-profile-desktop {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar-desktop {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  /* Adjust main content */
  .main-content {
    flex: 1;
    padding-bottom: 2rem;
  }

  /* Desktop grid layout */
  .dashboard-grid {
    grid-template-columns: 300px 1fr;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      "profile metrics"
      "analytics analytics"
      "calendar calendar";
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large Desktop */
@media (min-width: 1200px) {
  .content-wrapper {
    max-width: 1200px;
  }

  .dashboard-grid {
    grid-template-columns: 280px 1fr;
    grid-template-areas:
      "profile metrics calendar"
      "analytics analytics calendar";
  }

  .calendar-card {
    grid-row: 1 / 3;
  }
}
</style>