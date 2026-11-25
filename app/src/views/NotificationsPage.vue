<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Notifications</IonTitle>
        <IonButtons slot="end">
          <IonButton v-if="nonLues > 0" @click="toutLire">Tout lire</IonButton>
          <IonButton v-if="notifications.length > 0" color="medium" aria-label="Tout effacer" @click="vider">
            <IonIcon slot="icon-only" :icon="trashOutline" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div class="container">
        <div v-if="permission === 'default'" class="panel accent permission">
          <div class="min0">
            <p class="panel-title">Recevoir les alertes</p>
            <p class="panel-text flush">Soyez prévenu même lorsque l'application est en arrière-plan.</p>
          </div>
          <IonButton size="small" @click="activer">Activer</IonButton>
        </div>

        <EtatListe
          :vide="notifications.length === 0"
          :icon="notificationsOutline"
          titre="Aucune notification"
          message="Vous serez prévenu ici lorsqu'un objet est signalé ou qu'une prime vous est due."
        />

        <IonList v-if="notifications.length > 0" class="liste" lines="full">
          <IonItemSliding v-for="n in notifications" :key="n.id">
            <IonItem button :detail="false" :class="{ unread: !n.lu }" @click="ouvrir(n)">
              <span slot="start" class="ico" :class="STYLE[n.type]?.ton">
                <IonIcon :icon="STYLE[n.type]?.icon ?? notificationsOutline" aria-hidden="true" />
              </span>
              <IonLabel class="ion-text-wrap">
                <div class="row between top">
                  <h2>{{ n.titre }}</h2>
                  <span class="time">{{ formatRelatif(n.createdAt) }}</span>
                </div>
                <p>{{ n.message }}</p>
              </IonLabel>
            </IonItem>
            <IonItemOptions side="end">
              <IonItemOption color="danger" @click="supprimer(n.id)">Supprimer</IonItemOption>
            </IonItemOptions>
          </IonItemSliding>
        </IonList>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import {
  arrowUndoOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  handRightOutline,
  notificationsOutline,
  pricetagOutline,
  trashOutline,
  walletOutline,
} from 'ionicons/icons'
import EtatListe from '@/components/EtatListe.vue'
import { demanderPermissionNotifications, useSession } from '@/composables/useSession'
import { marquerLue, marquerToutesLues, supprimerNotification, viderNotifications } from '@/services/users.service'
import { formatRelatif } from '@/utils/format'
import type { Notification, TypeNotification } from '@/types/models'

const STYLE: Record<TypeNotification, { icon: string; ton: string }> = {
  signalement: { icon: handRightOutline, ton: 'primary' },
  signalement_accepte: { icon: checkmarkCircleOutline, ton: 'success' },
  signalement_refuse: { icon: closeCircleOutline, ton: 'neutral' },
  objet_recupere: { icon: checkmarkCircleOutline, ton: 'success' },
  prime_due: { icon: walletOutline, ton: 'warning' },
  prime_payee: { icon: cashOutline, ton: 'success' },
  prime_modifiee: { icon: pricetagOutline, ton: 'primary' },
  restitution_annulee: { icon: arrowUndoOutline, ton: 'neutral' },
}

const router = useRouter()
const { user, notifications, nonLues } = useSession()
const permission = ref<string>('Notification' in window ? window.Notification.permission : 'unsupported')

async function activer() {
  permission.value = await demanderPermissionNotifications()
}

async function ouvrir(n: Notification) {
  if (!user.value) return
  if (!n.lu) marquerLue(user.value.uid, n.id).catch(console.error)
  if (n.objetId) await router.push(`/objets/${n.objetId}`)
}

function toutLire() {
  if (user.value) marquerToutesLues(user.value.uid).catch(console.error)
}

function supprimer(id: string) {
  if (user.value) supprimerNotification(user.value.uid, id).catch(console.error)
}

function vider() {
  if (user.value) viderNotifications(user.value.uid).catch(console.error)
}
</script>

<style scoped>
.permission {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.min0 {
  flex: 1;
  min-width: 0;
}

.flush {
  margin: 0;
}

.liste {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

ion-item {
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --padding-top: 6px;
  --padding-bottom: 6px;
}

ion-item.unread {
  --background: #f5f8ff;
}

.ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-right: 12px;
  border-radius: 12px;
  font-size: 19px;
}

.ico.primary {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  color: var(--ion-color-primary);
}

.ico.success {
  background: #e6f4ea;
  color: var(--ion-color-success);
}

.ico.warning {
  background: #fdf1e3;
  color: var(--ion-color-warning);
}

.ico.neutral {
  background: var(--ion-color-light);
  color: var(--text-muted);
}

.top {
  align-items: baseline;
}

ion-label h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-strong);
}

.unread ion-label h2::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-left: 6px;
  vertical-align: middle;
  border-radius: 50%;
  background: var(--ion-color-primary);
}

ion-label p {
  margin-top: 2px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--text-muted);
}

.time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-soft);
}
</style>
