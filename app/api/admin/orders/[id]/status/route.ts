import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // Vérifier que l'ID de la commande et le statut sont fournis
    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID de commande et statut requis' },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    const validStatuses = [
      'PENDING', 
      'PROCESSING', 
      'COMPLETED', 
      'CANCELLED', 
      'SHIPPED', 
      'DELIVERED',
      'QUOTE',
      'PAID',
      'SHIPPING',
      'FINISHED'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut non valide' },
        { status: 400 }
      );
    }

    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut de la commande
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    console.log(`Statut de la commande ${id} mis à jour: ${status}`);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut de la commande' },
      { status: 500 }
    );
  }
} 