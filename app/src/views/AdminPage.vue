<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div slot="start" class="brand">
          <BrandMark :size="28" />
          <span>Administration</span>
        </div>
        <IonButtons slot="end">
          <IonButton color="medium" @click="handleLogout">
            <IonIcon slot="start" :icon="logOutOutline" />
            Déconnexion
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div class="container wide">
        <div class="intro row between wrap">
          <div>
            <h1 class="page-title">Tableau de bord</h1>
            <p class="page-subtitle flush">Recettes des droits de déclaration et activité de la plateforme.</p>
          </div>
          <IonSegment v-model="periode" class="periode" :scrollable="false">
            <IonSegmentButton value="3"><IonLabel>3 mois</IonLabel></IonSegmentButton>
            <IonSegmentButton value="6"><IonLabel>6 mois</IonLabel></IonSegmentButton>
            <IonSegmentButton value="12"><IonLabel>12 mois</IonLabel></IonSegmentButton>
          </IonSegment>
        </div>

        <EtatListe :loading="loading" :erreur="erreur" />

        <template v-if="!loading && !erreur">
          <div class="kpis">
            <div class="kpi hero">
              <span class="kpi-label">Recettes sur la période</span>
              <span class="kpi-value">{{ formatAriary(recettesPeriode) }}</span>
              <span class="kpi-hint" :class="{ up: recettesPrecedentes > 0 && tendance >= 0, down: tendance < 0 }">
                {{ libelleTendance }}
              </span>
            </div>
            <div class="kpi">
              <span class="kpi-label">Recettes totales</span>
              <span class="kpi-value">{{ formatAriary(recettesTotales) }}</span>
              <span class="kpi-hint">Depuis le lancement</span>
            </div>
            <div class="kpi">
              <span class="kpi-label">Déclarations payées</span>
              <span class="kpi-value">{{ formatNombre(paiementsPeriode.length) }}</span>
              <span class="kpi-hint">Sur la période</span>
            </div>
            <div class="kpi">
              <span class="kpi-label">Ce mois-ci</span>
              <span class="kpi-value">{{ formatAriary(recettesMois) }}</span>
              <span class="kpi-hint">{{ moisCourant }}</span>
            </div>
          </div>

          <section class="panel chart-panel">
            <div class="row between wrap panel-head">
              <div>
                <h2 class="panel-title">Recettes mensuelles</h2>
                <p class="muted small flush">Droits de déclaration encaissés, en Ariary</p>
              </div>
              <div class="toggle" role="tablist">
                <button type="button" :class="{ active: vue === 'graphique' }" @click="vue = 'graphique'">Graphique</button>
                <button type="button" :class="{ active: vue === 'tableau' }" @click="vue = 'tableau'">Tableau</button>
              </div>
            </div>

            <BarChart v-if="vue === 'graphique'" :points="pointsMensuels" :format-valeur="formatAriary" />

            <table v-else class="table">
              <thead>
                <tr><th>Mois</th><th class="num">Déclarations</th><th class="num">Recettes</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in pointsMensuels" :key="p.label">
                  <td>{{ p.libelleLong }}</td>
                  <td class="num">{{ p.nombre }}</td>
                  <td class="num">{{ formatAriary(p.valeur) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div class="two-cols">
            <section class="panel">
              <h2 class="panel-title">Par moyen de paiement</h2>
              <p class="muted small">Part des recettes sur la période</p>
              <p v-if="parMethode.length === 0" class="muted small">Aucun paiement sur la période.</p>
              <ul class="ranks">
                <li v-for="m in parMethode" :key="m.id">
                  <div class="row between">
                    <span>{{ m.libelle }}</span>
                    <span class="rank-value">{{ formatAriary(m.montant) }}</span>
                  </div>
                  <div class="track" :title="`${m.part.toFixed(0)} %`">
                    <span class="fill" :style="{ width: `${m.part}%` }" />
                  </div>
                  <span class="muted small">{{ m.nombre }} paiement{{ m.nombre > 1 ? 's' : '' }} · {{ m.part.toFixed(0) }} %</span>
                </li>
              </ul>
            </section>

            <section class="panel">
              <h2 class="panel-title">Activité</h2>
              <p class="muted small">Toutes périodes confondues</p>
              <dl class="figures">
                <div><dt>Utilisateurs</dt><dd>{{ formatNombre(nbUtilisateurs) }}</dd></div>
                <div><dt>Annonces</dt><dd>{{ formatNombre(objets.length) }}</dd></div>
                <div><dt>En recherche</dt><dd>{{ formatNombre(compte('perdu')) }}</dd></div>
                <div><dt>En restitution</dt><dd>{{ formatNombre(compte('trouve')) }}</dd></div>
                <div><dt>Récupérés</dt><dd>{{ formatNombre(compte('recupere')) }}</dd></div>
                <div><dt>Taux de récupération</dt><dd>{{ tauxRecuperation }} %</dd></div>
                <div><dt>Primes versées entre membres</dt><dd>{{ formatAriary(primesVersees) }}</dd></div>
                <div><dt>Primes en attente</dt><dd>{{ formatAriary(primesDues) }}</dd></div>
              </dl>
            </section>
          </div>

          <section class="panel">
            <h2 class="panel-title">Droit de déclaration</h2>
            <p class="panel-text">
              Montant facturé à chaque nouvelle annonce. La modification s'applique immédiatement aux prochaines déclarations.
            </p>
            <form class="frais-form" novalidate @submit.prevent="enregistrerFrais">
              <IonInput
                v-model="nouveauFrais"
                fill="outline"
                type="number"
                inputmode="numeric"
                min="0"
                step="500"
                label="Montant (Ar)"
                label-placement="floating"
              />
              <IonButton type="submit" class="btn-main" :disabled="sauvegarde">
                <IonSpinner v-if="sauvegarde" name="crescent" />
                <span v-else>Enregistrer</span>
              </IonButton>
            </form>
            <p class="muted small">Montant actuel : <strong>{{ formatAriary(fraisDeclaration) }}</strong></p>
          </section>

          <section class="panel">
            <div class="row between panel-head">
              <h2 class="panel-title">Derniers encaissements</h2>
              <span class="muted small">{{ paiements.length }} au total</span>
            </div>
            <p v-if="paiements.length === 0" class="muted small">Aucun encaissement.</p>
            <ul class="transactions">
              <li v-for="p in paiements.slice(0, nbAffiches)" :key="p.objet.id">
                <div class="min0">
                  <strong class="ellipsis">{{ p.objet.libelle }}</strong>
                  <span class="muted small ellipsis">
                    {{ p.objet.proprietaireNom || p.objet.proprietaireEmail }} · {{ libelleMethode(p.paiement.methode) }}
                  </span>
                  <span class="ref">{{ p.paiement.reference }} · {{ formatDateHeure(p.paiement.payeLe) }}</span>
                </div>
                <span class="amount">+{{ formatAriary(p.paiement.montant) }}</span>
              </li>
            </ul>
            <IonButton
              v-if="paiements.length > nbAffiches"
              fill="clear"
              expand="block"
              @click="nbAffiches += 10"
            >
              Afficher plus
            </IonButton>
          </section>
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import { logOutOutline } from 'ionicons/icons'
import BarChart from '@/components/BarChart.vue'
import type { PointBarre } from '@/components/BarChart.vue'
import BrandMark from '@/components/BrandMark.vue'
import EtatListe from '@/components/EtatListe.vue'
import { useSession } from '@/composables/useSession'
import { libelleMethode, METHODES_PAIEMENT } from '@/constants/paiement'
import { logout } from '@/services/auth.service'
import { ecouterTousLesObjets } from '@/services/objets.service'
import { compterUtilisateurs, modifierProfil } from '@/services/users.service'
import { erreurMessage, formatAriary, formatDateHeure, formatNombre } from '@/utils/format'
import type { Objet, PaiementDeclaration, StatutObjet } from '@/types/models'

const router = useRouter()
const { user, fraisDeclaration } = useSession()

const objets = ref<Objet[]>([])
const nbUtilisateurs = ref(0)
const loading = ref(true)
const erreur = ref('')
const periode = ref<'3' | '6' | '12'>('6')
const vue = ref<'graphique' | 'tableau'>('graphique')
const nouveauFrais = ref('')
const sauvegarde = ref(false)
const nbAffiches = ref(10)
let stop: (() => void) | undefined

watch(fraisDeclaration, (v) => (nouveauFrais.value = String(v)), { immediate: true })

const paiements = computed(() =>
  objets.value
    .filter((o): o is Objet & { paiementDeclaration: PaiementDeclaration } => !!o.paiementDeclaration)
    .map((o) => ({ objet: o, paiement: o.paiementDeclaration }))
    .sort((a, b) => b.paiement.payeLe.toMillis() - a.paiement.payeLe.toMillis()),
)

const debutMois = (decalage = 0) => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() - decalage, 1)
}

