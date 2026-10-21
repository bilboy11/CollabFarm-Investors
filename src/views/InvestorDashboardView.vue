<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import africanFarmer from '@/assets/images/African farmer.png'
import farmerProfile from '@/assets/images/Farmer profile photo.png'
import femaleFarmer from '@/assets/images/female african farmer.png'
import availableIcon from '@/assets/images/Available.png'
import lockedIcon from '@/assets/images/Locked.png'
import disbursedIcon from '@/assets/images/Disbursed.png'
import { authApi, investmentsApi, walletApi } from '@/services/api'

type DashboardPayload = Record<string, unknown>

const dashboardData = ref<DashboardPayload | null>(null)
const investmentData = ref<DashboardPayload[]>([])
const walletOverview = ref<DashboardPayload>({})
const dashboardLoading = ref(true)
const dashboardError = ref('')
const avatarFallbacks = [femaleFarmer, farmerProfile, africanFarmer]
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
  const summary = dashboardFields.value.summary
  const summaryValue =
    summary && typeof summary === 'object'
      ? valueFrom(summary as DashboardPayload, keys)
      : undefined
  return summaryValue ?? valueFrom(dashboardFields.value, keys) ?? fallback
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
  return Array.isArray(value)
    ? value.filter((item): item is DashboardPayload => Boolean(item) && typeof item === 'object')
    : []
}

function recordValue(record: DashboardPayload, keys: string[], fallback = '—'): string {
  return text(valueFrom(record, keys), fallback)
}

const investorName = computed(() => text(metric(['full_name', 'name', 'first_name']), 'Investor'))
const totalInvested = computed(() =>
  amount(metric(['total_invested', 'invested_amount', 'total_investment'])),
)
const expectedReturn = computed(() =>
  amount(metric(['expected_return', 'expected_returns', 'total_expected_return'])),
)
const returnRate = computed(() => {
  const value = metric(['return_rate', 'roi', 'average_roi'])
  return value === '—' ? value : `${text(value)}${String(value).includes('%') ? '' : '%'}`
})
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

const recentInvestments = computed(() =>
  investmentData.value.map((investment) => {
    const pkg =
      investment.package && typeof investment.package === 'object'
        ? (investment.package as DashboardPayload)
        : investment.funding_package && typeof investment.funding_package === 'object'
          ? (investment.funding_package as DashboardPayload)
          : {}
    return {
      ...investment,
      id: investment.id ?? investment.investment_id,
      farmer_name:
        investment.farmer_name ?? investment.investor_name ?? investment.full_name ?? '—',
      crop_type: investment.crop_type ?? investment.category ?? pkg.category ?? '—',
      invested_amount:
        investment.invested_amount ?? investment.amount_invested ?? investment.amount,
      expected_return: investment.expected_return ?? investment.expected_amount,
      roi: investment.roi ?? investment.return_rate ?? pkg.expected_roi,
      due_date: investment.due_date ?? investment.maturity_date ?? pkg.expected_payback_date,
    }
  }),
)
const activities = computed(() => records(['recent_activity', 'recent_activities', 'activities']))
const allocation = computed(() => {
  const entries = records(['investment_allocation', 'allocation', 'allocations', 'crop_allocation'])
  return entries.map((entry, index) => ({
    label: recordValue(entry, ['label', 'crop', 'crop_type', 'name']),
    value: Number(valueFrom(entry, ['value', 'percentage', 'percent', 'share'])) || 0,
    color: allocationColors[index % allocationColors.length],
  }))
})
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
    id: 'available',
    label: 'Available Balance',
    value: amount(valueFrom(walletOverview.value, ['available_balance'])),
    icon: availableIcon,
    tone: 'wallet',
    action: true,
  },
  {
    id: 'locked',
    label: 'Locked Funds',
    value: amount(valueFrom(walletOverview.value, ['locked_funds'])),
    icon: lockedIcon,
    tone: 'wallet',
  },
  {
    id: 'disbursed',
    label: 'Disbursed Funds',
    value: amount(valueFrom(walletOverview.value, ['actively_distributed'])),
    icon: disbursedIcon,
    tone: 'wallet',
  },
  {
    id: 'overdue',
    label: 'Overdue Returns',
    value: text(
      metric(['overdue_count', 'overdue_investment_count']),
      String(overdueReturns.value.length),
    ),
    tone: 'alert',
  },
])

