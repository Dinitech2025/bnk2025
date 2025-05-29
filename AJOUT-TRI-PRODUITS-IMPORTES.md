# Ajout du tri sur la page des produits importés

## 🎯 **Problème identifié**

La page des produits importés (`/admin/products/imported`) n'avait pas de fonctionnalité de tri comme la page des produits normaux. Les en-têtes de colonnes n'étaient pas cliquables et ne permettaient pas de trier les données.

## ✅ **Solution implémentée**

### 1. **Ajout des types TypeScript**
```typescript
type SortField = "name" | "supplierPrice" | "sellingPrice" | "warehouse" | "transport" | "stock" | "createdAt"
type SortOrder = "asc" | "desc"
```

### 2. **Ajout des imports nécessaires**
```typescript
import { 
  // ... autres imports
  ChevronUp,
  ChevronDown
} from 'lucide-react'
```

### 3. **Ajout des états de tri**
```typescript
const [sortField, setSortField] = useState<SortField>("createdAt")
const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
```

### 4. **Modification de la fonction de filtrage**
- Renommée `applyFilters()` → `applyFiltersAndSort()`
- Ajout de la logique de tri pour tous les champs
- Tri par défaut : date de création (plus récent en premier)

### 5. **Ajout des fonctions de gestion du tri**
```typescript
const handleSort = (field: SortField) => {
  if (field === sortField) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  } else {
    setSortField(field)
    setSortOrder("asc")
  }
}

const renderSortIcon = (field: SortField) => {
  if (sortField !== field) return null
  return sortOrder === "asc" ? 
    <ChevronUp className="ml-1 h-4 w-4" /> : 
    <ChevronDown className="ml-1 h-4 w-4" />
}
```

### 6. **Modification des en-têtes de tableau**
Transformation des en-têtes statiques en en-têtes cliquables :

**Avant :**
```jsx
<TableHead>Produit</TableHead>
<TableHead>Prix fournisseur</TableHead>
<TableHead>Prix de vente</TableHead>
```

**Après :**
```jsx
<TableHead onClick={() => handleSort("name")} className="cursor-pointer">
  <div className="flex items-center">
    Produit {renderSortIcon("name")}
  </div>
</TableHead>
<TableHead onClick={() => handleSort("supplierPrice")} className="cursor-pointer">
  <div className="flex items-center">
    Prix fournisseur {renderSortIcon("supplierPrice")}
  </div>
</TableHead>
<TableHead onClick={() => handleSort("sellingPrice")} className="cursor-pointer">
  <div className="flex items-center">
    Prix de vente {renderSortIcon("sellingPrice")}
  </div>
</TableHead>
```

## 🔧 **Colonnes triables**

| Colonne | Champ de tri | Description |
|---------|--------------|-------------|
| **Produit** | `name` | Tri alphabétique par nom |
| **Prix fournisseur** | `supplierPrice` | Tri numérique par prix fournisseur |
| **Prix de vente** | `sellingPrice` | Tri par prix de vente en MGA |
| **Transport** | `warehouse` | Tri par entrepôt/pays |
| **Stock** | `stock` | Tri par quantité en stock |

**Note :** La colonne "Actions" n'est pas triable.

## 🎨 **Comportement du tri**

1. **Premier clic** : Tri croissant (ASC)
2. **Deuxième clic** : Tri décroissant (DESC)
3. **Changement de colonne** : Retour au tri croissant

## 📊 **Logique de tri par champ**

### Nom (`name`)
```typescript
comparison = a.name.localeCompare(b.name)
```

### Prix fournisseur (`supplierPrice`)
```typescript
comparison = a.supplierPrice - b.supplierPrice
```

### Prix de vente (`sellingPrice`)
```typescript
comparison = a.sellingPriceMGA - b.sellingPriceMGA
```

### Entrepôt (`warehouse`)
```typescript
comparison = a.warehouse.localeCompare(b.warehouse)
```

### Transport (`transport`)
```typescript
comparison = a.transportMode.localeCompare(b.transportMode)
```

### Stock (`stock`)
```typescript
comparison = a.inventory - b.inventory
```

### Date de création (`createdAt`)
```typescript
comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
```

## 🎯 **Résultat**

La page des produits importés a maintenant la même fonctionnalité de tri que les autres pages d'administration :

- ✅ En-têtes cliquables avec curseur pointer
- ✅ Icônes de tri (flèches haut/bas)
- ✅ Tri bidirectionnel (ASC/DESC)
- ✅ Tri cohérent avec les filtres existants (entrepôt, transport)
- ✅ Interface utilisateur uniforme

## 🚀 **Utilisation**

1. Se connecter en tant qu'admin : `admin@boutiknaka.com` / `admin123`
2. Aller sur `/admin/products/imported`
3. Cliquer sur les en-têtes de colonnes pour trier
4. Observer les flèches indiquant le sens du tri
5. Utiliser les filtres (entrepôt, transport) en combinaison avec le tri

La fonctionnalité fonctionne maintenant exactement comme sur les pages des produits normaux et des abonnements ! 🎉

## 🔄 **Cohérence avec les autres pages**

Cette modification assure une cohérence parfaite avec :
- `/admin/products` (produits normaux)
- `/admin/streaming/subscriptions` (abonnements)
- `/admin/clients` (clients)
- `/admin/orders` (commandes)

Toutes les pages d'administration ont maintenant le même comportement de tri uniforme. 