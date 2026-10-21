<script setup lang="ts">
defineProps<{ modelValue: boolean; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    class="settings-toggle"
    :class="{ 'settings-toggle--on': modelValue }"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="emit('update:modelValue', !modelValue)"
  ><span class="settings-toggle__thumb"></span></button>
</template>

<style scoped>
.settings-toggle {
  flex: 0 0 auto;
  width: 44px;
  height: 25px;
  padding: 3px;
  border: 0;
  border-radius: 999px;
  background: #c9d1cb;
  cursor: pointer;
  transition: background 0.18s ease;
}
.settings-toggle--on { background: var(--color-green-700); }
.settings-toggle__thumb {
  display: block;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(18, 38, 27, 0.18);
  transition: transform 0.18s ease;
}
.settings-toggle--on .settings-toggle__thumb { transform: translateX(19px); }
</style>
