import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les notifications importantes (version simplifiée)
    let lowStockProducts = []
    let pendingOrders = []
    let recentQuotes = []
    
    try {
      // Produits en stock faible (si la colonne stock existe)
      lowStockProducts = await prisma.product.findMany({
        where: {
          inventory: {
            lt: 10
          }
        },
        select: {
          id: true,
          name: true,
          inventory: true
        },
        take: 5
      })
    } catch (error) {
      console.log('Stock notifications not available:', error)
    }
    
    try {
      // Commandes en attente
      pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING'
        },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: 5
      })
    } catch (error) {
      console.log('Pending orders notifications error:', error)
    }
    
    try {
      // Nouveaux devis (si la table quote existe)
      recentQuotes = await prisma.quote.findMany({
        where: {
          status: 'PENDING'
        },
        select: {
          id: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: 5
      })
    } catch (error) {
      console.log('Quotes notifications not available:', error)
    }

    const notifications = []

    // Notifications de stock faible
    lowStockProducts.forEach(product => {
      notifications.push({
        id: `stock-${product.id}`,
        type: 'warning',
        title: 'Stock faible',
        message: `${product.name} - ${product.inventory} unités restantes`,
        action: {
          text: 'Voir le produit',
          url: `/admin/products/${product.id}`
        },
        createdAt: new Date().toISOString()
      })
    })

    // Notifications de commandes en attente
    pendingOrders.forEach(order => {
      notifications.push({
        id: `order-${order.id}`,
        type: 'error',
        title: 'Commande en attente',
        message: `Commande #${order.orderNumber} de ${order.user.firstName} ${order.user.lastName} en attente depuis plus de 24h`,
        action: {
          text: 'Voir la commande',
          url: `/admin/orders/${order.id}`
        },
        createdAt: order.createdAt.toISOString()
      })
    })

    // Notifications de nouveaux devis
    recentQuotes.forEach(quote => {
      notifications.push({
        id: `quote-${quote.id}`,
        type: 'info',
        title: 'Nouveau devis',
        message: `${quote.description.substring(0, 50)}... de ${quote.user.firstName} ${quote.user.lastName}`,
        action: {
          text: 'Voir le devis',
          url: `/admin/quotes/${quote.id}`
        },
        createdAt: quote.createdAt.toISOString()
      })
    })

    // Notifications de devis récents
    recentQuotes.forEach(quote => {
      notifications.push({
        id: `quote-${quote.id}`,
        type: 'info',
        title: 'Nouveau devis',
        message: `${quote.description.substring(0, 50) || 'Demande de devis'}... de ${quote.user.firstName} ${quote.user.lastName}`,
        action: {
          text: 'Voir le devis',
          url: `/admin/quotes/${quote.id}`
        },
        createdAt: quote.createdAt.toISOString()
      })
    })

    // Trier par date (plus récent en premier)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      notifications: notifications.slice(0, 20), // Limiter à 20 notifications
      unreadCount: notifications.length
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    )
  }
}