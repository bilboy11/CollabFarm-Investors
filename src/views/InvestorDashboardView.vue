<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import availableIcon from '@/assets/images/Available.png'
import lockedIcon from '@/assets/images/Locked.png'
import disbursedIcon from '@/assets/images/Disbursed.png'
import { authApi, investmentsApi } from '@/services/api'

type DashboardPayload = Record<string, unknown>

const dashboardData = ref<DashboardPayload | null>(null)
const investmentData = ref<DashboardPayload[]>([])
const dashboardLoading = ref(true)
const dashboardError = ref('')
const allocationColors = ['#1b4d3e', '#3f7a5c', '#6eb489', '#a8d4b8', '#c5cec8']

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
})

const dashboardFields = computed<DashboardPayload>(() => {
  const response = dashboardData.value
  if (!response) return {}
  const nested = response.data ?? response.dashboard
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as DashboardPayload)
    : response
})

function valueFrom(source: DashboardPayload, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key]
  }
  return undefined
}

function metric(keys: string[], fallback: unknown = '—'): unknown {
  const metrics = dashboardFields.value.metrics
  const metricsValue =
    metrics && typeof metrics === 'object'
      ? valueFrom(metrics as DashboardPayload, keys)
      : undefined
  return metricsValue ?? valueFrom(dashboardFields.value, keys) ?? fallback
}

function text(value: unknown, fallback = '—'): string {
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}

function amount(value: unknown, fallback = '—'): string {
  if (typeof value === 'number') return `₦ ${value.toLocaleString('en-NG')}`
  return text(value, fallback)
}

function records(keys: string[]): DashboardPayload[] {
  const value = metric(keys, [])
  if (Array.isArray(value) && value.length > 0) {
    return value.filter(
      (item): item is DashboardPayload => Boolean(item) && typeof item === 'object',
    )
  }
  return []
}

function recordValue(record: DashboardPayload, keys: string[], fallback = '—'): string {
  return text(valueFrom(record, keys), fallback)
}

function investmentStatusClass(status: string): string {
  return `investment-status--${status.toLowerCase().replace(/\s+/g, '-')}`
}

function displayDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(date)
}

const investorName = computed(() =>
  text(metric(['investor_name', 'first_name', 'name']), 'Investor'),
)
const overdueReturns = computed(() => records(['overdue_returns', 'overdue_investments_list']))
function extractInvestmentRecords(response: unknown): DashboardPayload[] {
  if (Array.isArray(response))
    return response.filter(
      (item): item is DashboardPayload => Boolean(item) && typeof item === 'object',
    )
  if (!response || typeof response !== 'object') return []
  const payload = response as DashboardPayload
  for (const key of ['investments', 'items', 'results', 'data']) {
    const nested = payload[key]
    if (Array.isArray(nested)) return extractInvestmentRecords(nested)
    if (nested && typeof nested === 'object') {
      const result = extractInvestmentRecords(nested)
      if (result.length) return result
    }
  }
  return []
}

const recentInvestments = computed(() => {
  const dashboardRecentInvestments = records(['recent_investments'])
  const source = dashboardRecentInvestments.length
    ? dashboardRecentInvestments
    : investmentData.value
  return source.slice(0, 5).map((investment) => {
    return {
      ...investment,
      id: investment.id ?? investment.investment_id,
      package_title: investment.package_name ?? investment.package_title ?? '—',
      cooperative_name: investment.cooperative_name ?? '—',
      package_code: '—',
      farming_category: investment.farming_category ?? investment.category ?? '—',
      invested_amount: investment.amount_invested ?? investment.amount,
      expected_returns: investment.expected_returns ?? investment.expected_return,
      roi_percentage: investment.roi_percentage ?? investment.roi,
      funding_progress: '—',
      expected_settlement: displayDate(investment.due_date ?? investment.expected_settlement_date),
      date_invested: displayDate(investment.created_at ?? investment.date_invested),
      status: investment.status ?? investment.investment_status ?? '—',
    }
  })
})
const activities = computed(() =>
  records(['recent_activities', 'recent_activity', 'activities'])
    .slice(0, 4)
    .map((activity) => ({
      ...activity,
      time: displayDate(valueFrom(activity, ['timestamp', 'created_at', 'time', 'date'])),
      detail: valueFrom(activity, ['description', 'detail', 'name']),
      title: valueFrom(activity, ['title', 'action', 'type']),
      tone: valueFrom(activity, ['activity_type', 'tone']),
    })),
)
const portfolioAllocation = computed(() => {
  const value = valueFrom(dashboardFields.value, ['portfolio_allocation'])
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as DashboardPayload)
    : {}
})
const allocation = computed(() => {
  const breakdown = valueFrom(portfolioAllocation.value, ['breakdown'])
  const entries = Array.isArray(breakdown)
    ? breakdown.filter(
        (entry): entry is DashboardPayload => Boolean(entry) && typeof entry === 'object',
      )
    : []
  return entries.map((entry, index) => ({
    label: recordValue(entry, ['farming_category', 'label', 'crop', 'crop_type', 'name']),
    amount: Number.isFinite(Number(valueFrom(entry, ['amount'])))
      ? Number(valueFrom(entry, ['amount']))
      : null,
    value: Number(valueFrom(entry, ['percentage', 'percent', 'share', 'value'])) || 0,
    color: allocationColors[index % allocationColors.length],
  }))
})
function compactCurrency(value: unknown): string {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return text(value)
  const absoluteValue = Math.abs(numericValue)
  if (absoluteValue >= 1_000_000_000) return `₦ ${(numericValue / 1_000_000_000).toFixed(1)}B`
  if (absoluteValue >= 1_000_000) return `₦ ${(numericValue / 1_000_000).toFixed(1)}M`
  if (absoluteValue >= 1_000) return `₦ ${(numericValue / 1_000).toFixed(1)}K`
  return `₦ ${numericValue.toLocaleString('en-NG')}`
}

