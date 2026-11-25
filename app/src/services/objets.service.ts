import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import type { DocumentSnapshot, Query } from 'firebase/firestore'
import { db } from './firebase'
import { genererId } from '@/utils/id'
import { envoyerNotification, userRef } from './users.service'
import { formatAriary } from '@/utils/format'
import type {
  InfosPaiement,
  NouveauSignalement,
  NouvelObjet,
  Objet,
  Signalement,
  StatutObjet,
} from '@/types/models'

const objetsCollection = collection(db, 'objets')
const objetRef = (id: string) => doc(db, 'objets', id)

export interface Acteur {
  uid: string
  nom: string
  email: string
  telephone: string
}

export function versObjet(snapshot: DocumentSnapshot): Objet {
  const d = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return {
    id: snapshot.id,
    libelle: d.libelle ?? 'Objet sans nom',
    description: d.description ?? '',
    categorie: d.categorie ?? 'autre',
    lieuPerte: d.lieuPerte ?? '',
    datePerte: d.datePerte ?? '',
    image: d.image ?? '',
    prime: Number(d.prime ?? 0),
    statut: (d.statut ?? 'perdu') as StatutObjet,
    userId: d.userId,
    proprietaireNom: d.proprietaireNom ?? '',
    proprietaireEmail: d.proprietaireEmail ?? '',
    proprietaireTelephone: d.proprietaireTelephone ?? '',
    signalements: d.signalements ?? [],
    signaleurIds: d.signaleurIds ?? [],
    trouveurId: d.trouveurId ?? null,
    trouveurNom: d.trouveurNom ?? '',
    trouveurTelephone: d.trouveurTelephone ?? '',
    primeStatut: d.primeStatut ?? 'aucune',
    primeModifieeLe: d.primeModifieeLe ?? null,
    dateRecuperation: d.dateRecuperation ?? null,
    datePaiementPrime: d.datePaiementPrime ?? null,
    paiementDeclaration: d.paiementDeclaration ?? null,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  }
}

type ChampDate = 'createdAt' | 'dateRecuperation'

// Tri côté client pour ne pas dépendre d'index composites.
function ecouter(q: Query, cb: (o: Objet[]) => void, err?: (e: Error) => void, tri: ChampDate = 'createdAt') {
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(versObjet)
      list.sort((a, b) => (b[tri]?.toMillis() ?? 0) - (a[tri]?.toMillis() ?? 0))
      cb(list)
    },
    err,
  )
}

type Ecouteur = (cb: (o: Objet[]) => void, err?: (e: Error) => void) => () => void
type EcouteurUtilisateur = (uid: string, cb: (o: Objet[]) => void, err?: (e: Error) => void) => () => void

export const ecouterObjetsPerdus: Ecouteur = (cb, err) =>
  ecouter(query(objetsCollection, where('statut', 'in', ['perdu', 'trouve'])), cb, err)

export const ecouterObjetsRecuperes: Ecouteur = (cb, err) =>
  ecouter(query(objetsCollection, where('statut', '==', 'recupere')), cb, err, 'dateRecuperation')

export const ecouterTousLesObjets: Ecouteur = (cb, err) => ecouter(query(objetsCollection), cb, err)

export const ecouterMesObjets: EcouteurUtilisateur = (uid, cb, err) =>
  ecouter(query(objetsCollection, where('userId', '==', userRef(uid))), cb, err)

export const ecouterObjetsTrouves: EcouteurUtilisateur = (uid, cb, err) =>
  ecouter(query(objetsCollection, where('trouveurId', '==', userRef(uid))), cb, err)

export const ecouterMesSignalements: EcouteurUtilisateur = (uid, cb, err) =>
  ecouter(query(objetsCollection, where('signaleurIds', 'array-contains', userRef(uid))), cb, err)

export function ecouterObjet(id: string, cb: (o: Objet | null) => void, err?: (e: Error) => void) {
  return onSnapshot(objetRef(id), (s) => cb(s.exists() ? versObjet(s) : null), err)
}

function referencePaiement(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const suffixe = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `RF${date}-${suffixe}`
}

