<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import cropIcon from '@/assets/images/crop.png'
import fishIcon from '@/assets/images/fish.png'
import mixedIcon from '@/assets/images/mixed.png'
import livestockIcon from '@/assets/images/livestock.png'
import poultryIcon from '@/assets/images/poultry.png'
import { packagesApi } from '@/services/api'

const router = useRouter()

type FundingPackage = {
  id: string | number
  category: string
  status: string
  title: string
  description: string
  amount: number | null
  tenureMonths: number | null
  expectedRoi: number | null
  cooperativeShare: number | null
}

type PackageRecord = Record<string, unknown>

const selectedFilter = ref('All')

const filters = [
  { id: 'All', label: 'All', icon: null },
  { id: 'Crop Farming', label: 'Crop Farming', icon: cropIcon },
  { id: 'Fishery', label: 'Fishery', icon: fishIcon },
  { id: 'Mixed Farming', label: 'Mixed Farming', icon: mixedIcon },
  { id: 'Livestock', label: 'Livestock', icon: livestockIcon },
  { id: 'Poultry', label: 'Poultry', icon: poultryIcon },
]

const packages = ref<FundingPackage[]>([])
const loading = ref(true)
const errorMessage = ref('')

function extractPackages(response: unknown): PackageRecord[] {
  if (Array.isArray(response))
    return response.filter(
      (item): item is PackageRecord => Boolean(item) && typeof item === 'object',
    )
  if (!response || typeof response !== 'object') return []
  const payload = response as PackageRecord
  for (const key of ['packages', 'items', 'results', 'data']) {
    const nested = payload[key]
    if (Array.isArray(nested)) return extractPackages(nested)
    if (nested && typeof nested === 'object') {
      const records = extractPackages(nested)
      if (records.length) return records
    }
  }
  return []
}

function displayCategory(value: unknown): string {
  const category = String(value ?? '').toUpperCase()
  const labels: Record<string, string> = {
    CROP_FARMING: 'Crop Farming',
    FISHERY: 'Fishery',
    MIXED_FARMING: 'Mixed Farming',
    LIVESTOCK: 'Livestock',
    POULTRY: 'Poultry',
  }
  return (
    labels[category] ??
    category.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(date)
}

function numberFrom(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

onMounted(async () => {
  try {
    const apiPackages = extractPackages(await packagesApi.list())

    packages.value = apiPackages.map((record) => ({
      id: String(record.id ?? `${record.title}-${record.created_at}`),
      category: displayCategory(record.category),
      status: String(record.status ?? '—')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      title: String(record.title ?? 'Untitled package'),
      description: String(record.short_description ?? ''),
      amount: numberFrom(record.fund_amount),
      tenureMonths: numberFrom(record.tenure_months),
      expectedRoi: numberFrom(record.expected_roi),
      cooperativeShare: numberFrom(record.cooperative_share),
    }))
  } catch (error) {
    const err = error as {
      response?: { data?: { detail?: string; message?: string } }
      message?: string
    }
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unable to load funding packages.'

    packages.value = []
  } finally {
    loading.value = false
  }
})

const filteredPackages = computed(() => {
  if (selectedFilter.value === 'All') return packages.value
  return packages.value.filter((pkg) => pkg.category === selectedFilter.value)
})

const currentPage = ref(1)
const itemsPerPage = 12
const totalItems = computed(() => filteredPackages.value.length)

const paginatedPackages = computed(() => {
  return filteredPackages.value
})

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getProgressPercentage(raised: number | null, amount: number): number {
  return raised === null || !amount ? 0 : Math.round((raised / amount) * 100)
}

function selectFilter(filter: string) {
  selectedFilter.value = filter
  currentPage.value = 1
}

function getCategoryColorClass(category: string): string {
  const colorMap: Record<string, string> = {
    'Crop Farming': 'tag--crop',
    Fishery: 'tag--fishery',
    'Mixed Farming': 'tag--mixed',
    Livestock: 'tag--livestock',
    Poultry: 'tag--poultry',
  }
  return colorMap[category] || 'tag--category'
}

function viewPackage(id: string | number) {
  router.push(`/dashboard/packages/${id}`)
}
</script>

<template>
  <div class="packages-wrapper">
    <div class="content">
      <header class="header">
        <div>
          <h1>Funding Packages</h1>
          <p>Create and manage all funding opportunities you've made available to cooperatives</p>
        </div>
      </header>

      <div class="filter-bar">
        <button
          v-for="filter in filters"
          :key="filter.id"
          class="filter-btn"
          :class="{ 'filter-btn--active': selectedFilter === filter.id }"
          type="button"
          @click="selectFilter(filter.id)"
        >
          <img v-if="filter.icon" :src="filter.icon" :alt="filter.label" class="filter-btn__icon" />
          <span>{{ filter.label }}</span>
        </button>
      </div>

      <div class="packages-grid">
        <p v-if="loading">Loading funding packages…</p>
        <p v-else-if="errorMessage" role="alert">{{ errorMessage }}</p>
        <p v-else-if="!paginatedPackages.length">No funding packages found.</p>
        <article v-for="pkg in paginatedPackages" :key="pkg.id" class="package-card">
          <div class="package-card__header">
            <span class="tag" :class="getCategoryColorClass(pkg.category)">{{ pkg.category }}</span>
            <span
              class="tag"
              :class="
                ['Open', 'Approved', 'Active'].includes(pkg.status) ? 'tag--open' : 'tag--completed'
              "
            >
              {{ pkg.status }}
            </span>
          </div>

          <h3 class="package-card__title">{{ pkg.title }}</h3>

          <p class="package-card__description">{{ pkg.description }}</p>

          <div class="package-card__amount">
            <span class="amount-label">Package Amount</span>
            <span class="amount-value">{{ formatCurrency(pkg.amount) }}</span>
          </div>

          <div class="package-card__terms">
            <div class="package-card__term">
              <span>Tenure</span>
              <strong>{{ pkg.tenureMonths === null ? '—' : `${pkg.tenureMonths} months` }}</strong>
            </div>
            <div class="package-card__term">
              <span>Expected ROI</span>
              <strong>{{ pkg.expectedRoi === null ? '—' : `${pkg.expectedRoi}%` }}</strong>
            </div>
            <div class="package-card__term">
              <span>Cooperative Share</span>
              <strong>{{
                pkg.cooperativeShare === null ? '—' : `${pkg.cooperativeShare}%`
              }}</strong>
            </div>
          </div>

          <button class="btn-view" type="button" @click="viewPackage(pkg.id)">View Package</button>
        </article>
      </div>

      <div class="pagination">
        <p class="pagination__info">
          Showing {{ paginatedPackages.length ? 1 : 0 }} - {{ paginatedPackages.length }} of
          {{ totalItems }} Funding Packages
        </p>
        <div class="pagination__controls">
          <button class="page-btn" type="button" :disabled="currentPage === 1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
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
              <path
                d="M6 3 11 8l-5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.packages-wrapper {
  min-height: 100vh;
  background: #f4f6f4;
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

.header {
  margin-bottom: 8px;
}

.header h1 {
  margin-bottom: 0.5rem;
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 2.5vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}

.header p {
  color: var(--color-ink-soft);
  font-size: 0.95rem;
}

.filter-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 100%;
  height: 56px;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  height: 56px;
  padding: var(--space-7);
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 28px;
  background: #fff;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn__icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.filter-btn:hover {
  border-color: var(--color-green-800);
  color: var(--color-green-800);
}

.filter-btn--active {
  border-color: var(--color-green-800);
  background: var(--color-green-800);
  color: #fff;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(348px, 1fr));
  gap: 20px;
}

.package-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 16px;
  background: #fff;
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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

.package-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tag--category,
.tag--crop {
  background: #e7f3ea;
  color: var(--color-green-800);
}

.tag--fishery {
  background: #e3f2fd;
  color: #1976d2;
}

.tag--mixed {
  background: #f3e5f5;
  color: #7b1fa2;
}

.tag--livestock {
  background: #fff8e1;
  color: #f57c00;
}

.tag--poultry {
  background: #fff3e0;
  color: #e64a19;
}

.tag--open {
  background: #eef8f1;
  color: #1f6b45;
  border: 1px solid #6eb489;
}

.tag--completed {
  background: #f0f0f0;
  color: #666;
  border: 1px solid #ccc;
}

.package-card__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
}

