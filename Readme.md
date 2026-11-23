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

## Configuration Firebase

Les identifiants Firebase se trouvent dans `app/.env`.

Dans Firebase Console :

1. Activez **E-mail/Mot de passe** dans Authentication → Sign-in method.
2. Créez un utilisateur dans Authentication → Users.
3. Lancez l’application, puis connectez-vous avec cet utilisateur.
