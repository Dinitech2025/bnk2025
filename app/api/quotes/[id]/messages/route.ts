import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Ajouter un message à un devis
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { message, proposedPrice, attachments } = await request.json()

    // Vérifier qu'au moins un contenu est fourni
    const hasMessage = message && message.trim().length > 0
    const hasPrice = proposedPrice && !isNaN(parseFloat(proposedPrice))
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0

    if (!hasMessage && !hasPrice && !hasAttachments) {
      return NextResponse.json({ 
        error: 'Veuillez fournir un message, un prix proposé ou joindre des fichiers' 
      }, { status: 400 })
    }

    // Vérifier que le devis existe
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, role: true }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    const isOwner = quote.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'STAFF'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Créer le message
    const quoteMessage = await prisma.quoteMessage.create({
      data: {
        quoteId: params.id,
        senderId: session.user.id,
        message: message?.trim() || '',
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
        attachments: attachments || []
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Mettre à jour le statut du devis si nécessaire
    let updatedStatus = quote.status
    if (proposedPrice && isAdmin) {
      updatedStatus = 'PRICE_PROPOSED'
    } else if (quote.status === 'PENDING') {
      updatedStatus = 'NEGOTIATING'
    }

    if (updatedStatus !== quote.status) {
      await prisma.quote.update({
        where: { id: params.id },
        data: { 
          status: updatedStatus,
          proposedPrice: proposedPrice ? parseFloat(proposedPrice) : quote.proposedPrice
        }
      })
    }

    // Convertir les champs Decimal en nombres pour la sérialisation JSON
    const serializedMessage = {
      ...quoteMessage,
      proposedPrice: quoteMessage.proposedPrice ? parseFloat(quoteMessage.proposedPrice.toString()) : null
    }

    return NextResponse.json(serializedMessage, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 