<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section class="settings-panel">
    <h3 class="settings-panel__title">{{ title }}</h3>
    <div class="settings-panel__content"><slot /></div>
  </section>
</template>

<style scoped>
.settings-panel {
  overflow: hidden;
  border: 1px solid #e1e7e2;
  border-radius: 16px;
  background: #fff;
}
.settings-panel__title {
  margin: 0;
  padding: 18px 22px;
  border-bottom: 1px solid #e9eeea;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
}
.settings-panel__content { padding: 0 22px; }
</style>
