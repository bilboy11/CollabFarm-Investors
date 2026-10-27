<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import availableIcon from '@/assets/images/Available.png'
import lockedIcon from '@/assets/images/Locked.png'
import disbursedIcon from '@/assets/images/Disbursed.png'
import { walletApi, type WalletFundData } from '@/services/api'

const unavailableAmount = '—'
type WalletRecord = Record<string, unknown>
type WalletActivity = {
  id: string | number
  date: string
  description: string
  amount: string
  type: string
  status: string
}

const showFundWalletModal = ref(false)
const showFundConfirmModal = ref(false)
const fundAmount = ref('')
const isFunding = ref(false)
const fundError = ref('')
const isVerifying = ref(false)
const showPaystackModal = ref(false)
const paystackUrl = ref('')
const currentReference = ref('')

const showWithdrawModal = ref(false)
const withdrawAccountNumber = ref('')
const withdrawBankCode = ref('')
const withdrawAmount = ref('')
const withdrawError = ref('')
const isWithdrawing = ref(false)
const isAccountValid = ref(false)
const isResolvingAccount = ref(false)
const resolvedAccountName = ref('')
let accountResolveTimeout: ReturnType<typeof setTimeout> | undefined
let accountResolveRequestId = 0

const withdrawalBanks = [
  { code: '044', name: 'Access Bank' },
  { code: '035A', name: 'ALAT by WEMA' },
  { code: '304', name: 'Alternative Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '50162', name: 'Dot Microfinance Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '50126', name: 'Eyowo' },
  { code: '51318', name: 'Fairmoney Microfinance Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '103', name: 'Globus Bank' },
  { code: '100022', name: 'GoMoney' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '50383', name: 'Hasal Microfinance Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '120002', name: 'Hope PSB' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '50211', name: 'Kuda Bank' },
  { code: '50515', name: 'Moniepoint MFB' },
  { code: '120003', name: 'MTN MoMo PSB' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '107', name: 'Optimus Bank' },
  { code: '999991', name: 'PalmPay' },
  { code: '526', name: 'Parallex Bank' },
  { code: '100039', name: 'Paystack-Titan' },
  { code: '076', name: 'Polaris Bank' },
  { code: '105', name: 'PremiumTrust Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '125', name: 'Rubies MFB' },
  { code: '120004', name: 'SmartCash PSB (Airtel)' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '302', name: 'Taj Bank' },
  { code: '102', name: 'Titan Trust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '566', name: 'VFD Microfinance Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '120001', name: '9mobile 9Payment Service Bank' },
]

async function openFundWalletModal() {
  showFundWalletModal.value = true
  showFundConfirmModal.value = false
  fundAmount.value = ''
  fundError.value = ''
}

function closeFundWalletModal() {
  showFundWalletModal.value = false
  showFundConfirmModal.value = false
  fundAmount.value = ''
  fundError.value = ''
  isFunding.value = false
}

function backToFundModal() {
  showFundConfirmModal.value = false
  showFundWalletModal.value = true
}

function closePaystackModal() {
  showPaystackModal.value = false
  paystackUrl.value = ''
  currentReference.value = ''
}

async function fundWallet() {
  const amount = Number(fundAmount.value)
  if (!fundAmount.value || !Number.isFinite(amount) || amount <= 0) {
    fundError.value = 'Please enter a valid amount'
    return
  }

  // Show confirmation modal instead of proceeding directly
  showFundWalletModal.value = false
  showFundConfirmModal.value = true
  fundError.value = ''
}

async function confirmFundWallet() {
  try {
    isFunding.value = true
    fundError.value = ''

    // Initialize wallet funding
    const fundData: WalletFundData = {
      amount: Number(fundAmount.value),
    }
    const initResponse = await walletApi.initializeFund(fundData)

    // Log the response to debug
    console.log('Initialize response:', initResponse)
    console.log('Response keys:', Object.keys(initResponse))
    console.log('Full response JSON:', JSON.stringify(initResponse, null, 2))

    // Extract payment URL and reference from response
    const paymentUrl =
      initResponse.checkout_url ||
      initResponse.data?.checkout_url ||
      initResponse.authorization_url ||
      initResponse.data?.authorization_url ||
      initResponse.payment_url ||
      initResponse.data?.payment_url ||
      initResponse.url ||
      initResponse.data?.url
    const reference = initResponse.reference || initResponse.data?.reference

    console.log('Payment URL:', paymentUrl)
    console.log('Reference:', reference)

    if (paymentUrl) {
      // Show Paystack in iframe modal
      paystackUrl.value = paymentUrl
      currentReference.value = reference || ''
      showPaystackModal.value = true
      showFundConfirmModal.value = false

      // Show a message to user
      fundError.value = 'Complete your payment in the modal below.'
      isFunding.value = false

      // Store reference for manual verification
      window.localStorage.setItem('pending_payment_reference', reference || '')
    } else if (reference) {
      // If no payment URL but we have reference, try to verify directly
      await verifyPayment(reference)
      showFundConfirmModal.value = false
    } else {
      fundError.value = 'Payment initialization failed. No payment details returned.'
      isFunding.value = false
      showFundConfirmModal.value = false
    }
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string } } }
    fundError.value =
      err.response?.data?.detail || 'Failed to initialize payment. Please try again.'
    isFunding.value = false
    showFundConfirmModal.value = true
  }
}