export async function declarerObjet(
  data: NouvelObjet,
  paiement: InfosPaiement | null,
  frais: number,
  acteur: Acteur,
): Promise<string> {
  const paiementDeclaration =
    frais > 0 && paiement
      ? {
          montant: frais,
          methode: paiement.methode,
          telephone:
            paiement.methode === 'carte'
              ? `•••• ${paiement.telephone.replace(/\D/g, '').slice(-4)}`
              : paiement.telephone.trim(),
          reference: referencePaiement(),
          payeLe: Timestamp.now(),
        }
      : null

  const reference = await addDoc(objetsCollection, {
    ...data,
    prime: 0,
    statut: 'perdu',
    userId: userRef(acteur.uid),
    proprietaireNom: acteur.nom,
    proprietaireEmail: acteur.email,
    proprietaireTelephone: acteur.telephone,
    signalements: [],
    signaleurIds: [],
    trouveurId: null,
    trouveurNom: '',
    trouveurTelephone: '',
    primeStatut: 'aucune',
    primeModifieeLe: null,
    dateRecuperation: null,
    datePaiementPrime: null,
    paiementDeclaration,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function supprimerObjet(id: string): Promise<void> {
  await deleteDoc(objetRef(id))
}

async function modifierCommeProprietaire(
  objetId: string,
  acteur: Acteur,
  mutate: (objet: Objet) => Record<string, unknown>,
): Promise<Objet> {
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(objetRef(objetId))
    if (!snapshot.exists()) throw new Error("Cet objet n'existe plus.")
    const objet = versObjet(snapshot)
    if (objet.userId?.id !== acteur.uid) {
      throw new Error('Seul le propriétaire peut effectuer cette action.')
    }
    transaction.update(objetRef(objetId), { ...mutate(objet), updatedAt: serverTimestamp() })
    return objet
  })
}

const avecStatuts = (list: Signalement[], statut: (s: Signalement) => Signalement['statut']) =>
  list.map((s) => ({ ...s, statut: statut(s) }))

const notifierSansErreur = (...args: Parameters<typeof envoyerNotification>) =>
  envoyerNotification(...args).catch(() => undefined)

export async function modifierPrime(objetId: string, montant: number, acteur: Acteur) {
  const prime = Math.max(0, Math.round(montant || 0))
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => {
    if (o.statut === 'recupere') throw new Error('La prime ne peut plus être modifiée après la récupération.')
    return { prime, primeModifieeLe: serverTimestamp() }
  })
  if (objet.prime === prime) return

  const destinataires = new Set<string>()
  if (objet.trouveurId) destinataires.add(objet.trouveurId.id)
  objet.signalements.filter((s) => s.statut === 'en_attente').forEach((s) => destinataires.add(s.trouveurId.id))

  const message =
    prime > 0
      ? `La prime pour « ${objet.libelle} » est maintenant de ${formatAriary(prime)}.`
      : `La prime pour « ${objet.libelle} » a été retirée.`
  await Promise.all(
    [...destinataires].map((uid) =>
      notifierSansErreur(uid, { type: 'prime_modifiee', titre: 'Prime mise à jour', message, objetId }),
    ),
  )
}

export async function accepterSignalement(objetId: string, signalementId: string, acteur: Acteur) {
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => {
    if (o.statut !== 'perdu') throw new Error('Un trouveur a déjà été retenu pour cet objet.')
    const retenu = o.signalements.find((s) => s.id === signalementId)
    if (!retenu) throw new Error('Signalement introuvable.')
    return {
      statut: 'trouve',
      trouveurId: retenu.trouveurId,
      trouveurNom: retenu.trouveurNom,
      trouveurTelephone: retenu.telephone,
      signalements: avecStatuts(o.signalements, (s) =>
        s.id === signalementId ? 'accepte' : s.statut === 'en_attente' ? 'refuse' : s.statut,
      ),
    }
  })

  const contact = acteur.telephone || acteur.email
  await Promise.all(
    objet.signalements
      .filter((s) => s.statut === 'en_attente')
      .map((s) =>
        s.id === signalementId
          ? notifierSansErreur(s.trouveurId.id, {
              type: 'signalement_accepte',
              titre: 'Signalement accepté',
              message: `${acteur.nom} a retenu votre signalement pour « ${objet.libelle} ». Contact : ${contact}.`,
              objetId,
            })
          : notifierSansErreur(s.trouveurId.id, {
              type: 'signalement_refuse',
              titre: 'Signalement non retenu',
              message: `Le propriétaire de « ${objet.libelle} » a retenu un autre signalement.`,
              objetId,
            }),
      ),
  )
}

export async function refuserSignalement(objetId: string, signalementId: string, acteur: Acteur) {
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => ({
    signalements: avecStatuts(o.signalements, (s) => (s.id === signalementId ? 'refuse' : s.statut)),
  }))
  const signalement = objet.signalements.find((s) => s.id === signalementId)
  if (signalement) {
    await notifierSansErreur(signalement.trouveurId.id, {
      type: 'signalement_refuse',
      titre: 'Signalement refusé',
      message: `Le propriétaire indique que l'objet signalé n'est pas « ${objet.libelle} ».`,
      objetId,
    })
  }
}

