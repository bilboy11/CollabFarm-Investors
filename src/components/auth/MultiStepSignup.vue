<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/api'
const nationality = ref('')
const ninNumber = ref('')
const address = ref('')

// Upload state for Step 2
const identityFile = ref<File | null>(null)
const identityInput = ref<HTMLInputElement | null>(null)
const identityPreviewUrl = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const currentStep = ref(1)
const totalSteps = 2
const router = useRouter()

// Dynamic title and subtitle based on current step
const stepTitle = computed(() => {
  if (currentStep.value === 1) return 'Basic Information'
  if (currentStep.value === 2) return 'Upload Credentials'
  return ''
})

const stepSubtitle = computed(() => {
  if (currentStep.value === 1) return 'Please provide your individual investor details.'
  if (currentStep.value === 2) return 'Upload your documentation'
  return ''
})

function onNextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function onPreviousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function onIdentityFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (identityPreviewUrl.value) URL.revokeObjectURL(identityPreviewUrl.value)
  identityPreviewUrl.value = file?.type.startsWith('image/') ? URL.createObjectURL(file) : ''
  identityFile.value = file
}

function clearIdentityFile() {
  if (identityPreviewUrl.value) URL.revokeObjectURL(identityPreviewUrl.value)
  identityPreviewUrl.value = ''
  identityFile.value = null
  if (identityInput.value) identityInput.value.value = ''
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`
}

onUnmounted(() => {
  if (identityPreviewUrl.value) URL.revokeObjectURL(identityPreviewUrl.value)
})

async function onSubmitProfile() {
  errorMessage.value = ''
  if (!identityFile.value) {
    errorMessage.value = 'Please upload your National Identity Slip.'
    return
  }

  const profileData = new FormData()
  profileData.append('id_number', ninNumber.value)
  profileData.append('nationality', nationality.value)
  profileData.append('id_file', identityFile.value)
  if (address.value.trim()) profileData.append('address', address.value.trim())

  try {
    isSubmitting.value = true
    await authApi.submitIndividualProfile(profileData)
    router.push('/dashboard')
  } catch (error) {
    const err = error as {
      response?: { data?: { detail?: string; message?: string } }
      message?: string
    }
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unable to submit your profile. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Expose step info to parent component
defineExpose({
  stepTitle,
  stepSubtitle,
})
</script>

<template>
  <div class="multi-step-signup">
    <div class="step-indicator">
      <div class="step-indicator__header">
        <span class="step-indicator__text">Step {{ currentStep }} of {{ totalSteps }}</span>
        <span class="step-indicator__progress"
          >{{ Math.round((currentStep / totalSteps) * 100) }}%</span
        >
      </div>
      <div class="step-indicator__bar">
        <div
          class="step-indicator__progress-bar"
          :style="{ width: (currentStep / totalSteps) * 100 + '%' }"
        ></div>
      </div>
    </div>

    <!-- Step 1: Basic Information -->
    <div v-if="currentStep === 1" class="step-content">
      <form class="auth-form" @submit.prevent="onNextStep">
        <div class="auth-form__grid">
          <label class="field field--full">
            <span>Nationality *</span>
            <input
              v-model="nationality"
              type="text"
              name="nationality"
              placeholder="Enter your nationality"
              required
            />
          </label>

          <label class="field field--full">
            <span>ID Number *</span>
            <input
              v-model="ninNumber"
              type="text"
              name="id_number"
              placeholder="Enter your ID number"
              required
            />
          </label>

          <label class="field field--full">
            <span>Address</span>
            <input
              v-model="address"
              type="text"
              name="address"
              placeholder="Enter your address (optional)"
            />
          </label>
        </div>

        <div class="form-actions">
          <button class="btn btn--primary auth-form__submit" type="submit">Continue</button>
        </div>
      </form>
      <p class="support-text">
        Having issues? <a href="#" class="support-link">Contact support</a>
      </p>
    </div>

    <!-- Step 2: Upload Credentials -->
    <div v-if="currentStep === 2" class="step-content">
      <div class="upload-section">
        <div v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</div>
        <div class="upload-card">
          <div class="upload-card__header">
            <h3 class="upload-card__title">National Identity Slip *</h3>
            <p class="upload-card__subtitle">Upload your national identity slip</p>
          </div>

          <div class="upload-card__upload" :class="{ 'upload-card__upload--has-file': identityFile }">
            <input
              ref="identityInput"
              type="file"
              id="identity-upload"
              class="upload-input"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              @change="onIdentityFileChange"
            />
            <div v-if="identityFile" class="uploaded-file">
              <img
                v-if="identityPreviewUrl"
                class="uploaded-file__preview"
                :src="identityPreviewUrl"
                :alt="`Preview of ${identityFile.name}`"
              />
              <div v-else class="uploaded-file__icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M6 2.75h7l5 5v13.5H6a2 2 0 0 1-2-2v-14a2.5 2.5 0 0 1 2-2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                  <path d="M13 3v5h5M7.5 13h7M7.5 16h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </div>
              <div class="uploaded-file__details">
                <strong>{{ identityFile.name }}</strong>
                <span>{{ formatFileSize(identityFile.size) }} · {{ identityPreviewUrl ? 'Image' : 'PDF document' }}</span>
              </div>
              <button class="uploaded-file__remove" type="button" @click="clearIdentityFile">
                Remove
              </button>
              <label for="identity-upload" class="uploaded-file__change">Change file</label>
            </div>
            <label v-else for="identity-upload" class="upload-label">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M16 2v20M16 22l-6-6M16 22l6-6M2 30h28"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Click to upload an image or PDF</span>
            </label>
          </div>
        </div>

      </div>

      <div class="form-actions">
        <button class="btn btn--secondary" type="button" @click="onPreviousStep">Back</button>
        <button
          class="btn btn--primary auth-form__submit"
          type="button"
          :disabled="isSubmitting"
          @click="onSubmitProfile"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </button>
      </div>

      <p class="support-text">
        Having issues? <a href="#" class="support-link">Contact support</a>
      </p>
    </div>

  </div>
</template>

<style scoped>
.multi-step-signup {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.step-indicator__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-indicator__text {
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
}

.step-indicator__progress {
  color: var(--color-green-700);
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
}

.step-indicator__bar {
  width: 100%;
  height: 6px;
  background: #e8ebe7;
  border-radius: 3px;
  overflow: hidden;
}

.step-indicator__progress-bar {
  height: 100%;
  background: var(--color-green-700);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-title {
  margin: 0 0 8px 0;
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.step-subtitle {
  margin: 0 0 24px 0;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  font-family: var(--font-body);
}

.auth-form__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
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

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
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
  flex: 1;
}

.btn--primary:hover {
  background: var(--color-green-800);
  transform: translateY(-1px);
}

.btn--secondary {
  background: #e8ebe7;
  color: var(--color-ink);
  min-width: 100px;
}

.btn--secondary:hover {
  background: #dfe4dc;
}

.auth-form__submit {
  width: 100%;
}

.support-text {
  margin-top: 24px;
  text-align: center;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 400;
}

.support-link {
  color: var(--color-green-700);
  text-decoration: none;
  font-weight: 500;
}

.support-link:hover {
  text-decoration: underline;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-bottom: 24px;
  opacity: 1;
}

.upload-card {
  border: 1px solid #d7ddd8;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  width: 100%;
  gap: 8px;
  opacity: 1;
}

.upload-card__header {
  margin-bottom: 16px;
}

.upload-card__title {
  margin: 0 0 4px 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
}

.upload-card__subtitle {
  margin: 0;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 400;
}

.upload-card__upload {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 2px dashed #d7ddd8;
  border-radius: 8px;
  background: #f9faf9;
  transition: all 0.2s ease;
}

.upload-card__upload:hover {
  border-color: var(--color-green-700);
  background: var(--color-green-50);
}

.upload-card__upload--has-file {
  justify-content: flex-start;
  min-height: 96px;
  padding: 12px;
  border-style: solid;
  background: #fff;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  text-align: left;
}

.uploaded-file__preview,
.uploaded-file__icon {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  border-radius: 8px;
}

.uploaded-file__preview {
  object-fit: cover;
  border: 1px solid #d7ddd8;
}

.uploaded-file__icon {
  display: grid;
  place-items: center;
  background: #e8f2ec;
  color: var(--color-green-700);
}

.uploaded-file__details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  font-family: var(--font-body);
}

.uploaded-file__details strong {
  overflow: hidden;
  color: var(--color-ink);
  font-size: 0.88rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uploaded-file__details span {
  color: var(--color-ink-soft);
  font-size: 0.78rem;
}

.uploaded-file__remove,
.uploaded-file__change {
  padding: 7px 9px;
  border: 1px solid #d7ddd8;
  border-radius: 7px;
  background: #fff;
  color: var(--color-green-800);
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.uploaded-file__change:hover,
.uploaded-file__remove:hover {
  background: #f1f6f2;
}

.upload-input {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
}

.upload-label svg {
  color: var(--color-ink-soft);
}

.upload-card__uploading {
  padding: 20px 0;
}

.uploading-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.uploading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e8ebe7;
  border-top-color: var(--color-green-700);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.uploading-text {
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
}

.uploading-progress {
  color: var(--color-green-700);
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
}

.uploading-progress-bar {
  width: 100%;
  height: 6px;
  background: #e8ebe7;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.uploading-progress-fill {
  height: 100%;
  background: var(--color-green-700);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.cancel-upload-btn {
  padding: 8px 16px;
  border: 1px solid #d7ddd8;
  border-radius: 6px;
  background: #fff;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-upload-btn:hover {
  border-color: var(--color-ink-soft);
  background: #f9faf9;
}

.upload-card__success {
  padding: 20px 0;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-green-700);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 600px) {
  .auth-form {
    gap: 20px;
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

  .btn {
    min-height: 44px;
    font-size: 0.95rem;
  }

  .step-title {
    font-size: 1.25rem;
  }

  .uploaded-file {
    gap: 8px;
  }

  .uploaded-file__preview,
  .uploaded-file__icon {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
  }

  .uploaded-file__remove,
  .uploaded-file__change {
    padding: 6px;
    font-size: 0.72rem;
  }
}
</style>