.package-card__description {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  line-height: 1.5;
  flex: 1;
}

.package-card__amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f7f8f6;
  border-radius: 8px;
}

.amount-label {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 500;
}

.amount-value {
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
}

.package-card__terms {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 4px 0;
}

.package-card__term {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.package-card__term span {
  color: var(--color-ink-soft);
  font-size: 0.75rem;
}

.package-card__term strong {
  color: var(--color-green-800);
  font-size: 0.9rem;
  font-weight: 600;
}

.package-card__progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: #eef1ee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #1b4d3e 0%, #3f7a5c 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.progress-info span:first-child {
  color: var(--color-green-800);
  font-weight: 600;
}

.progress-info span:last-child {
  color: var(--color-ink-soft);
}

.package-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-ink-soft);
  font-size: 0.8rem;
}

.meta-item svg {
  flex-shrink: 0;
  color: var(--color-green-800);
}

.btn-view {
  width: 100%;
  padding: 12px 20px;
  border: var(--stroke-05) solid var(--color-green-800);
  border-radius: 10px;
  background: #fff;
  color: var(--color-green-800);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view:hover {
  background: var(--color-green-800);
  color: #fff;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.pagination__info {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
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
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-green-800);
  color: var(--color-green-800);
}

.page-btn--active {
  border-color: var(--color-green-800);
  background: var(--color-green-800);
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .content {
    padding: 16px;
    min-width: 0;
  }

  .packages-wrapper {
    max-width: 100%;
    overflow-x: clip;
  }

  .packages-grid {
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

  .filter-bar {
    gap: 8px;
    flex-direction: row;
    height: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .filter-btn {
    flex: 0 0 auto;
    min-width: max-content;
    padding: 8px 16px;
    font-size: 0.85rem;
    scroll-snap-align: start;
  }
}
</style>
