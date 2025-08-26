// Diagnostic spécifique pour le checkout et les méthodes de paiement
const fs = require('fs')

// Chargement manuel du .env
function loadEnvVariables() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=').trim()
        if (key && value) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.log('⚠️  Impossible de charger .env:', error.message)
  }
}

async function testCheckoutPayment() {
  console.log('🛒 DIAGNOSTIC CHECKOUT - MÉTHODES DE PAIEMENT')
  console.log('==============================================\n')

  loadEnvVariables()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  console.log(`🎯 Test sur: ${baseUrl}`)
  console.log('')

  // 1. Vérifier les variables PayPal
  console.log('1️⃣ Configuration PayPal')
  console.log('------------------------')
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const paypalSecret = process.env.PAYPAL_CLIENT_SECRET
  const paypalMode = process.env.PAYPAL_MODE

  console.log(`   NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${paypalClientId ? '✅ Configuré' : '❌ Manquant'}`)
  console.log(`   PAYPAL_CLIENT_SECRET: ${paypalSecret ? '✅ Configuré' : '❌ Manquant'}`)
  console.log(`   PAYPAL_MODE: ${paypalMode || 'Non défini (défaut: sandbox)'}`)
  console.log('')

  // 2. Test de connectivité de base
  try {
    console.log('2️⃣ Test de connectivité serveur')
    console.log('--------------------------------')
    
    const pingResponse = await fetch(`${baseUrl}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 secondes timeout
    })

    if (pingResponse.ok) {
      console.log('   ✅ Serveur de développement accessible')
    } else {
      console.log(`   ⚠️  Serveur répond avec status: ${pingResponse.status}`)
    }
  } catch (error) {
    console.log('   ❌ Serveur inaccessible')
    console.log(`   Erreur: ${error.message}`)
    console.log('')
    console.log('💡 SOLUTIONS:')
    console.log('   1. Démarrez le serveur: npm run dev')
    console.log('   2. Vérifiez le port (défaut: 3000)')
    console.log('   3. Redémarrez si vous avez modifié les variables .env')
    return
  }

  console.log('')

  // 3. Test des endpoints PayPal
  console.log('3️⃣ Test des endpoints PayPal')
  console.log('-----------------------------')
  
  try {
    // Test create-order
    const createOrderTest = await fetch(`${baseUrl}/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: '10.00',
        currency: 'USD',
        orderData: { test: true }
      })
    })

    console.log(`   /api/paypal/create-order: ${createOrderTest.status} ${createOrderTest.statusText}`)
    
    if (createOrderTest.ok) {
      const orderData = await createOrderTest.json()
      console.log(`   ✅ Création de commande PayPal: ${orderData.id}`)
    } else {
      const errorData = await createOrderTest.json()
      console.log(`   ❌ Erreur: ${errorData.error}`)
    }

  } catch (error) {
    console.log('   ❌ Erreur endpoints PayPal')
    console.log(`   ${error.message}`)
  }

  console.log('')

  // 4. Recommandations
  console.log('💡 RECOMMANDATIONS POUR ÉVITER LES BLOCAGES')
  console.log('-------------------------------------------')
  console.log('   ✅ PayPal se charge maintenant à la demande (bouton "Activer PayPal")')
  console.log('   ✅ Plus de blocage lors de la sélection des méthodes de paiement')
  console.log('   ✅ Méthodes alternatives disponibles: Mobile Money, Paiement à la livraison')
  console.log('')
  console.log('📋 ÉTAPES POUR TESTER:')
  console.log('   1. Redémarrez le serveur si nécessaire: npm run dev')
  console.log('   2. Allez sur /checkout')
  console.log('   3. Sélectionnez une méthode de paiement')
  console.log('   4. Pour PayPal: cliquez sur "Activer PayPal" puis utilisez les boutons')
  console.log('')
  console.log('🎉 Diagnostic terminé!')
}

testCheckoutPayment()