const nbMois = computed(() => Number(periode.value))
const debutPeriode = computed(() => debutMois(nbMois.value - 1))
const debutPeriodePrecedente = computed(() => debutMois(nbMois.value * 2 - 1))

const total = (list: { paiement: PaiementDeclaration }[]) => list.reduce((s, p) => s + p.paiement.montant, 0)

const paiementsPeriode = computed(() =>
  paiements.value.filter((p) => p.paiement.payeLe.toDate() >= debutPeriode.value),
)
const recettesPeriode = computed(() => total(paiementsPeriode.value))
const recettesPrecedentes = computed(() =>
  total(
    paiements.value.filter((p) => {
      const d = p.paiement.payeLe.toDate()
      return d >= debutPeriodePrecedente.value && d < debutPeriode.value
    }),
  ),
)
const recettesTotales = computed(() => total(paiements.value))
const recettesMois = computed(() =>
  total(paiements.value.filter((p) => p.paiement.payeLe.toDate() >= debutMois(0))),
)

const tendance = computed(() => {
  if (recettesPrecedentes.value === 0) return recettesPeriode.value > 0 ? 100 : 0
  return ((recettesPeriode.value - recettesPrecedentes.value) / recettesPrecedentes.value) * 100
})
const libelleTendance = computed(() => {
  if (recettesPrecedentes.value === 0) return 'Pas de période précédente comparable'
  const signe = tendance.value >= 0 ? '+' : ''
  return `${signe}${tendance.value.toFixed(0)} % vs période précédente`
})

