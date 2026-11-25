<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Déclarer une perte</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <form id="form-declaration" class="container" novalidate @submit.prevent="continuer">
        <h3 class="section-title first">Photo</h3>
        <button type="button" class="photo" :class="{ vide: !image }" @click="choisirImage">
          <img v-if="image" :src="image" alt="Aperçu de la photo" />
          <span v-else class="photo-vide">
            <IonIcon :icon="cameraOutline" aria-hidden="true" />
            <strong>Ajouter une photo</strong>
            <span>Appareil photo ou galerie, JPG ou PNG</span>
          </span>
          <IonSpinner v-if="traitementImage" class="photo-spinner" name="crescent" />
        </button>
        <div v-if="image" class="photo-actions">
          <IonButton fill="clear" size="small" @click="choisirImage">Remplacer</IonButton>
          <IonButton fill="clear" size="small" color="danger" @click="image = ''">Retirer</IonButton>
        </div>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onFichier" />

        <h3 class="section-title">Informations</h3>
        <div class="form-stack">
          <IonInput
            v-model="form.libelle"
            fill="outline"
            label="Nom de l'objet"
            label-placement="floating"
            placeholder="Ex : iPhone 13 noir"
            :maxlength="80"
            :counter="true"
          />

          <IonSelect
            v-model="form.categorie"
            fill="outline"
            label="Catégorie"
            label-placement="floating"
            interface="action-sheet"
            cancel-text="Annuler"
          >
            <IonSelectOption v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.libelle }}</IonSelectOption>
          </IonSelect>

          <IonTextarea
            v-model="form.description"
            fill="outline"
            label="Description"
            label-placement="floating"
            placeholder="Couleur, marque, signes distinctifs"
            :auto-grow="true"
            :rows="3"
            :maxlength="500"
            :counter="true"
          />

          <IonInput
            v-model="form.lieuPerte"
            fill="outline"
            label="Lieu de perte"
            label-placement="floating"
            placeholder="Ex : Analakely, taxi-be ligne 194"
          />

          <IonInput
            v-model="form.datePerte"
            fill="outline"
            type="date"
            label="Date de perte"
            label-placement="stacked"
            :max="aujourdhui"
          />
        </div>

        <div class="panel accent frais">
          <div class="row between">
            <span class="panel-title">Droit de déclaration</span>
            <strong class="frais-montant">{{ frais > 0 ? formatAriary(frais) : 'Gratuit' }}</strong>
          </div>
          <p class="panel-text">
            Réglé une seule fois à la publication. Vous pourrez proposer une prime au trouveur
            depuis votre annonce, à tout moment avant la récupération.
          </p>
        </div>

        <p v-if="erreur" class="form-error">{{ erreur }}</p>
      </form>
    </IonContent>

    <IonFooter class="footer">
      <div class="container footer-inner">
        <IonButton
          class="btn-main"
          expand="block"
          type="submit"
          form="form-declaration"
          :disabled="envoi || traitementImage"
        >
          <IonSpinner v-if="envoi && frais === 0" name="crescent" />
          <span v-else>{{ frais > 0 ? `Continuer vers le paiement` : "Publier l'annonce" }}</span>
        </IonButton>
      </div>
    </IonFooter>

    <PaiementModal
      :is-open="paiementOuvert"
      :montant="frais"
      :libelle="form.libelle"
      :telephone-defaut="profile?.telephone"
      :en-cours="envoi"
      @fermer="paiementOuvert = false"
      @payer="publier"
    />
  </IonPage>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import { cameraOutline } from 'ionicons/icons'
import PaiementModal from '@/components/PaiementModal.vue'
import { CATEGORIES } from '@/constants/categories'
import { declarerObjet } from '@/services/objets.service'
import { useSession } from '@/composables/useSession'
import { compresserImage } from '@/utils/image'
import { erreurMessage, formatAriary } from '@/utils/format'
import type { InfosPaiement } from '@/types/models'

const router = useRouter()
const { acteur, profile, fraisDeclaration: frais } = useSession()

const aujourdhui = new Date().toISOString().slice(0, 10)
const formVide = () => ({
  libelle: '',
  categorie: '',
  description: '',
  lieuPerte: '',
  datePerte: aujourdhui,
})
const form = reactive(formVide())
const image = ref('')
const fileInput = ref<HTMLInputElement>()
const traitementImage = ref(false)
const envoi = ref(false)
const erreur = ref('')
const paiementOuvert = ref(false)

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function choisirImage() {
  fileInput.value?.click()
}

async function onFichier(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  traitementImage.value = true
  erreur.value = ''
  try {
    image.value = await compresserImage(file)
  } catch (error) {
    erreur.value = erreurMessage(error, 'Image invalide.')
  } finally {
    traitementImage.value = false
  }
}

function continuer() {
  erreur.value = ''
  if (!form.libelle.trim() || !form.categorie || !form.lieuPerte.trim()) {
    erreur.value = 'Renseignez au minimum le nom, la catégorie et le lieu de perte.'
    return
  }
  if (frais.value > 0) {
    paiementOuvert.value = true
  } else {
    publier(null)
  }
}

async function publier(paiement: InfosPaiement | null) {
  if (!acteur.value) {
    erreur.value = 'Session expirée, reconnectez-vous.'
    return
  }
  envoi.value = true
  try {
    if (paiement) await pause(1200)
    const id = await declarerObjet(
      {
        libelle: form.libelle.trim(),
        categorie: form.categorie,
        description: form.description.trim(),
        lieuPerte: form.lieuPerte.trim(),
        datePerte: form.datePerte,
        image: image.value,
      },
      paiement,
      frais.value,
      acteur.value,
    )
    paiementOuvert.value = false
    Object.assign(form, formVide())
    image.value = ''
    const toast = await toastController.create({
      message: paiement ? 'Paiement reçu. Votre annonce est en ligne.' : 'Votre annonce est en ligne.',
      duration: 2500,
      color: 'success',
      position: 'top',
    })
    await toast.present()
    await router.push(`/objets/${id}`)
  } catch (error) {
    paiementOuvert.value = false
    erreur.value = erreurMessage(error, 'Publication impossible.')
  } finally {
    envoi.value = false
  }
}
</script>

<style scoped>
.section-title.first {
  margin-top: 4px;
}

.photo {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 340px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.photo.vide {
  border: 1.5px dashed #cbd5e1;
  background: var(--surface-muted);
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-vide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  padding: 16px;
  text-align: center;
}

.photo-vide ion-icon {
  margin-bottom: 4px;
  font-size: 30px;
  color: var(--ion-color-primary);
}

.photo-vide strong {
  font-size: 15px;
  font-weight: 600;
}

.photo-vide span {
  font-size: 13px;
  color: var(--text-muted);
}

.photo-spinner {
  position: absolute;
  inset: 0;
  margin: auto;
}

.photo-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.frais {
  margin-top: 20px;
}

.frais .panel-text {
  margin: 6px 0 0;
}

.frais-montant {
  font-size: 17px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.form-error {
  margin-top: 14px;
}

.footer {
  border-top: 1px solid var(--line);
  background: var(--surface);
  box-shadow: none;
}

.footer-inner {
  padding: 10px 16px;
}
</style>