async function verifyPayment(reference: string | undefined) {
  if (!reference) {
    fundError.value = 'Payment verification failed: No reference found.'
    isFunding.value = false
    return
  }

  try {
    isVerifying.value = true
    fundError.value = 'Verifying payment...'

    // Verify the funding
    await walletApi.verifyFund(reference)

    // Reload wallet data to show updated balance
    await refreshWalletData()

    // Reload wallet activities to show the new transaction
    try {
      walletActivities.value = recordsFrom(await walletApi.transactions()).map((record, index) => ({
        id: String(
          valueOf(record, ['id', 'transaction_id', 'reference']) ?? `transaction-${index}`,
        ),
        date: formatDate(valueOf(record, ['created_at', 'date', 'transaction_date', 'timestamp'])),
        description: String(
          valueOf(record, ['description', 'narration', 'purpose', 'title']) ?? 'Wallet transaction',
        ),
        amount: formatAmount(valueOf(record, ['amount', 'total_amount', 'value']), record),
        type: String(valueOf(record, ['type', 'transaction_type', 'direction']) ?? '—'),
        status: String(valueOf(record, ['status', 'payment_status']) ?? '—'),
      }))
    } catch {
      walletActivities.value = []
    }

    closeFundWalletModal()
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string } } }
    fundError.value = err.response?.data?.detail || 'Payment verification failed. Please try again.'
  } finally {
    isVerifying.value = false
    isFunding.value = false
  }
}

async function manualVerifyPayment() {
  const reference =
    currentReference.value || window.localStorage.getItem('pending_payment_reference')
  if (reference) {
    await verifyPayment(reference)
  } else {
    fundError.value = 'No pending payment to verify. Please initiate a new payment.'
  }
}

function handlePaymentComplete() {
  // Called when user indicates payment is complete
  closePaystackModal()
  manualVerifyPayment()
}

function openWithdrawModal() {
  showWithdrawModal.value = true
  withdrawAccountNumber.value = ''
  withdrawBankCode.value = ''
  withdrawAmount.value = ''
  withdrawError.value = ''
  isAccountValid.value = false
}

function closeWithdrawModal() {
  if (accountResolveTimeout) clearTimeout(accountResolveTimeout)
  accountResolveRequestId += 1
  showWithdrawModal.value = false
  withdrawAccountNumber.value = ''
  withdrawBankCode.value = ''
  withdrawAmount.value = ''
  withdrawError.value = ''
  isWithdrawing.value = false
  isAccountValid.value = false
  isResolvingAccount.value = false
  resolvedAccountName.value = ''
}

async function resolveWithdrawAccount() {
  const accountNumber = withdrawAccountNumber.value.replace(/\s/g, '')
  if (!/^\d{10}$/.test(accountNumber)) {
    withdrawError.value = 'Please enter a valid 10-digit account number'
    return
  }
  if (!withdrawBankCode.value) {
    withdrawError.value = 'Please select your bank'
    return
  }

  const requestId = ++accountResolveRequestId
  try {
    isResolvingAccount.value = true
    withdrawError.value = ''
    resolvedAccountName.value = ''
    const account = await walletApi.resolveAccount({
      account_number: accountNumber,
      bank_code: withdrawBankCode.value,
    })
    if (requestId !== accountResolveRequestId) return
    resolvedAccountName.value = account.account_name
    isAccountValid.value = Boolean(account.account_name)
  } catch (error) {
    if (requestId !== accountResolveRequestId) return
    const err = error as {
      response?: { data?: { detail?: string | { msg?: string }[] } }
      message?: string
    }
    const detail = err.response?.data?.detail
    withdrawError.value =
      (typeof detail === 'string' ? detail : detail?.[0]?.msg) ||
      err.message ||
      'Could not verify this account. Check the details and try again.'
  } finally {
    if (requestId === accountResolveRequestId) isResolvingAccount.value = false
  }
}