const moisCourant = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

const pointsMensuels = computed<Array<PointBarre & { nombre: number }>>(() =>
  Array.from({ length: nbMois.value }, (_, i) => {
    const debut = debutMois(nbMois.value - 1 - i)
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 1)
    const duMois = paiements.value.filter((p) => {
      const d = p.paiement.payeLe.toDate()
      return d >= debut && d < fin
    })
    return {
      label: debut.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      libelleLong: debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      valeur: total(duMois),
      nombre: duMois.length,
      detail: `${duMois.length} déclaration${duMois.length > 1 ? 's' : ''}`,
    }
  }),
)

const parMethode = computed(() => {
  const totalPeriode = recettesPeriode.value || 1
  return METHODES_PAIEMENT.map((m) => {
    const list = paiementsPeriode.value.filter((p) => p.paiement.methode === m.id)
    const montant = total(list)
    return { id: m.id, libelle: m.libelle, montant, nombre: list.length, part: (montant / totalPeriode) * 100 }
  })
    .filter((m) => m.nombre > 0)
    .sort((a, b) => b.montant - a.montant)
})

const compte = (statut: StatutObjet) => objets.value.filter((o) => o.statut === statut).length
const tauxRecuperation = computed(() =>
  objets.value.length ? Math.round((compte('recupere') / objets.value.length) * 100) : 0,
)
const primesVersees = computed(() =>
  objets.value.filter((o) => o.primeStatut === 'payee').reduce((s, o) => s + o.prime, 0),
)
const primesDues = computed(() =>
  objets.value.filter((o) => o.primeStatut === 'due').reduce((s, o) => s + o.prime, 0),
)

