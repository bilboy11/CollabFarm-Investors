<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import logoSrc from '@/assets/images/Logo.png'

const router = useRouter()
const menuOpen = ref(false)
const openDropdown = ref<'login' | 'signup' | null>(null)
const links = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Solutions', href: '#why-choose' },
  { label: 'About Us', href: '#solutions' },
  { label: 'Contact', href: '#contact' },
]

function closeMenu() {
  menuOpen.value = false
}

function navigateToSection(href: string) {
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    })
  } else {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  closeMenu()
}

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown')) {
    openDropdown.value = null
  }
}

function toggleDropdown(name: 'login' | 'signup') {
  openDropdown.value = openDropdown.value === name ? null : name
}

function closeDropdownMenu() {
  openDropdown.value = null
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink class="brand" to="/" aria-label="CollabFarm Finance home">
        <img :src="logoSrc" alt="CollabFarm Finance" />
      </RouterLink>

      <nav class="nav" aria-label="Primary">
        <a
          v-for="link in links"
          :key="link.href"
          href="#"
          @click.prevent="navigateToSection(link.href)"
          >{{ link.label }}</a
        >
      </nav>

      <div class="actions">
        <div class="dropdown">
          <button
            class="btn btn--ghost dropdown__toggle"
            type="button"
            :aria-expanded="openDropdown === 'login'"
            @click="toggleDropdown('login')"
          >
            Login
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="dropdown__arrow" :class="{ 'dropdown__arrow--open': openDropdown === 'login' }">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <ul v-if="openDropdown === 'login'" class="dropdown__menu">
            <li><RouterLink to="/login?role=investor" class="dropdown__item" @click="closeDropdownMenu">Log in as Investor</RouterLink></li>
            <li><a href="https://collabfarm-cooperative.vercel.app/login" class="dropdown__item" @click="closeDropdownMenu">Log in as Cooperative</a></li>
          </ul>
        </div>
        <div class="dropdown">
          <button
            class="btn btn--primary dropdown__toggle"
            @click="toggleDropdown('signup')"
            :aria-expanded="openDropdown === 'signup'"
          >
            Get Started
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              class="dropdown__arrow"
              :class="{ 'dropdown__arrow--open': openDropdown === 'signup' }"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <ul v-if="openDropdown === 'signup'" class="dropdown__menu">
            <li>
              <RouterLink to="/signup?role=investor" class="dropdown__item"
                >Sign up as Investor</RouterLink
              >
            </li>
            <li>
              <a href="https://collabfarm-cooperative.vercel.app/create_account" class="dropdown__item">Sign up as Cooperative</a>
            </li>
          </ul>
        </div>
      </div>

      <button
        class="menu-btn"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        aria-label="Toggle menu"
        @click="menuOpen = !menuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <nav
      id="mobile-nav"
      class="mobile-nav"
      :class="{ 'mobile-nav--open': menuOpen }"
      aria-label="Mobile"
    >
      <a
        v-for="link in links"
        :key="link.href"
        href="#"
        @click.prevent="navigateToSection(link.href)"
      >
        {{ link.label }}
      </a>
      <div class="mobile-nav__actions">
        <div class="dropdown">
          <button class="btn btn--ghost dropdown__toggle" type="button" :aria-expanded="openDropdown === 'login'" @click="toggleDropdown('login')">
            Login
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="dropdown__arrow" :class="{ 'dropdown__arrow--open': openDropdown === 'login' }">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <ul v-if="openDropdown === 'login'" class="dropdown__menu">
            <li><RouterLink to="/login?role=investor" class="dropdown__item" @click="closeMenu(); closeDropdownMenu()">Log in as Investor</RouterLink></li>
            <li><a href="https://collabfarm-cooperative.vercel.app/login" class="dropdown__item" @click="closeMenu(); closeDropdownMenu()">Log in as Cooperative</a></li>
          </ul>
        </div>
        <div class="dropdown">
          <button
            class="btn btn--primary dropdown__toggle"
            @click="toggleDropdown('signup')"
            :aria-expanded="openDropdown === 'signup'"
          >
            Get Started
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              class="dropdown__arrow"
              :class="{ 'dropdown__arrow--open': openDropdown === 'signup' }"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <ul v-if="openDropdown === 'signup'" class="dropdown__menu">
            <li>
              <RouterLink to="/signup?role=investor" class="dropdown__item" @click="closeMenu"
                >Sign up as Investor</RouterLink
              >
            </li>
            <li>
              <a href="https://collabfarm-cooperative.vercel.app/create_account" class="dropdown__item" @click="closeMenu(); closeDropdownMenu()">Sign up as Cooperative</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: var(--stroke-1) solid var(--color-border);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: var(--layout-max);
  height: var(--header-height);
  margin: 0 auto;
  padding: 0 var(--page-pad-x);
}

.brand img {
  height: 40px;
  width: auto;
}

.nav {
  display: flex;
  gap: clamp(1rem, 2vw, 2rem);
  flex: 1;
  justify-content: center;
}

.nav a {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-ink-soft);
}

.nav a:hover {
  color: var(--color-green-800);
}

.actions {
  display: flex;
  gap: 12px;
}

/* —— Dropdown —— */
.dropdown {
  position: relative;
}

.dropdown__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.dropdown__arrow {
  transition: transform 0.2s ease;
}

.dropdown__arrow--open {
  transform: rotate(180deg);
}

.dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  min-width: 200px;
  list-style: none;
  margin: 0;
  padding: 8px;
  border-radius: var(--radius-9);
  background: #fff;
  box-shadow: 0 8px 24px rgba(16, 36, 28, 0.15);
}

.dropdown__item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
  border-radius: 8px;
}

.dropdown__item:hover {
  background: #e8ebe6;
}

.menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
}

.menu-btn span {
  display: block;
  height: 2px;
  width: 20px;
  margin-inline: auto;
  background: var(--color-green-800);
}

.mobile-nav {
  display: none;
}

@media (max-width: 900px) {
  .nav,
  .actions {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .mobile-nav {
    display: none;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.5rem var(--page-pad-x) 1rem;
    background: #fff;
    border-bottom: var(--stroke-1) solid var(--color-border);
  }

  .mobile-nav--open {
    display: flex;
  }

  .mobile-nav a {
    padding: 0.7rem 0.2rem;
    font-weight: 500;
    color: var(--color-ink);
  }

  .mobile-nav__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 0.5rem;
  }

  .mobile-nav .dropdown__menu {
    position: static;
    box-shadow: none;
    background: #f5f7f5;
    margin-top: 8px;
  }
}
</style>
