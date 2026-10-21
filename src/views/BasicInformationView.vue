<script setup lang="ts">
import { ref, computed } from 'vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import MultiStepSignup from '@/components/auth/MultiStepSignup.vue'

const multiStepRef = ref<InstanceType<typeof MultiStepSignup> | null>(null)

const title = computed(() => multiStepRef.value?.stepTitle || 'Basic Information')
const subtitle = computed(
  () =>
    multiStepRef.value?.stepSubtitle || 'Please provide basic information about your cooperative.',
)
</script>

<template>
  <AuthShell :title="title" :subtitle="subtitle">
    <MultiStepSignup ref="multiStepRef" />
  </AuthShell>
</template>

<style scoped></style>