const portfolioValue = computed(() =>
  compactCurrency(valueFrom(portfolioAllocation.value, ['total_portfolio_value'])),
)
const allocationGradient = computed(() => {
  const total = allocation.value.reduce((sum, item) => sum + item.value, 0)
  if (!total) return 'conic-gradient(#e8ebe7 0deg 360deg)'
  let start = 0
  const stops = allocation.value.map((item) => {
    const end = start + (item.value / total) * 360
    const slice = `${item.color} ${start}deg ${end}deg`
    start = end
    return slice
  })
  return `conic-gradient(from -90deg, ${stops.join(', ')})`
})
const kpis = computed(() => [
  {
    id: 'invested',
    label: 'Total Invested Amount',
    value: amount(metric(['total_invested_amount', 'total_invested', 'invested_amount'])),
    icon: availableIcon,
    tone: 'wallet',
  },
  {
    id: 'expected',
    label: 'Total Expected Returns',
    value: amount(metric(['total_expected_returns', 'expected_return', 'expected_returns'])),
    icon: lockedIcon,
    tone: 'wallet',
  },
  {
    id: 'active',
    label: 'Active Investments Count',
    value: text(metric(['active_investments_count', 'active_investments', 'active_count']), '0'),
    icon: disbursedIcon,
    tone: 'wallet',
  },
  {
    id: 'overdue',
    label: 'Overdue Investments Count',
    value: text(metric(['overdue_investments_count', 'overdue_count']), '0'),
    tone: 'alert',
  },
])

onMounted(async () => {
  const [dashboardResult, investmentsResult] = await Promise.allSettled([
    authApi.getInvestorDashboard(),
    investmentsApi.list(),
  ])
  if (dashboardResult.status === 'fulfilled') {
    dashboardData.value = dashboardResult.value as DashboardPayload
  } else {
    const err = dashboardResult.reason as {
      response?: { data?: { detail?: string; message?: string } }
      message?: string
    }
    dashboardError.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unable to load dashboard data.'
  }
  if (investmentsResult.status === 'fulfilled') {
    investmentData.value = extractInvestmentRecords(investmentsResult.value)
  }
  dashboardLoading.value = false
})
</script>

