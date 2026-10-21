<script setup lang="ts">
import { RouterLink } from 'vue-router'
import authImage from '@/assets/images/Authentication.png'
import logoSrc from '@/assets/images/Logo.png'

defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <main class="auth-page">
    <RouterLink class="auth-back" to="/" aria-label="Back to landing page">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 3 5 8l5 5"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Back to Home
    </RouterLink>

    <div class="auth-layout">
      <aside class="auth-visual" aria-hidden="true">
        <img class="auth-visual__img" :src="authImage" alt="" />
        <div class="auth-visual__scrim"></div>
        <div class="auth-visual__content">
          <p class="auth-visual__copy">
            A data-driven dashboard concept for CollabFarm that enables Super Admins to monitor
            platform growth, manage stakeholders, and access critical insights through an organized,
            user-centered interface.
          </p>
          <div class="auth-visual__brand">
            <img :src="logoSrc" alt="CollabFarm Finance" />
          </div>
        </div>
      </aside>

      <section class="auth-panel">
        <header class="auth-panel__header">
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </header>
        <div class="auth-panel__body">
          <slot />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 42px 28px;
  background: #f3f4f2;
}

.auth-back {
  position: absolute;
  top: 24px;
  left: 28px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 1rem 0 0.75rem;
  border: var(--stroke-1) solid #cfd8d3;
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-green-800);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 600;
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.auth-back:hover {
  border-color: var(--color-green-800);
  background: var(--color-green-50);
  transform: translateY(-1px);
}

.auth-layout {
  display: flex;
  align-items: stretch;
  gap: 48px;
  width: 1456px;
  max-width: 100%;
  height: auto;
  padding: 0;
  border-radius: var(--radius-14);
  background: #f3f4f2;
}

.auth-visual {
  position: relative;
  flex: 0 0 838px;
  width: 838px;
  height: 897px;
  overflow: hidden;
  border-radius: var(--radius-14);
  background: #24352c;
}

.auth-visual__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.auth-visual__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(12, 20, 16, 0) 42%,
    rgba(12, 20, 16, 0.55) 72%,
    rgba(12, 20, 16, 0.78) 100%
  );
}

.auth-visual__content {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 28px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-visual__copy {
  width: 790px;
  max-width: 100%;
  height: 84px;
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-family: var(--font-body);
  font-weight: var(--font-weight-subheading);
  font-style: normal;
  font-size: var(--font-size-subheading-2);
  line-height: var(--line-height-subheading);
  letter-spacing: 0;
}

.auth-visual__brand {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.auth-visual__brand img {
  height: 36px;
  width: auto;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 24px;
  flex: 0 0 570px;
  width: 570px;
  height: 897px;
  padding: var(--space-18) 0;
  background: transparent;
  font-family: var(--font-body);
  overflow-y: visible;
}

.auth-panel__header h1 {
  margin-bottom: 0.55rem;
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: clamp(2rem, 3.2vw, 2.75rem);
  font-weight: 700;
  line-height: 1.15;
}

.auth-panel__header p {
  max-width: 28rem;
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.55;
}

.auth-panel__body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: auto;
  font-family: var(--font-body);
  flex: 1;
}

.auth-panel__body > :deep(form) {
  gap: 24px;
}

.auth-panel__body :deep(:is(h1, h2, h3, strong, b)),
.auth-panel__body :deep(.auth-form__footer a),
.auth-panel__body :deep(.field > span),
.auth-panel__body :deep(.auth-form__submit),
.auth-panel__body :deep(.btn--google) {
  font-family: var(--font-display);
}

@media (max-width: 1500px) {
  .auth-layout {
    width: 100%;
    height: auto;
    min-height: 0;
  }

  .auth-visual,
  .auth-panel {
    flex: 1 1 0;
    width: auto;
  }

  .auth-visual {
    min-height: 640px;
    aspect-ratio: 838 / 897;
  }

  .auth-panel {
    min-height: 640px;
  }
}

@media (max-width: 1000px) {
  .auth-page {
    padding: 72px 16px 20px;
  }

  .auth-back {
    top: 16px;
    left: 16px;
  }

  .auth-layout {
    flex-direction: column;
    gap: 24px;
  }

  .auth-visual {
    width: 100%;
    min-height: 280px;
    max-height: 420px;
    aspect-ratio: auto;
  }

  .auth-panel {
    width: 100%;
    min-height: 0;
    padding: var(--space-8) 0 var(--space-12);
  }
}

@media (max-width: 600px) {
  .auth-page {
    padding: 60px 12px 16px;
  }

  .auth-back {
    top: 12px;
    left: 12px;
    font-size: 0.85rem;
    padding: 0 0.75rem 0 0.5rem;
    min-height: 38px;
  }

  .auth-back svg {
    width: 14px;
    height: 14px;
  }

  .auth-layout {
    gap: 16px;
  }

  .auth-visual {
    min-height: 200px;
    max-height: 320px;
    border-radius: var(--radius-9);
  }

  .auth-visual__content {
    left: 16px;
    right: 16px;
    bottom: 16px;
    gap: 8px;
  }

  .auth-visual__copy {
    height: auto;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .auth-visual__brand {
    padding: 8px 14px;
  }

  .auth-visual__brand img {
    height: 28px;
  }

  .auth-panel {
    padding: var(--space-6) 0 var(--space-10);
  }

  .auth-panel__header h1 {
    font-size: clamp(1.5rem, 5vw, 2rem);
  }

  .auth-panel__header p {
    font-size: 0.88rem;
  }
}

@media (max-width: 400px) {
  .auth-page {
    padding: 50px 10px 12px;
  }

  .auth-back {
    top: 10px;
    left: 10px;
    font-size: 0.8rem;
    padding: 0 0.6rem 0 0.4rem;
    min-height: 36px;
  }

  .auth-visual {
    min-height: 180px;
    max-height: 280px;
  }

  .auth-visual__content {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }

  .auth-visual__copy {
    font-size: 0.8rem;
  }

  .auth-panel__header h1 {
    font-size: 1.5rem;
  }
}
</style>
