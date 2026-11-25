import {
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { genererId } from '@/utils/id'
import { FRAIS_DECLARATION_DEFAUT } from '@/constants/paiement'
import type { Notification, Role, TypeNotification, UserProfile } from '@/types/models'

const MAX_NOTIFICATIONS = 50
const usersCollection = collection(db, 'users')

export const userRef = (uid: string) => doc(db, 'users', uid)

export function nomComplet(profile?: Pick<UserProfile, 'nom' | 'prenom' | 'email'> | null): string {
  if (!profile) return 'Utilisateur'
  const nom = `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim()
  return nom || profile.email || 'Utilisateur'
}

export async function creerProfil(
  uid: string,
  data: Pick<UserProfile, 'email' | 'nom' | 'prenom' | 'telephone' | 'adresse'>,
): Promise<void> {
  await setDoc(userRef(uid), { ...data, role: 'user', createdAt: serverTimestamp() }, { merge: true })
}

export async function assurerProfil(user: User): Promise<void> {
  const snapshot = await getDoc(userRef(user.uid))
  if (!snapshot.exists()) {
    await creerProfil(user.uid, {
      email: user.email ?? '',
      nom: '',
      prenom: user.email?.split('@')[0] ?? '',
      telephone: '',
      adresse: '',
    })
  }
}

export async function lireRole(uid: string): Promise<Role> {
  const snapshot = await getDoc(userRef(uid))
  return snapshot.data()?.role === 'admin' ? 'admin' : 'user'
}

export async function modifierProfil(
  uid: string,
  data: Partial<Pick<UserProfile, 'nom' | 'prenom' | 'telephone' | 'adresse' | 'fraisDeclaration'>>,
): Promise<void> {
  await setDoc(userRef(uid), data, { merge: true })
}

export function ecouterProfil(
  uid: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    userRef(uid),
    (snapshot) => {
      callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null)
    },
    onError,
  )
}

/** Le montant du droit de déclaration est porté par le compte administrateur. */
export function ecouterFraisDeclaration(callback: (montant: number) => void) {
  return onSnapshot(
    query(usersCollection, where('role', '==', 'admin'), limit(1)),
    (snapshot) => {
      const montant = snapshot.docs[0]?.data().fraisDeclaration
      callback(typeof montant === 'number' ? montant : FRAIS_DECLARATION_DEFAUT)
    },
    () => callback(FRAIS_DECLARATION_DEFAUT),
  )
}

export async function compterUtilisateurs(): Promise<number> {
  const snapshot = await getCountFromServer(usersCollection)
  return snapshot.data().count
}

export async function envoyerNotification(
  uid: string,
  notification: { type: TypeNotification; titre: string; message: string; objetId?: string },
): Promise<void> {
  const nouvelle: Notification = {
    id: genererId(),
    lu: false,
    createdAt: Timestamp.now(),
    ...notification,
  }
  await setDoc(userRef(uid), { notifications: arrayUnion(nouvelle) }, { merge: true })
}

async function modifierNotifications(
  uid: string,
  transform: (list: Notification[]) => Notification[],
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef(uid))
    const list = ((snapshot.data()?.notifications ?? []) as Notification[])
      .slice()
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    transaction.set(
      userRef(uid),
      { notifications: transform(list).slice(0, MAX_NOTIFICATIONS) },
      { merge: true },
    )
  })
}

export const marquerToutesLues = (uid: string) =>
  modifierNotifications(uid, (list) => list.map((n) => ({ ...n, lu: true })))

export const marquerLue = (uid: string, id: string) =>
  modifierNotifications(uid, (list) => list.map((n) => (n.id === id ? { ...n, lu: true } : n)))

export const supprimerNotification = (uid: string, id: string) =>
  modifierNotifications(uid, (list) => list.filter((n) => n.id !== id))

export const viderNotifications = (uid: string) => modifierNotifications(uid, () => [])
