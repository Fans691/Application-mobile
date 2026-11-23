<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Accueil</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="handleLogout">Déconnexion</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true" class="ion-padding">
      <main class="app-shell">
        <h1>Connexion réussie</h1>
        <p>Compte : {{ userEmail }}</p>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { auth } from '@/services/firebase'
import { logout } from '@/services/auth.service'

const router = useRouter()
const userEmail = computed(() => auth.currentUser?.email || 'Utilisateur connecté')

async function handleLogout() {
  await logout()
  await router.replace('/login')
}
</script>
