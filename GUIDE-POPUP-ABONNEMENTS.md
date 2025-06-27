# Guide du Système de Popup d'Abonnements

## Vue d'ensemble

Le système de popup d'abonnements permet aux utilisateurs de sélectionner des comptes et profils spécifiques lors de l'ajout d'une offre d'abonnement streaming au panier. Cette fonctionnalité assure une attribution précise des ressources avant le paiement.

## Fonctionnalités

### 🎯 Sélection Interactive
- **Popup moderne** : Interface utilisateur intuitive avec design responsive
- **Sélection de compte** : Choix parmi les comptes disponibles pour la plateforme
- **Sélection de profils** : Choix des profils libres avec limitation selon l'offre
- **Réservation temporaire** : Les profils sont marqués comme réservés côté front-end

### 📊 Informations Détaillées
- **Détails de l'offre** : Prix, durée, nombre de profils inclus
- **Fonctionnalités** : Liste des avantages inclus dans l'abonnement
- **État des comptes** : Nombre de profils utilisés/disponibles par compte
- **Logos des plateformes** : Affichage visuel des logos officiels

### 🛒 Gestion du Panier
- **Réservations temporaires** : Stockage local des sélections avant paiement
- **Affichage détaillé** : Visualisation des comptes et profils réservés
- **Validation différée** : Attribution définitive après paiement réussi

## Architecture Technique

### Composants Principaux

#### 1. SubscriptionPopup (`components/ui/subscription-popup.tsx`)
- **Props** :
  - `offer`: Offre sélectionnée
  - `isOpen`: État d'ouverture du popup
  - `onClose`: Fonction de fermeture
  - `onAddToCart`: Callback d'ajout au panier

- **Fonctionnalités** :
  - Chargement dynamique des comptes et profils
  - Validation des sélections
  - Gestion des limites de profils
  - Interface responsive

#### 2. Page des Abonnements (`app/(site)/subscriptions/page.tsx`)
- **Modifications** :
  - Intégration du popup de sélection
  - Gestion des réservations temporaires
  - Stockage des données de réservation

#### 3. Page du Panier (`app/(site)/cart/page.tsx`)
- **Améliorations** :
  - Affichage spécialisé pour les abonnements
  - Détails des réservations temporaires
  - Design différencié pour les abonnements

### APIs Utilisées

#### 1. API des Comptes (`/api/admin/streaming/accounts`)
```typescript
GET /api/admin/streaming/accounts?platformId={id}
```
- Récupère les comptes actifs pour une plateforme
- Inclut le nombre de profils utilisés/disponibles

#### 2. API des Profils (`/api/admin/streaming/profiles`)
```typescript
GET /api/admin/streaming/profiles?accountId={id}
```
- Récupère les profils d'un compte spécifique
- Filtre les profils disponibles/assignés

#### 3. API des Offres (`/api/public/offers`)
```typescript
GET /api/public/offers
```
- Récupère toutes les offres d'abonnement publiques
- Inclut les détails des plateformes et logos

## Flux d'Utilisation

### 1. Sélection d'une Offre
1. L'utilisateur navigue vers `/subscriptions`
2. Il clique sur "Choisir" pour une offre
3. Le popup de sélection s'ouvre

