<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => {
  const map: Record<string, string> = {
    investments: 'My Investments',
    reports: 'Reports',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help & Support',
  }
  const key = route.path.split('/').pop() || ''
  return map[key] || 'Dashboard'
})
</script>

<template>
  <section class="section-page">
    <div class="section-page__card">
      <h2>{{ title }}</h2>
      <p>This section is ready for content. Use the side navigation to move between pages.</p>
    </div>
  </section>
</template>

<style scoped>
.section-page {
  width: min(1208px, 100%);
  margin: 0 auto;
  padding: 28px;
}

.section-page__card {
  padding: var(--space-9) var(--space-7);
  border: var(--stroke-05) solid var(--color-border);
  border-top: 0.5px solid var(--color-primary-300);
  border-radius: var(--radius-7);
  background: #fff;
}

.section-page__card h2 {
  margin-bottom: 0.5rem;
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
}

.section-page__card p {
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.55;
}
</style>
