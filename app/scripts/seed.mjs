// Données de démonstration : comptes, annonces, paiements et notifications.
// Usage : npm run seed (depuis app/). Relançable sans risque, les documents demo_* sont réécrits.
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  setLogLevel,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'

setLogLevel('error')

const env = process.env
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)
const dossierIcones = new URL('../node_modules/ionicons/dist/svg/', import.meta.url)

const FRAIS_ACTUEL = 2000
const FRAIS_ANCIEN = 1500

const COMPTES = {
  admin: {
    email: 'admin@refind.mg',
    motDePasse: 'admin123!',
    prenom: 'Administrateur',
    nom: '',
    telephone: '',
    adresse: '',
    role: 'admin',
  },
  rakoto: {
    email: 'demo.rakoto@refind.mg',
    motDePasse: 'Refind2026',
    prenom: 'Jean',
    nom: 'Rakoto',
    telephone: '034 11 222 33',
    adresse: 'Analakely, Antananarivo',
    role: 'user',
  },
  rasoa: {
    email: 'demo.rasoa@refind.mg',
    motDePasse: 'Refind2026',
    prenom: 'Marie',
    nom: 'Rasoa',
    telephone: '033 44 555 66',
    adresse: 'Ankorondrano, Antananarivo',
    role: 'user',
  },
}

const JOUR = 86_400_000
const ilYa = (jours) => Timestamp.fromDate(new Date(Date.now() - jours * JOUR))
const dateISO = (jours) => new Date(Date.now() - jours * JOUR).toISOString().slice(0, 10)
const nom = (c) => `${c.prenom} ${c.nom}`.trim()

