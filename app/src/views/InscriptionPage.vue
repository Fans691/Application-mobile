<template>
  <IonPage>
    <IonContent class="ion-padding">
      <div class="login-container">
        <div class="logo">
          <h1>Refind</h1>
        </div>

        <div class="form-container">
          <h2>Créer un compte</h2>
          <p class="subtitle">Inscrivez-vous pour commencer.</p>

          <form @submit.prevent="handleRegister">
            <IonItem>
              <IonInput
                v-model="email"
                type="email"
                label="Adresse e-mail"
                label-placement="floating"
                placeholder="exemple@gmail.com"
                required
              />
            </IonItem>

            <IonItem>
              <IonInput
                v-model="password"
                type="password"
                label="Mot de passe"
                label-placement="floating"
                required
              />
            </IonItem>

            <IonItem>
              <IonInput
                v-model="confirmPassword"
                type="password"
                label="Confirmer le mot de passe"
                label-placement="floating"
                required
              />
            </IonItem>

            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

            <IonButton expand="block" type="submit" :disabled="loading">
              {{ loading ? 'Création...' : "S'inscrire" }}
            </IonButton>
          </form>

          <RouterLink to="/login">Déjà un compte ? Se connecter</RouterLink>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonPage
} from '@ionic/vue'
import { register } from '@/services/auth.service'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleRegister() {
  errorMessage.value = ''

  if (!email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  loading.value = true

  try {
    await register(email.value, password.value)
    await router.replace('/home')
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : ''

    if (code === 'auth/email-already-in-use') {
      errorMessage.value = 'Cette adresse email est déjà utilisée.'
    } else if (code === 'auth/invalid-email') {
      errorMessage.value = 'Adresse email invalide.'
    } else if (code === 'auth/weak-password') {
      errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères.'
    } else {
      errorMessage.value = "Impossible de créer le compte. Réessayez."
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 420px;
  margin: 70px auto;
}

.logo {
  text-align: center;
  margin-bottom: 60px;
}

.logo h1 {
  font-size: 38px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.form-container h2 {
  font-size: 26px;
  font-weight: 700;
}

.subtitle {
  color: var(--ion-color-medium);
  margin-bottom: 30px;
}

ion-item {
  margin-bottom: 15px;
  --border-radius: 10px;
}

ion-button {
  margin-top: 30px;
  height: 48px;
  --border-radius: 10px;
  font-weight: 600;
}

.error {
  color: var(--ion-color-danger);
  font-size: 14px;
}
</style>
