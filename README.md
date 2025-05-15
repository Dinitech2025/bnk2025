# Projet Next.js avec TypeScript

Ce projet est une application web moderne construite avec Next.js et TypeScript, utilisant Prisma comme ORM et Tailwind CSS pour le style.

## Structure du Projet

```
├── app/                    # Dossier principal des routes Next.js
│   ├── admin/             # Interface d'administration
│   ├── api/               # Routes API
│   ├── auth/              # Pages d'authentification
│   ├── profile/           # Pages de profil utilisateur
│   ├── products/          # Pages des produits
│   ├── services/          # Pages des services
│   ├── contact/           # Page de contact
│   ├── layout.tsx         # Layout principal de l'application
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
│
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI génériques
│   ├── admin/            # Composants spécifiques à l'admin
│   ├── site-header.tsx   # En-tête du site
│   ├── site-footer.tsx   # Pied de page du site
│   └── user-menu.tsx     # Menu utilisateur
│
├── lib/                  # Utilitaires et fonctions partagées
├── prisma/              # Configuration et schémas Prisma
├── public/              # Fichiers statiques
├── types/               # Types TypeScript personnalisés
└── middleware.ts        # Middleware Next.js
```

## Configuration Technique

- **Framework**: Next.js
- **Language**: TypeScript
- **Base de données**: Prisma ORM
- **Styles**: Tailwind CSS
- **Authentification**: Intégrée via le dossier auth/
- **API**: Routes API Next.js dans le dossier api/

## Fonctionnalités Principales

- 🔐 Système d'authentification complet
- 👤 Gestion des profils utilisateurs
- 📊 Interface d'administration
- 🛍️ Gestion des produits
- 🔧 Gestion des services
- 📱 Interface responsive
- 📝 Formulaire de contact

## Scripts Disponibles

\`\`\`bash
npm run dev      # Lance le serveur de développement
npm run build    # Construit l'application pour la production
npm run start    # Démarre l'application en mode production
\`\`\`

## Configuration Requise

- Node.js 18.x ou supérieur
- npm ou yarn
- Base de données compatible avec Prisma

## Installation

1. Clonez le repository
2. Installez les dépendances : \`npm install\`
3. Configurez les variables d'environnement
4. Lancez les migrations Prisma : \`npx prisma migrate dev\`
5. Démarrez le serveur : \`npm run dev\`

## Structure des Composants

### Components Principaux
- `site-header.tsx`: Navigation principale et en-tête
- `site-footer.tsx`: Pied de page avec liens et informations
- `user-menu.tsx`: Menu déroulant pour les utilisateurs connectés
- `ImageCropper.tsx`: Composant pour le recadrage d'images

### Composants UI
Le dossier `components/ui/` contient des composants réutilisables pour l'interface utilisateur.

## Routes Principales

- `/` - Page d'accueil
- `/admin` - Interface d'administration
- `/profile` - Profil utilisateur
- `/products` - Liste des produits
- `/services` - Services disponibles
- `/contact` - Formulaire de contact
- `/auth` - Pages d'authentification

## Middleware

Le fichier `middleware.ts` gère :
- La protection des routes
- La redirection des utilisateurs
- La validation des sessions

## Configuration Supplémentaire

- `next.config.js` - Configuration Next.js
- `tailwind.config.js` - Configuration Tailwind CSS
- `tsconfig.json` - Configuration TypeScript
- `postcss.config.js` - Configuration PostCSS 