watch([withdrawAccountNumber, withdrawBankCode], () => {
  if (accountResolveTimeout) clearTimeout(accountResolveTimeout)
  accountResolveRequestId += 1
  isAccountValid.value = false
  isResolvingAccount.value = false
  resolvedAccountName.value = ''
  withdrawError.value = ''

  const accountNumber = withdrawAccountNumber.value.replace(/\s/g, '')
  if (!withdrawBankCode.value || !/^\d{10}$/.test(accountNumber)) return

  accountResolveTimeout = setTimeout(() => {
    void resolveWithdrawAccount()
  }, 500)
})

async function withdrawFunds() {
  if (!withdrawAccountNumber.value) {
    withdrawError.value = 'Please enter your account number'
    return
  }
  if (!withdrawBankCode.value) {
    withdrawError.value = 'Please select your bank'
    return
  }
  if (!withdrawAmount.value || Number(withdrawAmount.value) <= 0) {
    withdrawError.value = 'Please enter a valid amount'
    return
  }
  if (!isAccountValid.value || !resolvedAccountName.value) {
    withdrawError.value = 'Wait for the bank account verification to complete successfully'
    return
  }

  try {
    isWithdrawing.value = true
    withdrawError.value = ''

    await walletApi.withdraw({
      account_number: withdrawAccountNumber.value.replace(/\s/g, ''),
      bank_code: withdrawBankCode.value,
      amount: Number(withdrawAmount.value),
    })
    await refreshWalletData()

    closeWithdrawModal()
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string } } }
    withdrawError.value = err.response?.data?.detail || 'Withdrawal failed. Please try again.'
  } finally {
    isWithdrawing.value = false
  }
}

const loading = ref(true)
const errorMessage = ref('')
const overview = ref({
  available_balance: null as number | null,
  locked_funds: null as number | null,
  actively_distributed: null as number | null,
})

let refreshInterval: number | null = null

async function refreshWalletData() {
  try {
    const response = (await walletApi.overview()) as Record<string, unknown>
    const data =
      response.data && typeof response.data === 'object'
        ? (response.data as Record<string, unknown>)
        : response
    overview.value = {
      available_balance: Number.isFinite(Number(data.available_balance))
        ? Number(data.available_balance)
        : null,
      locked_funds: Number.isFinite(Number(data.locked_funds)) ? Number(data.locked_funds) : null,
      actively_distributed: Number.isFinite(Number(data.actively_distributed))
        ? Number(data.actively_distributed)
        : null,
    }
  } catch {
    // Silent refresh - don't show errors to user
  }
}

function formatOverviewAmount(value: number | null): string {
  if (value === null) return unavailableAmount
  return `₦ ${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(value)}`
}

function valueOf(record: WalletRecord, keys: string[]): unknown {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null) return record[key]
  return undefined
}

function recordsFrom(response: unknown): WalletRecord[] {
  if (Array.isArray(response))
    return response.filter(
      (item): item is WalletRecord => Boolean(item) && typeof item === 'object',
    )
  if (!response || typeof response !== 'object') return []
  const payload = response as WalletRecord
  for (const key of ['transactions', 'items', 'results', 'data']) {
    const nested = payload[key]
    if (Array.isArray(nested)) return recordsFrom(nested)
    if (nested && typeof nested === 'object') {
      const found = recordsFrom(nested)
      if (found.length) return found
    }
  }
  return []
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(date)
}

function formatAmount(value: unknown, record: WalletRecord): string {
  if (value === undefined || value === null || value === '') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return String(value)
  const kind = String(
    valueOf(record, ['type', 'transaction_type', 'direction']) ?? '',
  ).toLowerCase()
  const sign =
    kind.includes('credit') || kind.includes('deposit') || kind.includes('return')
      ? '+'
      : kind.includes('debit') || kind.includes('withdraw')
        ? '−'
        : ''
  return `${sign} ₦ ${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(Math.abs(amount))}`
}