<template>
  <div class="dashboard-wrapper">
    <div class="content">
      <section class="hero-row">
        <div>
          <h2>{{ greeting }}, {{ investorName }}</h2>
          <p>Your account overview</p>
        </div>
      </section>

      <p v-if="dashboardLoading" class="dashboard-message">Loading dashboard data…</p>
      <p v-else-if="dashboardError" class="dashboard-message dashboard-message--error" role="alert">
        {{ dashboardError }}
      </p>
      <template v-else>
        <section class="kpi-row" aria-label="Key metrics">
          <article v-for="kpi in kpis" :key="kpi.id" class="kpi" :class="[`kpi--${kpi.tone}`]">
            <div class="kpi__main">
              <img v-if="kpi.icon" :src="kpi.icon" :alt="''" class="kpi__icon" />
              <div class="kpi__copy">
                <p class="kpi__label">{{ kpi.label }}</p>
                <p class="kpi__value">{{ kpi.value }}</p>
              </div>
            </div>
            <span
              v-if="kpi.tone === 'alert' && overdueReturns.length"
              class="kpi__badge"
              aria-hidden="true"
              >!</span
            >
          </article>
        </section>

        <section class="mid-row" aria-label="Returns and allocation">
          <article class="panel panel--overdue">
            <header class="panel__head">
              <h3>
                Overdue Returns
                <span class="count-badge" :class="{ 'count-badge--empty': !overdueReturns.length }">
                  {{ overdueReturns.length }}
                </span>
              </h3>
            </header>
            <ul class="overdue-list">
              <li
                v-for="item in overdueReturns"
                :key="String(item.id ?? item.investment_id ?? item.package_name)"
              >
                <div class="overdue-list__meta">
                  <strong>{{ recordValue(item, ['package_name']) }}</strong>
                  <span>{{ recordValue(item, ['cooperative_name']) }}</span>
                </div>
                <div class="overdue-list__amount">
                  <strong>{{ amount(valueFrom(item, ['amount'])) }}</strong>
                  <time>{{ displayDate(valueFrom(item, ['due_date'])) }}</time>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="m6 3 5 5-5 5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </li>
              <li v-if="!overdueReturns.length" class="overdue-list__empty">No overdue returns</li>
            </ul>
            <RouterLink class="btn-outline btn-outline--wide" to="/dashboard/investments"
              >View all</RouterLink
            >
          </article>
          <article class="panel panel--allocation">
            <header class="panel__head panel__head--split">
              <h3>Investment by Farming Category</h3>
              <RouterLink class="allocation-details" to="/dashboard/investments"
                >View Details</RouterLink
              >
            </header>
            <div class="allocation">
              <div class="donut" :style="{ background: allocationGradient }" aria-hidden="true">
                <div class="donut__hole">
                  <strong>{{ portfolioValue }}</strong>
                </div>
              </div>
              <ul class="legend">
                <li v-for="item in allocation" :key="item.label">
                  <span class="legend__dot" :style="{ background: item.color }"></span
                  ><span class="legend__label">{{ item.label }}</span
                  ><strong
                    >{{ item.amount === null ? '' : compactCurrency(item.amount)
                    }}{{ item.amount === null ? '' : ' ' }}({{ item.value }}%)</strong
                  >
                </li>
                <li v-if="!allocation.length">No farming category data.</li>
              </ul>
            </div>
          </article>
        </section>

        <section class="bottom-row" aria-label="Investments and activity">
          <article class="panel panel--farmers">
            <header class="panel__head panel__head--split">
              <h3>Recent Investments</h3>
              <RouterLink class="text-link" to="/dashboard/investments"
                >View All Investments</RouterLink
              >
            </header>
            <div class="table-wrap">
              <table class="investment-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Cooperative</th>
                    <th>Farming Category</th>
                    <th>Invested</th>
                    <th>Expected Return</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in recentInvestments" :key="String(item.id ?? index)">
                    <td>
                      <div class="package-cell">
                        <strong>{{ recordValue(item, ['package_title']) }}</strong>
                        <span>{{ recordValue(item, ['farming_category']) }}</span>
                      </div>
                    </td>
                    <td>{{ recordValue(item, ['cooperative_name']) }}</td>
                    <td>{{ recordValue(item, ['farming_category']) }}</td>
                    <td>{{ amount(valueFrom(item, ['invested_amount'])) }}</td>
                    <td>
                      <div class="expected-cell">
                        <span>{{ amount(valueFrom(item, ['expected_returns'])) }}</span>
                        <small v-if="valueFrom(item, ['roi_percentage']) !== undefined">
                          {{ recordValue(item, ['roi_percentage'])
                          }}{{
                            String(valueFrom(item, ['roi_percentage'])).includes('%') ? '' : '%'
                          }}
                          ROI
                        </small>
                      </div>
                    </td>
                    <td>{{ displayDate(valueFrom(item, ['due_date', 'expected_settlement'])) }}</td>
                    <td>
                      <span
                        class="investment-status"
                        :class="investmentStatusClass(recordValue(item, ['status']))"
                        >{{ recordValue(item, ['status']) }}</span
                      >
                    </td>
                  </tr>
                  <tr v-if="!recentInvestments.length">
                    <td colspan="7">No investment data available.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
          <article class="panel panel--activity">
            <header class="panel__head"><h3>Recent Activity</h3></header>
            <ul class="activity-list">
              <li v-for="(item, index) in activities" :key="index">
                <span
                  class="activity-list__dot"
                  :class="`activity-list__dot--${recordValue(item, ['tone'], 'green')}`"
                ></span>
                <div>
                  <strong>{{ recordValue(item, ['title', 'action', 'type']) }}</strong>
                  <p>{{ recordValue(item, ['detail', 'description', 'name']) }}</p>
                  <time>{{ recordValue(item, ['time', 'created_at', 'date']) }}</time>
                </div>
              </li>
              <li v-if="!activities.length" class="activity-list__empty">no recent activity</li>
            </ul>
            <RouterLink class="btn-outline btn-outline--wide" to="/dashboard/reports"
              >View all</RouterLink
            >
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dashboard-error {
  padding: 12px 16px;
  border-radius: 8px;
  background: #fee;
  color: #a22;
}