### 2. Configuration de l'Abonnement
1. **Sélection du compte** : Choix parmi les comptes disponibles
2. **Sélection des profils** : Choix des profils libres (limité par l'offre)
3. **Validation** : Vérification des sélections
4. **Ajout au panier** : Création d'une réservation temporaire

### 3. Gestion du Panier
1. **Visualisation** : Affichage des détails de réservation
2. **Modification** : Possibilité de supprimer des éléments
3. **Finalisation** : Passage à la commande

### 4. Après Paiement (À implémenter)
1. **Validation** : Vérification du paiement
2. **Attribution** : Assignation définitive des profils
3. **Création d'abonnement** : Enregistrement en base de données

## Structure des Données

### Réservation Temporaire
```typescript
interface ReservationData {
  type: 'subscription'
  offerId: string
  offerName: string
  platform: Platform
  price: string
  duration: string
  maxProfiles: number
  account: {
    id: string
    email: string
    username: string
  }
  profiles: Array<{
    id: string
    name: string
    profileSlot: number
  }>
  reservedAt: string
}
```

### Élément du Panier
```typescript
interface CartItem {
  id: string // ID unique de réservation
  type: 'subscription'
  name: string
  price: number
  quantity: 1 // Toujours 1 pour les abonnements
  currency: 'Ar'
  platform: Platform
  duration: string
  maxProfiles: number
  reservation: ReservationData
}
```

## Tests et Validation

### Scripts de Test Disponibles

#### 1. Test Complet (`scripts/test-subscription-popup.js`)
```bash
node scripts/test-subscription-popup.js
```
- Vérifie les offres, comptes, et profils
- Simule une réservation complète
- Teste les APIs nécessaires

#### 2. Création de Comptes de Test (`scripts/create-test-accounts.js`)
```bash
node scripts/create-test-accounts.js
```
- Crée des comptes de test pour toutes les plateformes
- Génère des profils associés
- Fournit des données de test réalistes

#### 3. Test du Flux Complet (`scripts/test-subscription-flow.sh`)
```bash
bash scripts/test-subscription-flow.sh
```
- Teste toutes les APIs en conditions réelles
- Vérifie l'accessibilité des pages
- Fournit un rapport complet

### Données de Test Créées
- **6 comptes actifs** répartis sur 5 plateformes
- **33 profils disponibles** pour les tests
- **Comptes réalistes** avec emails et profils nommés

## Sécurité et Limitations

### Réservations Temporaires
- ⚠️ **Stockage local uniquement** : Les réservations ne sont pas persistées en base
- ⏰ **Durée limitée** : Les réservations expirent à la fermeture du navigateur
- 🔄 **Pas de synchronisation** : Risque de conflits entre utilisateurs

### Validation Côté Serveur
- ✅ **Vérification des comptes** : Validation de l'existence et disponibilité
- ✅ **Vérification des profils** : Contrôle des profils libres
- ✅ **Limites respectées** : Respect du nombre maximum de profils par offre

## Améliorations Futures

### 1. Persistance des Réservations
- Stockage des réservations en base de données
- Système d'expiration automatique
- Gestion des conflits entre utilisateurs

### 2. Notifications en Temps Réel
- WebSockets pour les mises à jour de disponibilité
- Alertes en cas de profil devenu indisponible
- Synchronisation multi-utilisateurs

### 3. Gestion des Paiements
- Intégration avec un système de paiement
- Validation automatique après paiement
- Rollback en cas d'échec de paiement

### 4. Analytics et Reporting
- Suivi des taux de conversion
- Analyse des préférences utilisateurs
- Reporting sur l'utilisation des comptes

## Maintenance

### Logs et Debugging
- Logs détaillés dans la console du navigateur
- Messages d'erreur explicites pour l'utilisateur
- Gestion gracieuse des erreurs réseau

### Performance
- Chargement lazy des données
- Cache des informations de plateforme
- Optimisation des requêtes API

### Monitoring
- Surveillance de la disponibilité des APIs
- Alertes en cas de comptes indisponibles
- Métriques d'utilisation du système

---

## Installation et Configuration

### Prérequis
- Node.js et pnpm installés
- Base de données configurée avec Prisma
- Plateformes et offres créées en base

### Étapes d'Installation
1. **Créer les comptes de test** :
   ```bash
   node scripts/create-test-accounts.js
   ```

2. **Démarrer le serveur** :
   ```bash
   pnpm dev
   ```

3. **Tester le système** :
   ```bash
   node scripts/test-subscription-popup.js
   ```

4. **Accéder à l'interface** :
   - Page des abonnements : `http://localhost:3000/subscriptions`
   - Page du panier : `http://localhost:3000/cart`

### Configuration
- Les logos des plateformes sont gérés automatiquement
- Les prix sont affichés en Ariary (Ar)
- L'interface est en français par défaut

---

*Guide créé le $(date) - Version 1.0* 