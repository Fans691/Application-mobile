# Application Mobile - Template

Projet minimal séparé en deux parties :

- `app/` : application **Vue 3, TypeScript, Vite et Ionic**
- `api/` : API HTTP Node.js sans dépendance

Aucune donnée métier, aucun écran de démonstration et aucune configuration propre à un projet existant.

## Technologies utilisées

### Application mobile

- **Vue 3** : framework JavaScript pour construire l’interface
- **Ionic Vue** : composants d’interface adaptés aux applications mobiles
- **TypeScript** : typage statique du code JavaScript
- **Vite** : serveur de développement et outil de compilation
- **Vue Router** : gestion de la navigation
- **Ionicons** : bibliothèque d’icônes
- **Firebase Authentication** : connexion et gestion de session des utilisateurs

### API

- **Node.js** : environnement d’exécution JavaScript côté serveur
- **Module HTTP natif** : création du serveur et des routes, sans dépendance

### Outils

- **npm** : gestion des dépendances et lancement des scripts

## Application

```bash
cd app
npm install
npm run dev
```

Le contenu de départ se trouve dans `app/src/App.vue`.

## API

```bash
cd api
npm run dev
```

L’API expose `GET /api/health` sur `http://localhost:3000`.

## Vérification

```bash
cd app
npm run build
cd ../api
npm start
```

## Refind – objets perdus & primes

### Fonctionnalités

- **Objets perdus** : liste en temps réel, recherche, filtre par catégorie et « avec prime ».
- **Objets récupérés** : liste des objets rendus, avec le trouveur et le total des primes.
- **Déclarer** : photo (appareil photo ou galerie, compressée côté client), catégorie, lieu, date.
  La publication est soumise à un **droit de déclaration** (MVola, Orange Money, Airtel Money ou carte,
  paiement simulé). Aucune prime n’est fixée à ce stade.
- **Prime** : le propriétaire la propose, la modifie ou la retire à tout moment avant la récupération ;
  les personnes concernées sont notifiées.
- **Détail d’un objet** : « J’ai trouvé cet objet » → le propriétaire accepte/refuse le signalement →
  confirme la récupération → la prime devient **due** → le propriétaire la marque **payée**.
- **Notifications** en temps réel (badge, toast, notification navigateur si autorisée).
- **Profil** : mes annonces, primes à recevoir / à verser, objets que j’ai trouvés, modification du profil.
- **Administration** (`admin` / `admin123!`) : recettes des droits de déclaration (période, mois, total),
  graphique mensuel, répartition par moyen de paiement, activité, réglage du montant du droit,
  derniers encaissements.

### Modèle Firestore

Les règles Firestore du projet autorisent les collections `users` et `objets` :

| Collection    | Contenu |
|---------------|---------|
| `users/{uid}` | `nom`, `prenom`, `email`, `telephone`, `adresse`, `role` (`user` / `admin`), `fraisDeclaration` (compte admin), `notifications[]` (50 dernières) |
| `objets/{id}` | `libelle`, `description`, `categorie`, `lieuPerte`, `datePerte`, `image` (data URL), `prime`, `statut` (`perdu` → `trouve` → `recupere`), `userId` (réf. propriétaire), `signalements[]`, `signaleurIds[]`, `trouveurId`, `primeStatut` (`aucune` / `due` / `payee`), `paiementDeclaration` (`montant`, `methode`, `reference`, `payeLe`), `dateRecuperation`, `datePaiementPrime`, `createdAt` |

### Données de démonstration

```bash
cd app
npm run seed
```

Comptes créés : `admin` / `admin123!` (soit `admin@refind.mg`), et `demo.rakoto@refind.mg`,
`demo.rasoa@refind.mg` avec le mot de passe `Refind2026`.
Le script est idempotent (documents `demo_*`) et complète les anciens objets avec les nouveaux champs.

## Configuration Firebase

Les identifiants Firebase se trouvent dans `app/.env`.

Dans Firebase Console :

1. Activez **E-mail/Mot de passe** dans Authentication → Sign-in method.
2. Créez un utilisateur dans Authentication → Users.
3. Lancez l’application, puis connectez-vous avec cet utilisateur.
