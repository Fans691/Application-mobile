import { computed, ref, shallowRef } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { toastController } from '@ionic/vue'
import { auth } from '@/services/firebase'
import {
  assurerProfil,
  ecouterFraisDeclaration,
  ecouterProfil,
  nomComplet,
} from '@/services/users.service'
import type { Acteur } from '@/services/objets.service'
import { FRAIS_DECLARATION_DEFAUT } from '@/constants/paiement'
import type { Notification, UserProfile } from '@/types/models'

const user = shallowRef<User | null>(auth.currentUser)
const profile = ref<UserProfile | null>(null)
const fraisDeclaration = ref(FRAIS_DECLARATION_DEFAUT)

let arrets: Array<() => void> = []
let connues = new Set<string>()
let premierChargement = true

const notifications = computed<Notification[]>(() =>
  [...(profile.value?.notifications ?? [])].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  ),
)
const nonLues = computed(() => notifications.value.filter((n) => !n.lu).length)
const estAdmin = computed(() => profile.value?.role === 'admin')

const acteur = computed<Acteur | null>(() => {
  if (!user.value) return null
  return {
    uid: user.value.uid,
    nom: nomComplet(profile.value ?? { nom: '', prenom: '', email: user.value.email ?? '' }),
    email: user.value.email ?? '',
    telephone: profile.value?.telephone ?? '',
  }
})

async function signalerNouvelles(list: Notification[]) {
  const nouvelles = list.filter((n) => !n.lu && !connues.has(n.id))
  connues = new Set(list.map((n) => n.id))
  if (premierChargement) {
    premierChargement = false
    return
  }
  for (const n of nouvelles) {
    const toast = await toastController.create({
      header: n.titre,
      message: n.message,
      duration: 4000,
      position: 'top',
      cssClass: 'toast-notification',
      buttons: [{ text: 'OK', role: 'cancel' }],
    })
    await toast.present()

    if ('Notification' in window && window.Notification.permission === 'granted' && document.hidden) {
      new window.Notification(n.titre, { body: n.message, icon: '/favicon.svg', tag: n.id })
    }
  }
}

onAuthStateChanged(auth, async (current) => {
  user.value = current
  arrets.forEach((arret) => arret())
  arrets = []
  profile.value = null
  connues = new Set()
  premierChargement = true

  if (!current) return

  try {
    await assurerProfil(current)
  } catch (error) {
    console.error(error)
  }

  arrets.push(
    ecouterProfil(
      current.uid,
      (p) => {
        profile.value = p
        signalerNouvelles(p?.notifications ?? [])
      },
      (error) => console.error(error),
    ),
    ecouterFraisDeclaration((montant) => (fraisDeclaration.value = montant)),
  )
})

export async function demanderPermissionNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (window.Notification.permission === 'default') {
    return window.Notification.requestPermission()
  }
  return window.Notification.permission
}

export function useSession() {
  return { user, profile, notifications, nonLues, acteur, estAdmin, fraisDeclaration }
}
