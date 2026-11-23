<template>
  <ion-page>
    <ion-content class="ion-padding">

      <div class="login-container">

        <div class="logo">
          <h1>Refind</h1>
          <p>Retrouvez ce qui compte.</p>
        </div>

        <div class="form-container">

          <h2>Bienvenue !</h2>
          <p class="subtitle">
            Connectez-vous à votre compte.
          </p>

          <form @submit.prevent="handleLogin">

            <ion-item>
              <ion-input
                v-model="email"
                type="email"
                label="Adresse e-mail"
                label-placement="floating"
                placeholder="exemple@gmail.com"
                required/>
            </ion-item>

            <ion-item>
              <ion-input
                v-model="password"
                type="password"
                label="Mot de passe"
                label-placement="floating"
                required
              />
            </ion-item>

            <p v-if="errorMessage" class="error">
              {{ errorMessage }}
            </p>

            <ion-button
              expand="block"
              type="submit"
              :disabled="loading"
            >
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </ion-button>

          </form>

        </div>

      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  IonPage,
  IonContent,
  IonItem,
  IonInput,
  IonButton
} from '@ionic/vue';

import { login } from '../services/auth.service';

const router = useRouter();

const email = ref('');
const password = ref('');

const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {

  errorMessage.value = '';

  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.';
    return;
  }

  loading.value = true;

  try {

    const user = await login(
      email.value,
      password.value
    );

    console.log('Connexion réussie !');
    console.log('UID :', user.uid);
    console.log('Email :', user.email);

    await router.push('/home');

  } catch (error: any) {

    console.error('Erreur Firebase :', error);

    switch (error.code) {

      case 'auth/invalid-credential':
        errorMessage.value = 'Email ou mot de passe incorrect.';
        break;

      case 'auth/invalid-email':
        errorMessage.value = 'Adresse email invalide.';
        break;

      case 'auth/user-disabled':
        errorMessage.value = 'Ce compte est désactivé.';
        break;

      case 'auth/too-many-requests':
        errorMessage.value = 'Trop de tentatives. Réessayez plus tard.';
        break;

      default:
        errorMessage.value = 'Impossible de se connecter. Réessayez.';
    }

  } finally {

    loading.value = false;

  }
};

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

.logo p {
  color: var(--ion-color-medium);
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