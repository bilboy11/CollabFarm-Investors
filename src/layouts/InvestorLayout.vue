<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import logoSrc from '@/assets/images/Logo.png'
import { API_BASE_URL, profileApi } from '@/services/api'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const accountMenuOpen = ref(false)
const accountImage = ref('')
const accountInitials = ref('')

onMounted(async () => {
  try {
    const response = await profileApi.me() as Record<string, unknown>
    const profile = response.profile && typeof response.profile === 'object'
      ? response.profile as Record<string, unknown>
      : response
    const photo = profile.profile_photo ?? profile.profile_picture ?? profile.profile_image ??
      profile.photo_url ?? profile.image_url ?? profile.avatar_url ?? profile.avatar
    const photoUrl = typeof photo === 'string' ? photo : photo && typeof photo === 'object'
      ? String((photo as Record<string, unknown>).url ?? (photo as Record<string, unknown>).image_url ?? '')
      : ''
    if (photoUrl) accountImage.value = photoUrl.startsWith('http') ? photoUrl : new URL(photoUrl, API_BASE_URL).toString()

    const fullName = String(profile.full_name ?? [response.first_name, response.last_name].filter(Boolean).join(' ')).trim()
    accountInitials.value = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  } catch {
    // The neutral avatar remains visible if profile details are unavailable.
  }
})

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', to: '/dashboard' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', to: '/dashboard/wallet' },
  { id: 'packages', label: 'Packages', icon: 'package', to: '/dashboard/packages' },
  { id: 'investments', label: 'Investments', icon: 'chart', to: '/dashboard/investments' },
  { id: 'profile', label: 'Profile', icon: 'user', to: '/dashboard/profile' },
]

const bottomNav = [
  { id: 'settings', label: 'Settings', icon: 'gear', to: '/dashboard/settings' },
  { id: 'help & support', label: 'Help & Support', icon: 'help', to: '/dashboard/help' },
]

function isActive(to: string) {
  if (to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(to)
}

function closeMenu() {
  menuOpen.value = false
}

function logout() {
  localStorage.removeItem('access_token')
  accountMenuOpen.value = false
  router.replace('/login')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(
  () => route.path,
  () => {
    menuOpen.value = false
    accountMenuOpen.value = false
  },
)
</script>

<template>
  <div class="dash" :class="{ 'dash--menu-open': menuOpen }">
    <div
      class="sidebar-backdrop"
      :class="{ 'sidebar-backdrop--open': menuOpen }"
      aria-hidden="true"
      @click="closeMenu"
    ></div>

    <aside id="dashboard-sidebar" class="sidebar" :class="{ 'sidebar--open': menuOpen }">
      <div class="sidebar__top">
        <RouterLink
          class="sidebar__brand"
          to="/"
          aria-label="CollabFarm Finance home"
          @click="closeMenu"
        >
          <img :src="logoSrc" alt="CollabFarm Finance" />
        </RouterLink>
        <button class="sidebar__close" type="button" aria-label="Close menu" @click="closeMenu">
          <span></span>
          <span></span>
        </button>
      </div>

      <nav class="sidebar__nav" aria-label="Dashboard">
        <RouterLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.to) }"
          @click="closeMenu"
        >
          <span class="nav-item__icon" aria-hidden="true">
            <svg v-if="item.icon === 'grid'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect
                x="2"
                y="2"
                width="6"
                height="6"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="10"
                y="2"
                width="6"
                height="6"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="2"
                y="10"
                width="6"
                height="6"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="10"
                y="10"
                width="6"
                height="6"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            <svg
              v-else-if="item.icon === 'users'"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <circle cx="6.5" cy="6" r="2.5" stroke="currentColor" stroke-width="1.5" />
              <circle cx="12.5" cy="7" r="2" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M2.5 14.5c.7-2.2 2.4-3.3 4-3.3s3.3 1.1 4 3.3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M11 11.4c1.2-.3 2.5-.1 3.5 1.1"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <svg
              v-else-if="item.icon === 'wallet'"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M2 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2V6z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else-if="item.icon === 'package'"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M3 7l6 3.5 6-3.5M3 7l6-3.5 6 3.5M3 7v7l6 3.5 6-3.5V7"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9 10.5v7"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else-if="item.icon === 'chart'"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M3 14V8M7.5 14V4M12 14v-5M15.5 14V6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="2.8" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M3.8 14.5c1-2.6 3-3.9 5.2-3.9s4.2 1.3 5.2 3.9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <nav class="sidebar__footer" aria-label="Settings">
        <RouterLink
          v-for="item in bottomNav"
          :key="item.id"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.to) }"
          @click="closeMenu"
        >
          <span class="nav-item__icon" aria-hidden="true">
            <svg v-if="item.icon === 'gear'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.4" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M9 2.2v1.6M9 14.2v1.6M2.2 9h1.6M14.2 9h1.6M4.1 4.1l1.1 1.1M12.8 12.8l1.1 1.1M13.9 4.1l-1.1 1.1M5.2 12.8l-1.1 1.1"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="6.2" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M9 5.8v4.2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="9" cy="12.4" r="0.8" fill="currentColor" />
            </svg>
          </span>
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="dash__main">
      <header class="topbar">
        <div class="topbar__left">
          <button
            class="menu-btn"
            type="button"
            :aria-expanded="menuOpen"
            aria-controls="dashboard-sidebar"
            aria-label="Open navigation menu"
            @click="toggleMenu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1>Investor Dashboard</h1>
        </div>
        <div class="topbar__actions">
          <div class="account-menu">
          <button
            class="account"
            type="button"
            :aria-expanded="accountMenuOpen"
            aria-haspopup="menu"
            @click="accountMenuOpen = !accountMenuOpen"
          >
            <img v-if="accountImage" :src="accountImage" alt="" />
            <span v-else class="account-avatar" aria-hidden="true">
              <template v-if="accountInitials">{{ accountInitials }}</template>
              <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.4" />
                <path d="M3.5 15c.7-2.5 2.5-3.8 5.5-3.8s4.8 1.3 5.5 3.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              </svg>
            </span>
            <span class="account__label">Account</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="m3 4.5 3 3 3-3"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div v-if="accountMenuOpen" class="account-menu__panel" role="menu">
            <RouterLink class="account-menu__item" to="/dashboard/profile" role="menuitem">
              Profile
            </RouterLink>
            <button class="account-menu__item" type="button" role="menuitem" @click="logout">
              Log out
            </button>
          </div>
          </div>
        </div>
      </header>

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.dash {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  min-height: 100vh;
  background: #f4f6f4;
  color: var(--color-ink);
  font-family: var(--font-body);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.sidebar-backdrop {
  display: none;
}

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 248px;
  height: 100vh;
  min-height: 100vh;
  padding: 28px 18px;
  background: #fff;
  border-right: var(--stroke-1) solid var(--color-border);
  overflow-y: auto;
}

