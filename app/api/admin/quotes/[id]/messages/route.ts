import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Ajouter un message à un devis (système unifié Message)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { message, attachments, proposedPrice } = body

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Le message ou des fichiers joints sont requis' }, { status: 400 })
    }

    // Vérifier que le devis existe
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Trouver ou créer la conversation pour ce devis
    let conversation = await prisma.conversation.findFirst({
      where: {
        messages: {
          some: {
            relatedQuoteId: params.id
          }
        }
      }
    })

    if (!conversation) {
      // Créer une nouvelle conversation
      conversation = await prisma.conversation.create({
        data: {
          title: `Devis: ${quote.service.name}`,
          participants: [quote.userId, session.user.id],
          isActive: true,
          lastMessageAt: new Date()
        }
      })
    }

    // Déterminer le type de message
    const messageType = proposedPrice && Number(proposedPrice) > 0
      ? 'QUOTE_PRICE_PROPOSAL'
      : 'QUOTE_DISCUSSION'

    const priority = proposedPrice && Number(proposedPrice) > 0 ? 'HIGH' : 'NORMAL'

    const subject = proposedPrice && Number(proposedPrice) > 0
      ? `Proposition de prix: ${Number(proposedPrice).toLocaleString('fr-FR')} Ar`
      : `Message sur devis ${quote.service.name}`

    // Créer le message unifié
    const newMessage = await prisma.message.create({
      data: {
        subject,
        content: message?.trim() || '',
        type: messageType,
        priority,
        status: 'UNREAD',
        fromUserId: session.user.id,
        toUserId: quote.userId,
        conversationId: conversation.id,
        relatedQuoteId: params.id,
        relatedServiceId: quote.serviceId,
        metadata: {
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
          attachments: attachments || []
        }
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: newMessage.sentAt }
    })

    // Mettre à jour le statut du devis si nécessaire
    if (quote.status === 'PENDING') {
      await prisma.quote.update({
        where: { id: params.id },
        data: { status: 'NEGOTIATING' }
      })
    }

    // Si un prix est proposé, mettre à jour le devis
    if (proposedPrice && Number(proposedPrice) > 0) {
      await prisma.quote.update({
        where: { id: params.id },
        data: {
          proposedPrice: Number(proposedPrice),
          status: 'PRICE_PROPOSED'
        }
      })
    }

    // Formater la réponse (compatible avec l'ancien format)
    const formattedMessage = {
      id: newMessage.id,
      message: newMessage.content,
      attachments: (newMessage.metadata as any)?.attachments || [],
      proposedPrice: (newMessage.metadata as any)?.proposedPrice || null,
      createdAt: newMessage.sentAt,
      isAdminReply: newMessage.fromUser.role === 'ADMIN' || newMessage.fromUser.role === 'STAFF',
      sender: newMessage.fromUser
    }

    return NextResponse.json(formattedMessage)

  } catch (error) {
    console.error('Erreur lors de l\'ajout du message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 