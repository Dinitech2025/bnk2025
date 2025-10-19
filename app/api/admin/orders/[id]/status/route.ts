import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Génère le numéro de commande selon le statut
 */
async function generateOrderNumber(order: any, newStatus: string): Promise<string> {
  // Si le statut ne change pas, garder le même numéro
  if (order.status === newStatus) {
    return order.orderNumber;
  }

  const currentYear = new Date().getFullYear();
  
  // Si on passe de QUOTE à un autre statut, générer un nouveau numéro CMD
  if (order.status === 'QUOTE' && newStatus !== 'QUOTE') {
    // Trouver le dernier numéro de commande CMD
    const lastOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          startsWith: `CMD-${currentYear}`
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      take: 10
    });

    // Trouver le plus grand numéro séquentiel
    let maxSequentialNumber = 0;
    for (const ord of lastOrders) {
      const match = ord.orderNumber?.match(/CMD-\d{4}-(\d{4})/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSequentialNumber) {
          maxSequentialNumber = num;
        }
      }
    }

    // Générer le nouveau numéro
    return `CMD-${currentYear}-${(maxSequentialNumber + 1).toString().padStart(4, '0')}`;
  }

  // Dans les autres cas, garder le même numéro
  return order.orderNumber;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, paymentData } = await request.json()
    const orderId = params.id

    // Récupérer la commande existante avec ses abonnements et paiements
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subscriptions: true,
        payments: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Si le statut passe à PAID et qu'il y a des données de paiement, on doit enregistrer le paiement
    if (status === 'PAID' && paymentData) {
      return NextResponse.json(
        { 
          error: 'Pour marquer une commande comme payée, utilisez l\'API de paiement /api/admin/orders/[id]/payments',
          redirectTo: `/api/admin/orders/${orderId}/payments`
        },
        { status: 400 }
      )
    }

    // Générer un nouveau numéro de commande si nécessaire
    const orderNumber = await generateOrderNumber(existingOrder, status)

    // Mise à jour dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          orderNumber,
          // Mettre à jour le paymentStatus seulement si ce n'est pas déjà PAID
          paymentStatus: status === 'CANCELLED' ? 'CANCELLED' : existingOrder.paymentStatus
        },
        include: {
          subscriptions: true,
          payments: true
        }
      })

      // Si la commande passe à CONFIRMED/PAID et qu'elle est entièrement payée, gérer les abonnements
      if ((status === 'CONFIRMED' || status === 'PAID') && existingOrder.paymentStatus === 'PAID') {
        // 1. Activer les abonnements existants
        for (const subscription of updatedOrder.subscriptions) {
          if (subscription.status === 'PENDING') {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' }
            })
          }
        }

        // 2. Créer automatiquement des abonnements pour les offres d'abonnement si aucun n'existe
        if (updatedOrder.subscriptions.length === 0) {
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

            console.log(`🔍 Offres d'abonnement trouvées lors du changement de statut: ${subscriptionOffers.length}`);

            // Créer un abonnement pour chaque offre d'abonnement
            for (const item of subscriptionOffers) {
              if (!item.offer) continue;

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

              console.log(`✅ Abonnement créé automatiquement lors du changement de statut: ${newSubscription.id} pour l'offre ${item.offer.name}`);
            }
          }
        }
      }

      return updatedOrder
    })

    console.log(`Commande ${result.id} mise à jour - Statut: ${status}, Numéro: ${orderNumber}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
} 