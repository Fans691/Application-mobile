<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Profil</IonTitle>
        <IonButtons slot="end">
          <IonButton color="medium" @click="handleLogout">
            <IonIcon slot="start" :icon="logOutOutline" />
            Déconnexion
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div class="container">
        <section class="panel identite">
          <span class="avatar">{{ initiales(nomAffiche) || '?' }}</span>
          <div class="min0">
            <h2 class="break">{{ nomAffiche }}</h2>
            <p class="break">{{ user?.email }}</p>
            <p v-if="profile?.telephone">{{ profile.telephone }}</p>
          </div>
          <IonButton fill="clear" aria-label="Modifier le profil" @click="ouvrirEdition">
            <IonIcon slot="icon-only" :icon="createOutline" />
          </IonButton>
        </section>

        <div class="kpis stats trio">
          <div class="kpi">
            <span class="kpi-label">Déclarés</span>
            <span class="kpi-value">{{ mesObjets.length }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Récupérés</span>
            <span class="kpi-value">{{ mesRecuperes }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Rendus</span>
            <span class="kpi-value">{{ objetsRendus.length }}</span>
          </div>
        </div>

        <div class="kpis stats">
          <div class="kpi">
            <span class="kpi-label">Primes à recevoir</span>
            <span class="kpi-value">{{ formatAriary(primesARecevoir) }}</span>
            <span class="kpi-hint">Reçu : {{ formatAriary(primesRecues) }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Primes à verser</span>
            <span class="kpi-value">{{ formatAriary(primesAVerser) }}</span>
            <span class="kpi-hint">Versé : {{ formatAriary(primesVersees) }}</span>
          </div>
        </div>

        <IonSegment v-model="onglet" class="segment" :scrollable="false">
          <IonSegmentButton value="objets"><IonLabel>Annonces</IonLabel></IonSegmentButton>
          <IonSegmentButton value="primes"><IonLabel>Primes</IonLabel></IonSegmentButton>
          <IonSegmentButton value="trouves"><IonLabel>Trouvés</IonLabel></IonSegmentButton>
        </IonSegment>

        <template v-if="onglet === 'objets'">
          <EtatListe
            :loading="loading"
            :erreur="erreur"
            :vide="mesObjets.length === 0"
            titre="Aucune annonce"
            message="Vos objets déclarés perdus apparaîtront ici."
          >
            <IonButton router-link="/tabs/declarer" size="small">Déclarer une perte</IonButton>
          </EtatListe>
          <div class="grid-cards">
            <ObjetCard v-for="o in mesObjets" :key="o.id" :objet="o" />
          </div>
        </template>

        <template v-if="onglet === 'primes'">
          <EtatListe
            :vide="lignesPrimes.length === 0"
            :icon="walletOutline"
            titre="Aucune prime"
            message="Les primes à verser ou à recevoir apparaîtront ici."
          />
          <IonList v-if="lignesPrimes.length > 0" class="liste" lines="full">
            <IonItem
              v-for="l in lignesPrimes"
              :key="l.objet.id + l.sens"
              button
              :detail="false"
              :router-link="`/objets/${l.objet.id}`"
            >
              <span slot="start" class="sens" :class="l.sens">
                <IonIcon :icon="l.sens === 'recevoir' ? arrowDownOutline : arrowUpOutline" aria-hidden="true" />
              </span>
              <IonLabel>
                <h2>{{ l.objet.libelle }}</h2>
                <p>{{ l.sens === 'recevoir' ? `De ${l.objet.proprietaireNom}` : `À ${l.objet.trouveurNom}` }}</p>
              </IonLabel>
              <div slot="end" class="montant">
                <strong>{{ l.sens === 'recevoir' ? '+' : '−' }}{{ formatAriary(l.objet.prime) }}</strong>
                <span class="pill" :class="l.objet.primeStatut === 'payee' ? 'pill-recupere' : 'pill-trouve'">
                  {{ l.objet.primeStatut === 'payee' ? 'Réglée' : 'En attente' }}
                </span>
              </div>
            </IonItem>
          </IonList>
        </template>

        <template v-if="onglet === 'trouves'">
          <EtatListe
            :vide="objetsSignales.length === 0"
            :icon="handRightOutline"
            titre="Aucun signalement"
            message="Les objets que vous avez signalés comme trouvés apparaîtront ici."
          />
          <div class="grid-cards">
            <ObjetCard v-for="o in objetsSignales" :key="o.id" :objet="o" />
          </div>
        </template>
      </div>
    </IonContent>

    <IonModal :is-open="edition" @did-dismiss="edition = false">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Modifier le profil</IonTitle>
          <IonButtons slot="end">
            <IonButton @click="edition = false">Fermer</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form class="container narrow form-stack" novalidate @submit.prevent="enregistrer">
          <IonInput v-model="form.prenom" fill="outline" label="Prénom" label-placement="floating" />
          <IonInput v-model="form.nom" fill="outline" label="Nom" label-placement="floating" />
          <IonInput v-model="form.telephone" fill="outline" type="tel" inputmode="tel" label="Téléphone" label-placement="floating" />
          <IonInput v-model="form.adresse" fill="outline" label="Adresse" label-placement="floating" />
          <IonButton class="btn-main" expand="block" type="submit" :disabled="sauvegarde">
            <IonSpinner v-if="sauvegarde" name="crescent" />
            <span v-else>Enregistrer</span>
          </IonButton>
        </form>
      </IonContent>
    </IonModal>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import {
  arrowDownOutline,
  arrowUpOutline,
  createOutline,
  handRightOutline,
  logOutOutline,
  walletOutline,
} from 'ionicons/icons'
import ObjetCard from '@/components/ObjetCard.vue'
import EtatListe from '@/components/EtatListe.vue'
import { useSession } from '@/composables/useSession'
import { logout } from '@/services/auth.service'
import { ecouterMesObjets, ecouterMesSignalements, ecouterObjetsTrouves } from '@/services/objets.service'
import { modifierProfil, nomComplet } from '@/services/users.service'
import { formatAriary, initiales } from '@/utils/format'
import type { Objet } from '@/types/models'

const router = useRouter()
const { user, profile } = useSession()

const onglet = ref<'objets' | 'primes' | 'trouves'>('objets')
const mesObjets = ref<Objet[]>([])
const objetsRendus = ref<Objet[]>([])
const signales = ref<Objet[]>([])
const loading = ref(true)
const erreur = ref('')
const edition = ref(false)
const sauvegarde = ref(false)
const form = reactive({ prenom: '', nom: '', telephone: '', adresse: '' })
const arrets: Array<() => void> = []

const nomAffiche = computed(() =>
  nomComplet(profile.value ?? { nom: '', prenom: '', email: user.value?.email ?? '' }),
)

const somme = (list: Objet[]) => list.reduce((total, o) => total + o.prime, 0)
const mesRecuperes = computed(() => mesObjets.value.filter((o) => o.statut === 'recupere').length)
const primesARecevoir = computed(() => somme(objetsRendus.value.filter((o) => o.primeStatut === 'due')))
const primesRecues = computed(() => somme(objetsRendus.value.filter((o) => o.primeStatut === 'payee')))
const primesAVerser = computed(() => somme(mesObjets.value.filter((o) => o.primeStatut === 'due')))
const primesVersees = computed(() => somme(mesObjets.value.filter((o) => o.primeStatut === 'payee')))

const lignesPrimes = computed(() =>
  [
    ...objetsRendus.value.filter((o) => o.primeStatut !== 'aucune').map((objet) => ({ objet, sens: 'recevoir' as const })),
    ...mesObjets.value.filter((o) => o.primeStatut !== 'aucune').map((objet) => ({ objet, sens: 'verser' as const })),
  ].sort((a, b) => Number(a.objet.primeStatut === 'payee') - Number(b.objet.primeStatut === 'payee')),
)

const objetsSignales = computed(() => {
  const ids = new Set(signales.value.map((o) => o.id))
  return [...signales.value, ...objetsRendus.value.filter((o) => !ids.has(o.id))]
})

onMounted(() => {
  const uid = user.value?.uid
  if (!uid) return
  const onError = (error: Error) => {
    erreur.value = error.message
    loading.value = false
  }
  arrets.push(
    ecouterMesObjets(uid, (list) => {
      mesObjets.value = list
      loading.value = false
    }, onError),
    ecouterObjetsTrouves(uid, (list) => (objetsRendus.value = list), onError),
    ecouterMesSignalements(uid, (list) => (signales.value = list), onError),
  )
})

onUnmounted(() => arrets.forEach((arret) => arret()))

function ouvrirEdition() {
  form.prenom = profile.value?.prenom ?? ''
  form.nom = profile.value?.nom ?? ''
  form.telephone = profile.value?.telephone ?? ''
  form.adresse = profile.value?.adresse ?? ''
  edition.value = true
}

async function enregistrer() {
  if (!user.value) return
  sauvegarde.value = true
  try {
    await modifierProfil(user.value.uid, {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      adresse: form.adresse.trim(),
    })
    edition.value = false
    const t = await toastController.create({ message: 'Profil mis à jour.', duration: 2000, color: 'success', position: 'top' })
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
.identite {
  display: flex;
  align-items: center;
  gap: 14px;
}

.identite h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.identite p {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--text-muted);
}

.identite ion-button {
  margin-left: auto;
}

.min0 {
  min-width: 0;
}

.avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.stats {
  margin-top: 10px;
}

.segment {
  margin: 20px 0 14px;
}

.liste {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.liste ion-label h2 {
  font-size: 15px;
  font-weight: 600;
}

.sens {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-right: 12px;
  border-radius: 10px;
  font-size: 17px;
}

.sens.recevoir {
  background: #e6f4ea;
  color: var(--ion-color-success);
}

.sens.verser {
  background: #fdf1e3;
  color: var(--ion-color-warning);
}

.montant {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