.dashboard-message {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-7);
  background: #fff;
}

.dashboard-message--error {
  background: #fee;
  color: #a22;
}

.dashboard-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.dashboard-data-card,
.dashboard-data-section {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-7);
  background: #fff;
  overflow: auto;
}

.dashboard-data-card h3,
.dashboard-data-section h3 {
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.dashboard-data-card p {
  overflow-wrap: anywhere;
  font-size: 1.25rem;
  font-weight: 600;
}

.dashboard-data-section pre {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: var(--font-body);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 32px;
  color: var(--color-ink);
  font-family: var(--font-body);
}

.hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hero-row h2 {
  margin-bottom: 0.35rem;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 2.5vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}

.hero-row p {
  color: var(--color-ink-soft);
  font-size: 0.95rem;
}

.btn-outline,
.text-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: var(--stroke-05) solid #c9d4cc;
  border-radius: 10px;
  background: #fff;
  color: var(--color-green-800);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-outline {
  min-height: 42px;
  padding: 0 1rem;
}

.btn-outline--wide {
  width: 100%;
}

.text-link {
  min-height: 34px;
  padding: 0 0.85rem;
  white-space: nowrap;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.kpi {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 145px;
  padding: 16px;
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 16px;
  background: #fff;
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

.kpi:nth-child(1) {
  animation-delay: 0.1s;
}
.kpi:nth-child(2) {
  animation-delay: 0.2s;
}
.kpi:nth-child(3) {
  animation-delay: 0.3s;
}
.kpi:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi--featured {
  background: #fff;
}

.kpi__main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.kpi__icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  padding: 9px;
  border-radius: 12px;
  background: #e8f4ed;
  object-fit: contain;
}

.kpi:first-child .kpi__icon {
  background: #31664b;
}

.kpi__copy {
  min-width: 0;
}

.kpi__label {
  margin: 0 0 5px;
  color: #727772;
  font-size: 0.78rem;
  font-weight: 500;
}

.kpi__value {
  margin: 0;
  color: #303431;
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.kpi__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.kpi__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  align-self: flex-start;
  padding: 0 20px;
  border-radius: 8px;
  background: #31664b;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
}

.panel {
  display: flex;
  flex-direction: column;
  border: var(--stroke-05) solid var(--color-border);
  background: #fff;
  animation: fadeIn 0.8s ease-out forwards;
  opacity: 0;
}

.panel--overdue {
  animation-delay: 0.5s;
}
.panel--allocation {
  animation-delay: 0.6s;
}
.panel--farmers {
  animation-delay: 0.7s;
}
.panel--activity {
  animation-delay: 0.8s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.panel__head h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-weight: var(--font-weight-body-large-bold);
  font-style: normal;
  font-size: var(--font-size-body-large);
  line-height: var(--line-height-body-large);
  letter-spacing: 0.0015em;
}

.panel__head--split {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.count-badge {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: var(--color-danger);
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
}

.count-badge--empty {
  background: #e8ebe7;
  color: var(--color-ink-soft);
}

.mid-row {
  display: flex;
  gap: 24px;
  width: 100%;
  height: 448px;
}

.panel--overdue {
  flex: 1;
  min-width: 0;
  height: 448px;
  gap: 33px;
  padding: var(--space-9) var(--space-7);
  border-radius: var(--radius-7);
}

.panel--allocation {
  flex: 0 0 400px;
  min-width: 300px;
  height: 448px;
  gap: 16px;
  padding: 18px;
  border-radius: var(--radius-7);
  border-top: 0.5px solid var(--color-primary-300);
}

.panel--allocation .panel__head {
  gap: 8px;
}

.panel--allocation .panel__head h3 {
  font-size: 0.92rem;
}

.allocation-details {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid #b7d6c1;
  border-radius: 7px;
  color: var(--color-green-800);
  font-size: 0.68rem;
  text-decoration: none;
  white-space: nowrap;
}

.allocation-details:hover {
  background: #f1f8f3;
}

.overdue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
}

.overdue-list li {
  display: grid;
  grid-template-columns: 1fr auto 16px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: #fbeeee;
  color: var(--color-ink-soft);
}

.overdue-list li.overdue-list__empty {
  display: block;
  background: transparent;
  color: var(--color-ink-soft);
}

.overdue-list__meta,
.overdue-list__amount {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.overdue-list strong {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
}

.overdue-list span,
.overdue-list time {
  font-size: 0.78rem;
}

.overdue-list__amount {
  text-align: right;
}

.overdue-list__amount time {
  color: var(--color-danger);
  font-weight: 600;
}

.allocation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.donut {
  position: relative;
  flex: 0 0 140px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  animation: scaleIn 0.8s ease-out forwards;
  transform: scale(0);
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.donut__hole {
  position: absolute;
  inset: 19px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
}

.donut__hole strong {
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 0.88rem;
  white-space: nowrap;
  font-weight: 700;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend li {
  display: grid;
  grid-template-columns: 8px minmax(40px, 1fr) auto;
  align-items: center;
  gap: 6px;
}

.legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend__label {
  color: var(--color-ink-soft);
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend strong {
  font-family: var(--font-display);
  font-size: 0.64rem;
  font-weight: 600;
  white-space: nowrap;
}

.bottom-row {
  display: flex;
  gap: 28px;
  width: 100%;
  height: 576px;
}

.panel--farmers {
  flex: 1;
  min-width: 0;
  height: 576px;
  gap: 28px;
  padding: var(--space-7) var(--space-9);
  border-radius: var(--radius-7);
  border-top: 0.5px solid var(--color-primary-300);
}

.panel--activity {
  flex: 0 0 350px;
  min-width: 300px;
  height: 576px;
  gap: 33px;
  padding: var(--space-9) var(--space-7);
  border-radius: var(--radius-7);
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

.investment-table {
  min-width: 0;
  table-layout: fixed;
}

.investment-table th {
  padding: 10px 6px;
  color: #9ca3af;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid #f3f4f6;
}

.investment-table td {
  padding: 12px 6px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.investment-table th:nth-child(1) {
  width: 18%;
}
.investment-table th:nth-child(2) {
  width: 18%;
}
.investment-table th:nth-child(3) {
  width: 15%;
}
.investment-table th:nth-child(4) {
  width: 13%;
}
.investment-table th:nth-child(5) {
  width: 16%;
}
.investment-table th:nth-child(6) {
  width: 10%;
}
.investment-table th:nth-child(7) {
  width: 10%;
}

.package-cell {
  display: flex;
  min-width: 130px;
  flex-direction: column;
  gap: 2px;
}

.package-cell strong {
  color: #111827;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
}

.package-cell span {
  color: #6b7280;
  font-size: 0.75rem;
}

.expected-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.expected-cell small {
  color: #3f7a5c;
  font-size: 0.62rem;
}

.investment-status {
  display: inline-flex;
  min-width: 96px;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  white-space: nowrap;
}

.investment-status--active {
  border-color: #a6e4c5;
  background: #e8f7f0;
  color: #12b76a;
}

.investment-status--pending {
  border-color: #fcd34d;
  background: #fef3c7;
  color: #d97706;
}

.investment-status--repaid {
  border-color: #a8c5ff;
  background: #eff4ff;
  color: #3769d6;
}

.investment-status--rejected,
.investment-status--overdue {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #ef4444;
}

.investment-view {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  border: 1px solid #12b76a;
  border-radius: 8px;
  background: #fff;
  color: #12b76a;
  font-size: 0.75rem;
  text-decoration: none;
  white-space: nowrap;
}

.investment-view:hover {
  background: #ecfdf5;
}

th,
td {
  padding: 12px 8px;
  text-align: left;
  vertical-align: middle;
  font-size: 0.82rem;
}

th {
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-weight: 600;
  border-bottom: var(--stroke-05) solid var(--color-border);
  white-space: nowrap;
}

td {
  color: var(--color-ink);
  border-bottom: var(--stroke-05) solid #eef1ee;
}

.farmer-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.farmer-cell img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.farmer-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-display);
  font-weight: 600;
}

.expected-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.expected-cell small {
  color: var(--color-primary-300);
  font-weight: 600;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status--track {
  border: 1px solid #6eb489;
  background: #eef8f1;
  color: #1f6b45;
}

.status--overdue {
  border: 1px solid #e08a8a;
  background: #fdeeee;
  color: var(--color-danger);
}

.more-btn {
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
}

.activity-list li {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  background: #f7f8f6;
}

.activity-list li.activity-list__empty {
  display: block;
  padding: 0 12px;
  background: transparent;
  color: var(--color-ink-soft);
}

.activity-list__dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
}

.activity-list__dot--green {
  background: #2f8a4e;
}
.activity-list__dot--red {
  background: var(--color-danger);
}
.activity-list__dot--orange {
  background: var(--color-warning);
}

.activity-list strong {
  display: block;
  margin-bottom: 2px;
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-list p {
  color: var(--color-ink-soft);
  font-size: 0.8rem;
}

.activity-list time {
  display: block;
  margin-top: 6px;
  color: #8a948c;
  font-size: 0.75rem;
}

@media (max-width: 1400px) {
  .mid-row,
  .bottom-row,
  .panel--overdue,
  .panel--allocation,
  .panel--farmers,
  .panel--activity {
    width: auto;
    height: auto;
    flex: 1 1 auto;
  }

  .mid-row,
  .bottom-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 1100px) {
  .kpi-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }

  .hero-row {
    flex-direction: column;
  }

  .content {
    padding: 16px;
  }

  .overdue-list li {
    grid-template-columns: 40px 1fr;
  }

  .overdue-list__amount {
    grid-column: 2;
    text-align: left;
  }

  .overdue-list li svg {
    display: none;
  }

  .allocation {
    flex-direction: column;
  }

  .panel--farmers {
    min-width: 0;
    padding: 20px 16px;
    gap: 18px;
  }

  .panel--farmers .panel__head--split {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .panel--farmers .table-wrap {
    flex: initial;
    width: 100%;
    overflow: visible;
  }

  .panel--farmers .investment-table {
    display: block;
    width: 100%;
    min-width: 0;
    table-layout: auto;
  }

  .panel--farmers .investment-table thead {
    display: none;
  }

  .panel--farmers .investment-table tbody {
    display: grid;
    gap: 12px;
  }

  .panel--farmers .investment-table tbody tr {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
    padding: 14px 0;
    border-bottom: 1px solid #e8eeea;
  }

  .panel--farmers .investment-table tbody td {
    display: block;
    min-width: 0;
    padding: 0;
    border: 0;
    overflow: visible;
    font-size: 0.78rem;
    overflow-wrap: anywhere;
    text-overflow: clip;
  }

  .panel--farmers .investment-table tbody td::before {
    display: block;
    margin-bottom: 3px;
    color: #8a948f;
    font-size: 0.61rem;
    font-weight: 600;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }

  .panel--farmers .investment-table tbody td:nth-child(1) {
    grid-column: 1 / -1;
  }

  .panel--farmers .investment-table tbody td[colspan] {
    grid-column: 1 / -1;
  }

  .panel--farmers .investment-table tbody td[colspan]::before {
    content: none;
  }

  .panel--farmers .investment-table tbody td:nth-child(1)::before {
    content: 'Package';
  }
  .panel--farmers .investment-table tbody td:nth-child(2)::before {
    content: 'Cooperative';
  }
  .panel--farmers .investment-table tbody td:nth-child(3)::before {
    content: 'Category';
  }
  .panel--farmers .investment-table tbody td:nth-child(4)::before {
    content: 'Invested';
  }
  .panel--farmers .investment-table tbody td:nth-child(5)::before {
    content: 'Expected return';
  }
  .panel--farmers .investment-table tbody td:nth-child(6)::before {
    content: 'Due date';
  }
  .panel--farmers .investment-table tbody td:nth-child(7)::before {
    content: 'Status';
  }

  .panel--farmers .investment-table .package-cell {
    min-width: 0;
  }

  .panel--farmers .investment-table .package-cell strong,
  .panel--farmers .investment-table .package-cell span {
    overflow-wrap: anywhere;
  }
}

.dashboard-wrapper {
  position: relative;
  min-height: 100vh;
}
</style>
