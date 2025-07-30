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
/* Mobile-first approach */
section {
  width: 100dvw;
  background-color: rgb(123, 123, 182);
}

.dashboard {
  max-height: 100dvh;
  width: 100%;
  flex: 1 1 auto;
  margin: 0 auto;

  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
}

/* Mobile Header */
.mobile-header {
  display: block;
  background: #1e293b;
  border-bottom: 1px solid #334155;
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
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #334155;

}

.profile-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
}

.profile-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.profile-subtitle {
  color: #64748b;
  margin: 0;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 1.5rem;
  border-top: 1px solid #334155;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
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
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #334155;
  max-width: 100vw;
  overflow: auto;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.analytics-title h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.analytics-title p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.period-select {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  color: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.analytics-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #334155;
  border-radius: 12px;
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon svg {
  width: 20px;
  height: 20px;
}

.summary-icon.revenue {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.summary-icon.growth {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.summary-change {
  font-size: 0.75rem;
  font-weight: 600;
}

.summary-change.positive {
  color: #22c55e;
}

.summary-change.negative {
  color: #ef4444;
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
  color: white;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.current {
  background: var(--primary-color);
}

.negative {
  color: #dc2626;
  /* red */
}

.legend-dot.previous {
  background: #64748b;
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
  color: #64748b;
  text-align: right;
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
  background: #334155;
  width: 100%;
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
  opacity: 0.8;
  transform: scaleY(1.02);
}

.bar.current {
  background: linear-gradient(180deg, #51f379 0%, #145058 100%);
}

.bar.previous {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.bar-label {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  margin-top: 0.5rem;
}

.chart-tooltip {
  position: absolute;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.75rem;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-period {
  color: #9ca3af;
  font-weight: 500;
}

.tooltip-value {
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

/* Calendar - Now at bottom */
.calendar-card {
  grid-area: calendar;
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #334155;
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
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  color: white;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.current-month {
  font-size: 0.875rem;
  color: #64748b;
  min-width: 120px;
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
  color: #64748b;
  font-weight: 600;
  padding: 0.5rem 0;
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
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.calendar-day:hover {
  background: #334155;
}

.calendar-day.other-month {
  color: #475569;
}

.calendar-day.today {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

.calendar-day.selected {
  background: #22c55e;
  color: white;
  font-weight: 600;
}

.event-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 4px;
  height: 4px;
  background: #f97316;
  border-radius: 50%;
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
    color: white;
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