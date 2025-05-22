import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/cybercafe/tickets
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        duration: 'asc'
      }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tickets' },
      { status: 500 }
    );
  }
}

// POST /api/cybercafe/tickets
export async function POST(request: Request) {
  try {
    const { duration, price } = await request.json();

    // Vérifier si un ticket avec cette durée existe déjà
    const existingTicket = await prisma.ticket.findFirst({
      where: { duration }
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: 'Un ticket avec cette durée existe déjà' },
        { status: 400 }
      );
    }

    // Créer le nouveau ticket
    const ticket = await prisma.ticket.create({
      data: {
        duration,
        price,
        stock: 0
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du ticket' },
      { status: 500 }
    );
  }
} 
 