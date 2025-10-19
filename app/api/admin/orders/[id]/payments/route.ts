import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { convertDevToCmdOrderNumber } from '@/lib/utils'

interface PaymentData {
  amount: number
  methodId?: string
  providerId?: string
  method: string // Conservé pour compatibilité
  provider?: string // Conservé pour compatibilité
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

    // Récupérer les informations de la méthode et du fournisseur si spécifiés
    let paymentMethod = null
    let paymentProvider = null
    let calculatedFees = { methodFee: 0, providerFee: 0, totalFee: 0 }

    if (paymentData.methodId) {
      paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentData.methodId },
        include: {
          providers: true
        }
      })

      if (paymentData.providerId) {
        paymentProvider = await prisma.paymentProvider.findUnique({
          where: { id: paymentData.providerId }
        })
      }

      // Calculer les frais
      const calculateFee = (feeType: string | null, feeValue: any, amount: number) => {
        if (!feeType || !feeValue || feeType === 'NONE') return 0
        
        const numValue = Number(feeValue)
        if (feeType === 'PERCENTAGE') {
          return (amount * numValue) / 100
        } else if (feeType === 'FIXED') {
          return numValue
        }
        
        return 0
      }

      if (paymentMethod) {
        calculatedFees.methodFee = calculateFee(paymentMethod.feeType, paymentMethod.feeValue, paymentData.amount)
      }

      if (paymentProvider) {
        calculatedFees.providerFee = calculateFee(paymentProvider.feeType, paymentProvider.feeValue, paymentData.amount)
      }

      calculatedFees.totalFee = calculatedFees.methodFee + calculatedFees.providerFee
    }

    // Créer le paiement dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const payment = await tx.payment.create({
        data: {
          orderId: orderId,
          amount: paymentData.amount,
          currency: order.currency,
          methodId: paymentData.methodId || null,
          providerId: paymentData.providerId || null,
          method: paymentData.method, // Conservé pour compatibilité
          provider: paymentData.provider, // Conservé pour compatibilité
          transactionId: paymentData.transactionId,
          reference: paymentData.reference,
          status: 'COMPLETED',
          notes: paymentData.notes,
          processedBy: session.user?.id,
          feeAmount: calculatedFees.totalFee > 0 ? calculatedFees.totalFee : null,
          feeType: calculatedFees.totalFee > 0 ? 'CALCULATED' : null,
          netAmount: paymentData.amount - calculatedFees.totalFee
        },
        include: {
          paymentMethod: true,
          paymentProvider: true
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

      // Si la commande est entièrement payée, gérer les abonnements
      if (isFullyPaid) {
        // 1. Activer les abonnements existants
        if (updatedOrder.subscriptions.length > 0) {
          for (const subscription of updatedOrder.subscriptions) {
            if (subscription.status === 'PENDING') {
              await tx.subscription.update({
                where: { id: subscription.id },
                data: { status: 'ACTIVE' }
              })
            }
          }
        }
        
        // 2. Créer automatiquement des abonnements pour les offres d'abonnement
        // Récupérer les items de la commande avec les détails des offres
        const orderWithItems = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                offer: {
                  include: {
                    platformOffers: {
                      include: {
                        platform: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (orderWithItems) {
          // Identifier les items qui sont des offres d'abonnement
          const subscriptionOffers = orderWithItems.items.filter(item => 
            (item.itemType === 'OFFER' || item.itemType === 'SUBSCRIPTION') && 
            item.offer && 
            item.offer.platformOffers.length > 0
          );

          console.log(`🔍 Offres d'abonnement trouvées: ${subscriptionOffers.length}`);

          // Créer un abonnement pour chaque offre d'abonnement
          for (const item of subscriptionOffers) {
            if (!item.offer) continue;

            // Vérifier si un abonnement existe déjà pour cette offre et cet utilisateur
            const existingSubscription = await tx.subscription.findFirst({
              where: {
                userId: orderWithItems.userId,
                offerId: item.offer.id,
                orderId: orderId
              }
            });

            if (!existingSubscription) {
              // Calculer les dates de début et fin
              const startDate = new Date();
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + item.offer.duration);

              // Créer l'abonnement
              const newSubscription = await tx.subscription.create({
                data: {
                  userId: orderWithItems.userId,
                  offerId: item.offer.id,
                  orderId: orderId,
                  status: 'ACTIVE',
                  startDate: startDate,
                  endDate: endDate,
                  autoRenew: false
                }
              });

              console.log(`✅ Abonnement créé automatiquement: ${newSubscription.id} pour l'offre ${item.offer.name}`);
            } else {
              console.log(`ℹ️ Abonnement déjà existant pour l'offre ${item.offer.name}`);
            }
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
