# Guide d'utilisation des devises dans la simulation d'importation

## 🎯 Fonctionnalité

La page de simulation d'importation utilise maintenant le système de sélection de devise global de l'administration. Les prix s'affichent automatiquement dans la devise sélectionnée dans l'en-tête admin.

## 🔧 Comment utiliser

### 1. Sélection de la devise d'affichage
- Dans l'en-tête de l'administration (en haut à droite), utilisez le sélecteur de devise
- Choisissez parmi : MGA (Ariary), EUR (Euro), USD (Dollar), GBP (Livre Sterling), etc.
- La devise sélectionnée est sauvegardée automatiquement

### 2. Calcul d'importation
- Allez sur `/admin/products/imported/simulation`
- Remplissez le formulaire normalement
- Tous les prix dans les résultats s'afficheront dans la devise sélectionnée

### 3. Conversion automatique
- Les calculs sont toujours effectués en MGA (devise de base)
- L'affichage est converti en temps réel selon la devise sélectionnée
- Les taux de change sont récupérés depuis la base de données

## 📊 Exemple d'utilisation

### Scénario : iPhone 15 Pro Max depuis la France
**Données d'entrée :**
- Prix fournisseur : 52 EUR
- Poids : 0.3 kg
- Transport : Aérien
- Entrepôt : France

**Résultats selon la devise sélectionnée :**

| Devise | Prix fournisseur | Coût total | Prix suggéré |
|--------|------------------|------------|--------------|
| MGA    | 268 264 Ar      | 734 280 Ar | 1 027 992 Ar |
| EUR    | 52,00 €         | 142,34 €   | 199,28 €     |
| USD    | 56,16 $         | 153,73 $   | 215,22 $     |
| GBP    | 43,68 £         | 119,57 £   | 167,40 £     |

## 🎨 Indicateurs visuels

### Badge de devise
- Quand une devise autre que MGA est sélectionnée, un badge "Affiché en [DEVISE]" apparaît dans l'en-tête des résultats

### Note d'information
- Une note bleue explicative s'affiche en haut de la page quand une devise autre que MGA est sélectionnée
- Elle rappelle à l'utilisateur comment changer la devise d'affichage

### Description contextuelle
- Une note sous le titre des résultats explique que les prix sont convertis depuis MGA

## ⚙️ Aspects techniques

### Conversion des prix
```typescript
const formatDisplayPrice = (priceInMGA: number) => {
  if (targetCurrency && targetCurrency !== 'MGA') {
    return formatWithTargetCurrency(priceInMGA, targetCurrency)
  }
  return formatPrice(priceInMGA, 'MGA', 'Ar')
}
```

### Hook utilisé
- `useCurrency()` depuis `@/lib/hooks/use-currency`
- Fournit `formatWithTargetCurrency` et `targetCurrency`
- Gère automatiquement la conversion et le formatage

### Taux de change
- Stockés dans la base de données (table `settings`)
- Clés : `exchangeRate_EUR`, `exchangeRate_USD`, etc.
- EUR est la devise de base (taux = 1)
- MGA a un taux d'environ 5158.93

## 🔄 Synchronisation

### Mise à jour des taux
- Les taux peuvent être mis à jour via `/admin/settings/currency`
- Synchronisation automatique possible avec des APIs externes
- Cache d'1 heure pour optimiser les performances

### Persistance
- La devise sélectionnée est sauvegardée dans `localStorage`
- Restaurée automatiquement lors des prochaines visites
- Partagée entre toutes les pages admin

## 🎯 Avantages

1. **Cohérence** : Même système de devise dans toute l'administration
2. **Flexibilité** : Changement de devise en temps réel
3. **Transparence** : Calculs toujours en MGA, affichage converti
4. **Utilisabilité** : Indicateurs visuels clairs
5. **Performance** : Cache des taux de change

## 🧪 Test

1. Allez sur `http://localhost:3001/admin/products/imported/simulation`
2. Changez la devise dans l'en-tête admin (sélecteur à droite)
3. Remplissez le formulaire avec 52 EUR, 0.3 kg, France, Aérien
4. Cliquez sur "Calculer les coûts"
5. Vérifiez que les prix s'affichent dans la devise sélectionnée
6. Changez la devise et vérifiez la mise à jour automatique 

