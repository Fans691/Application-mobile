# Application Mobile - Template

Projet minimal séparé en deux parties :

- `app/` : application **Vue 3, TypeScript, Vite et Ionic**
- `api/` : API HTTP Node.js sans dépendance

Aucune donnée métier, aucun écran de démonstration et aucune configuration propre à un projet existant.

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
