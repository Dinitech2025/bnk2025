# Guide : Affichage du Mode de Paiement dans la Liste des Commandes

## 📋 Aperçu

Cette fonctionnalité ajoute l'affichage du mode de paiement sous le statut de chaque commande dans la liste des commandes de l'administration.

## 🎯 Objectif

Permettre aux administrateurs de voir rapidement le mode de paiement utilisé pour chaque commande sans avoir à ouvrir les détails de la commande.

## 🔧 Modifications Apportées

### 1. Composant OrdersList (`components/admin/orders/orders-list.tsx`)

#### Ajout du type metadata
```typescript
type OrderWithRelations = {
  // ... autres champs
  items: Array<{
    // ... autres champs
    metadata: string | null;  // ← Nouveau champ ajouté
    // ... autres champs
  }>;
};
```

#### Fonction d'extraction du mode de paiement
```typescript
const getPaymentMethod = (order: OrderWithRelations): string => {
  // Chercher dans les métadonnées du premier item
  if (order.items && order.items.length > 0 && order.items[0].metadata) {
    try {
      const metadata = JSON.parse(order.items[0].metadata);
      if (metadata.paymentMethod) {
        const paymentMethods: { [key: string]: string } = {
          'mobile_money': 'Mobile Money',
          'bank_transfer': 'Virement bancaire',
          'cash_on_delivery': 'Paiement à la livraison',
          'credit_card': 'Carte bancaire',
          'card': 'Carte bancaire'
        };
        return paymentMethods[metadata.paymentMethod] || metadata.paymentMethod;
      }
    } catch (error) {
      console.error('Erreur lors du parsing des métadonnées:', error);
    }
  }
  return 'Non spécifié';
};
```

#### Modification de l'affichage de la colonne statut
```tsx
<TableCell>
  <div className="space-y-1">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 hover:bg-transparent">
          <OrderStatusBadge status={order.status} />
        </Button>
      </DropdownMenuTrigger>
      {/* ... menu dropdown ... */}
    </DropdownMenu>
    <div className="text-xs text-muted-foreground">
      {getPaymentMethod(order)}
    </div>
  </div>
</TableCell>
```

### 2. Récupération des Données

La requête Prisma dans `app/(admin)/admin/orders/page.tsx` utilise déjà `include` pour les items, ce qui inclut automatiquement tous les champs y compris `metadata`.

## 📊 Modes de Paiement Supportés

| Code API | Affichage |
|----------|-----------|
| `mobile_money` | Mobile Money |
| `bank_transfer` | Virement bancaire |
| `cash_on_delivery` | Paiement à la livraison |
| `credit_card` | Carte bancaire |
| `card` | Carte bancaire |

## 🎨 Apparence

- **Statut** : Badge coloré cliquable (existant)
- **Mode de paiement** : Texte en petit format, gris (`text-xs text-muted-foreground`)
- **Espacement** : `space-y-1` entre le statut et le mode de paiement

## 📍 Localisation des Métadonnées

Les métadonnées de paiement sont stockées dans le champ `metadata` de chaque `OrderItem` au format JSON :

```json
{
  "type": "product|service|subscription",
  "paymentMethod": "mobile_money|bank_transfer|cash_on_delivery|credit_card",
  "billingAddress": { ... },
  "shippingAddress": { ... },
  "notes": "..."
}
```

## 🔍 Gestion des Erreurs

- Si les métadonnées ne peuvent pas être parsées : affiche "Non spécifié"
- Si aucune métadonnée n'existe : affiche "Non spécifié"
- Si le mode de paiement n'est pas reconnu : affiche la valeur brute

## ✅ Test

Pour tester la fonctionnalité :

1. Aller sur `http://localhost:3000/admin/orders`
2. Vérifier que sous chaque statut de commande, le mode de paiement s'affiche
3. Les commandes récentes créées via le checkout devraient afficher le bon mode de paiement

## 📝 Notes Techniques

- La fonction `getPaymentMethod` utilise le premier item de la commande pour extraire les métadonnées
- Toutes les commandes d'un même checkout ont le même mode de paiement dans leurs métadonnées
- L'affichage est responsive et s'adapte à la largeur de la colonne
- Aucune modification de base de données n'était nécessaire car les métadonnées étaient déjà stockées

## 🔗 Fichiers Modifiés

- `components/admin/orders/orders-list.tsx` : Ajout de la fonction et modification de l'affichage
- `app/(admin)/admin/orders/page.tsx` : Aucune modification (la requête était déjà correcte) 