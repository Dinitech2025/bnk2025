import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { convertDevToCmdOrderNumber } from '@/lib/utils'

interface PaymentData {
  amount: number
  method: string
  provider?: string
  transactionId?: string
  reference?: string
  notes?: string
}

/**
 * Créer un nouveau paiement pour une commande
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const orderId = params.id
    const paymentData: PaymentData = await request.json()

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Calculer le montant total déjà payé
    const totalPaid = order.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Vérifier que le nouveau paiement ne dépasse pas le total de la commande
    const newTotal = totalPaid + paymentData.amount
    if (newTotal > Number(order.total)) {
      return NextResponse.json(
        { error: `Le montant total des paiements (${newTotal} ${order.currency}) ne peut pas dépasser le total de la commande (${order.total} ${order.currency})` },
        { status: 400 }
      )
    }

    // Créer le paiement dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const payment = await tx.payment.create({
        data: {
          orderId: orderId,
          amount: paymentData.amount,
          currency: order.currency,
          method: paymentData.method,
          provider: paymentData.provider,
          transactionId: paymentData.transactionId,
          reference: paymentData.reference,
          status: 'COMPLETED',
          notes: paymentData.notes,
          processedBy: session.user?.id
        }
      })

      // Calculer le nouveau total payé
      const updatedTotalPaid = totalPaid + paymentData.amount
      const isFullyPaid = updatedTotalPaid >= Number(order.total)

      // Changer le numéro de commande de DEV à CMD s'il y a au moins un paiement
      const isFirstPayment = order.payments.length === 0
      const newOrderNumber = isFirstPayment ? convertDevToCmdOrderNumber(order.orderNumber) : order.orderNumber

      // Mettre à jour le statut de paiement de la commande
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          orderNumber: newOrderNumber,
          paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          // Ne pas changer automatiquement le statut à CONFIRMED, laisser PAID
          status: order.status === 'QUOTE' && isFullyPaid ? 'PAID' : order.status
        },
        include: {
          payments: true,
          subscriptions: true
        }
      })

      // Si la commande est entièrement payée et contient des abonnements, les activer
      if (isFullyPaid && updatedOrder.subscriptions.length > 0) {
        for (const subscription of updatedOrder.subscriptions) {
          if (subscription.status === 'PENDING') {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' }
            })
          }
        }
      }

      return { payment, order: updatedOrder }
    })

    console.log(`✅ Paiement enregistré - Commande: ${order.orderNumber}, Montant: ${paymentData.amount} ${order.currency}, Méthode: ${paymentData.method}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement du paiement' },
      { status: 500 }
    )
  }
}

/**
 * Récupérer tous les paiements d'une commande
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const orderId = params.id

    const payments = await prisma.payment.findMany({
      where: { orderId },
      include: {
        processedByUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    )
  }
}