.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar__brand img {
  height: 40px;
  width: auto;
}

.sidebar__close {
  display: none;
}

.sidebar__nav,
.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar__footer {
  margin-top: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.nav-item:hover {
  background: #f3f7f4;
  color: var(--color-green-800);
}

.nav-item--active {
  background: #e7f3ea;
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-weight: 600;
}

.nav-item__icon {
  display: grid;
  place-items: center;
  width: 20px;
}

.dash__main {
  min-width: 0;
}

.topbar {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 20px;
  height: 84px;
  padding: 0 28px;
  background: #fff;
  border-bottom: var(--stroke-05) solid var(--color-border);
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0;
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.menu-btn span {
  display: block;
  width: 18px;
  height: 2px;
  margin-inline: auto;
  background: var(--color-green-800);
}

.topbar h1 {
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: var(--stroke-05) solid var(--color-border);
  border-radius: 50%;
  background: #fff;
  color: var(--color-ink-soft);
  cursor: pointer;
}

.icon-btn__dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary-300);
}

.account {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 4px 12px 4px 4px;
  border: var(--stroke-05) solid var(--color-border);
  border-radius: var(--radius-pill);
  background: #fff;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.account-menu {
  position: relative;
}

.account-menu__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  min-width: 160px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(16, 28, 22, 0.14);
}

.account-menu__item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.account-menu__item:hover {
  background: #f1f5f2;
}

.account img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.account-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2f0e8;
  color: var(--color-green-800);
  font-size: 0.72rem;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .dash {
    grid-template-columns: 1fr;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(16, 28, 22, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  .sidebar-backdrop--open {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: min(248px, 86vw);
    height: 100vh;
    min-height: 100vh;
    transform: translateX(-105%);
    transition: transform 0.25s ease;
    box-shadow: 8px 0 28px rgba(16, 28, 22, 0.12);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar__close {
    display: grid;
    place-items: center;
    position: relative;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: #f3f7f4;
    cursor: pointer;
  }

  .sidebar__close span {
    position: absolute;
    width: 14px;
    height: 2px;
    background: var(--color-green-800);
  }

  .sidebar__close span:first-child {
    transform: rotate(45deg);
  }

  .sidebar__close span:last-child {
    transform: rotate(-45deg);
  }

  .menu-btn {
    display: flex;
  }

  .topbar {
    grid-template-columns: 1fr auto;
    padding: 0 16px;
  }

  .account__label,
  .account > svg {
    display: none;
  }

  .account {
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
    padding: 3px;
  }
}
</style>
