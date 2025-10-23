import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupérer un message spécifique avec ses réponses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const message = await db.message.findUnique({
      where: { id: params.id },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        relatedOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
          },
        },
        relatedSubscription: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            offer: {
              select: {
                name: true,
              },
            },
          },
        },
        relatedQuote: {
          select: {
            id: true,
            status: true,
            budget: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            subject: true,
            content: true,
            status: true,
            priority: true,
            createdAt: true,
            fromUser: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un message
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      subject,
      content,
      type,
      priority,
      status,
      relatedOrderId,
      relatedSubscriptionId,
      relatedQuoteId,
      metadata,
    } = body

    const updateData: any = {
      subject,
      content,
      type,
      priority,
      status,
      relatedOrderId,
      relatedSubscriptionId,
      relatedQuoteId,
      metadata,
    }

    // Supprimer les valeurs undefined
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    )

    const message = await db.message.update({
      where: { id: params.id },
      data: updateData,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await db.message.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Message supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

