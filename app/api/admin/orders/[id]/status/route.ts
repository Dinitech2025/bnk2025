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
    const { status } = await request.json()
    const orderId = params.id

    // Récupérer la commande existante avec ses abonnements
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subscriptions: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'Commande non trouvée' },
        { status: 404 }
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
          orderNumber
        },
        include: {
          subscriptions: true
        }
      })

      // Si la commande passe à PAID et qu'il y a des abonnements en attente, les activer
      if (status === 'PAID' && existingOrder.status === 'QUOTE') {
        for (const subscription of updatedOrder.subscriptions) {
          if (subscription.status === 'PENDING') {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' }
            })
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