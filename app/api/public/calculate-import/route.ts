import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Configuration des entrepôts
const WAREHOUSES = {
  air: {
    usa: { name: 'États-Unis', currency: 'USD', origin: 'usa' },
    france: { name: 'France', currency: 'EUR', origin: 'france' },
    uk: { name: 'Royaume-Uni', currency: 'GBP', origin: 'uk' }
  },
  sea: {
    france: { name: 'France', currency: 'EUR', origin: 'france', transitTime: '25-35 jours' },
    china: { name: 'Chine', currency: 'USD', origin: 'china', transitTime: '30-40 jours' }
  }
}

interface CalculationRequest {
  mode: 'air' | 'sea'
  productName?: string
  productUrl?: string
  supplierPrice: number
  supplierCurrency: string
  weight: number
  warehouse: string
  volume?: number
}

export async function POST(request: NextRequest) {
  try {
    const data: CalculationRequest = await request.json()
    const { mode, productName, productUrl, supplierPrice, supplierCurrency, weight, warehouse, volume } = data

    // Validation des données
    if (!mode || supplierPrice === undefined || supplierPrice === null || !supplierCurrency || (weight === undefined && weight !== 0) || !warehouse) {
      return new NextResponse(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400 }
      )
    }

    if (supplierPrice <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Le prix fournisseur doit être supérieur à 0' }),
        { status: 400 }
      )
    }

    if (mode === 'sea' && (!volume || volume <= 0)) {
      return new NextResponse(
        JSON.stringify({ error: 'Le volume est requis pour le transport maritime' }),
        { status: 400 }
      )
    }

    // Récupérer les taux de change
    const exchangeRateSettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'exchangeRate_' }
      }
    })

    const exchangeRates: Record<string, number> = {}
    exchangeRateSettings.forEach((setting: any) => {
      const currencyCode = setting.key.replace('exchangeRate_', '')
      exchangeRates[currencyCode] = parseFloat(setting.value || '1')
    })

    // Récupérer les paramètres de calcul depuis ImportCalculationSettings
    const importSettings = await prisma.importCalculationSettings.findMany()
    
    const settings: Record<string, number> = {}
    importSettings.forEach((setting: any) => {
      settings[setting.key] = parseFloat(setting.value || '0')
    })

    // Fonction pour convertir vers MGA
    const convertToMGA = (amount: number, fromCurrency: string): number => {
      if (fromCurrency === 'MGA') return amount
      
      const mgaRate = exchangeRates['MGA'] || 1
      const fromRate = exchangeRates[fromCurrency] || 1
      
      if (mgaRate === 1) {
        return amount / fromRate
      }
      
      return amount * (mgaRate / fromRate)
    }

    // Obtenir la configuration de l'entrepôt
    const warehouseConfig = WAREHOUSES[mode][warehouse as keyof typeof WAREHOUSES[typeof mode]]
    if (!warehouseConfig) {
      return new NextResponse(
        JSON.stringify({ error: 'Entrepôt non valide' }),
        { status: 400 }
      )
    }

    // Convertir le prix fournisseur en devise de l'entrepôt pour les calculs
    const supplierPriceInWarehouseCurrency = supplierPrice * 
      (exchangeRates[warehouseConfig.currency] / exchangeRates[supplierCurrency])

    // Calculer le transport selon l'origine
    let transportRateInEUR = 0
    switch (warehouseConfig.origin) {
      case 'france':
        transportRateInEUR = settings['transport_france_rate'] || 15
        break
      case 'usa':
        transportRateInEUR = settings['transport_usa_rate'] || 35
        break
      case 'uk':
        transportRateInEUR = settings['transport_uk_rate'] || 18
        break
      case 'china':
        transportRateInEUR = settings['transport_china_rate'] || 25
        break
      default:
        transportRateInEUR = 15
    }
    
    // Convertir le taux de transport de EUR vers la devise de l'entrepôt
    const transportRate = transportRateInEUR * (exchangeRates[warehouseConfig.currency] / exchangeRates['EUR'])
    const transportCost = weight * transportRate

    // Calculer la commission variable selon le prix
    let commissionRate = 0
    if (supplierPriceInWarehouseCurrency < 10) {
      commissionRate = settings['commission_0_10'] || 25
    } else if (supplierPriceInWarehouseCurrency < 25) {
      commissionRate = settings['commission_10_25'] || 35
    } else if (supplierPriceInWarehouseCurrency < 100) {
      commissionRate = settings['commission_25_100'] || 38
    } else if (supplierPriceInWarehouseCurrency < 200) {
      commissionRate = settings['commission_100_200'] || 30
    } else {
      commissionRate = settings['commission_200_plus'] || 25
    }

    const commission = (supplierPriceInWarehouseCurrency * commissionRate) / 100

    // Frais fixes
    const processingFee = settings['processing_fee'] || 2
    const taxRate = settings['tax_rate'] || 3.5
    const tax = (supplierPriceInWarehouseCurrency * taxRate) / 100

    // Total en devise de l'entrepôt
    const totalInWarehouseCurrency = supplierPriceInWarehouseCurrency + transportCost + commission + processingFee + tax

    // Convertir en MGA
    const totalInMGA = convertToMGA(totalInWarehouseCurrency, warehouseConfig.currency)

    // Déterminer le délai de livraison
    let transitTime = '5-10 jours ouvrés'
    if (mode === 'sea') {
      transitTime = warehouseConfig.transitTime || '25-35 jours'
    } else {
      // Transport aérien
      switch (warehouseConfig.origin) {
        case 'usa':
          transitTime = '7-12 jours ouvrés'
          break
        case 'france':
          transitTime = '5-8 jours ouvrés'
          break
        case 'uk':
          transitTime = '6-10 jours ouvrés'
          break
        default:
          transitTime = '5-10 jours ouvrés'
      }
    }

    const calculation = {
      productInfo: {
        name: productName || 'Produit sans nom',
        url: productUrl,
        weight,
        volume: mode === 'sea' ? volume : undefined,
        mode,
        warehouse: warehouseConfig.name
      },
      costs: {
        supplierPrice: {
          amount: supplierPrice,
          currency: supplierCurrency,
          amountInMGA: convertToMGA(supplierPrice, supplierCurrency)
        },
        transport: {
          amount: transportCost,
          currency: warehouseConfig.currency,
          amountInMGA: convertToMGA(transportCost, warehouseConfig.currency),
          details: `${weight} kg × ${transportRateInEUR} EUR/kg → ${transportRate.toFixed(2)} ${warehouseConfig.currency}/kg`
        },
        commission: {
          amount: commission,
          currency: warehouseConfig.currency,
          amountInMGA: convertToMGA(commission, warehouseConfig.currency),
          rate: commissionRate,
          details: `${commissionRate}% du prix fournisseur`
        },
        fees: {
          processing: {
            amount: processingFee,
            currency: warehouseConfig.currency,
            amountInMGA: convertToMGA(processingFee, warehouseConfig.currency)
          },
          tax: {
            amount: tax,
            currency: warehouseConfig.currency,
            amountInMGA: convertToMGA(tax, warehouseConfig.currency),
            rate: taxRate
          }
        },
        total: totalInMGA
      },
      calculationMethod: `Calcul basé sur les paramètres d'importation de ${warehouseConfig.name}`,
      transitTime
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('Erreur lors du calcul d\'importation:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500 }
    )
  }
} 