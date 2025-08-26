// Diagnostic du chargement de la page profil
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

async function testProfileEndpoints() {
  console.log('🔍 DIAGNOSTIC PAGE PROFIL - CHARGEMENT BLOQUÉ')
  console.log('==============================================\n')

  loadEnvVariables()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  console.log(`🎯 Test sur: ${baseUrl}`)
  console.log('')

  try {
    // Test 1: Vérifier si le serveur répond
    console.log('1️⃣ Test de connectivité serveur...')
    const pingResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    console.log(`   Status: ${pingResponse.status} ${pingResponse.statusText}`)
    
    if (pingResponse.ok) {
      console.log('   ✅ Serveur accessible')
      const sessionData = await pingResponse.json()
      console.log(`   Session: ${sessionData.user ? 'Utilisateur connecté' : 'Pas de session'}`)
      
      if (sessionData.user) {
        console.log(`   User ID: ${sessionData.user.id}`)
        console.log(`   Email: ${sessionData.user.email}`)
      }
    } else {
      console.log('   ❌ Serveur non accessible')
      return
    }

    console.log('')

    // Test 2: API Profil
    console.log('2️⃣ Test endpoint /api/profile...')
    const profileResponse = await fetch(`${baseUrl}/api/profile`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    console.log(`   Status: ${profileResponse.status} ${profileResponse.statusText}`)
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      console.log('   ✅ API profil accessible')
      console.log(`   Adresses: ${profileData.addresses?.length || 0}`)
      console.log(`   Commandes: ${profileData.orders?.length || 0}`)
    } else {
      const errorData = await profileResponse.json()
      console.log('   ❌ Erreur API profil')
      console.log(`   Message: ${errorData.message}`)
    }

    console.log('')

    // Test 3: API Adresses
    console.log('3️⃣ Test endpoint /api/profile/addresses...')
    const addressesResponse = await fetch(`${baseUrl}/api/profile/addresses`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    console.log(`   Status: ${addressesResponse.status} ${addressesResponse.statusText}`)
    
    if (addressesResponse.ok) {
      const addressesData = await addressesResponse.json()
      console.log('   ✅ API adresses accessible')
      console.log(`   Nombre d'adresses: ${addressesData.length || 0}`)
      if (addressesData.length > 0) {
        addressesData.forEach((addr, index) => {
          console.log(`   Adresse ${index + 1}: ${addr.type} - ${addr.street}`)
        })
      }
    } else {
      const errorData = await addressesResponse.json()
      console.log('   ❌ Erreur API adresses')
      console.log(`   Message: ${errorData.message}`)
    }

  } catch (error) {
    console.log('❌ Erreur de connectivité globale')
    console.log(`   ${error.message}`)
    console.log('')
    console.log('💡 SOLUTIONS POSSIBLES:')
    console.log('   1. Vérifiez que le serveur est démarré: npm run dev')
    console.log('   2. Vérifiez le port (3000 par défaut)')
    console.log('   3. Redémarrez le serveur si récemment modifié')
  }

  console.log('')
  console.log('🎉 Diagnostic terminé!')
}

testProfileEndpoints()