onMounted(async () => {
  const [dashboardResult, investmentsResult, walletResult] = await Promise.allSettled([
    authApi.getInvestorDashboard(),
    investmentsApi.list(),
    walletApi.overview(),
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
  if (walletResult.status === 'fulfilled') {
    const result = walletResult.value as DashboardPayload
    walletOverview.value =
      result.data && typeof result.data === 'object' ? (result.data as DashboardPayload) : result
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
            <span v-if="kpi.tone === 'alert' && overdueReturns.length" class="kpi__badge" aria-hidden="true">!</span>
            <RouterLink v-if="kpi.action" class="kpi__action" to="/dashboard/wallet"
              >View Wallet <span aria-hidden="true">→</span></RouterLink
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
              <li v-for="(item, index) in overdueReturns" :key="String(item.id ?? index)">
                <img
                  :src="
                    text(
                      valueFrom(item, ['avatar', 'avatar_url', 'image']),
                      avatarFallbacks[index % avatarFallbacks.length],
                    )
                  "
                  alt=""
                />
                <div class="overdue-list__meta">
                  <strong>{{
                    recordValue(item, ['farmer_name', 'investor_name', 'name', 'full_name'])
                  }}</strong
                  ><span>{{ recordValue(item, ['crop', 'crop_type']) }}</span>
                </div>
                <div class="overdue-list__amount">
                  <strong
                    >{{
                      amount(valueFrom(item, ['expected_return', 'amount', 'return_amount']))
                    }}
                    Expected Return</strong
                  ><time>{{ recordValue(item, ['due_date', 'due']) }}</time>
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
              <h3>Investment Allocation</h3>
            </header>
            <div class="allocation">
              <div class="donut" :style="{ background: allocationGradient }" aria-hidden="true">
                <div class="donut__hole">
                  <strong>{{ totalInvested }}</strong>
                </div>
              </div>
              <ul class="legend">
                <li v-for="item in allocation" :key="item.label">
                  <span class="legend__dot" :style="{ background: item.color }"></span
                  ><span class="legend__label">{{ item.label }}</span
                  ><strong>{{ item.value }}%</strong>
                </li>
                <li v-if="!allocation.length">No allocation data.</li>
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
              <table>
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Crop Type</th>
                    <th>Invested</th>
                    <th>Expected Return</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in recentInvestments" :key="String(item.id ?? index)">
                    <td>
                      <div class="farmer-cell">
                        <img
                          :src="
                            text(
                              valueFrom(item, ['avatar', 'avatar_url', 'image']),
                              avatarFallbacks[index % avatarFallbacks.length],
                            )
                          "
                          alt=""
                        /><span>{{ recordValue(item, ['farmer_name', 'name', 'full_name']) }}</span>
                      </div>
                    </td>
                    <td>{{ recordValue(item, ['crop', 'crop_type']) }}</td>
                    <td>
                      {{
                        amount(valueFrom(item, ['invested_amount', 'amount', 'investment_amount']))
                      }}
                    </td>
                    <td>
                      <div class="expected-cell">
                        <span>{{
                          amount(valueFrom(item, ['expected_return', 'expected_amount']))
                        }}</span
                        ><small>{{ recordValue(item, ['roi', 'return_rate']) }} ROI</small>
                      </div>
                    </td>
                    <td>{{ recordValue(item, ['due_date', 'maturity_date']) }}</td>
                    <td>
                      <span
                        class="status"
                        :class="
                          recordValue(item, ['status']).toLowerCase() === 'overdue'
                            ? 'status--overdue'
                            : 'status--track'
                        "
                        >{{ recordValue(item, ['status']) }}</span
                      >
                    </td>
                    <td>
                      <button class="more-btn" type="button" aria-label="More options">⋯</button>
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
              <li v-for="(item, index) in activities" :key="String(item.id ?? index)">
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
  gap: 32px;
  padding: var(--space-7) var(--space-9);
  border-radius: var(--radius-7);
  border-top: 0.5px solid var(--color-primary-300);
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
  grid-template-columns: 44px 1fr auto 16px;
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

.overdue-list img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
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
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.donut {
  position: relative;
  flex: 0 0 210px;
  width: 210px;
  height: 210px;
  border-radius: 50%;
}

.donut__hole {
  position: absolute;
  inset: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
}

.donut__hole strong {
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend li {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 10px;
}

.legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend__label {
  color: var(--color-ink-soft);
  font-size: 0.9rem;
}

.legend strong {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
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
  gap: 8px;
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
}

.dashboard-wrapper {
  position: relative;
  min-height: 100vh;
}
</style>
