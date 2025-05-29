# Ajout du tri sur la page des produits

## 🎯 **Problème identifié**

La page des produits (`/admin/products`) n'avait pas de fonctionnalité de tri comme les autres pages d'administration (abonnements, clients, etc.). Les en-têtes de colonnes n'étaient pas cliquables et ne permettaient pas de trier les données.

## ✅ **Solution implémentée**

### 1. **Ajout des types TypeScript**
```typescript
type SortField = "name" | "price" | "stock" | "category" | "status" | "createdAt"
type SortOrder = "asc" | "desc"
```

### 2. **Ajout des états de tri**
```typescript
const [sortField, setSortField] = useState<SortField>("createdAt")
const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
```

### 3. **Modification de la fonction de filtrage**
- Renommée `applyFilters()` → `applyFiltersAndSort()`
- Ajout de la logique de tri pour tous les champs
- Tri par défaut : date de création (plus récent en premier)

### 4. **Ajout des fonctions de gestion du tri**
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

### 5. **Modification des en-têtes de tableau**
Transformation des en-têtes statiques en en-têtes cliquables :

**Avant :**
```jsx
<TableHead>Produit</TableHead>
<TableHead>Prix</TableHead>
```

**Après :**
```jsx
<TableHead onClick={() => handleSort("name")} className="cursor-pointer">
  <div className="flex items-center">
    Produit {renderSortIcon("name")}
  </div>
</TableHead>
<TableHead onClick={() => handleSort("price")} className="cursor-pointer">
  <div className="flex items-center">
    Prix {renderSortIcon("price")}
  </div>
</TableHead>
```

## 🔧 **Colonnes triables**

| Colonne | Champ de tri | Description |
|---------|--------------|-------------|
| **Produit** | `name` | Tri alphabétique par nom |
| **Informations** | `category` | Tri par nom de catégorie |
| **Prix** | `price` | Tri numérique par prix |
| **Stock** | `stock` | Tri par stock total |
| **Statut** | `status` | Tri par statut (publié/non publié) |

**Note :** La colonne "Variations" n'est pas triable car elle contient des données complexes.

## 🎨 **Comportement du tri**

1. **Premier clic** : Tri croissant (ASC)
2. **Deuxième clic** : Tri décroissant (DESC)
3. **Changement de colonne** : Retour au tri croissant

## 📊 **Logique de tri par champ**

### Nom (`name`)
```typescript
comparison = a.name.localeCompare(b.name)
```

### Prix (`price`)
```typescript
comparison = Number(a.price) - Number(b.price)
```

### Stock (`stock`)
```typescript
comparison = a.totalInventory - b.totalInventory
```

### Catégorie (`category`)
```typescript
const aCategory = a.category?.name || ''
const bCategory = b.category?.name || ''
comparison = aCategory.localeCompare(bCategory)
```

### Statut (`status`)
```typescript
comparison = a.published === b.published ? 0 : a.published ? -1 : 1
```

### Date de création (`createdAt`)
```typescript
comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
```

## 🎯 **Résultat**

La page des produits a maintenant la même fonctionnalité de tri que les autres pages d'administration :

- ✅ En-têtes cliquables avec curseur pointer
- ✅ Icônes de tri (flèches haut/bas)
- ✅ Tri bidirectionnel (ASC/DESC)
- ✅ Tri cohérent avec les filtres existants
- ✅ Interface utilisateur uniforme

## 🚀 **Utilisation**

1. Se connecter en tant qu'admin : `admin@boutiknaka.com` / `admin123`
2. Aller sur `/admin/products`
3. Cliquer sur les en-têtes de colonnes pour trier
4. Observer les flèches indiquant le sens du tri

La fonctionnalité fonctionne maintenant exactement comme sur la page des abonnements ! 🎉 