import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Vérifier que la commande existe et récupérer les détails nécessaires pour la facture
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            service: true,
            offer: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Structurer les données de la commande pour la facture
    const invoiceData = {
      id: order.id,
      orderNumber: order.id.substring(0, 8),
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: Number(order.total),
      customer: {
        id: order.user.id,
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        email: order.user.email,
      },
      items: order.items.map(item => {
        const name = item.product?.name || item.service?.name || item.offer?.name || 'Article inconnu';
        return {
          id: item.id,
          name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          type: item.itemType,
        };
      }),
    };

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Erreur lors de la génération de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la facture' },
      { status: 500 }
    );
  }
} 