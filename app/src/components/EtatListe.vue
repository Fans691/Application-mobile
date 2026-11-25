<template>
  <div v-if="loading" class="etat">
    <IonSpinner name="crescent" />
  </div>
  <div v-else-if="erreur" class="etat">
    <div class="etat-icon erreur"><IonIcon :icon="alertCircleOutline" /></div>
    <p class="etat-title">Chargement impossible</p>
    <p class="etat-text">{{ erreur }}</p>
  </div>
  <div v-else-if="vide" class="etat">
    <div class="etat-icon"><IonIcon :icon="icon" /></div>
    <p class="etat-title">{{ titre }}</p>
    <p v-if="message" class="etat-text">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import { alertCircleOutline, fileTrayOutline } from 'ionicons/icons'

withDefaults(
  defineProps<{
    loading?: boolean
    erreur?: string
    vide?: boolean
    titre?: string
    message?: string
    icon?: string
  }>(),
  { titre: 'Rien pour le moment', message: '', icon: fileTrayOutline },
)
</script>

<style scoped>
.etat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 48px 24px;
  text-align: center;
}

.etat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 6px;
  border-radius: 16px;
  background: var(--ion-color-light);
  color: var(--text-muted);
  font-size: 26px;
}

.etat-icon.erreur {
  background: #fdecec;
  color: var(--ion-color-danger);
}

.etat-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-strong);
}

.etat-text {
  max-width: 340px;
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted);
}
</style>
