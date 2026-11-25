<template>
  <RouterLink :to="`/objets/${objet.id}`" class="card">
    <ObjetVisuel :image="objet.image" :categorie-id="objet.categorie" :alt="objet.libelle">
      <StatutPill class="card-statut" :statut="objet.statut" />
    </ObjetVisuel>

    <div class="card-body">
      <div class="card-top">
        <StatutPill class="card-statut-inline" :statut="objet.statut" />
        <span class="card-categorie">{{ categorie.libelle }}</span>
        <span v-if="moi" class="pill pill-primary">Mon annonce</span>
      </div>

      <h3 class="card-title">{{ objet.libelle }}</h3>

      <p v-if="objet.lieuPerte" class="card-meta">
        <IonIcon :icon="locationOutline" aria-hidden="true" />
        <span>{{ objet.lieuPerte }}</span>
      </p>
      <p class="card-meta">
        <IonIcon :icon="timeOutline" aria-hidden="true" />
        <span v-if="objet.statut === 'recupere'">Récupéré le {{ formatDate(objet.dateRecuperation) }}</span>
        <span v-else-if="objet.datePerte">Perdu le {{ formatDate(objet.datePerte) }}</span>
        <span v-else>Publié {{ formatRelatif(objet.createdAt).toLowerCase() }}</span>
      </p>

      <div v-if="objet.prime > 0 || (moi && enAttente > 0) || $slots.default" class="card-footer">
        <span v-if="objet.prime > 0" class="card-prime">Prime {{ formatAriary(objet.prime) }}</span>
        <span v-if="moi && enAttente > 0" class="card-alert">
          {{ enAttente }} signalement{{ enAttente > 1 ? 's' : '' }}
        </span>
        <slot />
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { locationOutline, timeOutline } from 'ionicons/icons'
import ObjetVisuel from './ObjetVisuel.vue'
import StatutPill from './StatutPill.vue'
import { getCategorie } from '@/constants/categories'
import { formatAriary, formatDate, formatRelatif } from '@/utils/format'
import { useSession } from '@/composables/useSession'
import type { Objet } from '@/types/models'

const props = defineProps<{ objet: Objet }>()
const { user } = useSession()

const categorie = computed(() => getCategorie(props.objet.categorie))
const moi = computed(() => !!user.value && props.objet.userId?.id === user.value.uid)
const enAttente = computed(() => props.objet.signalements.filter((s) => s.statut === 'en_attente').length)
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.card:active {
  transform: scale(0.99);
}

@media (hover: hover) {
  .card:hover {
    box-shadow: var(--shadow);
  }
}

.card-statut {
  position: absolute;
  top: 10px;
  left: 10px;
  box-shadow: var(--shadow-sm);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px 14px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-categorie {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.card-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-strong);
  overflow-wrap: anywhere;
}

.card-meta {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.card-meta ion-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 14px;
}

.card-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 13px;
}

.card-prime {
  font-weight: 700;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.card-alert {
  margin-left: auto;
  color: var(--ion-color-warning);
  font-weight: 600;
}

.card-statut-inline {
  display: none;
}

/* Téléphones : liste compacte, vignette à gauche */
@media (max-width: 599px) {
  .card {
    flex-direction: row;
    align-items: stretch;
  }

  .card .visuel {
    flex-shrink: 0;
    width: 104px;
    min-height: 112px;
    aspect-ratio: auto;
  }

  .card .visuel :deep(.visuel-icon) {
    width: 40px;
  }

  .card-statut {
    display: none;
  }

  .card-statut-inline {
    display: inline-flex;
  }

  .card-categorie {
    display: none;
  }

  .card-top {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 6px;
  }

  .card-body {
    flex: 1;
    min-width: 0;
    gap: 3px;
    padding: 10px 12px;
  }

  .card-title {
    display: -webkit-box;
    margin: 2px 0;
    overflow: hidden;
    font-size: 15px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .card-footer {
    margin-top: 6px;
    padding-top: 6px;
  }
}
</style>