onMounted(async () => {
  stop = ecouterTousLesObjets(
    (list) => {
      objets.value = list
      loading.value = false
    },
    (error) => {
      erreur.value = error.message
      loading.value = false
    },
  )
  try {
    nbUtilisateurs.value = Math.max(0, (await compterUtilisateurs()) - 1)
  } catch {
    nbUtilisateurs.value = 0
  }
})

onUnmounted(() => stop?.())

async function enregistrerFrais() {
  if (!user.value) return
  const montant = Math.round(Number(nouveauFrais.value))
  if (!Number.isFinite(montant) || montant < 0 || montant > 1_000_000) {
    const t = await toastController.create({ message: 'Montant invalide.', duration: 2000, color: 'danger', position: 'top' })
    await t.present()
    return
  }
  sauvegarde.value = true
  try {
    await modifierProfil(user.value.uid, { fraisDeclaration: montant })
    const t = await toastController.create({
      message: `Droit de déclaration fixé à ${formatAriary(montant)}.`,
      duration: 2000,
      color: 'success',
      position: 'top',
    })
    await t.present()
  } catch (error) {
    const t = await toastController.create({ message: erreurMessage(error), duration: 2500, color: 'danger', position: 'top' })
    await t.present()
  } finally {
    sauvegarde.value = false
  }
}

async function handleLogout() {
  await logout()
  await router.replace('/login')
}
</script>

<style scoped>
.wide {
  max-width: 1040px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 16px;
  font-size: 16px;
  font-weight: 600;
}

.intro {
  gap: 12px;
  margin-bottom: 16px;
}

.flush {
  margin: 0;
}

.periode {
  width: auto;
  min-width: 240px;
}

@media (max-width: 520px) {
  .periode {
    width: 100%;
  }
}

.kpi.hero {
  border-color: rgba(var(--ion-color-primary-rgb), 0.3);
  background: #f5f8ff;
}

.kpi-hint.up {
  color: var(--ion-color-success);
}

.kpi-hint.down {
  color: var(--ion-color-danger);
}

.chart-panel {
  margin-top: 12px;
}

.panel-head {
  gap: 10px;
  margin-bottom: 16px;
}

.toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: var(--ion-color-light);
}

.toggle button {
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.toggle button.active {
  background: var(--surface);
  color: var(--text-strong);
  box-shadow: var(--shadow-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  padding: 10px 4px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

.table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.table td:first-child {
  text-transform: capitalize;
}

.two-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 12px;
  margin: 12px 0;
}

.two-cols .panel + .panel {
  margin-top: 0;
}

.ranks {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.rank-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.track {
  height: 8px;
  margin: 6px 0 4px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--ion-color-light);
}

.fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: #2f5bd3;
}

.figures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 12px;
  margin: 14px 0 0;
}

.figures dt {
  font-size: 12px;
  color: var(--text-muted);
}

.figures dd {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.frais-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

@media (max-width: 380px) {
  .frais-form {
    grid-template-columns: 1fr;
  }
}

.frais-form ion-input {
  --border-radius: 12px;
}

.transactions {
  margin: 0;
  padding: 0;
  list-style: none;
}

.transactions li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}

.transactions li:last-child {
  border-bottom: 0;
}

.min0 {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--text-soft);
}

.amount {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--ion-color-success);
  font-variant-numeric: tabular-nums;
}
</style>