function illustration(icone, fond, trait) {
  const source = readFileSync(new URL(`${icone}.svg`, dossierIcones), 'utf8')
    .replace(/currentColor/g, trait)
    .replace('<svg ', `<svg x="300" y="150" width="200" height="200" fill="${trait}" `)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">` +
    `<rect width="800" height="500" fill="${fond}"/>` +
    `<circle cx="400" cy="250" r="150" fill="#ffffff" fill-opacity="0.55"/>` +
    source +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function connexion(compte) {
  try {
    return (await signInWithEmailAndPassword(auth, compte.email, compte.motDePasse)).user
  } catch {
    return (await createUserWithEmailAndPassword(auth, compte.email, compte.motDePasse)).user
  }
}

function reference(jours, i) {
  const d = new Date(Date.now() - jours * JOUR).toISOString().slice(2, 10).replace(/-/g, '')
  return `RF${d}-${(0x1a2b3c + i * 7919).toString(36).toUpperCase().slice(-6)}`
}

async function main() {
  console.log('Comptes')
  const uids = {}
  for (const [cle, compte] of Object.entries(COMPTES)) {
    uids[cle] = (await connexion(compte)).uid
    await signOut(auth)
    console.log(`  ${compte.email.padEnd(24)} ${compte.role}`)
  }
  await connexion(COMPTES.rakoto)

  const personne = (cle) => ({ ...COMPTES[cle], uid: uids[cle], ref: doc(db, 'users', uids[cle]) })
  const R = personne('rakoto')
  const S = personne('rasoa')

  const proprio = (p) => ({
    userId: p.ref,
    proprietaireNom: nom(p),
    proprietaireEmail: p.email,
    proprietaireTelephone: p.telephone,
  })
  const signalement = (id, t, statut, lieuTrouve, message, jours) => ({
    id,
    trouveurId: t.ref,
    trouveurNom: nom(t),
    trouveurEmail: t.email,
    telephone: t.telephone,
    lieuTrouve,
    message,
    statut,
    createdAt: ilYa(jours),
  })
  const rendu = (t, prime, statutPrime, joursRecup, joursPaiement = null) => ({
    trouveurId: t.ref,
    trouveurNom: nom(t),
    trouveurTelephone: t.telephone,
    prime,
    primeStatut: prime > 0 ? statutPrime : 'aucune',
    statut: 'recupere',
    dateRecuperation: ilYa(joursRecup),
    datePaiementPrime: joursPaiement === null ? null : ilYa(joursPaiement),
  })

  let compteur = 0
  const annonce = (p, jours, methode, champs) => {
    compteur += 1
    return {
      description: '',
      image: '',
      prime: 0,
      statut: 'perdu',
      signalements: [],
      signaleurIds: [],
      trouveurId: null,
      trouveurNom: '',
      trouveurTelephone: '',
      primeStatut: 'aucune',
      primeModifieeLe: null,
      dateRecuperation: null,
      datePaiementPrime: null,
      ...proprio(p),
      datePerte: dateISO(jours),
      paiementDeclaration: {
        montant: jours > 90 ? FRAIS_ANCIEN : FRAIS_ACTUEL,
        methode,
        telephone: methode === 'carte' ? '•••• 1204' : p.telephone,
        reference: reference(jours, compteur),
        payeLe: ilYa(jours - 0.02),
      },
      createdAt: ilYa(jours - 0.02),
      updatedAt: ilYa(Math.max(0, jours - 1)),
      ...champs,
    }
  }

  const objets = {
    demo_laptop: annonce(S, 0.15, 'mvola', {
      libelle: 'Ordinateur portable HP gris',
      description: 'HP ProBook 14 pouces, autocollant « Madagascar » sur le capot, dans une housse noire.',
      categorie: 'electronique',
      lieuPerte: 'Café de la Gare, Soarano',
      image: illustration('laptop-outline', '#e4e8fb', '#3245a8'),
      prime: 100000,
      primeModifieeLe: ilYa(0.1),
    }),
    demo_iphone: annonce(R, 1, 'orange_money', {
      libelle: 'iPhone 13 noir',
      description: "Coque transparente avec une photo de famille à l'intérieur.",
      categorie: 'telephone',
      lieuPerte: 'Taxi-be ligne 194, Analakely',
      image: illustration('phone-portrait-outline', '#e3e9f4', '#24344f'),
      prime: 50000,
      primeModifieeLe: ilYa(0.5),
    }),
    demo_cles: annonce(S, 2, 'mvola', {
      libelle: 'Clés de voiture Toyota',
      description: 'Porte-clés rouge, deux clés et une télécommande.',
      categorie: 'cles',
      lieuPerte: 'Parking Akoor Digue',
      image: illustration('key-outline', '#f8e3e3', '#8f2323'),
      prime: 20000,
      statut: 'trouve',
      signalements: [
        signalement('demo_sig_cles', R, 'accepte', "Près de l'entrée du parking", 'Porte-clés rouge avec deux clés.', 1),
      ],
      signaleurIds: [R.ref],
      trouveurId: R.ref,
      trouveurNom: nom(R),
      trouveurTelephone: R.telephone,
    }),
    demo_portefeuille: annonce(R, 3, 'airtel_money', {
      libelle: 'Portefeuille en cuir marron',
      description: 'Carte bancaire et photos à l’intérieur. Initiales J.R. gravées.',
      categorie: 'portefeuille',
      lieuPerte: 'Marché Analakely',
      image: illustration('wallet-outline', '#f6eadc', '#7a4313'),
      prime: 30000,
      signalements: [
        signalement('demo_sig_portefeuille', S, 'en_attente', 'Pavillon 3 du marché', 'Portefeuille marron avec les initiales J.R., trouvé près d’un stand de fruits.', 0.2),
      ],
      signaleurIds: [S.ref],
    }),
    demo_chat: annonce(S, 4, 'orange_money', {
      libelle: 'Chat roux « Minou »',
      description: 'Chat roux de 2 ans, collier bleu avec clochette.',
      categorie: 'animal',
      lieuPerte: 'Ivandry, près du lycée',
      image: illustration('paw-outline', '#f9ecdc', '#8a4a0f'),
      prime: 25000,
    }),
    demo_sac: annonce(S, 6, 'mvola', {
      libelle: 'Sac à dos bleu',
      description: 'Sac bleu marine avec un ordinateur et des cahiers de cours.',
      categorie: 'sac',
      lieuPerte: 'IT University, Andoharanofotsy',
      image: illustration('bag-handle-outline', '#e1ebf7', '#1d3f73'),
      signalements: [signalement('demo_sig_sac', R, 'accepte', 'Salle de TP 2', 'Sac bleu oublié sous une table.', 5)],
      signaleurIds: [R.ref],
      ...rendu(R, 40000, 'due', 4),
    }),
    demo_cin: annonce(R, 12, 'carte', {
      libelle: "Carte d'identité nationale",
      description: 'Dans une pochette plastique verte.',
      categorie: 'papiers',
      lieuPerte: 'Gare routière Fasan’ny Karana',
      image: illustration('id-card-outline', '#e0f1e6', '#195c33'),
      signalements: [signalement('demo_sig_cin', S, 'accepte', 'Dans le taxi-brousse', 'Pochette verte trouvée sur un siège.', 11)],
      signaleurIds: [S.ref],
      ...rendu(S, 15000, 'payee', 10, 9),
    }),
    demo_cles_maison: annonce(S, 20, 'airtel_money', {
      libelle: 'Trousseau de clés de maison',
      description: 'Trois clés sur un anneau argenté avec un badge bleu.',
      categorie: 'cles',
      lieuPerte: 'Arrêt de bus Ambohijatovo',
      image: illustration('key-outline', '#e8edf3', '#334155'),
    }),
    demo_montre: annonce(R, 24, 'mvola', {
      libelle: 'Montre Casio argentée',
      description: 'Montre vintage, bracelet métal.',
      categorie: 'bijoux',
      lieuPerte: 'Stade Mahamasina',
      image: illustration('watch-outline', '#eceff3', '#3b4656'),
      statut: 'recupere',
      dateRecuperation: ilYa(21),
    }),
    demo_passeport: annonce(S, 45, 'carte', {
      libelle: 'Passeport',
      description: 'Passeport malgache dans un étui noir.',
      categorie: 'papiers',
      lieuPerte: 'Aéroport d’Ivato',
      image: illustration('id-card-outline', '#e4ecf7', '#1e3a66'),
      signalements: [signalement('demo_sig_passeport', R, 'accepte', 'Comptoir d’enregistrement', 'Étui noir remis à l’accueil.', 44)],
      signaleurIds: [R.ref],
      ...rendu(R, 30000, 'payee', 43, 42),
    }),
    demo_ecouteurs: annonce(R, 75, 'orange_money', {
      libelle: 'Écouteurs sans fil',
      description: 'Boîtier blanc, un écouteur légèrement rayé.',
      categorie: 'electronique',
      lieuPerte: 'Bibliothèque universitaire Ankatso',
      image: illustration('headset-outline', '#ebe9f8', '#3b3480'),
      signalements: [signalement('demo_sig_ecouteurs', S, 'accepte', 'Salle de lecture', 'Boîtier blanc trouvé sur une table.', 73)],
      signaleurIds: [S.ref],
      ...rendu(S, 10000, 'payee', 72, 70),
    }),
    demo_veste: annonce(S, 105, 'mvola', {
      libelle: 'Veste en jean',
      description: 'Taille M, bouton du haut manquant.',
      categorie: 'vetements',
      lieuPerte: 'Lac Anosy',
      image: illustration('shirt-outline', '#f3e9f6', '#5b2a6e'),
      statut: 'recupere',
      dateRecuperation: ilYa(100),
    }),
    demo_parapluie: annonce(R, 140, 'airtel_money', {
      libelle: 'Parapluie noir pliable',
      description: 'Poignée en bois.',
      categorie: 'autre',
      lieuPerte: 'Tsimbazaza',
      image: illustration('umbrella-outline', '#e8ebf0', '#2b3445'),
      signalements: [signalement('demo_sig_parapluie', S, 'accepte', 'Entrée du parc', 'Parapluie noir à poignée en bois.', 139)],
      signaleurIds: [S.ref],
      ...rendu(S, 5000, 'payee', 138, 137),
    }),
    demo_lunettes: annonce(S, 170, 'orange_money', {
      libelle: 'Lunettes de vue',
      description: 'Monture noire rectangulaire, étui gris.',
      categorie: 'autre',
      lieuPerte: 'Supermarché Analamahitsy',
      image: illustration('glasses-outline', '#e9eef4', '#26344a'),
      statut: 'recupere',
      dateRecuperation: ilYa(165),
    }),
  }

  const notif = (id, type, titre, message, objetId, jours, lu = false) => ({
    id, type, titre, message, objetId, lu, createdAt: ilYa(jours),
  })

  const notificationsRakoto = [
    notif('demo_n1', 'signalement', 'Nouveau signalement', `${nom(S)} pense avoir trouvé « Portefeuille en cuir marron » (Pavillon 3 du marché).`, 'demo_portefeuille', 0.2),
    notif('demo_n2', 'signalement_accepte', 'Signalement accepté', `${nom(S)} a retenu votre signalement pour « Clés de voiture Toyota ». Contact : ${S.telephone}.`, 'demo_cles', 0.8),
    notif('demo_n3', 'prime_due', 'Prime à recevoir', `${nom(S)} a récupéré « Sac à dos bleu » et vous doit 40 000 Ar.`, 'demo_sac', 4, true),
  ]
  const notificationsRasoa = [
    notif('demo_n4', 'signalement', 'Nouveau signalement', `${nom(R)} pense avoir trouvé « Clés de voiture Toyota » (près de l'entrée du parking).`, 'demo_cles', 1, true),
    notif('demo_n5', 'prime_payee', 'Prime payée', `${nom(R)} indique vous avoir versé 15 000 Ar pour « Carte d'identité nationale ».`, 'demo_cin', 9, true),
  ]

  console.log('Profils')
  const profil = (cle, extra) => {
    const { motDePasse: _mdp, ...data } = COMPTES[cle]
    return setDoc(doc(db, 'users', uids[cle]), { ...data, createdAt: ilYa(200), ...extra })
  }
  await profil('admin', { fraisDeclaration: FRAIS_ACTUEL, notifications: [] })
  await profil('rakoto', { notifications: notificationsRakoto })
  await profil('rasoa', { notifications: notificationsRasoa })

  console.log('Annonces')
  const batch = writeBatch(db)
  for (const [id, data] of Object.entries(objets)) {
    batch.set(doc(db, 'objets', id), data)
    console.log(`  ${id.padEnd(18)} ${data.statut.padEnd(9)} ${String(data.paiementDeclaration.montant).padStart(5)} Ar  ${data.libelle}`)
  }
  await batch.commit()

  console.log('Mise à niveau des anciennes annonces')
  const existants = await getDocs(collection(db, 'objets'))
  for (const snapshot of existants.docs) {
    if (snapshot.id.startsWith('demo_')) continue
    const d = snapshot.data()
    const ownerRef = d.userId ?? d.userReference ?? null
    const owner = ownerRef?.path ? ((await getDoc(ownerRef)).data() ?? {}) : {}
    const valeurs = {
      libelle: 'Objet sans nom',
      description: '',
      categorie: 'autre',
      lieuPerte: owner.adresse ?? '',
      datePerte: '',
      image: '',
      prime: 0,
      statut: 'perdu',
      userId: ownerRef,
      proprietaireNom: `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim(),
      proprietaireEmail: owner.email ?? '',
      proprietaireTelephone: owner.telephone ?? '',
      signalements: [],
      signaleurIds: [],
      trouveurId: null,
      trouveurNom: '',
      trouveurTelephone: '',
      primeStatut: 'aucune',
      primeModifieeLe: null,
      dateRecuperation: null,
      datePaiementPrime: null,
      paiementDeclaration: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    const patch = Object.fromEntries(Object.entries(valeurs).filter(([champ]) => d[champ] === undefined))
    if (Object.keys(patch).length) await setDoc(snapshot.ref, patch, { merge: true })
    console.log(`  ${snapshot.id} : ${Object.keys(patch).length} champ(s) ajouté(s)`)
  }

  await signOut(auth)
  const recettes = Object.values(objets).reduce((s, o) => s + o.paiementDeclaration.montant, 0)
  console.log(`\nTerminé. ${Object.keys(objets).length} annonces, ${recettes} Ar de droits encaissés.`)
  console.log('Admin : admin / admin123!   Utilisateurs démo : demo.rakoto@refind.mg, demo.rasoa@refind.mg (Refind2026)')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Échec :', error.code ?? '', error.message)
    process.exit(1)
  })
