import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les messages d'une conversation (côté client)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const clientEmail = searchParams.get('clientEmail')
    const userId = searchParams.get('userId')

    let where: any = {}

    if (conversationId) {
      where.conversationId = conversationId
    } else if (userId) {
      // Messages pour un utilisateur connecté
      where.OR = [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    } else if (clientEmail) {
      // Messages pour un client non connecté (par email)
      where.OR = [
        { clientEmail: clientEmail },
        { isPublic: true }
      ]
    } else {
      return NextResponse.json(
        { error: 'conversationId, userId ou clientEmail requis' },
        { status: 400 }
      )
    }

    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        subject: true,
        content: true,
        type: true,
        priority: true,
        status: true,
        fromUserId: true,
        toUserId: true,
        sentAt: true,
        createdAt: true,
        clientEmail: true,
        clientName: true,
      },
      orderBy: {
        sentAt: 'asc',
      },
    })

    // Marquer les messages comme lus pour l'utilisateur connecté
    if (userId) {
      const unreadMessages = messages.filter(m => m.toUserId === userId && m.status === 'UNREAD')
      if (unreadMessages.length > 0) {
        await prisma.message.updateMany({
          where: {
            id: {
              in: unreadMessages.map(m => m.id)
            }
          },
          data: {
            status: 'READ',
            readAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Envoyer un message depuis le site public
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      subject,
      content,
      clientEmail,
      clientName,
      type,
      relatedOrderId,
      relatedProductId,
      relatedServiceId,
    } = body

    // Validation
    if (!subject || !content || !clientEmail) {
      return NextResponse.json(
        { error: 'Sujet, contenu et email client requis' },
        { status: 400 }
      )
    }

    // Vérifier si le client existe
    let client = await prisma.user.findFirst({
      where: { email: clientEmail },
    })

    // Si le client n'existe pas, on crée un message anonyme
    let fromUserId = null
    if (client) {
      fromUserId = client.id
    }

    // Trouver un admin pour recevoir le message
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Aucun administrateur disponible' },
        { status: 503 }
      )
    }

    // Créer la conversation si elle n'existe pas (optionnel pour l'instant)
    let conversationId = null
    // TODO: Implémenter les conversations quand la table sera créée

    // Créer le message
    const message = await prisma.message.create({
      data: {
        subject,
        content,
        type: type || 'GENERAL',
        priority: 'NORMAL',
        fromUserId: fromUserId || admin.id, // Si pas de client, admin envoie
        toUserId: admin.id,
        clientEmail: clientEmail || undefined,
        clientName: clientName || undefined,
        isPublic: !client, // Public si pas de client connecté
        relatedOrderId,
        relatedSubscriptionId,
        relatedQuoteId,
        metadata: {
          source: 'public_form',
          timestamp: new Date().toISOString(),
        },
      },
      select: {
        id: true,
        subject: true,
        content: true,
        type: true,
        priority: true,
        status: true,
        sentAt: true,
        createdAt: true,
        fromUserId: true,
        toUserId: true,
        clientEmail: true,
        clientName: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès',
      conversationId,
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}