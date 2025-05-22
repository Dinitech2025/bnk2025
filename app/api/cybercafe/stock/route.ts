import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/cybercafe/stock
export async function POST(request: Request) {
  try {
    const { ticketId, amount } = await request.json();

    // Vérifier que les paramètres sont valides
    if (!ticketId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      );
    }

    // Récupérer le ticket actuel
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // Créer l'historique de mise à jour
    const stockUpdate = await prisma.stockUpdate.create({
      data: {
        ticketId,
        amount,
        previousStock: ticket.stock,
        newStock: ticket.stock + amount
      }
    });

    // Mettre à jour le stock du ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        stock: ticket.stock + amount
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du stock' },
      { status: 500 }
    );
  }
} 
 