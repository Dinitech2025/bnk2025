# Guide - Upload de Favicon (.ico)

## Problème résolu

L'erreur `"Can't resize to requested dimensions"` se produisait lors de l'upload de fichiers `.ico` car Cloudinary ne peut pas appliquer les transformations de redimensionnement sur les fichiers ICO.

## Modifications apportées

### 1. API Upload (`app/api/upload/route.ts`)

**Validation des types de fichiers améliorée :**
- Accepte maintenant `image/x-icon` et `image/vnd.microsoft.icon`
- Détection par extension `.ico`

**Nouveau type "favicon" :**
- Dossier spécifique : `bnk/favicons/`
- Upload en mode `raw` (sans transformation)
- Préservation du format `.ico`

**Gestion intelligente des logos :**
- Fichiers `.ico` → Mode `raw` sans transformation
- Autres formats → Transformations normales (500x500px)

### 2. Composant ImageUpload (`components/ui/image-upload.tsx`)

**Nouveau variant "favicon" :**
- Support du type `favicon` dans les interfaces TypeScript
- Attribution automatique du bon type d'upload
- Attribut `accept` étendu pour inclure `.ico`

### 3. Page des paramètres (`app/(admin)/admin/settings/appearance/page.tsx`)

**Favicon spécialisé :**
- Utilisation du variant `favicon` au lieu de `logo`
- Upload optimisé pour les fichiers ICO

## Types d'upload disponibles

| Type | Dossier | Transformations | Usage |
|------|---------|----------------|-------|
| `favicon` | `bnk/favicons/` | Aucune (raw) | Fichiers .ico uniquement |
| `logo` | `bnk/logos/` | 500x500px ou raw si .ico | Logos du site |
| `profile` | `bnk/profiles/` | 400x400px crop face | Photos de profil |
| `product` | `bnk/products/` | 800x800px | Images produits |
| `service` | `bnk/services/` | 1200px largeur | Images services |
| `offer` | `bnk/offers/` | 1200x630px | Images offres |

## Comment tester

1. **Accédez aux paramètres d'apparence :**
   ```
   http://localhost:3000/admin/settings/appearance
   ```

2. **Uploadez un favicon :**
   - Cliquez sur "Ajouter un logo" dans la section Favicon
   - Sélectionnez un fichier `.ico`
   - Le fichier devrait s'uploader sans erreur

3. **Vérifiez l'upload :**
   - L'URL générée pointera vers `bnk/favicons/`
   - Le fichier sera uploadé en mode `raw` sans transformation

## Formats supportés pour favicon

- ✅ `.ico` (recommandé)
- ✅ `.png` 
- ✅ `.jpg`
- ✅ `.gif`
- ✅ `.svg`

## Notes techniques

- Les fichiers `.ico` sont uploadés en mode `resource_type: 'raw'`
- Pas de transformation appliquée pour préserver la compatibilité
- Dossier séparé pour organiser les favicons
- Validation étendue des types MIME

## Dépannage

Si l'upload échoue encore :

1. **Vérifiez la taille du fichier :**
   - Limite Cloudinary : généralement 10MB
   - Favicons recommandés : < 100KB

2. **Vérifiez le format :**
   - Utilisez un vrai fichier `.ico` 
   - Pas seulement une image renommée

3. **Consultez les logs :**
   - Ouvrez la console du navigateur
   - Vérifiez les logs du serveur Next.js

## Exemple d'URL générée

```
https://res.cloudinary.com/defgsvs5i/raw/upload/v1234567890/bnk/favicons/mon-favicon.ico
``` 