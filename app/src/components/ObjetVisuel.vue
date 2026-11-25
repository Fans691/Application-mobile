<template>
  <div class="visuel" :style="{ '--ratio': ratio, background: image ? undefined : categorie.teinte }">
    <img v-if="image" :src="image" :alt="alt" loading="lazy" decoding="async" />
    <IonIcon v-else :icon="categorie.icon" class="visuel-icon" aria-hidden="true" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { getCategorie } from '@/constants/categories'

const props = withDefaults(
  defineProps<{ image?: string; categorieId?: string; alt?: string; ratio?: string }>(),
  { image: '', categorieId: 'autre', alt: '', ratio: '16 / 10' },
)

const categorie = computed(() => getCategorie(props.categorieId))
</script>

<style scoped>
.visuel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: var(--ratio);
  overflow: hidden;
  background: var(--ion-color-light);
}

.visuel img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visuel-icon {
  width: 30%;
  max-width: 96px;
  height: auto;
  aspect-ratio: 1;
  color: #475569;
  opacity: 0.55;
}
</style>
