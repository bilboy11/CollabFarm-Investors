<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import ChatBot from '@/components/ChatBot.vue'
import { setSessionInactivityActive, startSessionInactivityTracking } from '@/services/sessionInactivity'

const route = useRoute()
const router = useRouter()
const hideHeader = computed(() => Boolean(route.meta.hideHeader))
let stopInactivityTracking: (() => void) | undefined

onMounted(() => {
  stopInactivityTracking = startSessionInactivityTracking(router)
  setSessionInactivityActive(router, Boolean(localStorage.getItem('access_token')))
})

watch(
  () => route.fullPath,
  () => setSessionInactivityActive(router, Boolean(localStorage.getItem('access_token'))),
)

onUnmounted(() => stopInactivityTracking?.())
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
