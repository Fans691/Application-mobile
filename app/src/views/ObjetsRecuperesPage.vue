<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Objets récupérés</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div class="container">
        <div v-if="!loading && !erreur" class="kpis">
          <div class="kpi">
            <span class="kpi-label">Objets rendus</span>
            <span class="kpi-value">{{ objets.length }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Primes versées</span>
            <span class="kpi-value">{{ formatAriary(totalPrimes) }}</span>
          </div>
        </div>

        <IonSearchbar v-model="recherche" class="search" placeholder="Rechercher" :debounce="200" />

        <EtatListe
          :loading="loading"
          :erreur="erreur"
          :vide="filtres.length === 0"
          :icon="checkmarkCircleOutline"
          titre="Aucun objet récupéré"
          message="Les objets rendus à leur propriétaire apparaîtront ici."
        />

        <div class="grid-cards">
          <ObjetCard v-for="objet in filtres" :key="objet.id" :objet="objet">
            <span v-if="objet.trouveurNom" class="muted">Rendu par {{ objet.trouveurNom }}</span>
            <span v-else class="muted">Retrouvé par le propriétaire</span>
          </ObjetCard>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/vue'
import { checkmarkCircleOutline } from 'ionicons/icons'
import ObjetCard from '@/components/ObjetCard.vue'
import EtatListe from '@/components/EtatListe.vue'
import { ecouterObjetsRecuperes } from '@/services/objets.service'
import { formatAriary } from '@/utils/format'
import type { Objet } from '@/types/models'

const objets = ref<Objet[]>([])
const loading = ref(true)
const erreur = ref('')
const recherche = ref('')
let stop: (() => void) | undefined

const filtres = computed(() => {
  const terme = recherche.value.trim().toLowerCase()
  if (!terme) return objets.value
  return objets.value.filter((o) =>
    `${o.libelle} ${o.lieuPerte} ${o.trouveurNom}`.toLowerCase().includes(terme),
  )
})

const totalPrimes = computed(() =>
  objets.value.filter((o) => o.primeStatut === 'payee').reduce((total, o) => total + o.prime, 0),
)

onMounted(() => {
  stop = ecouterObjetsRecuperes(
    (list) => {
      objets.value = list
      loading.value = false
      erreur.value = ''
    },
    (error) => {
      erreur.value = error.message
      loading.value = false
    },
  )
})

onUnmounted(() => stop?.())
</script>

<style scoped>
.search {
  margin: 14px 0;
}
</style>
