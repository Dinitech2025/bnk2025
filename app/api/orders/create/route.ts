import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    console.log('📦 Création nouvelle commande:', {
      userId: session?.user?.id,
      itemsCount: body.items?.length,
      total: body.total,
      paymentMethod: body.paymentData?.method
    })

    // Extraire les données
    const {
      items,
      total,
      currency,
      shippingAddress,
      billingAddress,
      email,
      phone,
      firstName,
      lastName,
      paymentData,
      notes
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article dans la commande' },
        { status: 400 }
      )
    }

    if (!paymentData || !paymentData.transactionId) {
      return NextResponse.json(
        { error: 'Données de paiement manquantes' },
        { status: 400 }
      )
    }

    // Générer un numéro de commande unique
    const orderNumber = `BN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Créer la commande en base de données
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || 'guest',
        
        // Montants
        total,
        
        // Statut
        status: 'CONFIRMED',
        
        // Articles de la commande
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            serviceId: item.serviceId || null,
            itemType: item.type || 'product',
            quantity: item.quantity || 1,
            unitPrice: item.price,
            totalPrice: item.price * (item.quantity || 1),
            metadata: item.metadata ? JSON.stringify(item.metadata) : null
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                inventory: true
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('✅ Commande créée avec succès:', {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      itemsCount: order.items.length
    })

    // Log pour audit
    console.log(`📋 AUDIT COMMANDE: ${order.orderNumber}`)
    console.log(`   User: ${order.userId || 'Guest'} (${order.user?.email || 'No email'})`)
    console.log(`   Total: ${order.total}`)
    console.log(`   Items: ${order.items.length} articles`)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        items: order.items,
        createdAt: order.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Erreur création commande:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la commande',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