## 🎯 Fonctionnalité

La page de simulation d'importation utilise maintenant le système de sélection de devise global de l'administration. Les prix s'affichent automatiquement dans la devise sélectionnée dans l'en-tête admin.

## 🔧 Comment utiliser

### 1. Sélection de la devise d'affichage
- Dans l'en-tête de l'administration (en haut à droite), utilisez le sélecteur de devise
- Choisissez parmi : MGA (Ariary), EUR (Euro), USD (Dollar), GBP (Livre Sterling), etc.
- La devise sélectionnée est sauvegardée automatiquement

### 2. Calcul d'importation
- Allez sur `/admin/products/imported/simulation`
- Remplissez le formulaire normalement
- Tous les prix dans les résultats s'afficheront dans la devise sélectionnée

### 3. Conversion automatique
- Les calculs sont toujours effectués en MGA (devise de base)
- L'affichage est converti en temps réel selon la devise sélectionnée
- Les taux de change sont récupérés depuis la base de données

## 📊 Exemple d'utilisation

### Scénario : iPhone 15 Pro Max depuis la France
**Données d'entrée :**
- Prix fournisseur : 52 EUR
- Poids : 0.3 kg
- Transport : Aérien
- Entrepôt : France

**Résultats selon la devise sélectionnée :**

| Devise | Prix fournisseur | Coût total | Prix suggéré |
|--------|------------------|------------|--------------|
| MGA    | 268 264 Ar      | 734 280 Ar | 1 027 992 Ar |
| EUR    | 52,00 €         | 142,34 €   | 199,28 €     |
| USD    | 56,16 $         | 153,73 $   | 215,22 $     |
| GBP    | 43,68 £         | 119,57 £   | 167,40 £     |

## 🎨 Indicateurs visuels

### Badge de devise
- Quand une devise autre que MGA est sélectionnée, un badge "Affiché en [DEVISE]" apparaît dans l'en-tête des résultats

### Note d'information
- Une note bleue explicative s'affiche en haut de la page quand une devise autre que MGA est sélectionnée
- Elle rappelle à l'utilisateur comment changer la devise d'affichage

### Description contextuelle
- Une note sous le titre des résultats explique que les prix sont convertis depuis MGA

## ⚙️ Aspects techniques

### Conversion des prix
```typescript
const formatDisplayPrice = (priceInMGA: number) => {
  if (targetCurrency && targetCurrency !== 'MGA') {
    return formatWithTargetCurrency(priceInMGA, targetCurrency)
  }
  return formatPrice(priceInMGA, 'MGA', 'Ar')
}
```

### Hook utilisé
- `useCurrency()` depuis `@/lib/hooks/use-currency`
- Fournit `formatWithTargetCurrency` et `targetCurrency`
- Gère automatiquement la conversion et le formatage

### Taux de change
- Stockés dans la base de données (table `settings`)
- Clés : `exchangeRate_EUR`, `exchangeRate_USD`, etc.
- EUR est la devise de base (taux = 1)
- MGA a un taux d'environ 5158.93

## 🔄 Synchronisation

### Mise à jour des taux
- Les taux peuvent être mis à jour via `/admin/settings/currency`
- Synchronisation automatique possible avec des APIs externes
- Cache d'1 heure pour optimiser les performances

### Persistance
- La devise sélectionnée est sauvegardée dans `localStorage`
- Restaurée automatiquement lors des prochaines visites
- Partagée entre toutes les pages admin

## 🎯 Avantages

1. **Cohérence** : Même système de devise dans toute l'administration
2. **Flexibilité** : Changement de devise en temps réel
3. **Transparence** : Calculs toujours en MGA, affichage converti
4. **Utilisabilité** : Indicateurs visuels clairs
5. **Performance** : Cache des taux de change

## 🧪 Test

1. Allez sur `http://localhost:3001/admin/products/imported/simulation`
2. Changez la devise dans l'en-tête admin (sélecteur à droite)
3. Remplissez le formulaire avec 52 EUR, 0.3 kg, France, Aérien
4. Cliquez sur "Calculer les coûts"
5. Vérifiez que les prix s'affichent dans la devise sélectionnée
6. Changez la devise et vérifiez la mise à jour automatique 