const walletActivities = ref<WalletActivity[]>([])

onMounted(async () => {
  // Initial load
  await refreshWalletData()
  loading.value = false

  try {
    walletActivities.value = recordsFrom(await walletApi.transactions()).map((record, index) => ({
      id: String(valueOf(record, ['id', 'transaction_id', 'reference']) ?? `transaction-${index}`),
      date: formatDate(valueOf(record, ['created_at', 'date', 'transaction_date', 'timestamp'])),
      description: String(
        valueOf(record, ['description', 'narration', 'purpose', 'title']) ?? 'Wallet transaction',
      ),
      amount: formatAmount(valueOf(record, ['amount', 'total_amount', 'value']), record),
      type: String(valueOf(record, ['type', 'transaction_type', 'direction']) ?? '—'),
      status: String(valueOf(record, ['status', 'payment_status']) ?? '—'),
    }))
  } catch {
    walletActivities.value = []
  }

  // Set up auto-refresh every 30 seconds
  refreshInterval = window.setInterval(async () => {
    await refreshWalletData()
  }, 30000)
})

onBeforeUnmount(() => {
  if (accountResolveTimeout) clearTimeout(accountResolveTimeout)
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="wallet">
    <section class="wallet__header">
      <div class="wallet__header-text">
        <h2>Wallet</h2>
        <p>Manage your funds</p>
      </div>
      <div class="wallet__header-actions">
        <button class="btn-withdraw" @click="openWithdrawModal">Withdraw</button>
        <button class="btn-primary btn-primary--large" @click="openFundWalletModal">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 3v14M3 10h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Fund Wallet
        </button>
      </div>
    </section>

    <p v-if="loading" class="wallet-message">Loading wallet data…</p>
    <p v-else-if="errorMessage" class="wallet-message wallet-message--error" role="alert">
      {{ errorMessage }}
    </p>

    <div v-else class="wallet__grid">
      <div class="balance-card">
        <div class="balance-card__header">
          <img :src="availableIcon" alt="Available" class="balance-card__icon" />
          <div class="balance-card__content">
            <div class="balance-card__label">Available Balance</div>
            <div class="balance-card__amount">
              {{ formatOverviewAmount(overview.available_balance) }}
            </div>
          </div>
        </div>
      </div>

      <div class="balance-card">
        <div class="balance-card__header">
          <img :src="lockedIcon" alt="Locked" class="balance-card__icon" />
          <div class="balance-card__content">
            <div class="balance-card__label">Locked Funds</div>
            <div class="balance-card__amount">
              {{ formatOverviewAmount(overview.locked_funds) }}
            </div>
          </div>
        </div>
      </div>

      <div class="balance-card">
        <div class="balance-card__header">
          <img :src="disbursedIcon" alt="Disbursed" class="balance-card__icon" />
          <div class="balance-card__content">
            <div class="balance-card__label">Disbursed Funds</div>
            <div class="balance-card__amount">
              {{ formatOverviewAmount(overview.actively_distributed) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Left Column: Wallet Activity -->
      <section class="wallet__activity">
        <div class="section-header">
          <div class="section-header__text">
            <h3>Wallet Activity</h3>
            <p>Export and download your investment data.</p>
          </div>
          <button class="btn-link btn-link--outlined">View All</button>
        </div>

        <div class="activity-filters">
          <button class="filter-btn filter-btn--date">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4.5 2.5h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M4.5 5h7M4.5 8h7M4.5 11h4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <span>All dates</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="m3 4.5 3 3 3-3"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button class="filter-btn">
            <span>Crop Types</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="m3 4.5 3 3 3-3"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <table class="activity-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6">Loading transactions…</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="6">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="!walletActivities.length">
              <td colspan="6">No wallet transactions found.</td>
            </tr>
            <tr v-for="activity in walletActivities" :key="activity.id">
              <td>{{ activity.date }}</td>
              <td>{{ activity.description }}</td>
              <td
                :class="activity.amount.startsWith('+') ? 'amount--positive' : 'amount--negative'"
              >
                {{ activity.amount }}
              </td>
              <td>{{ activity.type }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="{
                    'status-badge--pending': activity.status.toLowerCase() === 'pending',
                    'status-badge--success':
                      activity.status.toLowerCase() === 'success' ||
                      activity.status.toLowerCase() === 'completed',
                  }"
                  >{{ activity.status }}</span
                >
              </td>
              <td>
                <button class="action-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="4" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Right Column: Funds by Packages -->
      <section class="wallet__packages">
        <div class="section-header">
          <h3>Funds by Packages</h3>
        </div>

        <div class="packages-list">
          <p>No package breakdown data available.</p>
        </div>

        <RouterLink class="btn-link btn-link--full" to="/dashboard/packages"
          >View all Packages</RouterLink
        >
      </section>
    </div>

    <!-- Fund Wallet Modal -->
    <div v-if="showFundWalletModal" class="modal-overlay" @click="closeFundWalletModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Fund Wallet</h3>
          <button class="modal-close" @click="closeFundWalletModal" aria-label="Close modal">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-question">How much do you want to add to your wallet?</p>
          <div class="amount-input-wrapper">
            <input
              v-model="fundAmount"
              type="text"
              inputmode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              class="amount-input"
              placeholder="0.00"
              @keyup.enter="fundWallet"
            />
          </div>
          <p v-if="fundError" class="modal-error">{{ fundError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" @click="closeFundWalletModal">Cancel</button>
          <button
            v-if="!fundError.includes('Payment window opened')"
            class="btn btn--primary"
            @click="fundWallet"
            :disabled="isFunding"
          >
            {{ isFunding ? 'Processing...' : 'Add Funds' }}
          </button>
          <button
            v-else
            class="btn btn--primary"
            @click="manualVerifyPayment"
            :disabled="isVerifying"
          >
            {{ isVerifying ? 'Verifying...' : 'Verify Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Fund Confirmation Modal -->
    <div v-if="showFundConfirmModal" class="modal-overlay" @click="closeFundWalletModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirm Funding</h3>
          <button class="modal-close" @click="closeFundWalletModal" aria-label="Close modal">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">You are about to add the following amount to your wallet:</p>
          <div class="confirmation-amount">
            ₦
            {{
              new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(
                Number(fundAmount),
              )
            }}
          </div>
          <p v-if="fundError" class="modal-error">{{ fundError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" @click="backToFundModal">Back</button>
          <button class="btn btn--primary" @click="confirmFundWallet" :disabled="isFunding">
            {{ isFunding ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Paystack Iframe Modal -->
    <div v-if="showPaystackModal" class="paystack-modal-overlay" @click="closePaystackModal">
      <div class="paystack-modal-content" @click.stop>
        <div class="paystack-modal-header">
          <h3>Complete Payment</h3>
          <button class="paystack-modal-close" @click="closePaystackModal" aria-label="Close modal">
            ✕
          </button>
        </div>
        <div class="paystack-modal-body">
          <iframe
            :src="paystackUrl"
            class="paystack-iframe"
            frameborder="0"
            allow="payment"
          ></iframe>
        </div>
        <div class="paystack-modal-footer">
          <p class="paystack-modal-hint">
            Complete your payment in the window above, then click the button below to verify.
          </p>
          <button class="btn btn--primary" @click="handlePaymentComplete" :disabled="isVerifying">
            {{ isVerifying ? 'Verifying...' : 'I have completed the payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Withdraw Modal -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click="closeWithdrawModal">
      <div class="modal-content modal-content--withdraw" @click.stop>
        <div class="modal-header">
          <h3>How much Would you like to Withdraw?</h3>
          <button class="modal-close" @click="closeWithdrawModal" aria-label="Close modal">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">Input your details and the amount in Naira below.</p>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Account Number</label>
              <input
                v-model="withdrawAccountNumber"
                type="text"
                class="form-input"
                placeholder="Enter your account number"
                maxlength="10"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Bank</label>
              <select v-model="withdrawBankCode" class="form-select">
                <option value="">Select your bank</option>
                <option v-for="bank in withdrawalBanks" :key="bank.code" :value="bank.code">
                  {{ bank.name }}
                </option>
              </select>
            </div>
            <div class="form-group form-group--full">
              <p v-if="isResolvingAccount" class="account-verifying" aria-live="polite">
                Verifying bank details...
              </p>
              <p v-else-if="resolvedAccountName" class="account-resolved" aria-live="polite">
                Account name: <strong>{{ resolvedAccountName }}</strong>
              </p>
            </div>
            <div class="form-group form-group--full">
              <label class="form-label">Amount</label>
              <input
                v-model="withdrawAmount"
                type="number"
                class="form-input"
                placeholder="Enter amount in Naira"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <p v-if="withdrawError" class="modal-error">{{ withdrawError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--cancel" @click="closeWithdrawModal">Cancel</button>
          <button class="btn btn--withdraw" @click="withdrawFunds" :disabled="isWithdrawing">
            {{ isWithdrawing ? 'Processing...' : 'Withdraw' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wallet {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 32px;
  color: var(--color-ink);
  font-family: var(--font-body);
}

.wallet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wallet__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wallet__header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wallet__header h2 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
}

.wallet__header p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 0.95rem;
}

.wallet-message {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: #fff;
  text-align: center;
}

.wallet-message--error {
  background: #fee;
  color: #a22;
  border-color: #fcc;
}

.wallet__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.wallet__activity {
  grid-column: span 2;
}

.wallet__packages {
  grid-column: span 1;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 1.5rem;
  border: none;
  border-radius: 10px;
  background: var(--color-green-700);
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary--large {
  min-height: 52px;
  padding: 0 2rem;
  font-size: 1rem;
}

.btn-withdraw {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0 2rem;
  border: 2px solid var(--color-green-700);
  border-radius: 10px;
  background: #e8f7f0;
  color: var(--color-green-700);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-withdraw:hover {
  background: #d4eadb;
  border-color: var(--color-green-800);
  color: var(--color-green-800);
}

.btn-primary:hover {
  background: var(--color-green-800);
}

.balance-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 180px;
  padding: 28px;
  border: 0.5px solid var(--color-border);
  border-radius: 16px;
  background: #fff;
  color: var(--color-ink);
}

.balance-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.balance-card__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.balance-card__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-card__label {
  font-size: 0.9rem;
  color: var(--color-ink-soft);
  font-weight: 500;
}

.balance-card__amount {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-green-800);
}

.balance-card__action {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: #6eb489;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.balance-card__action:hover {
  color: #3f7a5c;
}

.wallet__activity {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: #fff;
}

.activity-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn--date {
  padding: 8px 12px;
}

.filter-btn:hover {
  border-color: var(--color-green-700);
  color: var(--color-green-700);
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table thead th {
  padding: 12px 8px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.activity-table tbody td {
  padding: 16px 8px;
  font-size: 0.9rem;
  color: var(--color-ink);
  border-bottom: 1px solid var(--color-border);
}

.activity-table tbody tr:last-child td {
  border-bottom: none;
}

.amount--positive {
  color: #12b76a;
  font-weight: 600;
}

.amount--negative {
  color: #f04438;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e8f7f0;
  color: #12b76a;
  border: 1px solid #a6e4c5;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge--pending {
  background: #fff9c4;
  color: #f57c00;
  border: 1px solid #ffd54f;
}

.status-badge--success {
  background: #e8f7f0;
  color: #12b76a;
  border: 1px solid #a6e4c5;
}

.action-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
  transition: background 0.2s ease;
}

.action-btn:hover {
  background: #f7f8f6;
}

.wallet__packages {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: #fff;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header__text {
  display: flex;
  flex-direction: column;
}

.section-header h3 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
}

.section-header p {
  margin: 4px 0 0 0;
  color: var(--color-ink);
  font-size: 0.9rem;
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--color-green-700);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.btn-link:hover {
  color: var(--color-green-800);
}

.btn-link--outlined {
  padding: 6px 16px;
  border: 1px solid #12b76a;
  border-radius: 8px;
  background: transparent;
  color: #12b76a;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-link--outlined:hover {
  background: #e8f7f0;
}

.btn-link--full {
  width: 100%;
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #12b76a;
  border-radius: 12px;
  background: transparent;
  color: #12b76a;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-link--full:hover {
  background: #e8f7f0;
}

.packages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow: auto;
}

.balance-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 16px;
  background: #fff;
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

.balance-card:nth-child(1) {
  animation-delay: 0.1s;
}
.balance-card:nth-child(2) {
  animation-delay: 0.2s;
}
.balance-card:nth-child(3) {
  animation-delay: 0.3s;
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

.package-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #fff;
}

.package-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.package-card__name {
  font-weight: 600;
  color: var(--color-ink);
  font-size: 0.875rem;
}

.package-card__total {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-ink);
  font-size: 0.875rem;
}

.package-card__breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f7f8f6;
  border-radius: 8px;
}

.breakdown-item__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-ink-soft);
  font-weight: 500;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #12b76a;
}

.breakdown-item__value {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-ink);
  font-size: 0.875rem;
}

@media (max-width: 1300px) {
  .wallet__grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .wallet__activity {
    grid-column: span 2;
  }

  .wallet__packages {
    grid-column: span 1;
  }
}

@media (max-width: 900px) {
  .wallet__grid {
    grid-template-columns: 1fr;
  }

  .wallet__activity {
    grid-column: span 1;
  }

  .wallet__packages {
    grid-column: span 1;
  }
}

@media (max-width: 700px) {
  .wallet {
    padding: 16px;
  }

  .wallet__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .wallet__header-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-primary--large {
    width: 100%;
  }

  .btn-withdraw {
    width: 100%;
  }

  .wallet__grid {
    grid-template-columns: 1fr;
  }

  .wallet__activity {
    grid-column: span 1;
  }

  .wallet__packages {
    grid-column: span 1;
  }

  .activity-filters {
    flex-wrap: wrap;
  }

  .activity-table {
    font-size: 0.8rem;
  }

  .activity-table thead th,
  .activity-table tbody td {
    padding: 8px 4px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease-out forwards;
  z-index: 1000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-content--withdraw {
  max-width: 520px;
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

.modal-question {
  margin: 0 0 20px 0;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
}

.modal-subtitle {
  margin: 0 0 24px 0;
  color: #9aa39c;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 400;
}

.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #d7ddd8;
  border-radius: 12px;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s ease;
}

.amount-input::placeholder {
  color: #9aa39c;
}

.amount-input:focus {
  border-color: var(--color-green-700);
}

.confirmation-amount {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-green-800);
  text-align: center;
  padding: 24px;
  background: #f7f8f6;
  border-radius: 12px;
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

.modal-footer .btn--primary {
  background: var(--color-green-700);
  color: #fff;
}

.modal-footer .btn--primary:hover {
  background: var(--color-green-800);
}

.modal-footer .btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer .btn--secondary {
  background: #e8ebe7;
  color: var(--color-ink);
}

.modal-footer .btn--secondary:hover {
  background: #dfe4dc;
}

.modal-footer .btn--cancel {
  background: #fff;
  color: var(--color-ink);
  border: 1px solid #d7ddd8;
}

.modal-footer .btn--cancel:hover {
  background: #f7f8f6;
}

.modal-footer .btn--withdraw {
  background: var(--color-green-700);
  color: #fff;
}

.modal-footer .btn--withdraw:hover {
  background: var(--color-green-800);
}

/* Withdraw Modal Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 0;
}

.form-group--full {
  grid-column: span 2;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #d7ddd8;
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.2s ease;
  background: #fff;
}

.form-input::placeholder {
  color: #9aa39c;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--color-green-700);
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m3 4.5 3 3 3-3' stroke='%236eb489' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.form-success {
  margin: 6px 0 0 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: #e8f7f0;
  color: #12b76a;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
}

.account-resolved {
  margin: 8px 0 0;
  color: #16804a;
  font-size: 0.9rem;
}

.account-verifying {
  margin: 8px 0 0;
  color: #66736b;
  font-size: 0.9rem;
}

/* Paystack Iframe Modal Styles */
.paystack-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1100;
  padding: 16px;
}

.paystack-modal-content {
  width: 100%;
  max-width: 500px;
  height: 85vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.paystack-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8ebe7;
  flex-shrink: 0;
}

.paystack-modal-header h3 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
}

.paystack-modal-close {
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

.paystack-modal-close:hover {
  background: #e8ebe7;
  color: var(--color-ink);
}

.paystack-modal-body {
  flex: 1;
  min-height: 400px;
  overflow: hidden;
}

.paystack-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.paystack-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e8ebe7;
  flex-shrink: 0;
}

.paystack-modal-hint {
  margin: 0 0 12px 0;
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  text-align: center;
}

.paystack-modal-footer .btn {
  width: 100%;
  min-height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 10px;
  background: var(--color-green-700);
  color: #fff;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.paystack-modal-footer .btn:hover {
  background: var(--color-green-800);
}

.paystack-modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
