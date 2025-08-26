const fs = require('fs')
const path = require('path')

console.log('🔍 DIAGNOSTIC PAYPAL - BoutikNaka')
console.log('================================\n')

// 1. Vérifier les fichiers d'environnement
function checkEnvFiles() {
  console.log('📁 1. VÉRIFICATION DES FICHIERS ENVIRONNEMENT')
  console.log('----------------------------------------------')
  
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development']
  let envFound = false
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - Trouvé`)
      envFound = true
      
      try {
        const content = fs.readFileSync(file, 'utf8')
        const paypalVars = content.split('\n').filter(line => 
          line.includes('PAYPAL') && !line.startsWith('#')
        )
        
        if (paypalVars.length > 0) {
          console.log(`   Variables PayPal dans ${file}:`)
          paypalVars.forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) {
              const maskedValue = value.length > 10 ? 
                value.substring(0, 10) + '...' : 
                '***'
              console.log(`   - ${key}=${maskedValue}`)
            }
          })
        } else {
          console.log(`   ⚠️  Aucune variable PayPal trouvée dans ${file}`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur lecture ${file}: ${error.message}`)
      }
    } else {
      console.log(`❌ ${file} - Non trouvé`)
    }
  })
  
  if (!envFound) {
    console.log('❌ Aucun fichier d\'environnement trouvé!')
  }
  console.log('')
}

// 2. Vérifier les variables d'environnement nécessaires
function checkRequiredVars() {
  console.log('🔑 2. VARIABLES D\'ENVIRONNEMENT REQUISES')
  console.log('------------------------------------------')
  
  const requiredVars = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET', 
    'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
    'PAYPAL_MODE',
    'NEXT_PUBLIC_BASE_URL'
  ]
  
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const maskedValue = value.length > 10 ? 
        value.substring(0, 10) + '...' : 
        '***'
      console.log(`✅ ${varName} = ${maskedValue}`)
    } else {
      console.log(`❌ ${varName} = NON DÉFINIE`)
    }
  })
  console.log('')
}

// 3. Vérifier la configuration PayPal dans le code
function checkPayPalConfig() {
  console.log('⚙️  3. CONFIGURATION PAYPAL DANS LE CODE')
  console.log('-----------------------------------------')
  
  // Vérifier create-order
  const createOrderPath = 'app/api/paypal/create-order/route.ts'
  if (fs.existsSync(createOrderPath)) {
    console.log(`✅ ${createOrderPath} - Trouvé`)
    const content = fs.readFileSync(createOrderPath, 'utf8')
    
    // Vérifier les imports et configurations
    const hasClientId = content.includes('PAYPAL_CLIENT_ID')
    const hasClientSecret = content.includes('PAYPAL_CLIENT_SECRET') 
    const hasBaseUrl = content.includes('PAYPAL_BASE_URL')
    
    console.log(`   - CLIENT_ID configuré: ${hasClientId ? '✅' : '❌'}`)
    console.log(`   - CLIENT_SECRET configuré: ${hasClientSecret ? '✅' : '❌'}`)
    console.log(`   - BASE_URL configuré: ${hasBaseUrl ? '✅' : '❌'}`)
  } else {
    console.log(`❌ ${createOrderPath} - Non trouvé`)
  }
  
  // Vérifier capture-payment
  const capturePaymentPath = 'app/api/paypal/capture-payment/route.ts'
  if (fs.existsSync(capturePaymentPath)) {
    console.log(`✅ ${capturePaymentPath} - Trouvé`)
  } else {
    console.log(`❌ ${capturePaymentPath} - Non trouvé`)
  }
  
  // Vérifier le composant client
  const paypalComponentPath = 'components/checkout/paypal-checkout.tsx'
  if (fs.existsSync(paypalComponentPath)) {
    console.log(`✅ ${paypalComponentPath} - Trouvé`)
  } else {
    console.log(`❌ ${paypalComponentPath} - Non trouvé`)
  }
  console.log('')
}

// 4. Tester la connectivité PayPal
async function testPayPalConnectivity() {
  console.log('🌐 4. TEST DE CONNECTIVITÉ PAYPAL')
  console.log('----------------------------------')
  
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  
  if (!clientId || !clientSecret) {
    console.log('❌ Impossible de tester - Variables manquantes')
    return
  }
  
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'
    
  console.log(`🎯 Mode: ${mode}`)
  console.log(`🔗 URL: ${baseUrl}`)
  
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Authentification PayPal réussie')
      console.log(`   Token type: ${data.token_type}`)
      console.log(`   Expires in: ${data.expires_in}s`)
    } else {
      const error = await response.json()
      console.log('❌ Échec authentification PayPal')
      console.log(`   Status: ${response.status}`)
      console.log(`   Erreur: ${error.error_description || error.error}`)
    }
  } catch (error) {
    console.log('❌ Erreur de connectivité')
    console.log(`   Message: ${error.message}`)
  }
  console.log('')
}

// 5. Recommandations
function showRecommendations() {
  console.log('💡 5. RECOMMANDATIONS')
  console.log('---------------------')
  
  const clientId = process.env.PAYPAL_CLIENT_ID
  const publicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  
  if (!clientId) {
    console.log('🔧 Ajouter PAYPAL_CLIENT_ID dans .env')
  }
  
  if (!process.env.PAYPAL_CLIENT_SECRET) {
    console.log('🔧 Ajouter PAYPAL_CLIENT_SECRET dans .env')
  }
  
  if (!publicClientId) {
    console.log('🔧 Ajouter NEXT_PUBLIC_PAYPAL_CLIENT_ID dans .env')
  }
  
  if (!process.env.PAYPAL_MODE) {
    console.log('🔧 Ajouter PAYPAL_MODE=sandbox dans .env (ou live pour production)')
  }
  
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.log('🔧 Ajouter NEXT_PUBLIC_BASE_URL dans .env')
  }
  
  console.log('')
  console.log('📝 Exemple de configuration .env:')
  console.log('PAYPAL_CLIENT_ID=votre_client_id')
  console.log('PAYPAL_CLIENT_SECRET=votre_client_secret')
  console.log('NEXT_PUBLIC_PAYPAL_CLIENT_ID=votre_client_id')
  console.log('PAYPAL_MODE=sandbox')
  console.log('NEXT_PUBLIC_BASE_URL=http://localhost:3000')
}

// Exécuter le diagnostic
async function runDiagnostic() {
  checkEnvFiles()
  checkRequiredVars()
  checkPayPalConfig()
  await testPayPalConnectivity()
  showRecommendations()
  
  console.log('✨ Diagnostic PayPal terminé!')
}

runDiagnostic().catch(console.error)
