<script setup lang="ts">
import { ref } from 'vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import SettingsToggle from '@/components/settings/SettingsToggle.vue'
import ChangePasswordModal from '@/components/settings/ChangePasswordModal.vue'

const newsUpdates = ref(true)
const reminders = ref(true)
const accountActivity = ref(true)
const showPasswordModal = ref(false)
</script>

<template>
  <main class="settings-page">
    <header class="settings-page__header">
      <div>
        <h2>Settings</h2>
        <p class="settings-page__description">Manage your notifications and account security.</p>
      </div>
    </header>

    <SettingsPanel title="Notification Settings">
      <div class="settings-intro">
        <h4>Email Notifications</h4>
        <p>Choose which updates you would like to receive in your inbox.</p>
      </div>
      <div class="setting-row">
        <div class="setting-row__copy">
          <h4>News &amp; Updates</h4>
          <p>News about CollabFarm and new platform features.</p>
        </div>
        <SettingsToggle v-model="newsUpdates" label="News and updates email notifications" />
      </div>
      <div class="setting-row">
        <div class="setting-row__copy">
          <h4>Reminders</h4>
          <p>Helpful reminders about your investments and account.</p>
        </div>
        <SettingsToggle v-model="reminders" label="Reminder email notifications" />
      </div>
      <div class="setting-row">
        <div class="setting-row__copy">
          <h4>Account Activity</h4>
          <p>Notifications about important activity on your account.</p>
        </div>
        <SettingsToggle v-model="accountActivity" label="Account activity email notifications" />
      </div>
    </SettingsPanel>

    <SettingsPanel title="Security Settings">
      <div class="setting-row setting-row--action">
        <div class="setting-row__copy">
          <h4>Change your password</h4>
          <p>Set a unique password to help protect your account.</p>
        </div>
        <button class="settings-button" type="button" @click="showPasswordModal = true">
          Change Password
        </button>
      </div>
      <div class="setting-row setting-row--action">
        <div class="setting-row__copy">
          <h4>Deactivate Account</h4>
          <p>Deactivate your account and stop using CollabFarm.</p>
        </div>
        <button class="settings-button settings-button--danger" type="button" disabled>
          Deactivate Account
        </button>
      </div>
    </SettingsPanel>

    <ChangePasswordModal :open="showPasswordModal" @close="showPasswordModal = false" />
  </main>
</template>

<style scoped>
.settings-page {
  display: grid;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding: 24px 28px 32px;
}
.settings-page__header { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 2px; }
.settings-page__header h2 { margin: 0; color: var(--color-ink); font-family: var(--font-display); font-size: clamp(1.7rem, 3vw, 2.15rem); font-weight: 700; }
.settings-page__description { margin: 8px 0 0; color: var(--color-ink-soft); font-size: 0.94rem; }
.settings-intro { padding: 19px 0 15px; border-bottom: 1px solid #e9eeea; }
.settings-intro h4, .setting-row__copy h4 { margin: 0; color: var(--color-ink); font-size: 0.93rem; font-weight: 650; }
.settings-intro p, .setting-row__copy p { margin: 5px 0 0; color: var(--color-ink-soft); font-size: 0.83rem; line-height: 1.5; }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 76px; border-bottom: 1px solid #edf0ed; }
.setting-row:last-child { border-bottom: 0; }
.setting-row__copy { min-width: 0; }
.setting-row--action { min-height: 88px; }
.settings-button { min-height: 40px; flex: 0 0 auto; padding: 0 16px; border: 1px solid #cbd8ce; border-radius: 9px; background: #fff; color: var(--color-green-800); font: inherit; font-size: 0.84rem; font-weight: 650; cursor: pointer; transition: background 0.18s ease, border-color 0.18s ease; }
.settings-button:hover { border-color: var(--color-green-700); background: #f3f8f4; }
.settings-button--danger { border-color: #efc5c1; color: #b42318; }
.settings-button--danger:disabled { opacity: 0.75; cursor: not-allowed; }
@media (max-width: 600px) {
  .settings-page { gap: 12px; padding: 18px 14px 24px; }
  .setting-row { min-height: 72px; gap: 12px; }
  .setting-row--action { align-items: flex-start; flex-direction: column; padding: 16px 0; }
  .settings-button { min-height: 38px; }
}
</style>
