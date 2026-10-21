<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import heroImage from '@/assets/images/hero.png'
import { investmentsApi, packagesApi } from '@/services/api'

const route = useRoute()
const router = useRouter()

const showInvestModal = ref(false)
const investError = ref('')
const investSuccess = ref('')
const isInvesting = ref(false)

const packageData = ref({
  id: '',
  category: '',
  status: '',
  title: '',
  description: '',
  amount: null as number | null,
  tenureMonths: null as number | null,
  expectedRoi: null as number | null,
  cooperativeShare: null as number | null,
  raised: null as number | null,
  farmers: '',
  locations: '',
  closingDate: '',
  fullDescription: '',
  farmingType: '',
  farmingCycle: '',
  farmersCount: null as number | null,
  investorsCount: null as number | null,
  whatsIncluded: [] as string[],
})

const loading = ref(true)
const errorMessage = ref('')

function formatCurrency(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function numberFrom(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function openInvestModal() {
  showInvestModal.value = true
  investError.value = ''
  investSuccess.value = ''
}

function closeInvestModal() {
  showInvestModal.value = false
  investError.value = ''
  isInvesting.value = false
}

async function invest() {
  try {
    isInvesting.value = true
    investError.value = ''
    if (!packageData.value.id) {
      throw new Error('This package is missing its ID.')
    }
    await investmentsApi.invest(packageData.value.id)
    closeInvestModal()
    investSuccess.value = 'Your investment was created successfully.'
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    investError.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Investment failed. Please try again.'
  } finally {
    isInvesting.value = false
  }
}

onMounted(async () => {
  try {
    const packageId = route.params.id as string
    const response = await packagesApi.detail(packageId)
    const outer = response && typeof response === 'object' ? (response as Record<string, unknown>) : {}
    const raw = (outer.data ?? outer.package ?? outer) as Record<string, unknown>
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Package details were not returned by the server.')
    }
    const amount = numberFrom(raw.fund_amount ?? raw.amount)
    const tenure = numberFrom(raw.tenure_months ?? raw.tenure)
    const farmerCount = numberFrom(raw.farmers_count ?? raw.farmer_count)
    const investorCount = numberFrom(raw.investors_count ?? raw.investor_count)
    const included = raw.whats_included ?? raw.includes
    packageData.value = {
      id: String(raw.id ?? raw.package_id ?? packageId),
      category: String(raw.category ?? raw.farming_type ?? '—'),
      status: String(raw.status ?? '—'),
      title: String(raw.title ?? raw.name ?? '—'),
      description: String(raw.short_description ?? raw.description ?? '—'),
      amount,
      tenureMonths: tenure,
      expectedRoi: numberFrom(raw.expected_roi),
      cooperativeShare: numberFrom(raw.cooperative_share),
      raised: numberFrom(raw.amount_raised),
      farmers: String(raw.farmers_count ?? raw.farmer_count ?? '—'),
      locations: String(raw.locations ?? raw.location ?? '—'),
      closingDate: String(raw.expected_payback_date ?? raw.closing_date ?? '—'),
      fullDescription: String(raw.full_description ?? raw.description ?? raw.short_description ?? '—'),
      farmingType: String(raw.farming_type ?? raw.category ?? '—'),
      farmingCycle: tenure !== null ? `${tenure} Months` : String(raw.farming_cycle ?? '—'),
      farmersCount: farmerCount,
      investorsCount: investorCount,
      whatsIncluded: Array.isArray(included) ? included.map(String) : [],
    }
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unable to load package details.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="package-detail">
    <div v-if="loading" class="loading">Loading package details…</div>
    <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-else>
      <div v-if="investSuccess" class="investment-success" role="status">
        <span>{{ investSuccess }}</span>
        <button type="button" aria-label="Dismiss success message" @click="investSuccess = ''">×</button>
      </div>

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <span class="breadcrumb__item" @click="router.push('/dashboard/packages')"
          >Funding Packages</span
        >
        <span class="breadcrumb__separator">></span>
        <span class="breadcrumb__item breadcrumb__item--current">Select Package</span>
      </div>

      <!-- Header -->
      <div class="package-header">
        <div class="package-header__info">
          <h1>{{ packageData.title }}</h1>
          <p>{{ packageData.description }}</p>
        </div>
        <button class="btn-invest" @click="openInvestModal">
          Invest
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 10h12M10 4l6 6-6 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <!-- Main Content -->
      <div class="package-content">
        <div class="package-content__left">
          <!-- Package Image -->
          <div class="package-image">
            <img :src="heroImage" alt="Package Hero" class="package-image__img" />
          </div>

          <!-- Amount -->
          <div class="package-amount">
            {{ formatCurrency(packageData.amount) }}
          </div>

          <!-- Description -->
          <div class="package-description">
            <p>{{ packageData.fullDescription }}</p>
          </div>

          <!-- Statistics Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Funding Amount</span>
              <span class="stat-value">{{ formatCurrency(packageData.amount) }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Farming Type</span>
              <span class="stat-value">{{ packageData.farmingType }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Farming Cycle</span>
              <span class="stat-value">{{ packageData.farmingCycle }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Package Status</span>
              <span class="stat-value">{{ packageData.status }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Farmers</span>
              <span class="stat-value">{{ packageData.farmersCount ?? '—' }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Investors</span>
              <span class="stat-value">{{ packageData.investorsCount ?? '—' }}</span>
            </div>
          </div>

          <!-- What's Included -->
          <div class="whats-included">
            <h3>What's Included</h3>
            <ul class="included-list">
              <li v-for="item in packageData.whatsIncluded" :key="item" class="included-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 10l3 3 7-7"
                    stroke="#12b76a"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Invest Modal -->
    <div v-if="showInvestModal" class="modal-overlay" @click="closeInvestModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Invest in {{ packageData.title }}</h3>
          <button class="modal-close" @click="closeInvestModal" aria-label="Close modal">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">Confirm your investment in this package.</p>
          <div class="investment-summary">
            <span class="summary-label">Package</span>
            <span class="summary-value">{{ packageData.title }}</span>
          </div>
          <div class="investment-summary">
            <span class="summary-label">Funding Amount</span>
            <span class="summary-value">{{ formatCurrency(packageData.amount) }}</span>
          </div>
          <p v-if="investError" class="modal-error">{{ investError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--cancel" @click="closeInvestModal">Cancel</button>
          <button class="btn btn--invest" @click="invest" :disabled="isInvesting">
            {{ isInvesting ? 'Processing...' : 'Invest' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.package-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 32px;
  color: var(--color-ink);
  font-family: var(--font-body);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-ink-soft);
  margin-bottom: 16px;
}

.breadcrumb__item {
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb__item:hover {
  color: var(--color-green-700);
}

.breadcrumb__item--current {
  color: var(--color-ink);
  cursor: default;
}

.breadcrumb__separator {
  color: var(--color-ink-soft);
}

/* Header */
.package-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.package-header__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.package-header h1 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.package-header p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 1rem;
}

.btn-invest {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  background: var(--color-green-700);
  color: #fff;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.btn-invest:hover {
  background: var(--color-green-800);
}

/* Main Content */
.package-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.package-content__left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Package Image */
.package-image {
  width: 100%;
  height: 300px;
  border-radius: 16px;
  background: #f7f8f6;
  overflow: hidden;
}

.package-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Amount */
.package-amount {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-green-800);
}

/* Description */
.package-description p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 1rem;
  line-height: 1.6;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: #f7f8f6;
  border-radius: 12px;
}

.stat-label {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 500;
}

.stat-value {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
}

/* What's Included */
.whats-included {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.whats-included h3 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
}

.included-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.included-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-ink);
  font-size: 1rem;
}

.loading,
.error {
  padding: 48px;
  text-align: center;
  color: var(--color-ink-soft);
}

.investment-success {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid #b7dfc8;
  border-radius: 10px;
  background: #edf8f1;
  color: #1d6844;
  font-size: 0.9rem;
}

.investment-success button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e8ebe7;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f7f8f6;
  border-radius: 8px;
  color: var(--color-ink-soft);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #e8ebe7;
  color: var(--color-ink);
}

.modal-body {
  padding: 24px;
}

.modal-subtitle {
  margin: 0 0 20px 0;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 400;
}

.investment-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f7f8f6;
  border-radius: 12px;
  margin-bottom: 16px;
}

.summary-label {
  color: var(--color-ink-soft);
  font-size: 0.9rem;
  font-weight: 500;
}

.summary-value {
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
}

.modal-error {
  margin: 12px 0 0 0;
  padding: 10px 14px;
  border-radius: 8px;
  background: #fee;
  color: #c33;
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e8ebe7;
}

.modal-footer .btn {
  flex: 1;
  min-height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 10px;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-footer .btn--cancel {
  background: #fff;
  color: var(--color-ink);
  border: 1px solid #d7ddd8;
}

.modal-footer .btn--cancel:hover {
  background: #f7f8f6;
}

.modal-footer .btn--invest {
  background: var(--color-green-700);
  color: #fff;
}

.modal-footer .btn--invest:hover {
  background: var(--color-green-800);
}

.modal-footer .btn--invest:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .package-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-invest {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .package-detail {
    padding: 16px;
  }

  .package-header h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .package-image {
    height: 200px;
  }
}
</style>
