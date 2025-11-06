# 🎯 Système de Tarification Flexible pour les Produits

## 📋 Vue d'ensemble

BoutikNaka dispose maintenant d'un système de tarification flexible pour les produits, similaire à celui des services. Ce système permet de gérer différents modes de tarification : prix fixe, prix négociable, plage de prix, et devis sur mesure.

## ✨ Fonctionnalités principales

### 1. 📊 Stock Automatique Basé sur les Variations

Le stock principal d'un produit est maintenant **calculé automatiquement** à partir des stocks de ses variations.

#### Comportement :
- **Sans variations** : Le stock est modifiable manuellement
- **Avec variations** : Le stock est en lecture seule et calculé automatiquement
- **Affichage en temps réel** : Badge "Auto" + résumé des variations

#### Exemple :
```typescript
// Produit avec 3 variations
Variation 1 (Taille S) : 10 unités
Variation 2 (Taille M) : 15 unités
Variation 3 (Taille L) : 5 unités
→ Stock principal automatique : 30 unités
```

### 2. 💰 Types de Tarification

#### A. Prix Fixe (FIXED)
- Prix standard non négociable
- Ajout direct au panier
- Convient pour les produits standards

```typescript
{
  pricingType: 'FIXED',
  price: 50000, // Ar
  // Pas de champs supplémentaires requis
}
```

#### B. Plage de Prix (RANGE)
- Le client peut proposer un prix dans une plage définie
- Option d'auto-acceptation pour les prix dans la plage
- Idéal pour les produits avec marges flexibles

```typescript
{
  pricingType: 'RANGE',
  price: 50000, // Prix de base
  minPrice: 45000, // Prix minimum accepté
  maxPrice: 55000, // Prix maximum accepté
  autoAcceptNegotiation: true, // Auto-accepter les prix dans la plage
  requiresQuote: false
}
```

#### C. Prix Négociable (NEGOTIABLE)
- Le client peut proposer n'importe quel prix
- Nécessite validation manuelle de l'admin
- Pour les produits où la négociation est courante

```typescript
{
  pricingType: 'NEGOTIABLE',
  price: 50000, // Prix de départ
  requiresQuote: true, // Devis requis
  autoAcceptNegotiation: false
}
```

#### D. Sur Devis Uniquement (QUOTE_REQUIRED)
- Aucun prix affiché
- Le client doit obligatoirement demander un devis
- Pour les produits personnalisés ou sur mesure

```typescript
{
  pricingType: 'QUOTE_REQUIRED',
  requiresQuote: true, // Toujours true
  // Le prix n'est pas affiché au client
}
```

## 🛠️ Configuration dans l'Admin

### Étape 1 : Accéder au formulaire de produit
```
/admin/products/new  (création)
/admin/products/[id]/edit  (modification)
```

### Étape 2 : Onglet "Prix"

#### Section "Type de tarification"
1. **Choisir le type** via les radio buttons
2. **Configuration selon le type** :

##### Pour RANGE :
- Définir le prix minimum
- Définir le prix maximum
- Activer/désactiver l'auto-acceptation

##### Pour NEGOTIABLE ou QUOTE_REQUIRED :
- Cocher "Devis requis" si nécessaire

### Étape 3 : Configuration du stock

#### Sans variations :
- Entrer manuellement le stock

#### Avec variations :
- Le stock est automatiquement calculé
- Gérer le stock individuel dans l'onglet "Variations"
- Surveiller le résumé de stock en temps réel

## 💻 Utilisation Côté Client

### Composant ProductPricingSelector

Le composant `ProductPricingSelector` gère l'affichage et les interactions selon le type de tarification.

#### Importation :
```tsx
import { ProductPricingSelector } from '@/components/products/product-pricing-selector'
```

#### Utilisation :
```tsx
<ProductPricingSelector
  product={{
    id: product.id,
    name: product.name,
    price: product.price,
    pricingType: product.pricingType,
    minPrice: product.minPrice,
    maxPrice: product.maxPrice,
    inventory: product.inventory,
    requiresQuote: product.requiresQuote,
    autoAcceptNegotiation: product.autoAcceptNegotiation
  }}
  quantity={1}
  onAddToCart={async (price, proposedPrice, message) => {
    // Logique d'ajout au panier
    await addToCart({
      productId: product.id,
      quantity: 1,
      price,
      proposedPrice,
      message
    })
  }}
  onRequestQuote={async (proposedPrice, message) => {
    // Logique de demande de devis
    await requestQuote({
      productId: product.id,
      budget: proposedPrice,
      description: message
    })
  }}
  loading={isLoading}
/>
```

## 📊 Schéma de Base de Données

### Modèle Product (Mise à jour)
```prisma
model Product {
  id                    String             @id @default(cuid())
  name                  String
  price                 Decimal
  inventory             Int                @default(0)
  
  // Nouveaux champs de tarification
  pricingType           ServicePricingType @default(FIXED)
  minPrice              Decimal?
  maxPrice              Decimal?
  requiresQuote         Boolean            @default(false)
  autoAcceptNegotiation Boolean            @default(false)
  
  // Relations
  variations            ProductVariation[]
  // ... autres champs
}
```

### Enum ServicePricingType
```prisma
enum ServicePricingType {
  FIXED
  RANGE
  NEGOTIABLE
  QUOTE_REQUIRED
}
```

