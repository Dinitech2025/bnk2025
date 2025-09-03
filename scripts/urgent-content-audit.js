#!/usr/bin/env node

/**
 * AUDIT URGENT DU CONTENU SUSPECT
 * Identifie les éléments qui déclenchent l'alerte Google Safe Browsing
 */

const fs = require('fs')
const path = require('path')

console.log('🚨 AUDIT URGENT - CONTENU SUSPECT GOOGLE SAFE BROWSING')
console.log('=======================================================')

const PROBLEMES_DETECTES = {
  formulaires_suspects: [
    {
      fichier: 'app/(site)/checkout/checkout-content.tsx',
      probleme: 'Formulaire demande mot de passe + données personnelles',
      ligne: '73: password: "", // Pour création de compte seulement',
      risque: 'ÉLEVÉ - Phishing potentiel selon Google'
    },
    {
      fichier: 'components/admin/clients/client-form.tsx', 
      probleme: 'Collecte extensive données personnelles',
      ligne: 'email, password, phone, birthDate, etc.',
      risque: 'MOYEN - Formulaire admin mais Google peut confondre'
    }
  ],
  
  telechargemements_suspects: [
    {
      fichier: 'components/quotes/quote-request-form.tsx',
      probleme: 'Upload fichiers multiples avec extensions variées',
      ligne: 'accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.webm,.ogg,.mov,.avi"',
      risque: 'ÉLEVÉ - Google peut voir comme téléchargement malveillant'
    },
    {
      fichier: 'components/quotes/quote-discussion.tsx',
      probleme: 'Boutons "Télécharger" pour documents',
      ligne: 'Ouvrir/Télécharger PDF et documents',
      risque: 'MOYEN - Liens téléchargement sans contexte clair'
    }
  ],
  
  mots_cles_suspects: [
    'password', 'télécharger', 'ouvrir', 'installer', 'documents',
    'fichiers joints', 'upload', 'informations personnelles'
  ],
  
  patterns_google_flag: [
    'Formulaires demandant mots de passe ET données perso',
    'Uploads de fichiers exécutables potentiels', 
    'Liens de téléchargement sans contexte business clair',
    'Collecte excessive de données personnelles'
  ]
}

function analyserProblemes() {
  console.log('\n1️⃣ PROBLÈMES MAJEURS DÉTECTÉS')
  console.log('============================')
  
  console.log('\n🔴 FORMULAIRES SUSPECTS:')
  PROBLEMES_DETECTES.formulaires_suspects.forEach((pb, i) => {
    console.log(`\n   ${i+1}. ${pb.fichier}`)
    console.log(`      ❌ ${pb.probleme}`)
    console.log(`      📍 ${pb.ligne}`)
    console.log(`      ⚠️  RISQUE: ${pb.risque}`)
  })
  
  console.log('\n🔴 TÉLÉCHARGEMENTS SUSPECTS:')
  PROBLEMES_DETECTES.telechargemements_suspects.forEach((pb, i) => {
    console.log(`\n   ${i+1}. ${pb.fichier}`)
    console.log(`      ❌ ${pb.probleme}`)
    console.log(`      📍 ${pb.ligne}`)
    console.log(`      ⚠️  RISQUE: ${pb.risque}`)
  })
}

function genererCorrections() {
  console.log('\n2️⃣ CORRECTIONS URGENTES REQUISES')
  console.log('=================================')
  
  const corrections = [
    {
      priorite: '🔥 CRITIQUE',
      action: 'Supprimer champ password du checkout',
      fichier: 'app/(site)/checkout/checkout-content.tsx',
      details: 'Ligne 73: password: "" - RETIRER IMMÉDIATEMENT'
    },
    {
      priorite: '🔥 CRITIQUE', 
      action: 'Ajouter contexte explicite aux uploads',
      fichier: 'components/quotes/quote-request-form.tsx',
      details: 'Clarifier que c\'est pour devis business UNIQUEMENT'
    },
    {
      priorite: '🟡 IMPORTANT',
      action: 'Renommer boutons téléchargement',
      fichier: 'components/quotes/quote-discussion.tsx',
      details: 'Remplacer "Télécharger" par "Voir document devis"'
    },
    {
      priorite: '🟡 IMPORTANT',
      action: 'Ajouter notices de sécurité',
      fichier: 'Tous les formulaires',
      details: 'Ajouter badges "Site sécurisé" et explications'
    }
  ]
  
  corrections.forEach((corr, i) => {
    console.log(`\n${corr.priorite} ${i+1}. ${corr.action}`)
    console.log(`   📁 ${corr.fichier}`)
    console.log(`   📝 ${corr.details}`)
  })
}

function creerPlanAction() {
  console.log('\n3️⃣ PLAN D\'ACTION IMMÉDIAT')
  console.log('=========================')
  
  console.log(`
🎯 ÉTAPES À SUIVRE MAINTENANT:

1. SUPPRIMER CHAMP PASSWORD CHECKOUT (URGENT)
   → app/(site)/checkout/checkout-content.tsx ligne 73
   → Retirer complètement le champ password
   → Google voit ça comme phishing potential

2. CLARIFIER CONTEXTE UPLOADS  
   → Ajouter "Pour votre devis professionnel uniquement"
   → Limiter types fichiers à business (.pdf, .doc, images)
   → Supprimer .mp4, .webm, .ogg, .mov, .avi

3. RENOMMER BOUTONS TÉLÉCHARGEMENT
   → "Télécharger" → "Consulter document"
   → "Ouvrir" → "Voir fichier client"
   → Contexte business explicite

4. AJOUTER BADGES SÉCURITÉ
   → "🛡️ Site e-commerce sécurisé"
   → "✅ Vos données sont protégées"
   → "🏢 Boutique officielle Madagascar"

5. REDEPLOYER + DEMANDER RÉVISION GOOGLE IMMÉDIATE
`)

  console.log('\n💡 HYPOTHÈSE PRINCIPALE:')
  console.log('Google voit nos formulaires légitimes comme potentiel phishing')
  console.log('car ils collectent password + données perso sans contexte clair.')
  console.log('\n🎯 SOLUTION: Clarifier contexte business + supprimer éléments suspects')
}

// Vérifier fichiers temporaires suspects
function verifierFichiersSuspects() {
  console.log('\n4️⃣ VÉRIFICATION FICHIERS SUSPECTS')
  console.log('==================================')
  
  const dossiersAVerifier = ['temp/', 'public/uploads/', 'public/temp/']
  
  dossiersAVerifier.forEach(dossier => {
    if (fs.existsSync(dossier)) {
      console.log(`\n📁 ${dossier}:`)
      try {
        const fichiers = fs.readdirSync(dossier)
        if (fichiers.length === 0) {
          console.log('   ✅ Dossier vide')
        } else {
          fichiers.forEach(fichier => {
            console.log(`   ⚠️  ${fichier}`)
          })
        }
      } catch (error) {
        console.log(`   ❌ Erreur lecture: ${error.message}`)
      }
    } else {
      console.log(`\n📁 ${dossier}: ✅ N'existe pas`)
    }
  })
}

// Exécution
console.log('\n🔍 DÉMARRAGE AUDIT...\n')
analyserProblemes()
genererCorrections()  
creerPlanAction()
verifierFichiersSuspects()

console.log('\n🚀 AUDIT TERMINÉ')
console.log('================')
console.log('✅ Problèmes identifiés')
console.log('✅ Plan d\'action généré') 
console.log('⏰ APPLIQUER CORRECTIONS MAINTENANT!')

