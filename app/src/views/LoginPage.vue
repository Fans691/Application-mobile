<template>
  <IonPage>
    <IonContent>
      <div class="auth">
        <header class="auth-header">
          <BrandMark :size="52" />
          <h1>Refind</h1>
          <p>Déclarez, retrouvez et récompensez.</p>
        </header>

        <section class="auth-card">
          <h2>Connexion</h2>
          <p class="muted small">Accédez à votre compte.</p>

          <form class="form-stack" novalidate @submit.prevent="handleLogin">
            <IonInput
              v-model="identifiant"
              fill="outline"
              label="E-mail"
              label-placement="floating"
              type="text"
              inputmode="email"
              autocomplete="username"
              autocapitalize="off"
              :spellcheck="false"
            />

            <IonInput
              v-model="password"
              fill="outline"
              label="Mot de passe"
              label-placement="floating"
              type="password"
              autocomplete="current-password"
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

            <IonButton class="btn-main" expand="block" type="submit" :disabled="loading">
              <IonSpinner v-if="loading" name="crescent" />
              <span v-else>Se connecter</span>
            </IonButton>
          </form>
        </section>

        <p class="auth-switch">
          Pas encore de compte ?
          <RouterLink to="/inscription">Créer un compte</RouterLink>
        </p>
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
  IonInputPasswordToggle,
  IonPage,
  IonSpinner,
} from '@ionic/vue'
import BrandMark from '@/components/BrandMark.vue'
import { login } from '@/services/auth.service'
import { lireRole } from '@/services/users.service'

const router = useRouter()

const identifiant = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const messages: Record<string, string> = {
  'auth/invalid-credential': 'Identifiant ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/user-disabled': 'Ce compte est désactivé.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Connexion internet indisponible.',
}

async function handleLogin() {
  errorMessage.value = ''

  if (!identifiant.value.trim() || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.'
    return
  }

  loading.value = true
  try {
    const user = await login(identifiant.value, password.value)
    const role = await lireRole(user.uid)
    await router.replace(role === 'admin' ? '/admin' : '/tabs/perdus')
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    errorMessage.value = messages[code] ?? 'Connexion impossible. Réessayez.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 420px;
  min-height: 100%;
  margin: 0 auto;
  padding: calc(32px + env(safe-area-inset-top, 0px)) 20px calc(32px + env(safe-area-inset-bottom, 0px));
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
  text-align: center;
}

.auth-header h1 {
  margin: 14px 0 4px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.auth-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 15px;
}

.auth-card {
  padding: 24px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.auth-card h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.auth-card > p {
  margin: 4px 0 20px;
}

.auth-switch {
  margin: 20px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}

.auth-switch a {
  color: var(--ion-color-primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
