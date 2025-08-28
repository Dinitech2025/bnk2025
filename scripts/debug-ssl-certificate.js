// Diagnostic des problèmes de certificat SSL
console.log('🔍 DIAGNOSTIC CERTIFICAT SSL')
console.log('============================\n')

console.log('❌ ERREUR: net::ERR_CERT_AUTHORITY_INVALID')
console.log('==========================================\n')

console.log('🔍 CAUSES POSSIBLES:')
console.log('--------------------')
console.log('1. 🌐 HTTPS en développement local')
console.log('   → Certificat auto-signé non reconnu')
console.log('   → Navigateur bloque les requêtes HTTPS locales')
console.log('')

console.log('2. 🔗 Redirection PayPal Sandbox vs Production')
console.log('   → Sandbox: https://www.sandbox.paypal.com')
console.log('   → Production: https://www.paypal.com')
console.log('   → Certificat différent selon environnement')
console.log('')

console.log('3. 📱 Requêtes API mixtes HTTP/HTTPS')
console.log('   → Site en HTTP + API PayPal en HTTPS')
console.log('   → Problème de Mixed Content')
console.log('')

console.log('4. 🏢 Réseau d\'entreprise/Firewall')
console.log('   → Proxy d\'entreprise bloque certificats externes')
console.log('   → Antivirus analyse et modifie les certificats')
console.log('')

console.log('✅ SOLUTIONS IMMÉDIATES:')
console.log('========================\n')

console.log('🎯 SOLUTION 1: FORCER HTTP EN DÉVELOPPEMENT')
console.log('--------------------------------------------')
console.log('• Modifier le composant PayPalRedirect')
console.log('• Utiliser HTTP au lieu de HTTPS en local')
console.log('• Éviter les problèmes de certificat auto-signé')
console.log('')

console.log('🎯 SOLUTION 2: DÉSACTIVER VÉRIFICATION SSL (DEV ONLY)')
console.log('-----------------------------------------------------')
console.log('• Chrome: --ignore-certificate-errors-spki-list')
console.log('• Chrome: --ignore-ssl-errors')
console.log('• Firefox: about:config → security.insecure_connection_text.enabled')
console.log('')

console.log('🎯 SOLUTION 3: LOCALHOST TRUST')
console.log('------------------------------')
console.log('• Ajouter certificat localhost aux autorités de confiance')
console.log('• Chrome: chrome://flags/#allow-insecure-localhost')
console.log('• Edge: edge://flags/#allow-insecure-localhost')
console.log('')

console.log('🎯 SOLUTION 4: MODE HTTP STRICT')
console.log('-------------------------------')
console.log('• Force toutes les URLs en HTTP en développement')
console.log('• Basculer automatiquement vers HTTPS en production')
console.log('• Variable d\'environnement pour contrôler le protocole')
console.log('')

console.log('⚡ DIAGNOSTIC RAPIDE:')
console.log('---------------------')
console.log('')

// Vérifier l'environnement actuel
if (typeof window !== 'undefined') {
  console.log('🌐 URL ACTUELLE:', window.location.href)
  console.log('🔒 PROTOCOLE:', window.location.protocol)
  console.log('🏠 HOST:', window.location.host)
  console.log('🔧 USER AGENT:', navigator.userAgent.split(' ').slice(0, 3).join(' '))
} else {
  console.log('🖥️ ENVIRONNEMENT: Node.js')
}

console.log('')
console.log('🔍 VARIABLES PAYPAL:')
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID
const paypalSecret = process.env.PAYPAL_CLIENT_SECRET ? '[DÉFINI]' : '[MANQUANT]'
const nodeEnv = process.env.NODE_ENV || 'development'

console.log('• PAYPAL_CLIENT_ID:', paypalClientId ? '[DÉFINI]' : '[MANQUANT]')
console.log('• PAYPAL_CLIENT_SECRET:', paypalSecret)
console.log('• NODE_ENV:', nodeEnv)
console.log('• SANDBOX MODE:', nodeEnv !== 'production' ? 'OUI' : 'NON')
console.log('')

console.log('🚀 SOLUTION RECOMMANDÉE:')
console.log('=========================')
console.log('• Modifier PayPalRedirect pour HTTP en développement')
console.log('• Ajouter détection automatique de protocole')
console.log('• Mode fallback sans SSL en local')
console.log('• Test avec différents navigateurs')
console.log('')

console.log('📋 PROCHAINES ÉTAPES:')
console.log('---------------------')
console.log('1. Modifier composant PayPalRedirect')
console.log('2. Ajouter gestion protocole HTTP/HTTPS')
console.log('3. Test sur Chrome avec flags --ignore-ssl-errors')
console.log('4. Vérifier configuration PayPal Sandbox')
console.log('')

console.log('💡 SOLUTION RAPIDE: Tester sur un autre navigateur ou en mode incognito')
console.log('🔧 Si persistant: Modifier le code pour éviter HTTPS en local')
