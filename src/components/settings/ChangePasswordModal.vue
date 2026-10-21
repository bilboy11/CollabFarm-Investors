<script setup lang="ts">
import { ref, watch } from 'vue'
import { authApi } from '@/services/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

watch([oldPassword, newPassword, confirmPassword], () => {
  errorMessage.value = ''
})

watch(() => props.open, (open) => {
  if (!open) {
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    errorMessage.value = ''
    successMessage.value = ''
  }
})

async function submit() {
  if (isSubmitting.value) return
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Complete all password fields.'
  } else if (newPassword.value.length < 8 || confirmPassword.value.length < 8) {
    errorMessage.value = 'Your new password must be at least 8 characters.'
  } else if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'The new passwords do not match.'
  } else if (oldPassword.value === newPassword.value) {
    errorMessage.value = 'Choose a new password that differs from your current password.'
  } else {
    try {
      isSubmitting.value = true
      await authApi.changePassword({
        current_password: oldPassword.value,
        new_password: newPassword.value,
        confirm_password: confirmPassword.value,
      })
      successMessage.value = 'Your password has been changed successfully.'
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } catch (error) {
      const err = error as {
        response?: { data?: { detail?: unknown; message?: unknown } }
        message?: string
      }
      const detail = err.response?.data?.detail ?? err.response?.data?.message
      errorMessage.value = typeof detail === 'string'
        ? detail
        : err.message || 'Unable to change your password. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <section class="password-modal" role="dialog" aria-modal="true" aria-labelledby="password-title">
        <header class="password-modal__header">
          <h2 id="password-title">Change Password</h2>
          <button class="password-modal__close" type="button" aria-label="Close" @click="emit('close')">×</button>
        </header>
        <form class="password-form" @submit.prevent="submit">
          <label class="password-field">
            <span>Old Password</span>
            <span class="password-field__control">
              <input v-model="oldPassword" :type="showOldPassword ? 'text' : 'password'" placeholder="Enter current password" autocomplete="current-password" />
              <button type="button" :aria-label="showOldPassword ? 'Hide old password' : 'Show old password'" @click="showOldPassword = !showOldPassword">{{ showOldPassword ? 'Hide' : 'Show' }}</button>
            </span>
          </label>
          <label class="password-field">
            <span>New Password</span>
            <span class="password-field__control">
              <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" placeholder="Enter new password" autocomplete="new-password" />
              <button type="button" :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'" @click="showNewPassword = !showNewPassword">{{ showNewPassword ? 'Hide' : 'Show' }}</button>
            </span>
          </label>
          <p class="password-hint">Your new password must be at least 8 characters.</p>
          <label class="password-field">
            <span>Confirm Password</span>
            <span class="password-field__control">
              <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Confirm new password" autocomplete="new-password" />
              <button type="button" :aria-label="showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? 'Hide' : 'Show' }}</button>
            </span>
          </label>
          <p v-if="errorMessage" class="password-error" role="alert">{{ errorMessage }}</p>
          <p v-if="successMessage" class="password-success" role="status">{{ successMessage }}</p>
          <button class="password-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Changing Password…' : 'Change Password' }}
          </button>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100; display: grid; place-items: center;
  padding: 20px; background: rgba(20, 29, 24, 0.3); backdrop-filter: blur(5px);
}
.password-modal {
  width: min(100%, 500px); overflow: hidden; border: 1px solid #e2e8e3;
  border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(20, 29, 24, 0.2);
}
.password-modal__header {
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px;
  border-bottom: 1px solid #e9eeea;
}
.password-modal__header h2 { margin: 0; color: var(--color-ink); font-family: var(--font-display); font-size: 1.15rem; }
.password-modal__close {
  display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 9px;
  background: #f1f4f1; color: var(--color-ink-soft); font-size: 1.5rem; cursor: pointer;
}
.password-form { display: grid; gap: 16px; padding: 22px 24px 24px; }
.password-field { display: grid; gap: 7px; color: var(--color-ink-soft); font-size: 0.83rem; }
.password-field__control {
  display: flex; align-items: center; min-height: 48px; padding: 0 12px;
  border: 1px solid #dce4de; border-radius: 10px; background: #fbfcfb;
}
.password-field__control:focus-within { border-color: var(--color-green-700); box-shadow: 0 0 0 3px rgba(40, 101, 77, 0.1); }
.password-field__control input { flex: 1; width: 100%; border: 0; outline: 0; background: transparent; color: var(--color-ink); font: inherit; }
.password-field__control button { border: 0; background: transparent; color: var(--color-green-800); font: inherit; font-size: 0.76rem; cursor: pointer; }
.password-hint { margin: -7px 0 0; padding: 11px 14px; border-radius: 10px; background: #edf4ff; color: #2759a8; font-size: 0.77rem; line-height: 1.5; text-align: center; }
.password-error { margin: 0; color: #b42318; font-size: 0.82rem; }
.password-success { margin: 0; color: var(--color-green-800); font-size: 0.82rem; }
.password-submit { min-height: 50px; margin-top: 2px; border: 0; border-radius: 10px; background: var(--color-green-700); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.password-submit:hover { background: var(--color-green-800); }
.password-submit:disabled { opacity: 0.7; cursor: wait; }
</style>
