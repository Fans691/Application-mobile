<template>
  <IonModal :is-open="isOpen" :backdrop-dismiss="!enCours" @did-dismiss="emit('fermer')" @will-present="initialiser">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Paiement</IonTitle>
        <IonButtons slot="end">
          <IonButton :disabled="enCours" @click="emit('fermer')">Fermer</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div class="container narrow">
        <div class="recap">
          <span class="muted small">Droit de déclaration</span>
          <strong>{{ formatAriary(montant) }}</strong>
          <span class="muted small">{{ libelle }}</span>
        </div>

        <h3 class="section-title">Moyen de paiement</h3>
        <div class="methodes" role="radiogroup">
          <button
            v-for="m in METHODES_PAIEMENT"
            :key="m.id"
            type="button"
            role="radio"
            :aria-checked="methode === m.id"
            class="methode"
            :class="{ active: methode === m.id }"
            :disabled="enCours"
            @click="methode = m.id"
          >
            <span class="radio" />
            <span class="methode-text">
              <strong>{{ m.libelle }}</strong>
              <span>{{ m.detail }}</span>
            </span>
          </button>
        </div>

        <div class="form-stack field">
          <IonInput
            v-model="telephone"
            fill="outline"
            :label="methode === 'carte' ? 'Numéro de carte' : 'Numéro de téléphone'"
            label-placement="floating"
            :type="methode === 'carte' ? 'text' : 'tel'"
            :inputmode="methode === 'carte' ? 'numeric' : 'tel'"
            :disabled="enCours"
          />
        </div>

        <p v-if="erreur" class="form-error">{{ erreur }}</p>

        <IonButton class="btn-main" expand="block" :disabled="enCours" @click="valider">
          <IonSpinner v-if="enCours" name="crescent" />
          <span v-else>Payer {{ formatAriary(montant) }}</span>
        </IonButton>

        <p class="note">
          <IonIcon :icon="lockClosedOutline" aria-hidden="true" />
          Environnement de démonstration : aucun débit réel n'est effectué.
        </p>
      </div>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { lockClosedOutline } from 'ionicons/icons'
import { METHODES_PAIEMENT } from '@/constants/paiement'
import { formatAriary } from '@/utils/format'
import type { InfosPaiement, MethodePaiement } from '@/types/models'

const props = defineProps<{
  isOpen: boolean
  montant: number
  libelle: string
  telephoneDefaut?: string
  enCours?: boolean
}>()

const emit = defineEmits<{
  fermer: []
  payer: [infos: InfosPaiement]
}>()

const methode = ref<MethodePaiement>('mvola')
const telephone = ref('')
const erreur = ref('')

function initialiser() {
  telephone.value = props.telephoneDefaut ?? ''
  erreur.value = ''
}

function valider() {
  erreur.value = ''
  const valeur = telephone.value.replace(/\s+/g, '')
  if (methode.value === 'carte' ? valeur.length < 12 : valeur.length < 9) {
    erreur.value = methode.value === 'carte' ? 'Numéro de carte invalide.' : 'Numéro de téléphone invalide.'
    return
  }
  emit('payer', { methode: methode.value, telephone: telephone.value })
}
</script>

<style scoped>
.recap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 20px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  text-align: center;
}

.recap strong {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.recap span:last-child {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.methodes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr));
  gap: 8px;
}

.methode {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.methode.active {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 1px var(--ion-color-primary) inset;
}

.radio {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
}

.methode.active .radio {
  border: 5px solid var(--ion-color-primary);
}

.methode-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.methode-text strong {
  font-size: 15px;
  font-weight: 600;
}

.methode-text span {
  font-size: 12px;
  color: var(--text-muted);
}

.field {
  margin: 18px 0 14px;
}

.form-error {
  margin-bottom: 14px;
}

.note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 14px 0 0;
  color: var(--text-soft);
  font-size: 12px;
  text-align: center;
}
</style>
