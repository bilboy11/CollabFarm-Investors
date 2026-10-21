<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import { authApi, profileApi, type LoginData } from '@/services/api'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''

  const loginData: LoginData = {
    username: email.value,
    password: password.value,
  }

  let credentialsAccepted = false
  try {
    isLoading.value = true
    await authApi.login(loginData)
    credentialsAccepted = true

    // The login endpoint authenticates credentials but does not restrict account types.
    // Check the account profile before granting access to the investor dashboard.
    const profileResponse = await profileApi.me() as Record<string, unknown>
    const account = profileResponse.data && typeof profileResponse.data === 'object'
      ? profileResponse.data as Record<string, unknown>
      : profileResponse
    const accountProfile = account.profile && typeof account.profile === 'object'
      ? account.profile as Record<string, unknown>
      : account
    const role = String(account.role ?? account.user_type ?? account.account_type ?? accountProfile.role ?? '').toLowerCase()
    const investorType = String(account.investor_type ?? accountProfile.investor_type ?? '').toLowerCase()
    const isCooperative = [role, investorType].some((value) => value.includes('cooperative'))
    const isInvestor = role.includes('investor') || Boolean(investorType)

    if (isCooperative || !isInvestor) {
      localStorage.removeItem('access_token')
      errorMessage.value = 'This account is not registered as an investor. Please use the cooperative portal.'
      return
    }

    const verificationStatus = String(
      account.verification_status ?? accountProfile.verification_status ?? '',
    ).trim().toLowerCase()
    router.push(verificationStatus === 'approved' ? '/dashboard' : '/basic-information')
  } catch (error) {
    localStorage.removeItem('access_token')
    const err = error as { response?: { data?: { detail?: string } } }
    errorMessage.value =
      err.response?.data?.detail || (credentialsAccepted
        ? 'Unable to verify this account type. Please try again.'
        : 'Login failed. Please check your credentials.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthShell
    title="Welcome Back"
    subtitle="Join CollabFarm today to meet up with certified farmers across the country"
  >
    <form class="auth-form" @submit.prevent="onSubmit">
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <label class="field">
        <span>Email *</span>
        <div class="field__control">
          <input
            v-model="email"
            type="email"
            name="email"
            placeholder="youremail@email.com"
            required
          />
          <svg
            class="field__icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <path
              d="m4 7 8 6 8-6"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </label>

      <label class="field">
        <span>Password *</span>
        <div class="field__control">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            placeholder="input password"
            required
          />
          <button
            class="field__icon-btn"
            type="button"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="!showPassword"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M9.9 5.1A10.5 10.5 0 0 1 12 4.8c5.2 0 9.3 3.5 10.5 7.2a11.3 11.3 0 0 1-4.1 5.1M6.1 6.1A11.4 11.4 0 0 0 1.5 12C2.7 15.7 6.8 19.2 12 19.2c1.4 0 2.7-.2 3.9-.7"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </button>
        </div>
      </label>

      <div class="auth-form__row">
        <a class="forgot" href="#">Forgot Password?</a>
      </div>

      <button class="btn btn--primary auth-form__submit" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>

      <div class="divider" role="separator" aria-label="or">
        <span>or</span>
      </div>

      <button class="btn btn--google" type="button">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        Sign in with Google
      </button>

      <p class="auth-form__footer">
        Don’t have account?
        <RouterLink to="/signup">Create Account</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 520px;
  font-family: var(--font-body);
}

.error-message {
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #fee;
  color: #c33;
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field > span {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 600;
}

.field__control {
  position: relative;
}

.field__control input {
  width: 100%;
  min-height: 48px;
  padding: 0 44px 0 14px;
  border: 1px solid #d7ddd8;
  border-radius: 10px;
  background: #fff;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 400;
  outline: none;
  transition: border-color 0.2s ease;
}

.field__control input::placeholder {
  color: #9aa39c;
  font-family: var(--font-body);
  font-weight: 400;
}

.field__control input:focus {
  border-color: var(--color-green-700);
}

.field__icon,
.field__icon-btn {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  color: #8a948c;
}

.field__icon-btn {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
}

.auth-form__row {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.forgot {
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
}

.forgot:hover {
  color: var(--color-green-800);
}

.auth-form__submit {
  width: 100%;
  min-height: 48px;
  margin-top: 4px;
  border: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9aa39c;
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 400;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #d7ddd8;
}

.btn--google {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: var(--radius-sm);
  background: #e8ebe7;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
}

.btn--google:hover {
  background: #dfe4dc;
}

.auth-form__footer {
  margin-top: 8px;
  text-align: center;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 400;
}

.auth-form__footer a {
  margin-left: 0.25rem;
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 600px) {
  .auth-form {
    gap: 20px;
    max-width: 100%;
  }

  .field__control input {
    min-height: 44px;
    padding: 0 40px 0 12px;
    font-size: 0.9rem;
  }

  .field > span {
    font-size: 0.85rem;
  }

  .auth-form__submit {
    min-height: 44px;
    font-size: 0.95rem;
  }

  .btn--google {
    min-height: 44px;
    font-size: 0.9rem;
  }

  .auth-form__footer {
    font-size: 0.88rem;
  }

  .forgot {
    font-size: 0.8rem;
  }
}

@media (max-width: 400px) {
  .auth-form {
    gap: 18px;
  }

  .field__control input {
    min-height: 42px;
    font-size: 0.88rem;
  }

  .auth-form__submit,
  .btn--google {
    min-height: 42px;
    font-size: 0.88rem;
  }
}
</style>
