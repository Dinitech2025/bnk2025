# BoutikNaka - Système d'authentification

Ce projet implémente un système d'authentification complet pour une application e-commerce avec deux interfaces distinctes :
- **Storefront** : Interface publique accessible à tous les utilisateurs (publics et clients connectés)
- **Panel d'administration** : Interface réservée aux administrateurs et au personnel (staff)

## Structure de l'application

```
app/
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts      # Configuration NextAuth
│       └── register/
│           └── route.ts      # API d'inscription
├── auth/
│   ├── login/
│   │   └── page.tsx          # Page de connexion
│   ├── register/
│   │   └── page.tsx          # Page d'inscription
│   └── unauthorized/
│       └── page.tsx          # Page d'erreur d'accès
├── admin/
│   ├── layout.tsx            # Layout admin (protégé)
│   └── page.tsx              # Dashboard admin
├── storefront/
│   ├── layout.tsx            # Layout storefront (public)
│   └── page.tsx              # Page d'accueil publique
├── layout.tsx                # Layout racine
└── page.tsx                  # Redirection vers storefront

lib/
├── auth.ts                   # Fonctions d'authentification
├── auth-provider.tsx         # Provider d'authentification
├── db.ts                     # Client Prisma
└── utils.ts                  # Utilitaires

components/
├── admin/
│   ├── header.tsx            # En-tête admin
│   └── sidebar.tsx           # Barre latérale admin
├── ui/                       # Composants d'interface
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   └── label.tsx
└── user-menu.tsx             # Menu utilisateur pour le storefront

middleware.ts                 # Protection des routes
```

## Fonctionnalités

### Authentification
- Connexion avec email/mot de passe
- Inscription de nouveaux utilisateurs
- Protection des routes basée sur les rôles
- Sessions persistantes avec JWT

### Rôles utilisateurs
- **ADMIN** : Accès complet au panel d'administration
- **STAFF** : Accès au panel d'administration avec restrictions
- **CLIENT** : Accès au storefront avec fonctionnalités utilisateur

### Interfaces
- **Storefront** : Interface publique pour les clients et visiteurs
- **Admin Panel** : Interface protégée pour la gestion du site

## Connexion rapide

Pour faciliter les tests, trois utilisateurs sont préconfigurés :

| Type    | Email                  | Mot de passe |
|---------|------------------------|--------------|
| Admin   | admin@boutiknaka.com   | password123  |
| Staff   | staff@boutiknaka.com   | password123  |
| Client  | client@boutiknaka.com  | password123  |

## Démarrage

1. Installer les dépendances :
   ```
   npm install
   ```

2. Configurer la base de données :
   ```
   npx prisma generate
   npx prisma migrate dev
   ```

3. Initialiser les données de test :
   ```
   npm run prisma:seed
   ```

4. Lancer l'application :
   ```
   npm run dev
   ```

5. Accéder à l'application :
   - Storefront : http://localhost:3000/storefront
   - Admin : http://localhost:3000/admin (nécessite authentification) 