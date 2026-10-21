<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import { authApi, type RegisterData } from '@/services/api'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  const registerData: RegisterData = {
    email: email.value,
    password: password.value,
    confirm_password: confirmPassword.value,
    first_name: firstName.value,
    last_name: lastName.value,
    phone_number: phoneNumber.value,
    is_active: true,
    is_superuser: false,
    is_verified: false,
    role: 'INVESTOR',
    investor_type: 'INDIVIDUAL',
    verification_status: 'not_submitted',
  }

  try {
    isLoading.value = true
    await authApi.register(registerData)
    if (!localStorage.getItem('access_token')) {
      await authApi.login({ username: email.value, password: password.value })
    }
    // Navigate to basic information page after account creation
    router.push('/basic-information')
  } catch (error) {
    const err = error as { response?: { data?: { detail?: string } } }
    errorMessage.value = err.response?.data?.detail || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthShell
    title="Create an account"
    subtitle="Join CollabFarm today to meet up with certified farmers across the country"
  >
    <form class="auth-form" @submit.prevent="onSubmit">
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div class="auth-form__grid">
        <label class="field field--full">
          <span>Email *</span>
          <input
            v-model="email"
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          />
        </label>

        <label class="field field--half">
          <span>First Name *</span>
          <input
            v-model="firstName"
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            required
          />
        </label>

        <label class="field field--half">
          <span>Last Name *</span>
          <input
            v-model="lastName"
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            required
          />
        </label>

        <label class="field field--full">
          <span>Phone Number *</span>
          <input
            v-model="phoneNumber"
            type="tel"
            name="phoneNumber"
            placeholder="Enter your phone number"
            required
          />
        </label>

        <label class="field field--full">
          <span>Password *</span>
          <input
            v-model="password"
            type="password"
            name="password"
            placeholder="Create a password"
            required
          />
        </label>

        <label class="field field--full">
          <span>Confirm Password *</span>
          <input
            v-model="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            required
          />
        </label>
      </div>

      <button class="btn btn--primary auth-form__submit" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Creating account...' : 'Continue' }}
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
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
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
  max-width: 560px;
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

.auth-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.field--half {
  grid-column: span 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field--full {
  grid-column: 1 / -1;
}

.field > span {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 600;
}

.field input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
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

.field input::placeholder {
  color: #9aa39c;
  font-family: var(--font-body);
  font-weight: 400;
}

.field input:focus {
  border-color: var(--color-green-700);
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
}

.btn {
  min-height: 48px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background: var(--color-green-700);
  color: #fff;
}

.btn--primary:hover {
  background: var(--color-green-800);
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .auth-form {
    gap: 20px;
    max-width: 100%;
  }

  .auth-form__grid {
    gap: 20px;
  }

  .field input {
    min-height: 44px;
    padding: 0 12px;
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
}

@media (max-width: 400px) {
  .auth-form {
    gap: 18px;
  }

  .auth-form__grid {
    gap: 18px;
  }

  .field input {
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
