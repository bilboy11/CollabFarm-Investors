<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { profileApi } from '@/services/api'

type ProfileRecord = Record<string, unknown>

const userProfile = ref({
  initials: '—',
  name: '—',
  role: '—',
  tagline: '',
  fullName: '—',
  firstName: '—',
  lastName: '—',
  email: '—',
  phone: '—',
  country: '—',
})

const personalInfo = computed(() => [
  { label: 'First Name', value: userProfile.value.firstName },
  { label: 'Last Name', value: userProfile.value.lastName },
  { label: 'Email Address', value: userProfile.value.email },
  { label: 'Phone Number', value: userProfile.value.phone },
  { label: 'Country', value: userProfile.value.country },
])

function text(value: unknown): string {
  return value === undefined || value === null || value === '' ? '—' : String(value)
}

function titleCase(value: unknown): string {
  return text(value).replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

onMounted(async () => {
  try {
    const response = await profileApi.me() as ProfileRecord
    const profile = response.profile && typeof response.profile === 'object' ? response.profile as ProfileRecord : {}
    const firstName = text(response.first_name)
    const lastName = text(response.last_name)
    const fullName = text(profile.full_name ?? [response.first_name, response.last_name].filter(Boolean).join(' '))
    const initials = fullName.split(/\s+/).filter((part) => part !== '—').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '—'
    const investorType = response.investor_type ? ` ${titleCase(response.investor_type)} Investor` : ''

    userProfile.value = {
      initials,
      name: fullName,
      role: response.role ? `${titleCase(response.role)}${investorType}` : titleCase(response.investor_type),
      tagline: text(response.verification_status),
      fullName,
      firstName,
      lastName,
      email: text(response.email ?? profile.email),
      phone: text(response.phone_number ?? profile.phone_number),
      country: text(profile.nationality),
    }
  } catch {
    userProfile.value = { ...userProfile.value, tagline: '—' }
  }
})
</script>
<template>
  <div class="profile-wrapper">
    <div class="content">
      <header class="page-header">
        <h1 class="page-title">Profile</h1>
        <p class="page-subtitle">Manage your personal and business information</p>
      </header>
      <section class="profile-header-card">
        <div class="profile-header__left">
          <div class="avatar">{{ userProfile.initials }}</div>
          <div class="profile-info">
            <h2 class="profile-name">{{ userProfile.name }}</h2>
            <p class="profile-role">{{ userProfile.role }}</p>
            <p class="profile-tagline">{{ userProfile.tagline }}</p>
          </div>
        </div>
      </section>
      <section class="personal-info-card">
        <h3 class="card-title">Personal Information</h3>
        <div class="info-rows">
          <div v-for="(item, index) in personalInfo" :key="index" class="info-row">
            <span class="info-row__label">{{ item.label }}</span>
            <span class="info-row__value">{{ item.value }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.profile-wrapper {
  min-height: 100vh;
  background: #f8f9fa;
}
.content {
  width: 100%;
  padding: 32px;
  color: #111827;
  font-family: var(--font-body);
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 4px 0 0 0;
}
.profile-header-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 32px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}
@media (min-width: 640px) {
  .profile-header-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
}
.profile-header__left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e2f0e8;
  color: #1e5138;
  font-size: 1.5rem;
  font-weight: 600;
  display: grid;
  place-items: center;
}
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.profile-role {
  font-size: 1rem;
  font-weight: 400;
  color: #64748b;
  margin: 0;
}
.profile-tagline {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 4px 0 0 0;
}
.btn-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #23583c;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}
.btn-edit:hover {
  background: #1b462f;
}
.personal-info-card {
  padding: 24px 32px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}
.info-rows {
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}
.info-row:last-child {
  border-bottom: none;
}
.info-row__label {
  width: 288px;
  color: #475569;
  font-weight: 500;
  font-size: 0.875rem;
}
.info-row__value {
  flex: 1;
  color: #334155;
  font-size: 0.875rem;
}
@media (max-width: 768px) {
  .content {
    padding: 24px 16px;
  }
  .profile-header__left {
    width: 100%;
  }
  .btn-edit {
    width: 100%;
    justify-content: center;
  }
  .info-row {
    flex-direction: column;
    gap: 4px;
  }
  .info-row__label {
    width: 100%;
  }
}
</style>
