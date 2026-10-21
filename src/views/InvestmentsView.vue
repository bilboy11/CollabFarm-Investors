<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import totalIcon from '@/assets/images/total.png'
import activeIcon from '@/assets/images/active.png'
import disbursedIcon from '@/assets/images/Disbursed.png'
import pendingIcon from '@/assets/images/pending.png'
import cropIcon from '@/assets/images/crop.png'
import fishIcon from '@/assets/images/fish.png'
import mixedIcon from '@/assets/images/mixed.png'
import livestockIcon from '@/assets/images/livestock.png'
import poultryIcon from '@/assets/images/poultry.png'
import { investmentsApi } from '@/services/api'

interface Investment {
  id: string | number
  packageName: string
  category: string
  tier: string
  amountInvested: number | null
  progressPercentage: number | null
  fundingProgress: string
  expectedSettlement: string
  dateInvested: string
  status: string
  investmentId: string
  transactionRef: string
  raised: number | null
  targetAmount: number | null
  farmersSupported: string
  farmSize: string
  locations: string
  expectedSettlementDate: string
  expectedSettlementAmount: number | null
}

const selectedInvestment = ref<Investment | null>(null)
const searchQuery = ref('')
const statusFilter = ref('All Status')
const packageFilter = ref('All Packages')
const sortBy = ref('Newest')
const investments = ref<Investment[]>([])
const investmentSummary = ref<InvestmentRecord>({})
const loading = ref(true)
const errorMessage = ref('')
const detailLoading = ref(false)

type InvestmentRecord = Record<string, unknown>

function valueOf(record: InvestmentRecord, keys: string[]): unknown {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null) return record[key]
  return undefined
}

function asRecord(value: unknown): InvestmentRecord {
  return value && typeof value === 'object' ? value as InvestmentRecord : {}
}

function extractInvestments(response: unknown): InvestmentRecord[] {
  if (Array.isArray(response)) return response.filter((item): item is InvestmentRecord => Boolean(item) && typeof item === 'object')
  if (!response || typeof response !== 'object') return []
  const payload = response as InvestmentRecord
  for (const key of ['investments', 'items', 'results', 'data']) {
    const nested = payload[key]
    if (Array.isArray(nested)) return extractInvestments(nested)
    if (nested && typeof nested === 'object') {
      const records = extractInvestments(nested)
      if (records.length) return records
    }
  }
  return []
}

function numberValue(record: InvestmentRecord, keys: string[]): number | null {
  const value = valueOf(record, keys)
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(date)
}

