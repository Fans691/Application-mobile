<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Objets perdus</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div class="container">
        <IonSearchbar
          v-model="recherche"
          placeholder="Nom, lieu, description"
          :debounce="200"
          inputmode="search"
        />

        <div class="scroller filters">
          <button type="button" class="filter-chip" :class="{ active: !categorie }" @click="categorie = ''">
            Toutes
          </button>
          <button
            v-for="c in CATEGORIES"
            :key="c.id"
            type="button"
            class="filter-chip"
            :class="{ active: categorie === c.id }"
            @click="categorie = categorie === c.id ? '' : c.id"
          >
            <IonIcon :icon="c.icon" aria-hidden="true" />
            {{ c.libelle }}
          </button>
        </div>

        <div v-if="!loading && !erreur" class="row between toolbar-line">
          <span class="muted small">{{ filtres.length }} résultat{{ filtres.length > 1 ? 's' : '' }}</span>
          <button type="button" class="filter-chip" :class="{ active: avecPrime }" @click="avecPrime = !avecPrime">
            <IonIcon :icon="cashOutline" aria-hidden="true" />
            Avec prime
          </button>
        </div>

        <EtatListe
          :loading="loading"
          :erreur="erreur"
          :vide="filtres.length === 0"
          :icon="searchOutline"
          titre="Aucun objet trouvé"
          message="Modifiez votre recherche ou vos filtres."
        />

        <div class="grid-cards">
          <ObjetCard v-for="objet in filtres" :key="objet.id" :objet="objet" />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/vue'
import { cashOutline, searchOutline } from 'ionicons/icons'
import ObjetCard from '@/components/ObjetCard.vue'
import EtatListe from '@/components/EtatListe.vue'
import { CATEGORIES } from '@/constants/categories'
import { ecouterObjetsPerdus } from '@/services/objets.service'
import type { Objet } from '@/types/models'

const objets = ref<Objet[]>([])
const loading = ref(true)
const erreur = ref('')
const recherche = ref('')
const categorie = ref('')
const avecPrime = ref(false)
let stop: (() => void) | undefined

const normaliser = (texte: string) =>
  texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const filtres = computed(() => {
  const terme = normaliser(recherche.value.trim())
  return objets.value.filter((o) => {
    if (categorie.value && o.categorie !== categorie.value) return false
    if (avecPrime.value && o.prime <= 0) return false
    return !terme || normaliser(`${o.libelle} ${o.lieuPerte} ${o.description}`).includes(terme)
  })
})

onMounted(() => {
  stop = ecouterObjetsPerdus(
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
.filters {
  margin-top: 12px;
}

.toolbar-line {
  margin: 12px 0;
}
</style>