## 🎨 Interface Utilisateur

### Affichage selon le type de prix

#### FIXED
```
┌─────────────────────────────────┐
│ 50 000 Ar                       │
│ [Ajouter au panier]             │
└─────────────────────────────────┘
```

#### NEGOTIABLE
```
┌─────────────────────────────────┐
│ 50 000 Ar [Négociable]          │
│ [Accepter ce prix]              │
│ [Proposer un prix]              │
└─────────────────────────────────┘
```

#### RANGE
```
┌─────────────────────────────────┐
│ Plage de prix                   │
│ 45 000 Ar - 55 000 Ar          │
│ [Choisir un prix]               │
└─────────────────────────────────┘
```

#### QUOTE_REQUIRED
```
┌─────────────────────────────────┐
│ [⏰ Devis requis]               │
│ Le prix dépend de vos besoins   │
│ [Demander un devis]             │
└─────────────────────────────────┘
```

## 📝 Exemples d'Utilisation

### Cas 1 : Produit Standard
```typescript
const tshirt = {
  name: "T-shirt BoutikNaka",
  price: 25000,
  pricingType: 'FIXED',
  inventory: 100
}
// Le client paie 25 000 Ar, pas de négociation
```

### Cas 2 : Produit avec Remise Possible
```typescript
const smartphone = {
  name: "Smartphone X",
  price: 500000,
  pricingType: 'RANGE',
  minPrice: 480000,
  maxPrice: 500000,
  autoAcceptNegotiation: true,
  inventory: 10
}
// Le client peut proposer entre 480k et 500k
// Prix accepté automatiquement si dans la plage
```

### Cas 3 : Produit de Gros
```typescript
const laptop = {
  name: "Laptop Pro",
  price: 2000000,
  pricingType: 'NEGOTIABLE',
  requiresQuote: true,
  inventory: 5
}
// Le client peut proposer n'importe quel prix
// L'admin valide ou contre-propose
```

### Cas 4 : Produit Sur Mesure
```typescript
const custom_pc = {
  name: "PC Gaming Sur Mesure",
  pricingType: 'QUOTE_REQUIRED',
  requiresQuote: true
}
// Pas de prix affiché
// Le client décrit ses besoins
// L'admin prépare un devis personnalisé
```

## 🔄 Flux de Travail

### Pour FIXED
```
Client voit le prix
    ↓
Ajoute au panier
    ↓
Commande confirmée
```

### Pour RANGE avec Auto-Accept
```
Client voit la plage
    ↓
Propose un prix (dans la plage)
    ↓
Prix accepté automatiquement
    ↓
Ajouté au panier
```

### Pour NEGOTIABLE
```
Client voit le prix
    ↓
Propose un prix
    ↓
Admin reçoit la notification
    ↓
Admin accepte/refuse/contre-propose
    ↓
Client notifié de la réponse
```

### Pour QUOTE_REQUIRED
```
Client voit "Devis requis"
    ↓
Décrit ses besoins + budget
    ↓
Admin reçoit la demande
    ↓
Admin prépare un devis détaillé
    ↓
Client reçoit le devis
    ↓
Client accepte/négocie
```

## ⚙️ Configuration Recommandée par Catégorie

| Catégorie | Type recommandé | Raison |
|-----------|----------------|---------|
| Accessoires | FIXED | Prix standards, pas de négociation |
| Électronique | RANGE ou NEGOTIABLE | Marges flexibles, prix variables |
| Vêtements | FIXED | Tailles définies, prix fixes |
| Ordinateurs | NEGOTIABLE | Configurations variables, négociable |
| Services IT | QUOTE_REQUIRED | Chaque projet unique |
| Gros volumes | RANGE | Remises quantitatives |

## 🚀 Migration des Produits Existants

Tous les produits existants sont automatiquement configurés en `FIXED` après la migration.

Pour modifier le type de tarification :
1. Aller dans `/admin/products`
2. Cliquer sur "Modifier" pour un produit
3. Onglet "Prix"
4. Changer le "Type de tarification"
5. Configurer les options selon le type
6. Enregistrer

## 🎯 Bonnes Pratiques

### ✅ À FAIRE :
- Utiliser FIXED pour les produits standards
- Utiliser RANGE avec auto-accept pour les remises automatiques
- Définir des plages de prix réalistes (min/max)
- Fournir des descriptions claires pour les devis
- Surveiller le stock automatique avec variations

### ❌ À ÉVITER :
- Ne pas mettre tous les produits en QUOTE_REQUIRED
- Ne pas définir des plages trop larges (ex: 10k-1M)
- Ne pas oublier de répondre aux demandes de devis
- Ne pas activer auto-accept sans définir les limites
- Ne pas modifier manuellement le stock s'il y a des variations

## 📞 Support

Pour toute question sur le système de tarification flexible :
- Documentation : `/docs/TARIFICATION_PRODUITS_FLEXIBLE.md`
- Code : `components/products/product-form-enhanced.tsx`
- Composant client : `components/products/product-pricing-selector.tsx`

## 🔄 Changelog

### Version 1.0.0 (Novembre 2025)
- ✨ Ajout du système de tarification flexible
- 📊 Stock automatique basé sur les variations
- 🎨 Interface admin améliorée
- 🛒 Composant ProductPricingSelector
- 📱 Support complet des 4 types de prix
- 🔐 Validation et sécurité des propositions