function mapInvestment(record: InvestmentRecord): Investment {
  const pkg = asRecord(record.package ?? record.funding_package)
  const investmentDetails = asRecord(record.investment_details)
  const packageProgress = asRecord(record.package_progress)
  const settlementInfo = asRecord(record.settlement_info)
  const rawId = valueOf(record, ['id', 'investment_id', 'uuid'])
  const amount = numberValue(investmentDetails, ['amount_invested']) ?? numberValue(record, ['amount_invested', 'investment_amount', 'amount'])
  const raised = numberValue(packageProgress, ['amount_raised']) ?? numberValue(pkg, ['amount_raised', 'raised_amount', 'total_raised']) ?? numberValue(record, ['amount_raised', 'raised_amount'])
  const target = numberValue(packageProgress, ['target_amount']) ?? numberValue(pkg, ['fund_amount', 'target_amount']) ?? numberValue(record, ['target_amount', 'package_amount'])
  const categoryValue = String(valueOf(pkg, ['category']) ?? valueOf(record, ['farming_category', 'category']) ?? '')
  const category = categoryValue.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const progressValue = numberValue(record, ['funding_progress_percentage']) ?? numberValue(packageProgress, ['progress_percentage']) ?? numberValue(record, ['funding_progress', 'progress'])
  const expectedDate = valueOf(settlementInfo, ['expected_settlement_date']) ?? valueOf(pkg, ['expected_payback_date', 'expected_settlement_date']) ?? valueOf(record, ['expected_settlement_date', 'expected_payback_date', 'due_date'])
  const expectedSettlementAmount = numberValue(settlementInfo, ['expected_settlement_amount']) ?? numberValue(record, ['expected_settlement', 'expected_settlement_amount'])
  const dateInvested = valueOf(record, ['invested_date_str']) ?? valueOf(investmentDetails, ['date_invested']) ?? valueOf(record, ['created_at', 'date_invested', 'investment_date'])
  const investmentCode = valueOf(investmentDetails, ['investment_id_code'])
  return {
    id: (rawId as string | number | undefined) ?? '—',
    packageName: String(valueOf(pkg, ['title', 'name']) ?? valueOf(record, ['package_title', 'package_name', 'title']) ?? '—'),
    category: category || '—',
    tier: String(valueOf(pkg, ['package_type', 'type']) ?? valueOf(record, ['package_code', 'package_type', 'tier']) ?? '—').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    amountInvested: amount,
    progressPercentage: progressValue,
    fundingProgress: progressValue !== null ? `${progressValue}%` : raised !== null && target ? `${Math.round((raised / target) * 100)}%` : '—',
    expectedSettlement: expectedSettlementAmount !== null ? formatCurrency(expectedSettlementAmount) : formatDate(expectedDate),
    dateInvested: formatDate(dateInvested),
    status: String(valueOf(investmentDetails, ['status']) ?? valueOf(record, ['status', 'investment_status']) ?? '—').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    investmentId: String(investmentCode ?? rawId ?? '—'),
    transactionRef: String(valueOf(investmentDetails, ['transaction_reference']) ?? valueOf(record, ['transaction_reference', 'transaction_ref', 'reference']) ?? '—'),
    raised,
    targetAmount: target,
    farmersSupported: String(valueOf(packageProgress, ['farmers_supported']) ?? valueOf(pkg, ['farmers_supported', 'farmer_count']) ?? '—'),
    farmSize: String(valueOf(packageProgress, ['total_farm_size_ha']) ?? valueOf(pkg, ['farm_size', 'total_farm_size']) ?? '—'),
    locations: String(valueOf(packageProgress, ['locations_count']) ?? valueOf(pkg, ['location_count', 'locations']) ?? '—'),
    expectedSettlementDate: formatDate(expectedDate),
    expectedSettlementAmount,
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

const summaryCards = computed(() => {
  const sum = (records: Investment[]) => records.reduce((total, record) => total + (record.amountInvested ?? 0), 0)
  const active = investments.value.filter((investment) => investment.status.toLowerCase() === 'active')
  const pending = investments.value.filter((investment) => investment.status.toLowerCase() === 'pending')
  const packages = new Map(investments.value.filter((investment) => investment.targetAmount !== null).map((investment) => [investment.packageName, investment.targetAmount as number]))
  return [
    { id: 'total-invested', label: 'Total Invested', value: formatCurrency(numberValue(investmentSummary.value, ['total_invested']) ?? sum(investments.value)), icon: totalIcon },
    { id: 'active-investments', label: 'Active Investments', value: String(numberValue(investmentSummary.value, ['active_investments']) ?? active.length), icon: activeIcon },
    { id: 'packages-funded', label: 'Packages Funded', value: String(numberValue(investmentSummary.value, ['packages_funded']) ?? packages.size), icon: disbursedIcon },
    { id: 'pending-settlement', label: 'Pending Settlement', value: formatCurrency(numberValue(investmentSummary.value, ['pending_settlement']) ?? sum(pending)), icon: pendingIcon },
  ]
})

const statusOptions = ['All Status', 'Active', 'Inactive', 'Pending', 'Rejected']
const packageOptions = ['All Packages', 'Crop Farming', 'Fishery', 'Mixed Farming', 'Livestock', 'Poultry']
const sortOptions = ['Newest', 'Oldest', 'Marked as Repaid', 'Flag Loan', 'Extended Due Date']

const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = computed(() => filteredInvestments.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

const filteredInvestments = computed(() => investments.value.filter((investment) => {
  const query = searchQuery.value.trim().toLowerCase()
  const matchesQuery = !query || `${investment.packageName} ${investment.category} ${investment.investmentId}`.toLowerCase().includes(query)
  const matchesStatus = statusFilter.value === 'All Status' || investment.status.toLowerCase() === statusFilter.value.toLowerCase()
  const matchesPackage = packageFilter.value === 'All Packages' || investment.category === packageFilter.value
  return matchesQuery && matchesStatus && matchesPackage
}))

const paginatedInvestments = computed(() => filteredInvestments.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    Active: 'status--active',
    Inactive: 'status--inactive',
    Pending: 'status--pending',
    Rejected: 'status--rejected',
  }
  return statusMap[status] || ''
}

async function selectInvestment(investment: Investment) {
  selectedInvestment.value = investment
  detailLoading.value = true
  try {
    const response = await investmentsApi.detail(String(investment.id))
    const payload = asRecord(response)
    const detail = asRecord(payload.data ?? payload.investment ?? payload)
    if (Object.keys(detail).length) selectedInvestment.value = mapInvestment(detail)
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unable to load investment details.'
  } finally {
    detailLoading.value = false
  }
}

function goBack() {
  selectedInvestment.value = null
}

function getProgressPercentage(raised: number | null, target: number | null): number {
  return raised === null || !target ? 0 : Math.round((raised / target) * 100)
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Crop Farming': cropIcon,
    'Fishery': fishIcon,
    'Mixed Farming': mixedIcon,
    'Livestock': livestockIcon,
    'Poultry': poultryIcon,
  }
  return iconMap[category] || ''
}

onMounted(async () => {
  try {
    const response = await investmentsApi.list()
    const payload = asRecord(response)
    const data = asRecord(payload.data ?? payload)
    investmentSummary.value = asRecord(data.summary)
    investments.value = extractInvestments(response).map(mapInvestment)
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unable to load investments.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="investments-wrapper">
    <!-- VIEW 1: MAIN INVESTMENTS DASHBOARD -->
    <div v-if="!selectedInvestment" class="content">
      <header class="page-header">
        <h1 class="page-title">Investments</h1>
        <p class="page-subtitle">Track and manage your active and completed investments</p>
      </header>

      <!-- Summary Metric Cards -->
      <section class="summary-cards">
        <article v-for="card in summaryCards" :key="card.id" class="summary-card">
          <div class="summary-card__icon">
            <img :src="card.icon" :alt="card.label" class="summary-card__icon-img" />
          </div>
          <div class="summary-card__content">
            <p class="summary-card__label">{{ card.label }}</p>
            <p class="summary-card__value">{{ card.value }}</p>
          </div>
        </article>
      </section>

      <!-- Filter Bar & Table Card -->
      <section class="table-card">
        <div class="filter-bar">
          <label class="search-input">
            <input v-model="searchQuery" type="search" placeholder="Search investments" />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
              <path
                d="m10.5 10.5 3 3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </label>

          <div class="dropdowns">
            <select v-model="statusFilter" class="dropdown">
              <option v-for="option in statusOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <select v-model="packageFilter" class="dropdown">
              <option v-for="option in packageOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <select v-model="sortBy" class="dropdown">
              <option v-for="option in sortOptions" :key="option" :value="option">
                Sort by: {{ option }}
              </option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PACKAGE</th>
                <th>PACKAGE TYPE</th>
                <th>AMOUNT INVESTED</th>
                <th>FUNDING PROGRESS</th>
                <th>EXPECTED SETTLEMENT</th>
                <th>DATE INVESTED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="8">Loading investments…</td></tr>
              <tr v-else-if="errorMessage"><td colspan="8">{{ errorMessage }}</td></tr>
              <tr v-else-if="!paginatedInvestments.length"><td colspan="8">No investments found.</td></tr>
              <tr v-for="investment in paginatedInvestments" :key="investment.id">
                <td>
                  <div class="package-cell">
                    <strong>{{ investment.packageName }}</strong>
                    <span>{{ investment.category }}</span>
                  </div>
                </td>
                <td>{{ investment.tier }}</td>
                <td>{{ formatCurrency(investment.amountInvested) }}</td>
                <td>{{ investment.fundingProgress }}</td>
                <td>{{ investment.expectedSettlement }}</td>
                <td>{{ investment.dateInvested }}</td>
                <td>
                  <span class="status" :class="getStatusClass(investment.status)">
                    {{ investment.status }}
                  </span>
                </td>
                <td>
                  <button
                    @click="selectInvestment(investment)"
                    class="btn-view"
                    type="button"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <p class="pagination__info">Showing {{ paginatedInvestments.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }} - {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} Applications</p>
          <div class="pagination__controls">
            <button class="page-btn" type="button" :disabled="currentPage === 1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              class="page-btn"
              :class="{ 'page-btn--active': page === currentPage }"
              type="button"
            >
              {{ page }}
            </button>
            <button class="page-btn" type="button" :disabled="currentPage === totalPages">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3 11 8l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- VIEW 2: INVESTMENT DETAILS -->
    <div v-else class="content details-view">
      <header class="page-header">
        <h1 class="page-title">Investments</h1>
        <p class="page-subtitle">Track and manage your active and completed investments</p>
      </header>

      <!-- Header Banner Card -->
      <div class="header-banner">
        <div class="header-banner__left">
          <div class="header-banner__icon">
            <img v-if="getCategoryIcon(selectedInvestment.category)" :src="getCategoryIcon(selectedInvestment.category)" :alt="selectedInvestment.category" class="header-banner__icon-img" />
          </div>
          <div class="header-banner__info">
            <div class="header-banner__title-row">
              <h2 class="header-banner__title">{{ selectedInvestment.packageName }}</h2>
              <span class="category-pill">{{ selectedInvestment.category }}</span>
            </div>
            <p class="header-banner__subtitle">
              {{ selectedInvestment.investmentId }} • Invested on {{ selectedInvestment.dateInvested }}
            </p>
          </div>
        </div>
        <button class="btn-package-details" type="button">
          View Package Details ›
        </button>
      </div>

      <!-- Two-Column Details Layout -->
      <div class="details-grid">
        <!-- Left Card: Your Investment Details -->
        <div class="details-card details-card--left">
          <h3 class="details-card__title">Your Investment Details</h3>
          <p class="details-card__subtitle">Details of your contribution to this Package</p>

          <!-- Highlight Banner -->
          <div class="highlight-banner">
            <div class="highlight-banner__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3V7z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="highlight-banner__content">
              <p class="highlight-banner__label">Amount Invested</p>
              <p class="highlight-banner__value">{{ formatCurrency(selectedInvestment.amountInvested) }}</p>
            </div>
          </div>

          <!-- Spec Rows -->
          <div class="spec-rows">
            <div class="spec-row">
              <span class="spec-row__label">Investment ID</span>
              <span class="spec-row__value">{{ selectedInvestment.investmentId }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-row__label">Date Invested</span>
              <span class="spec-row__value">{{ selectedInvestment.dateInvested }}, 10:30 AM</span>
            </div>
            <div class="spec-row">
              <span class="spec-row__label">Transaction Reference</span>
              <span class="spec-row__value">{{ selectedInvestment.transactionRef }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-row__label">Investment Status</span>
              <div class="status-indicator">
                <span class="status-dot status-dot--active"></span>
                <span class="status-indicator__text">{{ selectedInvestment.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Stacked Cards -->
        <div class="details-column-right">
          <!-- Top Card: Package Funding Progress -->
          <div class="details-card">
            <div class="details-card__header">
              <h3 class="details-card__title">Package Funding Progress</h3>
              <span class="progress-percentage">{{ selectedInvestment.progressPercentage ?? getProgressPercentage(selectedInvestment.raised, selectedInvestment.targetAmount) }}%</span>
            </div>
            <p class="details-card__subtitle">Details of your contribution to this Package</p>

            <div class="progress-bar-container">
              <div class="progress-bar-track">
                <div
                  class="progress-bar-fill"
                  :style="{ width: Math.min(100, selectedInvestment.progressPercentage ?? getProgressPercentage(selectedInvestment.raised, selectedInvestment.targetAmount)) + '%' }"
                ></div>
              </div>
            </div>

            <p class="progress-sublabel">
              <strong>{{ formatCurrency(selectedInvestment.raised) }}</strong> raised of {{ formatCurrency(selectedInvestment.targetAmount) }}
            </p>

            <!-- 3 Metric Badges -->
            <div class="metric-badges">
              <div class="metric-badge">
                <div class="metric-badge__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </div>
                <div class="metric-badge__content">
                  <p class="metric-badge__value">{{ selectedInvestment.farmersSupported }}</p>
                  <p class="metric-badge__label">Farmers Supported</p>
                </div>
              </div>
              <div class="metric-badge">
                <div class="metric-badge__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="metric-badge__content">
                  <p class="metric-badge__value">{{ selectedInvestment.farmSize }}</p>
                  <p class="metric-badge__label">Total Farm Size</p>
                </div>
              </div>
              <div class="metric-badge">
                <div class="metric-badge__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </div>
                <div class="metric-badge__content">
                  <p class="metric-badge__value">{{ selectedInvestment.locations }}</p>
                  <p class="metric-badge__label">Locations</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Card: Settlement Information -->
          <div class="details-card">
            <h3 class="details-card__title">Settlement Information</h3>
            <p class="details-card__subtitle">Details about the expected settlement for your investment.</p>

            <div class="spec-row spec-row--full">
              <span class="spec-row__label"><strong>Expected Settlement Date</strong></span>
              <span class="spec-row__value">{{ selectedInvestment.expectedSettlementDate }}</span>
            </div>
            <div class="spec-row spec-row--full">
              <span class="spec-row__label"><strong>Expected Settlement Amount</strong></span>
              <span class="spec-row__value">{{ formatCurrency(selectedInvestment.expectedSettlementAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <button @click="goBack" class="btn-back" type="button">
        ← Back to Investments
      </button>
    </div>
  </div>
</template>

<style scoped>
.investments-wrapper {
  min-height: 100vh;
  background: #f4f6f4;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 32px;
  color: #111827;
  font-family: var(--font-body);
}

/* VIEW 1: Main Dashboard */
.page-header {
  margin-bottom: 6px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 16px;
}

@media (min-width: 640px) {
  .summary-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
}

.summary-card__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e8f7f0;
  color: #12b76a;
  overflow: hidden;
}

.summary-card__icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.summary-card__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card__label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.summary-card__value {
  color: #111827;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  padding: 24px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(320px, 100%);
  padding: 10px 16px;
  background: #f8f8f8;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
}

.search-input input {
  flex: 1;
  width: 100%;
  border: 0;
  background: transparent;
  color: #374151;
  font-family: var(--font-body);
  font-size: 0.875rem;
  outline: none;
}

.dropdowns {
  display: flex;
  gap: 12px;
}

.dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 16px;
  text-align: left;
  vertical-align: middle;
  font-size: 0.85rem;
}

th {
  color: #9ca3af;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
  background: transparent;
  padding: 12px 16px;
}

td {
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  padding: 16px;
}

.package-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.package-cell strong {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: #111827;
}

.package-cell span {
  font-size: 0.75rem;
  color: #6b7280;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
}

.status--active {
  background: #e8f7f0;
  color: #12b76a;
  border: 1px solid #a6e4c5;
}

.status--inactive {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.status--pending {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fcd34d;
}

.status--rejected {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fca5a5;
}

.btn-view {
  padding: 6px 16px;
  border: 1px solid #12b76a;
  border-radius: 8px;
  background: #fff;
  color: #12b76a;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view:hover {
  background: #ecfdf5;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.pagination__info {
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination__controls {
  display: flex;
  gap: 8px;
}

.page-btn {
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: #12b76a;
  color: #12b76a;
}

.page-btn--active {
  border-color: #2b5f44;
  background: #2b5f44;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* VIEW 2: Investment Details */
.details-view {
  gap: 24px;
}

.header-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
}

.header-banner__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-banner__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e8f7f0;
  color: #12b76a;
  overflow: hidden;
}

.header-banner__icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.header-banner__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-banner__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-banner__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.header-banner__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  background: #e8f7f0;
  color: #12b76a;
  font-size: 0.75rem;
  font-weight: 500;
}

.btn-package-details {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  color: #374151;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-package-details:hover {
  background: #f9fafb;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr 2fr;
  }
}

.details-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  padding: 24px;
}

.details-card--left {
  height: 100%;
}

.details-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.details-card__subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.details-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-percentage {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.highlight-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f2fbf7;
  border-radius: 12px;
  margin: 16px 0;
}

.highlight-banner__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e8f7f0;
  color: #12b76a;
}

.highlight-banner__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.highlight-banner__label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.highlight-banner__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.spec-rows {
  display: flex;
  flex-direction: column;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.75rem;
}

.spec-row--full {
  padding: 12px 0;
}

.spec-row__label {
  color: #6b7280;
}

.spec-row__value {
  font-weight: 500;
  color: #374151;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--active {
  background: #12b76a;
}

.status-indicator__text {
  font-weight: 500;
  color: #374151;
}

.details-column-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-bar-container {
  margin: 16px 0;
}

.progress-bar-track {
  width: 100%;
  height: 10px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #12b76a;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.progress-sublabel {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 16px 0;
}

.metric-badges {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.metric-badge__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f2fbf7;
  color: #12b76a;
  flex-shrink: 0;
}

.metric-badge__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-badge__value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.metric-badge__label {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.btn-back {
  padding: 12px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: #374151;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.btn-back:hover {
  background: #f9fafb;
}

@media (max-width: 768px) {
  .content {
    padding: 16px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .dropdowns {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .header-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .pagination__controls {
    justify-content: center;
  }

  .metric-badges {
    grid-template-columns: 1fr;
  }
}
</style>
