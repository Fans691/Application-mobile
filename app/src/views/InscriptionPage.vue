<template>
  <IonPage>
    <IonContent>
      <div class="auth">
        <header class="auth-header">
          <BrandMark :size="44" />
          <h1>Créer un compte</h1>
          <p>Quelques informations pour vous contacter si l'on retrouve vos objets.</p>
        </header>

        <section class="auth-card">
          <form class="form-stack" novalidate @submit.prevent="handleRegister">
            <div class="two-cols">
              <IonInput v-model="prenom" fill="outline" label="Prénom" label-placement="floating" autocomplete="given-name" />
              <IonInput v-model="nom" fill="outline" label="Nom" label-placement="floating" autocomplete="family-name" />
            </div>

            <IonInput
              v-model="telephone"
              fill="outline"
              label="Téléphone"
              label-placement="floating"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              helper-text="Visible uniquement par la personne qui vous rend un objet."
            />

            <IonInput
              v-model="email"
              fill="outline"
              label="Adresse e-mail"
              label-placement="floating"
              type="email"
              inputmode="email"
              autocomplete="email"
              autocapitalize="off"
            />

            <IonInput
              v-model="password"
              fill="outline"
              label="Mot de passe"
              label-placement="floating"
              type="password"
              autocomplete="new-password"
              helper-text="6 caractères minimum."
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <IonInput
              v-model="confirmPassword"
              fill="outline"
              label="Confirmer le mot de passe"
              label-placement="floating"
              type="password"
              autocomplete="new-password"
            />

            <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

            <IonButton class="btn-main" expand="block" type="submit" :disabled="loading">
              <IonSpinner v-if="loading" name="crescent" />
              <span v-else>Créer mon compte</span>
            </IonButton>
          </form>
        </section>

        <p class="auth-switch">
          Déjà inscrit ?
          <RouterLink to="/login">Se connecter</RouterLink>
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
import { register } from '@/services/auth.service'

const router = useRouter()
const nom = ref('')
const prenom = ref('')
const telephone = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

const messages: Record<string, string> = {
  'auth/email-already-in-use': 'Cette adresse e-mail est déjà utilisée.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/network-request-failed': 'Connexion internet indisponible.',
}

async function handleRegister() {
  errorMessage.value = ''

  if (!nom.value.trim() || !prenom.value.trim() || !email.value.trim() || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  loading.value = true
  try {
    await register(email.value, password.value, {
      nom: nom.value,
      prenom: prenom.value,
      telephone: telephone.value,
    })
    await router.replace('/tabs/perdus')
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    errorMessage.value = messages[code] ?? 'Impossible de créer le compte. Réessayez.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  padding: calc(28px + env(safe-area-inset-top, 0px)) 20px calc(28px + env(safe-area-inset-bottom, 0px));
}

.auth-header {
  margin-bottom: 20px;
}

.auth-header h1 {
  margin: 16px 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.auth-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.auth-card {
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 359px) {
  .two-cols {
    grid-template-columns: 1fr;
  }
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
