<template>
  <svg class="brand-mark" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="currentColor" />
    <circle cx="29" cy="29" r="13" fill="none" stroke="#fff" stroke-width="5" />
    <path d="M38.5 38.5L48 48" stroke="#fff" stroke-width="5" stroke-linecap="round" />
    <path
      d="M23.5 29.5l4 4 7.5-8"
      fill="none"
      stroke="#fff"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 44 })
</script>

<style scoped>
.brand-mark {
  display: block;
  color: var(--ion-color-primary);
}
</style>
