import type { DocumentReference, Timestamp } from 'firebase/firestore'

export type Role = 'user' | 'admin'
export type StatutObjet = 'perdu' | 'trouve' | 'recupere'
export type StatutSignalement = 'en_attente' | 'accepte' | 'refuse'
export type StatutPrime = 'aucune' | 'due' | 'payee'
export type MethodePaiement = 'mvola' | 'orange_money' | 'airtel_money' | 'carte'

export type TypeNotification =
  | 'signalement'
  | 'signalement_accepte'
  | 'signalement_refuse'
  | 'objet_recupere'
  | 'prime_due'
  | 'prime_payee'
  | 'prime_modifiee'
  | 'restitution_annulee'

export interface Notification {
  id: string
  type: TypeNotification
  titre: string
  message: string
  objetId?: string
  lu: boolean
  createdAt: Timestamp
}

export interface UserProfile {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  adresse?: string
  role?: Role
  fraisDeclaration?: number
  notifications?: Notification[]
  createdAt?: Timestamp
}

export interface Signalement {
  id: string
  trouveurId: DocumentReference
  trouveurNom: string
  trouveurEmail: string
  telephone: string
  lieuTrouve: string
  message: string
  statut: StatutSignalement
  createdAt: Timestamp
}

export interface PaiementDeclaration {
  montant: number
  methode: MethodePaiement
  telephone: string
  reference: string
  payeLe: Timestamp
}

export interface Objet {
  id: string
  libelle: string
  description: string
  categorie: string
  lieuPerte: string
  datePerte: string
  image: string
  prime: number
  statut: StatutObjet

  userId: DocumentReference
  proprietaireNom: string
  proprietaireEmail: string
  proprietaireTelephone: string

  signalements: Signalement[]
  signaleurIds: DocumentReference[]

  trouveurId: DocumentReference | null
  trouveurNom: string
  trouveurTelephone: string

  primeStatut: StatutPrime
  primeModifieeLe: Timestamp | null
  dateRecuperation: Timestamp | null
  datePaiementPrime: Timestamp | null

  paiementDeclaration: PaiementDeclaration | null

  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export interface NouvelObjet {
  libelle: string
  description: string
  categorie: string
  lieuPerte: string
  datePerte: string
  image: string
}

export interface InfosPaiement {
  methode: MethodePaiement
  telephone: string
}

export interface NouveauSignalement {
  telephone: string
  lieuTrouve: string
  message: string
}
