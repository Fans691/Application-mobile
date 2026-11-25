<template>
  <span class="pill" :class="`pill-${statut}`">
    <span class="dot" />
    {{ STATUT_LABEL[statut] }}
  </span>
</template>

<script setup lang="ts">
import { STATUT_LABEL } from '@/utils/format'
import type { StatutObjet } from '@/types/models'

defineProps<{ statut: StatutObjet }>()
</script>

<style scoped>
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
</style>
