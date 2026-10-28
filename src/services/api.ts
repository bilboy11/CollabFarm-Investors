import axios from 'axios'

export const API_BASE_URL = 'https://test-collab-farm.onrender.com'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function saveAccessToken(data: unknown) {
  if (!data || typeof data !== 'object') return

  const response = data as {
    access_token?: string
    accessToken?: string
    token?: string
    data?: { access_token?: string; accessToken?: string; token?: string }
  }
  const token =
    response.access_token ??
    response.accessToken ??
    response.token ??
    response.data?.access_token ??
    response.data?.accessToken ??
    response.data?.token

  if (token) localStorage.setItem('access_token', token)
}

export interface RegisterData {
  email: string
  password: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  first_name: string
  last_name: string
  phone_number: string
  role: string
  investor_type: string
  verification_status: string
  confirm_password: string
}

export interface LoginData {
  username: string
  password: string
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    saveAccessToken(response.data)
    return response.data
  },

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    saveAccessToken(response.data)
    return response.data
  },

  submitIndividualProfile: async (data: FormData) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.post('/onboard/profile/individual-investor', data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  changePassword: async (data: {
    current_password: string
    new_password: string
    confirm_password: string
  }) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.post('/onboard/profile/change-password', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  getInvestorDashboard: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get('/investor/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },
}

export const profileApi = {
  me: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get('/onboard/profile/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },
}

export interface ChatRequest {
  session_id: string
  message: string
}

export const chatApi = {
  send: async (data: ChatRequest) => {
    const token = localStorage.getItem('access_token')
    const response = await api.post(
      '/chat',
      data,
      token
        ? {
            headers: { Authorization: `Bearer ${token}` },
          }
        : undefined,
    )
    return response.data
  },
}

export const packagesApi = {
  list: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get('/packages', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  detail: async (packageId: string | number) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get(`/packages/${encodeURIComponent(String(packageId))}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },
}

export const investmentsApi = {
  list: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get('/investments', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  detail: async (investmentId: string | number) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get(`/investments/${encodeURIComponent(String(investmentId))}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  invest: async (packageId: string, amount: number) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.post(
      `/investments/${encodeURIComponent(packageId)}`,
      { amount },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    return response.data
  },
}

export interface WalletWithdrawalData {
  amount: number
  bank_code: string
  account_number: string
}

export interface WalletResolveAccountData {
  bank_code: string
  account_number: string
}

export interface WalletResolvedAccount {
  account_number: string
  account_name: string
  bank_code: string
}

export interface WalletFundData {
  amount: number
}

export const walletApi = {
  overview: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get('/wallet/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  transactions: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get('/wallet/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  resolveAccount: async (data: WalletResolveAccountData): Promise<WalletResolvedAccount> => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.post<WalletResolvedAccount>('/wallet/resolve-account', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  withdraw: async (data: WalletWithdrawalData) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.post('/wallet/withdraw', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  initializeFund: async (data: WalletFundData) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.post('/wallet/fund/initialize', data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },

  verifyFund: async (reference: string) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Your session has expired. Please sign in again.')

    const response = await api.get(`/wallet/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },
}

export default api
