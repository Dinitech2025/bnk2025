import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les devis avec statistiques (admin seulement)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Construire les filtres
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    // Récupérer les devis avec pagination
    const quotes = await prisma.quote.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            pricingType: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Convertir les champs Decimal en nombres
    const formattedQuotes = quotes.map(quote => ({
      ...quote,
      budget: quote.budget ? parseFloat(quote.budget.toString()) : null,
      finalPrice: quote.finalPrice ? parseFloat(quote.finalPrice.toString()) : null,
      proposedPrice: quote.proposedPrice ? parseFloat(quote.proposedPrice.toString()) : null,
      service: {
        ...quote.service,
        price: quote.service.price ? parseFloat(quote.service.price.toString()) : null
      }
    }))

    // Compter le total
    const total = await prisma.quote.count({ where })

    // Calculer les statistiques de façon simple
    const allQuotes = await prisma.quote.findMany({
      select: {
        status: true,
        finalPrice: true,
        updatedAt: true
      }
    })

    // Calculer les statistiques manuellement
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let pendingCount = 0
    let negotiatingCount = 0
    let priceProposedCount = 0
    let acceptedCount = 0
    let rejectedCount = 0
    let totalValueThisMonth = 0
    let acceptedThisMonth = 0

    allQuotes.forEach(quote => {
      const status = quote.status as string
      switch (status) {
        case 'PENDING':
          pendingCount++
          break
        case 'NEGOTIATING':
          negotiatingCount++
          break
        case 'PRICE_PROPOSED':
          priceProposedCount++
          break
        case 'ACCEPTED':
          acceptedCount++
          if (quote.updatedAt >= startOfMonth) {
            acceptedThisMonth++
            if (quote.finalPrice) {
              totalValueThisMonth += parseFloat(quote.finalPrice.toString())
            }
          }
          break
        case 'REJECTED':
          rejectedCount++
          break
      }
    })

    const statistiques = {
      total: total,
      pending: pendingCount,
      negotiating: negotiatingCount,
      priceProposed: priceProposedCount,
      accepted: acceptedCount,
      rejected: rejectedCount,
      totalValueThisMonth: totalValueThisMonth,
      acceptedThisMonth: acceptedThisMonth
    }

    return NextResponse.json({
      quotes: formattedQuotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics: statistiques
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des devis admin:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 