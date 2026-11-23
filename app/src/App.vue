<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  IonApp,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonLoading,
  IonPage,
  IonText
} from '@ionic/vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

interface UserProfile {
  id: string
  nom?: string
  prenom?: string
  adresse?: string
  email?: string
}

const users = ref<UserProfile[]>([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'))
    users.value = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    })) as UserProfile[]
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible de charger les utilisateurs.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <IonApp>
    <IonPage>
      <IonContent :fullscreen="true">
        <main class="app-shell">
          <h1>Utilisateurs</h1>

          <IonLoading :is-open="loading" message="Chargement des utilisateurs..." />

          <IonText v-if="errorMessage" color="danger">
            <p>{{ errorMessage }}</p>
          </IonText>

          <IonText v-else-if="!loading && users.length === 0">
            <p>Aucun utilisateur trouvé.</p>
          </IonText>

          <IonCard v-for="user in users" :key="user.id">
            <IonCardHeader>
              <IonCardTitle>
                {{ user.prenom || '' }} {{ user.nom || '' }}
              </IonCardTitle>
              <IonCardSubtitle>{{ user.email || 'Email non renseigné' }}</IonCardSubtitle>
            </IonCardHeader>

            <IonCardContent>
              <p><strong>ID :</strong> {{ user.id }}</p>
              <p><strong>Adresse :</strong> {{ user.adresse || 'Non renseignée' }}</p>
            </IonCardContent>
          </IonCard>
        </main>
      </IonContent>
    </IonPage>
  </IonApp>
</template>
