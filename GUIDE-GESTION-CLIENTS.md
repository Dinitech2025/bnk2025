# Guide de Gestion des Clients - Nouvelles Fonctionnalités

## Vue d'ensemble

Ce guide décrit les nouvelles fonctionnalités améliorées pour la gestion des clients dans l'administration de BoutiKnaka. Les pages de création et modification de clients ont été entièrement repensées pour offrir une meilleure expérience utilisateur et plus de flexibilité.

## Nouvelles Fonctionnalités

### 1. Création de Comptes par Numéro de Téléphone

#### Fonctionnalité
- Possibilité de créer un compte client uniquement avec un numéro de téléphone
- Plus besoin d'email obligatoire pour créer un compte
- Validation intelligente : au moins un email OU un numéro de téléphone requis

#### Comment utiliser
1. Accédez à **Administration > Clients > Nouveau client**
2. Remplissez soit l'email, soit le numéro de téléphone (ou les deux)
3. Si aucun email n'est fourni, un mot de passe temporaire est requis
4. Le client pourra se connecter avec son numéro de téléphone

#### Cas d'usage
- Clients qui n'ont pas d'adresse email
- Clients préférant utiliser leur téléphone pour les communications
- Marchés où l'usage du téléphone mobile est prédominant

### 2. Upload et Redimensionnement de Photo de Profil

#### Fonctionnalité
- Upload de photo de profil avec prévisualisation
- Outil de recadrage intégré pour optimiser la photo
- Redimensionnement automatique en format circulaire
- Support des formats JPG, PNG

#### Comment utiliser
1. Dans le formulaire client, cliquez sur "Ajouter une photo"
2. Sélectionnez une image depuis votre ordinateur
3. Utilisez l'outil de recadrage pour ajuster la zone d'affichage
4. Cliquez sur "Appliquer" pour sauvegarder
5. La photo est automatiquement uploadée et optimisée

#### Avantages
- Photos de profil uniformes et professionnelles
- Amélioration de l'identification visuelle des clients
- Interface moderne et intuitive

### 3. Interface Modernisée

#### Améliorations visuelles
- Design en cartes (cards) pour une meilleure organisation
- Icônes intuitives pour chaque section
- Couleurs et espacement améliorés
- Navigation plus fluide avec boutons de retour

#### Sections organisées
- **Photo de profil** : Upload et gestion de l'avatar
- **Informations personnelles** : Nom, prénom, date de naissance, genre
- **Informations de contact** : Email, téléphone, méthode de communication préférée
- **Type de client** : Particulier ou Entreprise avec champs spécialisés
- **Préférences** : Langue, newsletter
- **Notes** : Informations supplémentaires

### 4. Nouveaux Champs de Données

#### Champs ajoutés
- **Date de naissance** : Pour mieux connaître la clientèle
- **Genre** : Homme, Femme, Autre
- **Méthode de communication préférée** : Email, Téléphone, SMS, WhatsApp
- **Langue préférée** : Français, Anglais, Malagasy
- **Newsletter** : Activation/désactivation des communications marketing
- **Numéro de TVA** : Pour les entreprises

#### Utilité
- Segmentation marketing plus précise
- Communication personnalisée selon les préférences
- Conformité légale pour les entreprises

## Guide d'Utilisation Détaillé

### Création d'un Nouveau Client

1. **Accès à la page**
   - Naviguez vers Administration > Clients
   - Cliquez sur "Nouveau client"

2. **Photo de profil (optionnel)**
   - Cliquez sur "Ajouter une photo"
   - Sélectionnez une image (JPG, PNG recommandé)
   - Ajustez le cadrage avec l'outil de recadrage
   - Validez pour uploader

3. **Informations personnelles**
   - Remplissez le prénom et nom
   - Ajoutez la date de naissance si disponible
   - Sélectionnez le genre

4. **Contact (obligatoire)**
   - Saisissez l'email ET/OU le numéro de téléphone
   - Choisissez la méthode de communication préférée
   - Si pas d'email : définissez un mot de passe temporaire

5. **Type de client**
   - Sélectionnez "Particulier" ou "Entreprise"
   - Pour les entreprises : ajoutez nom et numéro de TVA

6. **Préférences**
   - Définissez la langue préférée
   - Activez/désactivez la newsletter

7. **Notes**
   - Ajoutez des informations complémentaires si nécessaire

8. **Validation**
   - Cliquez sur "Créer le client"
   - Redirection automatique vers la fiche client

### Modification d'un Client Existant

1. **Accès à la modification**
   - Depuis la liste des clients : cliquez sur l'icône de modification
   - Depuis la fiche client : cliquez sur "Modifier"

2. **Modifications**
   - Tous les champs sont pré-remplis avec les données existantes
   - Modifiez les informations souhaitées
   - Changez ou ajoutez une photo de profil

3. **Sauvegarde**
   - Cliquez sur "Enregistrer"
   - Les modifications sont appliquées immédiatement

## Validation et Sécurité

### Règles de validation
- Au moins un email ou un numéro de téléphone obligatoire
- Email unique dans le système
- Mot de passe temporaire requis si pas d'email (nouveaux clients)
- Formats d'image supportés : JPG, PNG

### Sécurité
- Upload d'images sécurisé avec validation du type de fichier
- Redimensionnement automatique pour optimiser l'espace de stockage
- Validation côté serveur de tous les champs

## Compatibilité

### Données existantes
- Tous les clients existants restent compatibles
- Nouveaux champs optionnels pour les clients existants
- Possibilité de compléter les profils progressivement

### API
- API mise à jour pour supporter tous les nouveaux champs
- Rétrocompatibilité maintenue
- Validation flexible selon les données fournies

## Dépannage

### Problèmes courants

**L'upload d'image ne fonctionne pas**
- Vérifiez le format de l'image (JPG, PNG)
- Assurez-vous que la taille n'est pas excessive (< 10MB)
- Vérifiez la connexion internet

**Erreur "Email ou téléphone requis"**
- Remplissez au moins un des deux champs
- Vérifiez le format de l'email
- Vérifiez le format du numéro de téléphone

**Le recadrage d'image ne s'affiche pas**
- Actualisez la page
- Vérifiez que JavaScript est activé
- Essayez avec un autre navigateur

### Support technique
Pour toute assistance technique, contactez l'équipe de développement avec :
- Description détaillée du problème
- Étapes pour reproduire l'erreur
- Captures d'écran si pertinentes

## Conclusion

Ces nouvelles fonctionnalités améliorent considérablement l'expérience de gestion des clients en offrant :
- Plus de flexibilité dans la création de comptes
- Une interface moderne et intuitive
- Des outils visuels pour une meilleure identification
- Une collecte de données plus complète pour un service personnalisé

L'interface a été conçue pour être intuitive et accessible, permettant une adoption rapide par les équipes d'administration. 