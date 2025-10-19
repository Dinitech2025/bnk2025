import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API pour nettoyer les paniers expirés
 * Accessible uniquement aux administrateurs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier que l'utilisateur est connecté et est admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé - Connexion requise' },
        { status: 401 }
      )
    }

    // Vérifier le rôle admin (ajustez selon votre système de rôles)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé - Droits administrateur requis' },
        { status: 403 }
      )
    }

    const now = new Date()
    
    // Statistiques avant nettoyage
    const stats = await prisma.cart.groupBy({
      by: ['userId'],
      where: {
        expiresAt: {
          lt: now
        }
      },
      _count: {
        id: true
      }
    })
    
    const expiredCartsCount = await prisma.cart.count({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredItemsCount = await prisma.cartItem.count({
      where: {
        cart: {
          expiresAt: {
            lt: now
          }
        }
      }
    })

    if (expiredCartsCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun panier expiré à nettoyer',
        cleaned: {
          carts: 0,
          items: 0
        },
        statistics: {
          totalExpiredCarts: 0,
          guestCarts: 0,
          userCarts: 0
        }
      })
    }

    // Supprimer les paniers expirés (cascade supprimera les items)
    const result = await prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    // Calculer les statistiques
    const guestCarts = stats.filter(s => s.userId === null).reduce((sum, s) => sum + s._count.id, 0)
    const userCarts = stats.filter(s => s.userId !== null).reduce((sum, s) => sum + s._count.id, 0)

    console.log(`🧹 Nettoyage manuel des paniers: ${result.count} paniers et ${expiredItemsCount} articles supprimés`)

    return NextResponse.json({
      success: true,
      message: `${result.count} paniers expirés supprimés avec succès`,
      cleaned: {
        carts: result.count,
        items: expiredItemsCount
      },
      statistics: {
        totalExpiredCarts: expiredCartsCount,
        guestCarts,
        userCarts
      },
      cleanupDate: now.toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des paniers:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du nettoyage des paniers',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * API pour obtenir les statistiques des paniers expirés
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier que l'utilisateur est connecté et est admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé - Connexion requise' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé - Droits administrateur requis' },
        { status: 403 }
      )
    }

    const now = new Date()
    
    // Statistiques des paniers expirés
    const expiredCartsCount = await prisma.cart.count({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredGuestCarts = await prisma.cart.count({
      where: {
        userId: null,
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredUserCarts = await prisma.cart.count({
      where: {
        userId: { not: null },
        expiresAt: {
          lt: now
        }
      }
    })
    
    const expiredItemsCount = await prisma.cartItem.count({
      where: {
        cart: {
          expiresAt: {
            lt: now
          }
        }
      }
    })

    // Statistiques des paniers actifs
    const activeCarts = await prisma.cart.count({
      where: {
        expiresAt: {
          gt: now
        }
      }
    })
    
    const activeGuestCarts = await prisma.cart.count({
      where: {
        userId: null,
        expiresAt: {
          gt: now
        }
      }
    })
    
    const activeUserCarts = await prisma.cart.count({
      where: {
        userId: { not: null },
        expiresAt: {
          gt: now
        }
      }
    })

    return NextResponse.json({
      success: true,
      statistics: {
        expired: {
          totalCarts: expiredCartsCount,
          guestCarts: expiredGuestCarts,
          userCarts: expiredUserCarts,
          totalItems: expiredItemsCount
        },
        active: {
          totalCarts: activeCarts,
          guestCarts: activeGuestCarts,
          userCarts: activeUserCarts
        },
        expirySettings: {
          guestCartExpiryDays: 3,
          lastCheck: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des statistiques',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}




