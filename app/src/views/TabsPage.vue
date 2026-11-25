<template>
  <IonPage>
    <IonTabs>
      <IonRouterOutlet />
      <IonTabBar slot="bottom">
        <IonTabButton tab="perdus" href="/tabs/perdus">
          <IonIcon :icon="searchOutline" aria-hidden="true" />
          <IonLabel>Perdus</IonLabel>
        </IonTabButton>

        <IonTabButton tab="recuperes" href="/tabs/recuperes">
          <IonIcon :icon="checkmarkCircleOutline" aria-hidden="true" />
          <IonLabel>Récupérés</IonLabel>
        </IonTabButton>

        <IonTabButton tab="declarer" href="/tabs/declarer">
          <IonIcon :icon="addCircleOutline" aria-hidden="true" />
          <IonLabel>Déclarer</IonLabel>
        </IonTabButton>

        <IonTabButton tab="notifications" href="/tabs/notifications">
          <IonIcon :icon="notificationsOutline" aria-hidden="true" />
          <IonLabel>Alertes</IonLabel>
          <IonBadge v-if="nonLues > 0" color="danger">{{ nonLues > 99 ? '99+' : nonLues }}</IonBadge>
        </IonTabButton>

        <IonTabButton tab="profil" href="/tabs/profil">
          <IonIcon :icon="personOutline" aria-hidden="true" />
          <IonLabel>Profil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  addCircleOutline,
  checkmarkCircleOutline,
  notificationsOutline,
  personOutline,
  searchOutline,
} from 'ionicons/icons'
import { useSession } from '@/composables/useSession'

const { nonLues } = useSession()
</script>
