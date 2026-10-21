<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import ChatBot from '@/components/ChatBot.vue'

const route = useRoute()
const hideHeader = computed(() => Boolean(route.meta.hideHeader))
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--auth': hideHeader }">
    <AppHeader v-if="!hideHeader" />
    <RouterView />
    <ChatBot />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--color-surface);
}

.app-shell--auth {
  background: #f3f4f2;
}
</style>
