<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tabs/perdus" text="" />
        </IonButtons>
        <IonTitle>{{ objet?.libelle ?? 'Annonce' }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <EtatListe
        :loading="loading"
        :erreur="erreur"
        :vide="!loading && !objet"
        :icon="trashOutline"
        titre="Annonce introuvable"
        message="Cette annonce a été supprimée."
      />

      <div v-if="objet" class="container detail">
        <ObjetVisuel
          class="hero"
          :image="objet.image"
          :categorie-id="objet.categorie"
          :alt="objet.libelle"
          ratio="4 / 3"
        />

        <div class="head">
          <div class="row wrap">
            <StatutPill :statut="objet.statut" />
            <span class="pill pill-neutral">{{ categorie.libelle }}</span>
          </div>
          <h1 class="page-title break">{{ objet.libelle }}</h1>
          <p class="muted small">Publié {{ formatRelatif(objet.createdAt).toLowerCase() }}</p>
        </div>

        <section class="panel prime" :class="{ 'accent-warning': objet.primeStatut === 'due' }">
          <div class="prime-main">
            <span class="kpi-label">Prime pour le trouveur</span>
            <span class="prime-montant">{{ objet.prime > 0 ? formatAriary(objet.prime) : 'Aucune' }}</span>
            <span v-if="objet.primeStatut !== 'aucune'" class="pill" :class="objet.primeStatut === 'payee' ? 'pill-recupere' : 'pill-trouve'">
              {{ PRIME_LABEL[objet.primeStatut] }}
            </span>
          </div>
          <IonButton
            v-if="estProprietaire && objet.statut !== 'recupere'"
            fill="outline"
            size="small"
            @click="ouvrirPrime"
          >
            {{ objet.prime > 0 ? 'Modifier' : 'Proposer' }}
          </IonButton>
        </section>

        <p v-if="objet.description" class="description">{{ objet.description }}</p>

        <dl class="infos">
          <div>
            <dt><IonIcon :icon="locationOutline" aria-hidden="true" />Lieu de perte</dt>
            <dd>{{ objet.lieuPerte || 'Non précisé' }}</dd>
          </div>
          <div v-if="objet.datePerte">
            <dt><IonIcon :icon="calendarOutline" aria-hidden="true" />Date de perte</dt>
            <dd>{{ formatDate(objet.datePerte) }}</dd>
          </div>
          <div>
            <dt><IonIcon :icon="personOutline" aria-hidden="true" />Propriétaire</dt>
            <dd>{{ estProprietaire ? 'Vous' : objet.proprietaireNom || 'Anonyme' }}</dd>
          </div>
          <div v-if="objet.dateRecuperation">
            <dt><IonIcon :icon="checkmarkCircleOutline" aria-hidden="true" />Récupéré le</dt>
            <dd>{{ formatDate(objet.dateRecuperation) }}</dd>
          </div>
        </dl>

        <ol class="steps" aria-label="Avancement">
          <li v-for="etape in etapes" :key="etape.label" :class="{ done: etape.faite }">
            <span class="step-dot"><IonIcon v-if="etape.faite" :icon="checkmark" /></span>
            <span class="step-label">{{ etape.label }}</span>
          </li>
        </ol>

        <!-- Propriétaire -->
        <template v-if="estProprietaire">
          <section v-if="objet.statut === 'trouve'" class="panel accent-warning">
            <h2 class="panel-title">Restitution en cours</h2>
            <p class="panel-text">
              {{ objet.trouveurNom }} a votre objet. Convenez d'un rendez-vous, puis confirmez la récupération.
            </p>
            <div class="actions">
              <IonButton v-if="objet.trouveurTelephone" :href="`tel:${objet.trouveurTelephone}`" fill="outline" expand="block">
                <IonIcon slot="start" :icon="callOutline" />
                {{ objet.trouveurTelephone }}
              </IonButton>
              <IonButton expand="block" color="success" :disabled="action" @click="executer('confirmer')">
                Confirmer la récupération
              </IonButton>
              <IonButton expand="block" fill="clear" color="medium" :disabled="action" @click="executer('annuler')">
                La personne ne s'est pas présentée
              </IonButton>
            </div>
          </section>

          <section v-if="objet.primeStatut === 'due'" class="panel accent-warning">
            <h2 class="panel-title">Prime à verser</h2>
            <p class="panel-text">
              Vous devez {{ formatAriary(objet.prime) }} à {{ objet.trouveurNom }}. Indiquez-le une fois le versement effectué.
            </p>
            <div class="actions">
              <IonButton v-if="objet.trouveurTelephone" :href="`tel:${objet.trouveurTelephone}`" fill="outline" expand="block">
                <IonIcon slot="start" :icon="callOutline" />
                {{ objet.trouveurTelephone }}
              </IonButton>
              <IonButton expand="block" :disabled="action" @click="executer('payer')">J'ai versé la prime</IonButton>
            </div>
          </section>

          <section v-if="objet.primeStatut === 'payee'" class="panel accent-success">
            <p class="panel-text flush">
              Prime de {{ formatAriary(objet.prime) }} versée à {{ objet.trouveurNom }} le {{ formatDate(objet.datePaiementPrime) }}.
            </p>
          </section>

          <h2 class="section-title">Signalements · {{ objet.signalements.length }}</h2>
          <p v-if="objet.signalements.length === 0" class="muted small">
            Personne n'a encore signalé cet objet. Vous recevrez une notification dès que ce sera le cas.
          </p>

          <article v-for="s in signalementsTries" :key="s.id" class="panel signalement">
            <header class="row between">
              <div class="row">
                <span class="avatar">{{ initiales(s.trouveurNom) }}</span>
                <div class="min0">
                  <strong class="break">{{ s.trouveurNom }}</strong>
                  <span class="muted small block">{{ formatRelatif(s.createdAt) }}</span>
                </div>
              </div>
              <span class="pill" :class="SIG_CLASS[s.statut]">{{ SIG_LABEL[s.statut] }}</span>
            </header>
            <dl class="sig-infos">
              <div v-if="s.lieuTrouve"><dt>Trouvé à</dt><dd>{{ s.lieuTrouve }}</dd></div>
              <div v-if="s.message"><dt>Message</dt><dd>{{ s.message }}</dd></div>
              <div v-if="s.telephone"><dt>Téléphone</dt><dd><a :href="`tel:${s.telephone}`">{{ s.telephone }}</a></dd></div>
              <div><dt>E-mail</dt><dd class="break">{{ s.trouveurEmail }}</dd></div>
            </dl>
            <div v-if="s.statut === 'en_attente' && objet.statut === 'perdu'" class="sig-actions">
              <IonButton fill="outline" color="medium" :disabled="action" @click="executer('refuser', s.id)">Refuser</IonButton>
              <IonButton :disabled="action" @click="executer('accepter', s.id)">Accepter</IonButton>
            </div>
          </article>

          <div v-if="objet.statut !== 'recupere'" class="danger-zone">
            <IonButton expand="block" fill="outline" color="medium" :disabled="action" @click="executer('seul')">
              Je l'ai retrouvé moi-même
            </IonButton>
            <IonButton v-if="objet.statut === 'perdu'" expand="block" fill="clear" color="danger" :disabled="action" @click="executer('supprimer')">
              Supprimer l'annonce
            </IonButton>
          </div>
        </template>

        <!-- Visiteur ou trouveur -->
        <template v-else>
          <section v-if="estTrouveur && objet.statut === 'trouve'" class="panel accent-success">
            <h2 class="panel-title">Votre signalement a été retenu</h2>
            <p class="panel-text">Contactez {{ objet.proprietaireNom }} pour lui remettre l'objet.</p>
            <div class="actions">
              <IonButton v-if="objet.proprietaireTelephone" :href="`tel:${objet.proprietaireTelephone}`" expand="block">
                <IonIcon slot="start" :icon="callOutline" />
                {{ objet.proprietaireTelephone }}
              </IonButton>
              <IonButton :href="`mailto:${objet.proprietaireEmail}`" expand="block" fill="outline">
                <IonIcon slot="start" :icon="mailOutline" />
                Envoyer un e-mail
              </IonButton>
            </div>
          </section>

          <section v-if="estTrouveur && objet.primeStatut === 'due'" class="panel accent-warning">
            <h2 class="panel-title">Prime à recevoir</h2>
            <p class="panel-text">{{ objet.proprietaireNom }} vous doit {{ formatAriary(objet.prime) }}.</p>
            <IonButton v-if="objet.proprietaireTelephone" :href="`tel:${objet.proprietaireTelephone}`" fill="outline" expand="block">
              <IonIcon slot="start" :icon="callOutline" />
              Contacter le propriétaire
            </IonButton>
          </section>

          <section v-if="estTrouveur && objet.primeStatut === 'payee'" class="panel accent-success">
            <p class="panel-text flush">
              Prime de {{ formatAriary(objet.prime) }} reçue le {{ formatDate(objet.datePaiementPrime) }}.
            </p>
          </section>

          <section v-if="monSignalement && !estTrouveur" class="panel">
            <div class="row between">
              <h2 class="panel-title">Votre signalement</h2>
              <span class="pill" :class="SIG_CLASS[monSignalement.statut]">{{ SIG_LABEL[monSignalement.statut] }}</span>
            </div>
            <p class="panel-text flush">
              Envoyé {{ formatRelatif(monSignalement.createdAt).toLowerCase() }}.
              <template v-if="monSignalement.statut === 'en_attente'">Le propriétaire a été prévenu.</template>
            </p>
          </section>
        </template>
      </div>
    </IonContent>

    <IonFooter v-if="objet && peutSignaler" class="footer">
      <div class="container footer-inner">
        <IonButton class="btn-main" expand="block" :disabled="action" @click="ouvrirSignalement">
          J'ai trouvé cet objet
        </IonButton>
      </div>
    </IonFooter>

    <!-- Signalement -->
    <IonModal :is-open="modalSignalement" @did-dismiss="modalSignalement = false">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Signaler une trouvaille</IonTitle>
          <IonButtons slot="end">
            <IonButton @click="modalSignalement = false">Fermer</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form class="container narrow form-stack" novalidate @submit.prevent="envoyerSignalement">
          <p class="muted small flush">
            Le propriétaire recevra vos informations et pourra accepter votre signalement.
          </p>
          <IonInput v-model="sig.telephone" fill="outline" type="tel" inputmode="tel" label="Votre téléphone" label-placement="floating" />
          <IonInput v-model="sig.lieuTrouve" fill="outline" label="Où l'avez-vous trouvé ?" label-placement="floating" />
          <IonTextarea
            v-model="sig.message"
            fill="outline"
            label="Détails"
            label-placement="floating"
            placeholder="Un détail qui prouve qu'il s'agit du bon objet"
            :rows="3"
            :auto-grow="true"
            :maxlength="400"
          />
          <p v-if="erreurModal" class="form-error">{{ erreurModal }}</p>
          <IonButton class="btn-main" expand="block" type="submit" :disabled="action">
            <IonSpinner v-if="action" name="crescent" />
            <span v-else>Envoyer au propriétaire</span>
          </IonButton>
        </form>
      </IonContent>
    </IonModal>

    <!-- Prime -->
    <IonModal :is-open="modalPrime" @did-dismiss="modalPrime = false">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Prime pour le trouveur</IonTitle>
          <IonButtons slot="end">
            <IonButton @click="modalPrime = false">Fermer</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form class="container narrow form-stack" novalidate @submit.prevent="enregistrerPrime">
          <p class="muted small flush">
            Montant versé à la personne qui vous rend l'objet. Vous pouvez le modifier jusqu'à la récupération.
          </p>
          <IonInput
            v-model="nouvellePrime"
            fill="outline"
            type="number"
            inputmode="numeric"
            min="0"
            step="1000"
            label="Montant (Ar)"
            label-placement="floating"
          />
          <div class="row wrap">
            <button
              v-for="m in [5000, 10000, 20000, 50000]"
              :key="m"
              type="button"
              class="filter-chip"
              :class="{ active: Number(nouvellePrime) === m }"
              @click="nouvellePrime = String(m)"
            >
              {{ formatAriary(m) }}
            </button>
          </div>
          <p v-if="erreurModal" class="form-error">{{ erreurModal }}</p>
          <IonButton class="btn-main" expand="block" type="submit" :disabled="action">
            <IonSpinner v-if="action" name="crescent" />
            <span v-else>Enregistrer</span>
          </IonButton>
          <IonButton v-if="objet && objet.prime > 0" expand="block" fill="clear" color="danger" :disabled="action" @click="retirerPrime">
            Retirer la prime
          </IonButton>
        </form>
      </IonContent>
    </IonModal>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  alertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import {
  calendarOutline,
  callOutline,
  checkmark,
  checkmarkCircleOutline,
  locationOutline,
  mailOutline,
  personOutline,
  trashOutline,
} from 'ionicons/icons'
import EtatListe from '@/components/EtatListe.vue'
import ObjetVisuel from '@/components/ObjetVisuel.vue'
import StatutPill from '@/components/StatutPill.vue'
import { getCategorie } from '@/constants/categories'
import { useSession } from '@/composables/useSession'
import {
  accepterSignalement,
  annulerRestitution,
  confirmerRecuperation,
  ecouterObjet,
  marquerRetrouveSeul,
  modifierPrime,
  payerPrime,
  refuserSignalement,
  signalerTrouve,
  supprimerObjet,
} from '@/services/objets.service'
import {
  erreurMessage,
  formatAriary,
  formatDate,
  formatRelatif,
  initiales,
  PRIME_LABEL,
} from '@/utils/format'
import type { Objet, StatutSignalement } from '@/types/models'

const SIG_LABEL: Record<StatutSignalement, string> = {
  en_attente: 'En attente',
  accepte: 'Accepté',
  refuse: 'Refusé',
}
const SIG_CLASS: Record<StatutSignalement, string> = {
  en_attente: 'pill-trouve',
  accepte: 'pill-recupere',
  refuse: 'pill-neutral',
}

const route = useRoute()
const router = useRouter()
const { user, profile, acteur } = useSession()

const objet = ref<Objet | null>(null)
const loading = ref(true)
const erreur = ref('')
const action = ref(false)
const modalSignalement = ref(false)
const modalPrime = ref(false)
const erreurModal = ref('')
const nouvellePrime = ref('')
const sig = reactive({ telephone: '', lieuTrouve: '', message: '' })
let stop: (() => void) | undefined

const categorie = computed(() => getCategorie(objet.value?.categorie))
const estProprietaire = computed(() => !!user.value && objet.value?.userId?.id === user.value.uid)
const estTrouveur = computed(() => !!user.value && objet.value?.trouveurId?.id === user.value.uid)
const monSignalement = computed(() =>
  [...(objet.value?.signalements ?? [])].reverse().find((s) => s.trouveurId?.id === user.value?.uid),
)
const peutSignaler = computed(
  () => objet.value?.statut === 'perdu' && !estProprietaire.value && monSignalement.value?.statut !== 'en_attente',
)
const signalementsTries = computed(() => {
  const ordre: Record<StatutSignalement, number> = { accepte: 0, en_attente: 1, refuse: 2 }
  return [...(objet.value?.signalements ?? [])].sort(
    (a, b) => ordre[a.statut] - ordre[b.statut] || b.createdAt.toMillis() - a.createdAt.toMillis(),
  )
})

const etapes = computed(() => {
  const o = objet.value
  const statut = o?.statut ?? 'perdu'
  const list = [
    { label: 'Déclaré', faite: true },
    { label: 'Trouvé', faite: statut !== 'perdu' },
    { label: 'Récupéré', faite: statut === 'recupere' },
  ]
  if ((o?.prime ?? 0) > 0) list.push({ label: 'Prime versée', faite: o?.primeStatut === 'payee' })
  return list
})

onMounted(() => {
  stop = ecouterObjet(
    String(route.params.id),
    (o) => {
      objet.value = o
      loading.value = false
    },
    (error) => {
      erreur.value = error.message
      loading.value = false
    },
  )
})
onUnmounted(() => stop?.())

async function toast(message: string, color = 'dark') {
  const t = await toastController.create({ message, duration: 2500, color, position: 'top' })
  await t.present()
}

async function confirmer(header: string, message: string, bouton: string) {
  const alert = await alertController.create({
    header,
    message,
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: bouton, role: 'confirm' },
    ],
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  return role === 'confirm'
}

type Action = 'accepter' | 'refuser' | 'confirmer' | 'annuler' | 'seul' | 'payer' | 'supprimer'

async function executer(type: Action, signalementId = '') {
  const o = objet.value
  const moi = acteur.value
  if (!o || !moi) return

  const textes: Record<Action, [string, string, string, string]> = {
    accepter: ['Accepter ce signalement ?', 'Les autres signalements en attente seront refusés et le trouveur recevra vos coordonnées.', 'Accepter', 'Signalement accepté.'],
    refuser: ['Refuser ce signalement ?', 'La personne sera prévenue.', 'Refuser', 'Signalement refusé.'],
    confirmer: ['Confirmer la récupération ?', o.prime > 0 ? `Une prime de ${formatAriary(o.prime)} sera due à ${o.trouveurNom}.` : "L'annonce passera dans les objets récupérés.", 'Confirmer', 'Récupération confirmée.'],
    annuler: ['Annuler la restitution ?', "L'objet redeviendra visible comme perdu.", 'Annuler la restitution', 'Restitution annulée.'],
    seul: ['Objet retrouvé ?', "L'annonce sera clôturée sans prime.", 'Clôturer', 'Annonce clôturée.'],
    payer: ['Prime versée ?', `Confirmez avoir versé ${formatAriary(o.prime)} à ${o.trouveurNom}.`, 'Confirmer', 'Prime marquée comme versée.'],
    supprimer: ["Supprimer l'annonce ?", 'Cette action est définitive. Le droit de déclaration ne sera pas remboursé.', 'Supprimer', 'Annonce supprimée.'],
  }
  const [header, message, bouton, succes] = textes[type]
  if (!(await confirmer(header, message, bouton))) return

  action.value = true
  try {
    switch (type) {
      case 'accepter':
        await accepterSignalement(o.id, signalementId, moi)
        break
      case 'refuser':
        await refuserSignalement(o.id, signalementId, moi)
        break
      case 'confirmer':
        await confirmerRecuperation(o.id, moi)
        break
      case 'annuler':
        await annulerRestitution(o.id, moi)
        break
      case 'seul':
        await marquerRetrouveSeul(o.id, moi)
        break
      case 'payer':
        await payerPrime(o.id, moi)
        break
      case 'supprimer':
        stop?.()
        await supprimerObjet(o.id)
        await router.replace('/tabs/profil')
        break
    }
    await toast(succes, 'success')
  } catch (error) {
    await toast(erreurMessage(error), 'danger')
  } finally {
    action.value = false
  }
}

function ouvrirSignalement() {
  erreurModal.value = ''
  sig.telephone = profile.value?.telephone ?? ''
  sig.lieuTrouve = ''
  sig.message = ''
  modalSignalement.value = true
}

async function envoyerSignalement() {
  const o = objet.value
  const moi = acteur.value
  if (!o || !moi) return
  erreurModal.value = ''
  if (!sig.telephone.trim() || !sig.lieuTrouve.trim()) {
    erreurModal.value = 'Le téléphone et le lieu sont obligatoires.'
    return
  }
  action.value = true
  try {
    await signalerTrouve(o.id, { ...sig }, moi)
    modalSignalement.value = false
    await toast('Signalement envoyé au propriétaire.', 'success')
  } catch (error) {
    erreurModal.value = erreurMessage(error)
  } finally {
    action.value = false
  }
}

function ouvrirPrime() {
  erreurModal.value = ''
  nouvellePrime.value = objet.value?.prime ? String(objet.value.prime) : ''
  modalPrime.value = true
}

async function sauverPrime(montant: number) {
  const o = objet.value
  const moi = acteur.value
  if (!o || !moi) return
  action.value = true
  try {
    await modifierPrime(o.id, montant, moi)
    modalPrime.value = false
    await toast(montant > 0 ? `Prime fixée à ${formatAriary(montant)}.` : 'Prime retirée.', 'success')
  } catch (error) {
    erreurModal.value = erreurMessage(error)
  } finally {
    action.value = false
  }
}

function enregistrerPrime() {
  erreurModal.value = ''
  const montant = Number(nouvellePrime.value)
  if (!Number.isFinite(montant) || montant < 0) {
    erreurModal.value = 'Montant invalide.'
    return
  }
  if (montant > 10_000_000) {
    erreurModal.value = 'Le montant maximum est de 10 000 000 Ar.'
    return
  }
  sauverPrime(montant)
}

function retirerPrime() {
  sauverPrime(0)
}
</script>

<style scoped>
.detail {
  padding-top: 0;
}

.hero {
  max-height: 380px;
  margin: 0 -16px;
  width: calc(100% + 32px);
}

@media (min-width: 760px) {
  .hero {
    margin: 16px 0 0;
    width: 100%;
    border-radius: var(--radius-lg);
  }
}

.head {
  margin: 16px 0 14px;
}

.head .page-title {
  margin-top: 10px;
}

.head p {
  margin: 0;
}

.prime {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.prime-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.prime-montant {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.description {
  margin: 16px 0;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.infos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 1px;
  margin: 16px 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--line);
}

.infos > div {
  padding: 12px 14px;
  background: var(--surface);
}

.infos dt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.infos dd {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.steps {
  display: flex;
  margin: 20px 0;
  padding: 0;
  list-style: none;
}

.steps li {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
  text-align: center;
}

.steps li + li::before {
  content: '';
  position: absolute;
  top: 11px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: var(--line);
}

.steps li.done + li.done::before {
  background: var(--ion-color-success);
}

.step-dot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--surface);
  color: #fff;
  font-size: 14px;
}

.done .step-dot {
  border-color: var(--ion-color-success);
  background: var(--ion-color-success);
}

.step-label {
  font-size: 12px;
  color: var(--text-muted);
}

.done .step-label {
  color: var(--text-strong);
  font-weight: 600;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions ion-button {
  margin: 0;
}

.flush {
  margin: 0;
}

.signalement + .signalement {
  margin-top: 10px;
}

.avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  color: var(--ion-color-primary-shade);
  font-size: 13px;
  font-weight: 700;
}

.min0 {
  min-width: 0;
}

.block {
  display: block;
}

.sig-infos {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
}

.sig-infos div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  font-size: 14px;
}

.sig-infos dt {
  color: var(--text-muted);
}

.sig-infos dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.sig-infos a {
  color: var(--ion-color-primary);
}

.sig-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 14px;
}

.sig-actions ion-button {
  margin: 0;
}

.danger-zone {
  margin-top: 24px;
}

.footer {
  border-top: 1px solid var(--line);
  background: var(--surface);
  box-shadow: none;
}

.footer-inner {
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
}
</style>
