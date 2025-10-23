import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Récupérer tous les messages avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority
    if (userId) where.toUserId = userId

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
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
            },
          },
          relatedSubscription: {
            select: {
              id: true,
              status: true,
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
              createdAt: true,
              fromUser: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { sentAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.message.count({ where }),
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau message
export async function POST(request: NextRequest) {
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
      toUserId,
      relatedOrderId,
      relatedSubscriptionId,
      relatedQuoteId,
      metadata,
    } = body

    // Validation
    if (!subject || !content || !toUserId) {
      return NextResponse.json(
        { error: 'Le sujet, contenu et destinataire sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le destinataire existe
    const recipient = await db.user.findUnique({
      where: { id: toUserId },
      select: { id: true, email: true, role: true },
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Destinataire non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien un client (pas un admin/staff)
    if (recipient.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Le destinataire doit être un client' },
        { status: 400 }
      )
    }

    const message = await db.message.create({
      data: {
        subject,
        content,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        fromUserId: session.user.id,
        toUserId,
        relatedOrderId,
        relatedSubscriptionId,
        relatedQuoteId,
        metadata,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

