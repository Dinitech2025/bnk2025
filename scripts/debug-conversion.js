const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugConversion() {
  console.log('🔍 DIAGNOSTIC COMPLET DES CONVERSIONS')
  console.log('=' .repeat(60))

  try {
    // 1. Récupérer les taux de change
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    console.log('\n💱 TAUX DE CHANGE ACTUELS:')
    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
      console.log(`   ${currency}: ${rate.value}`)
    })

    // 2. Test de conversion simple
    console.log('\n🧪 TEST DE CONVERSION SIMPLE:')
    const testAmount = 45 // 45 EUR
    console.log(`   Montant test: ${testAmount} EUR`)

    // Conversion EUR vers MGA
    const eurToMgaRate = rates['EUR'] || 0.000196
    const amountInMGA = testAmount / eurToMgaRate
    console.log(`   EUR vers MGA: ${testAmount} ÷ ${eurToMgaRate} = ${amountInMGA.toFixed(0)} MGA`)

    // Conversion MGA vers GBP
    const gbpRate = rates['GBP'] || 0.000168
    const amountInGBP = amountInMGA * gbpRate
    console.log(`   MGA vers GBP: ${amountInMGA.toFixed(0)} × ${gbpRate} = ${amountInGBP.toFixed(2)} GBP`)

    // 3. Récupérer les settings
    const importSettings = await prisma.importCalculationSettings.findMany()
    const settings = {}
    importSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value)
    })

    console.log('\n⚙️ SETTINGS TRANSPORT:')
    console.log(`   France: ${settings['transport_france_rate']} EUR/kg`)
    console.log(`   UK: ${settings['transport_uk_rate']} GBP/kg`)

    // 4. Simulation complète
    console.log('\n📦 SIMULATION COMPLÈTE (45 EUR, 1 kg, France):')
    
    // Prix fournisseur en MGA
    const supplierPriceInMGA = 45 / eurToMgaRate
    console.log(`   Prix fournisseur: ${supplierPriceInMGA.toFixed(0)} MGA`)

    // Transport en MGA
    const transportRateEUR = settings['transport_france_rate'] || 15
    const transportRateInMGA = transportRateEUR / eurToMgaRate
    const transportCostInMGA = 1 * transportRateInMGA
    console.log(`   Transport: ${transportRateEUR} EUR/kg = ${transportRateInMGA.toFixed(0)} MGA/kg`)
    console.log(`   Transport total: ${transportCostInMGA.toFixed(0)} MGA`)

    // Commission
    const commissionRate = 38 // 38% pour 25-100 EUR
    const commissionInMGA = (supplierPriceInMGA * commissionRate) / 100
    console.log(`   Commission (${commissionRate}%): ${commissionInMGA.toFixed(0)} MGA`)

    // Total en MGA
    const totalInMGA = supplierPriceInMGA + transportCostInMGA + commissionInMGA
    console.log(`   Total en MGA: ${totalInMGA.toFixed(0)} MGA`)

    // Conversion vers GBP pour affichage
    const totalInGBP = totalInMGA * gbpRate
    console.log(`   Total en GBP: ${totalInGBP.toFixed(2)} GBP`)

    // 5. Vérification des taux
    console.log('\n🔍 VÉRIFICATION DES TAUX:')
    console.log(`   1 EUR = ${eurToMgaRate} MGA ? NON ! Devrait être l'inverse`)
    console.log(`   1 MGA = ${eurToMgaRate} EUR ? OUI !`)
    console.log(`   Donc 45 EUR = 45 ÷ ${eurToMgaRate} = ${(45 / eurToMgaRate).toFixed(0)} MGA`)

    // 6. Test avec les vrais taux
    console.log('\n✅ CALCUL AVEC VRAIS TAUX (1 EUR ≈ 5100 MGA):')
    const realEurToMga = 5100
    const realSupplierInMGA = 45 * realEurToMga
    const realTransportInMGA = 15 * realEurToMga
    const realCommissionInMGA = (realSupplierInMGA * 38) / 100
    const realTotalInMGA = realSupplierInMGA + realTransportInMGA + realCommissionInMGA
    
    console.log(`   Prix: 45 EUR = ${realSupplierInMGA} MGA`)
    console.log(`   Transport: 15 EUR = ${realTransportInMGA} MGA`)
    console.log(`   Commission: ${realCommissionInMGA} MGA`)
    console.log(`   Total: ${realTotalInMGA} MGA`)
    console.log(`   Total en EUR: ${(realTotalInMGA / realEurToMga).toFixed(2)} EUR`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugConversion().catch(console.error) 

const prisma = new PrismaClient()

async function debugConversion() {
  console.log('🔍 DIAGNOSTIC COMPLET DES CONVERSIONS')
  console.log('=' .repeat(60))

  try {
    // 1. Récupérer les taux de change
    const exchangeRates = await prisma.setting.findMany({
      where: { key: { startsWith: 'exchangeRate_' } }
    })

    console.log('\n💱 TAUX DE CHANGE ACTUELS:')
    const rates = {}
    exchangeRates.forEach(rate => {
      const currency = rate.key.replace('exchangeRate_', '')
      rates[currency] = parseFloat(rate.value)
      console.log(`   ${currency}: ${rate.value}`)
    })

    // 2. Test de conversion simple
    console.log('\n🧪 TEST DE CONVERSION SIMPLE:')
    const testAmount = 45 // 45 EUR
    console.log(`   Montant test: ${testAmount} EUR`)

    // Conversion EUR vers MGA
    const eurToMgaRate = rates['EUR'] || 0.000196
    const amountInMGA = testAmount / eurToMgaRate
    console.log(`   EUR vers MGA: ${testAmount} ÷ ${eurToMgaRate} = ${amountInMGA.toFixed(0)} MGA`)

    // Conversion MGA vers GBP
    const gbpRate = rates['GBP'] || 0.000168
    const amountInGBP = amountInMGA * gbpRate
    console.log(`   MGA vers GBP: ${amountInMGA.toFixed(0)} × ${gbpRate} = ${amountInGBP.toFixed(2)} GBP`)

    // 3. Récupérer les settings
    const importSettings = await prisma.importCalculationSettings.findMany()
    const settings = {}
    importSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value)
    })

    console.log('\n⚙️ SETTINGS TRANSPORT:')
    console.log(`   France: ${settings['transport_france_rate']} EUR/kg`)
    console.log(`   UK: ${settings['transport_uk_rate']} GBP/kg`)

    // 4. Simulation complète
    console.log('\n📦 SIMULATION COMPLÈTE (45 EUR, 1 kg, France):')
    
    // Prix fournisseur en MGA
    const supplierPriceInMGA = 45 / eurToMgaRate
    console.log(`   Prix fournisseur: ${supplierPriceInMGA.toFixed(0)} MGA`)

    // Transport en MGA
    const transportRateEUR = settings['transport_france_rate'] || 15
    const transportRateInMGA = transportRateEUR / eurToMgaRate
    const transportCostInMGA = 1 * transportRateInMGA
    console.log(`   Transport: ${transportRateEUR} EUR/kg = ${transportRateInMGA.toFixed(0)} MGA/kg`)
    console.log(`   Transport total: ${transportCostInMGA.toFixed(0)} MGA`)

    // Commission
    const commissionRate = 38 // 38% pour 25-100 EUR
    const commissionInMGA = (supplierPriceInMGA * commissionRate) / 100
    console.log(`   Commission (${commissionRate}%): ${commissionInMGA.toFixed(0)} MGA`)

    // Total en MGA
    const totalInMGA = supplierPriceInMGA + transportCostInMGA + commissionInMGA
    console.log(`   Total en MGA: ${totalInMGA.toFixed(0)} MGA`)

    // Conversion vers GBP pour affichage
    const totalInGBP = totalInMGA * gbpRate
    console.log(`   Total en GBP: ${totalInGBP.toFixed(2)} GBP`)

    // 5. Vérification des taux
    console.log('\n🔍 VÉRIFICATION DES TAUX:')
    console.log(`   1 EUR = ${eurToMgaRate} MGA ? NON ! Devrait être l'inverse`)
    console.log(`   1 MGA = ${eurToMgaRate} EUR ? OUI !`)
    console.log(`   Donc 45 EUR = 45 ÷ ${eurToMgaRate} = ${(45 / eurToMgaRate).toFixed(0)} MGA`)

    // 6. Test avec les vrais taux
    console.log('\n✅ CALCUL AVEC VRAIS TAUX (1 EUR ≈ 5100 MGA):')
    const realEurToMga = 5100
    const realSupplierInMGA = 45 * realEurToMga
    const realTransportInMGA = 15 * realEurToMga
    const realCommissionInMGA = (realSupplierInMGA * 38) / 100
    const realTotalInMGA = realSupplierInMGA + realTransportInMGA + realCommissionInMGA
    
    console.log(`   Prix: 45 EUR = ${realSupplierInMGA} MGA`)
    console.log(`   Transport: 15 EUR = ${realTransportInMGA} MGA`)
    console.log(`   Commission: ${realCommissionInMGA} MGA`)
    console.log(`   Total: ${realTotalInMGA} MGA`)
    console.log(`   Total en EUR: ${(realTotalInMGA / realEurToMga).toFixed(2)} EUR`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugConversion().catch(console.error) 