export async function annulerRestitution(objetId: string, acteur: Acteur) {
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => {
    if (o.statut !== 'trouve') throw new Error('Aucune restitution en cours.')
    return {
      statut: 'perdu',
      trouveurId: null,
      trouveurNom: '',
      trouveurTelephone: '',
      signalements: avecStatuts(o.signalements, (s) => (s.statut === 'accepte' ? 'refuse' : s.statut)),
    }
  })
  if (objet.trouveurId) {
    await notifierSansErreur(objet.trouveurId.id, {
      type: 'restitution_annulee',
      titre: 'Restitution annulée',
      message: `Le propriétaire a annulé la restitution de « ${objet.libelle} ».`,
      objetId,
    })
  }
}

export async function confirmerRecuperation(objetId: string, acteur: Acteur) {
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => {
    if (o.statut !== 'trouve' || !o.trouveurId) {
      throw new Error("Acceptez d'abord le signalement d'un trouveur.")
    }
    return {
      statut: 'recupere',
      dateRecuperation: serverTimestamp(),
      primeStatut: o.prime > 0 ? 'due' : 'aucune',
    }
  })
  if (!objet.trouveurId) return
  await notifierSansErreur(objet.trouveurId.id, {
    type: objet.prime > 0 ? 'prime_due' : 'objet_recupere',
    titre: objet.prime > 0 ? 'Prime à recevoir' : 'Objet remis',
    message:
      objet.prime > 0
        ? `${acteur.nom} a récupéré « ${objet.libelle} » et vous doit ${formatAriary(objet.prime)}.`
        : `${acteur.nom} a bien récupéré « ${objet.libelle} ». Merci pour votre aide.`,
    objetId,
  })
}

export async function marquerRetrouveSeul(objetId: string, acteur: Acteur) {
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => {
    if (o.statut === 'recupere') throw new Error('Objet déjà récupéré.')
    return {
      statut: 'recupere',
      dateRecuperation: serverTimestamp(),
      primeStatut: 'aucune',
      trouveurId: null,
      trouveurNom: '',
      trouveurTelephone: '',
      signalements: avecStatuts(o.signalements, (s) => (s.statut === 'refuse' ? s.statut : 'refuse')),
    }
  })
  await Promise.all(
    objet.signalements
      .filter((s) => s.statut !== 'refuse')
      .map((s) =>
        notifierSansErreur(s.trouveurId.id, {
          type: 'objet_recupere',
          titre: 'Objet retrouvé',
          message: `Le propriétaire a retrouvé « ${objet.libelle} » par lui-même. Merci pour votre signalement.`,
          objetId,
        }),
      ),
  )
}

export async function payerPrime(objetId: string, acteur: Acteur) {
  const objet = await modifierCommeProprietaire(objetId, acteur, (o) => {
    if (o.primeStatut !== 'due') throw new Error('Aucune prime due pour cet objet.')
    return { primeStatut: 'payee', datePaiementPrime: serverTimestamp() }
  })
  if (objet.trouveurId) {
    await notifierSansErreur(objet.trouveurId.id, {
      type: 'prime_payee',
      titre: 'Prime payée',
      message: `${acteur.nom} indique vous avoir versé ${formatAriary(objet.prime)} pour « ${objet.libelle} ».`,
      objetId,
    })
  }
}

export async function signalerTrouve(objetId: string, data: NouveauSignalement, acteur: Acteur) {
  const signalement: Signalement = {
    id: genererId(),
    trouveurId: userRef(acteur.uid),
    trouveurNom: acteur.nom,
    trouveurEmail: acteur.email,
    telephone: data.telephone.trim(),
    lieuTrouve: data.lieuTrouve.trim(),
    message: data.message.trim(),
    statut: 'en_attente',
    createdAt: Timestamp.now(),
  }

  const objet = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(objetRef(objetId))
    if (!snapshot.exists()) throw new Error("Cet objet n'existe plus.")
    const o = versObjet(snapshot)
    if (o.userId?.id === acteur.uid) throw new Error('Vous ne pouvez pas signaler votre propre objet.')
    if (o.statut !== 'perdu') throw new Error('Cet objet a déjà été trouvé.')
    if (o.signalements.some((s) => s.trouveurId.id === acteur.uid && s.statut === 'en_attente')) {
      throw new Error('Vous avez déjà un signalement en attente pour cet objet.')
    }
    transaction.update(objetRef(objetId), {
      signalements: arrayUnion(signalement),
      signaleurIds: arrayUnion(userRef(acteur.uid)),
      updatedAt: serverTimestamp(),
    })
    return o
  })

  if (objet.userId) {
    const lieu = signalement.lieuTrouve ? ` (${signalement.lieuTrouve})` : ''
    await notifierSansErreur(objet.userId.id, {
      type: 'signalement',
      titre: 'Nouveau signalement',
      message: `${acteur.nom} pense avoir trouvé « ${objet.libelle} »${lieu}.`,
      objetId,
    })
  }
}
