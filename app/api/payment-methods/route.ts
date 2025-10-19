import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API publique pour récupérer les méthodes de paiement actives
 * Utilisée par les composants de checkout et d'administration des commandes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const amountStr = searchParams.get('amount')
    const currency = searchParams.get('currency') || 'Ar'

    const amount = amountStr ? parseFloat(amountStr) : null

    // Construire les conditions de filtrage
    const methodWhere: any = {}
    const providerWhere: any = {}

    if (!includeInactive) {
      methodWhere.isActive = true
      providerWhere.isActive = true
    }

    // Filtrer par montant si spécifié
    if (amount !== null) {
      // Pour les méthodes de paiement
      methodWhere.AND = [
        {
          OR: [
            { minAmount: null },
            { minAmount: { lte: amount } }
          ]
        },
        {
          OR: [
            { maxAmount: null },
            { maxAmount: { gte: amount } }
          ]
        }
      ]

      // Pour les fournisseurs
      providerWhere.AND = [
        {
          OR: [
            { minAmount: null },
            { minAmount: { lte: amount } }
          ]
        },
        {
          OR: [
            { maxAmount: null },
            { maxAmount: { gte: amount } }
          ]
        }
      ]
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: methodWhere,
      include: {
        providers: {
          where: providerWhere,
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Filtrer les méthodes selon leur type et leurs fournisseurs
    const filteredMethods = paymentMethods.filter(method => {
      if (includeInactive) return true
      
      // Les méthodes DIRECT et MANUAL n'ont pas besoin de fournisseurs
      if (method.type === 'DIRECT' || method.type === 'MANUAL') {
        return true
      }
      
      // Les méthodes PROVIDERS ont besoin d'au moins un fournisseur actif
      if (method.type === 'PROVIDERS') {
        return method.providers.some(provider => provider.isActive)
      }
      
      return false
    })

    // Calculer les frais pour chaque méthode et fournisseur si un montant est fourni
    const methodsWithFees = filteredMethods.map(method => {
      const calculateFee = (feeType: string | null, feeValue: number | null, amount: number) => {
        if (!feeType || !feeValue || feeType === 'NONE') return 0
        
        if (feeType === 'PERCENTAGE') {
          return (amount * Number(feeValue)) / 100
        } else if (feeType === 'FIXED') {
          return Number(feeValue)
        }
        
        return 0
      }

      const methodFee = amount !== null ? calculateFee(method.feeType, Number(method.feeValue), amount) : null

      const providersWithFees = method.providers.map(provider => {
        const providerFee = amount !== null ? calculateFee(provider.feeType, Number(provider.feeValue), amount) : null
        const totalFee = amount !== null ? (methodFee || 0) + (providerFee || 0) : null

        return {
          ...provider,
          calculatedFee: providerFee,
          totalFee: totalFee,
          finalAmount: amount !== null && totalFee !== null ? amount + totalFee : null
        }
      })

      return {
        ...method,
        calculatedFee: methodFee,
        providers: providersWithFees
      }
    })

    return NextResponse.json({
      paymentMethods: methodsWithFees,
      currency,
      amount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des méthodes de paiement' },
      { status: 500 }
    )
  }
}

/**
 * Récupérer une méthode de paiement spécifique par son code
 */
export async function POST(request: NextRequest) {
  try {
    const { code, providerId, amount } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Le code de la méthode est obligatoire' },
        { status: 400 }
      )
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { code },
      include: {
        providers: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!paymentMethod || !paymentMethod.isActive) {
      return NextResponse.json(
        { error: 'Méthode de paiement non trouvée ou inactive' },
        { status: 404 }
      )
    }

    // Si un fournisseur spécifique est demandé
    if (providerId) {
      const provider = paymentMethod.providers.find(p => p.id === providerId)
      if (!provider) {
        return NextResponse.json(
          { error: 'Fournisseur non trouvé ou inactif' },
          { status: 404 }
        )
      }

      // Vérifier les limites de montant si spécifié
      if (amount !== undefined && amount !== null) {
        if (provider.minAmount && amount < Number(provider.minAmount)) {
          return NextResponse.json(
            { error: `Le montant minimum pour ce fournisseur est ${provider.minAmount}` },
            { status: 400 }
          )
        }
        if (provider.maxAmount && amount > Number(provider.maxAmount)) {
          return NextResponse.json(
            { error: `Le montant maximum pour ce fournisseur est ${provider.maxAmount}` },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json({
      paymentMethod,
      selectedProvider: providerId ? paymentMethod.providers.find(p => p.id === providerId) : null
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la méthode de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la méthode de paiement' },
      { status: 500 }
    )
  }
}
