const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initImportSettings() {
  console.log('🔧 Initialisation des paramètres de calcul d\'importation...')

  const defaultSettings = [
    // Transport rates (par kg)
    {
      key: 'transport_france_rate',
      value: '15',
      description: 'Tarif transport France (par kg)',
      category: 'transport'
    },
    {
      key: 'transport_usa_rate',
      value: '35',
      description: 'Tarif transport USA (par kg)',
      category: 'transport'
    },
    {
      key: 'transport_uk_rate',
      value: '18',
      description: 'Tarif transport UK (par kg)',
      category: 'transport'
    },

    // Commission rates (pourcentages selon tranches de prix)
    {
      key: 'commission_0_10',
      value: '25',
      description: 'Commission pour prix < 10 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_10_25',
      value: '35',
      description: 'Commission pour prix 10-25 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_25_100',
      value: '38',
      description: 'Commission pour prix 25-100 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_100_200',
      value: '30',
      description: 'Commission pour prix 100-200 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_200_plus',
      value: '25',
      description: 'Commission pour prix > 200 (en %)',
      category: 'commission'
    },

    // Frais fixes
    {
      key: 'processing_fee',
      value: '2',
      description: 'Frais de traitement fixes',
      category: 'fees'
    },
    {
      key: 'tax_rate',
      value: '3.5',
      description: 'Taux de taxe (en %)',
      category: 'fees'
    },

    // Paramètres généraux
    {
      key: 'calculation_method',
      value: 'hybrid',
      description: 'Méthode de calcul (hybrid, original, detailed)',
      category: 'general'
    }
  ]

  for (const setting of defaultSettings) {
    try {
      await prisma.importCalculationSettings.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
          category: setting.category
        },
        create: setting
      })
      console.log(`✅ ${setting.key}: ${setting.value}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${setting.key}:`, error.message)
    }
  }

  console.log('✅ Paramètres de calcul d\'importation initialisés')
}

async function main() {
  try {
    await initImportSettings()
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

module.exports = { initImportSettings } 

const prisma = new PrismaClient()

async function initImportSettings() {
  console.log('🔧 Initialisation des paramètres de calcul d\'importation...')

  const defaultSettings = [
    // Transport rates (par kg)
    {
      key: 'transport_france_rate',
      value: '15',
      description: 'Tarif transport France (par kg)',
      category: 'transport'
    },
    {
      key: 'transport_usa_rate',
      value: '35',
      description: 'Tarif transport USA (par kg)',
      category: 'transport'
    },
    {
      key: 'transport_uk_rate',
      value: '18',
      description: 'Tarif transport UK (par kg)',
      category: 'transport'
    },

    // Commission rates (pourcentages selon tranches de prix)
    {
      key: 'commission_0_10',
      value: '25',
      description: 'Commission pour prix < 10 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_10_25',
      value: '35',
      description: 'Commission pour prix 10-25 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_25_100',
      value: '38',
      description: 'Commission pour prix 25-100 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_100_200',
      value: '30',
      description: 'Commission pour prix 100-200 (en %)',
      category: 'commission'
    },
    {
      key: 'commission_200_plus',
      value: '25',
      description: 'Commission pour prix > 200 (en %)',
      category: 'commission'
    },

    // Frais fixes
    {
      key: 'processing_fee',
      value: '2',
      description: 'Frais de traitement fixes',
      category: 'fees'
    },
    {
      key: 'tax_rate',
      value: '3.5',
      description: 'Taux de taxe (en %)',
      category: 'fees'
    },

    // Paramètres généraux
    {
      key: 'calculation_method',
      value: 'hybrid',
      description: 'Méthode de calcul (hybrid, original, detailed)',
      category: 'general'
    }
  ]

  for (const setting of defaultSettings) {
    try {
      await prisma.importCalculationSettings.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
          category: setting.category
        },
        create: setting
      })
      console.log(`✅ ${setting.key}: ${setting.value}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${setting.key}:`, error.message)
    }
  }

  console.log('✅ Paramètres de calcul d\'importation initialisés')
}

async function main() {
  try {
    await initImportSettings()
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

module.exports = { initImportSettings } 