import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Ajouter un message à un devis (admin seulement)
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
    const { message, attachments } = body

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Le message ou des fichiers joints sont requis' }, { status: 400 })
    }

    // Vérifier que le devis existe
    const quote = await prisma.quote.findUnique({
      where: { id: params.id }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Créer le message
    const newMessage = await prisma.quoteMessage.create({
      data: {
        message: message?.trim() || '',
        attachments: attachments || [],
        senderId: session.user.id,
        quoteId: params.id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Mettre à jour le statut du devis si nécessaire
    if (quote.status === 'PENDING') {
      await prisma.quote.update({
        where: { id: params.id },
        data: { status: 'NEGOTIATING' }
      })
    }

    // Formater la réponse
    const formattedMessage = {
      id: newMessage.id,
      message: newMessage.message,
      attachments: newMessage.attachments,
      createdAt: newMessage.createdAt,
      isAdminReply: newMessage.sender.role === 'ADMIN' || newMessage.sender.role === 'STAFF',
      sender: newMessage.sender
    }

    return NextResponse.json(formattedMessage)

  } catch (error) {
    console.error('Erreur lors de l\'ajout du message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 