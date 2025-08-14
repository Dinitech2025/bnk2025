import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Durée de vie du panier pour les invités : 7 jours
const GUEST_CART_EXPIRY_DAYS = 7

// Schéma de validation pour l'ajout d'un item au panier
const addCartItemSchema = z.object({
  type: z.enum(['product', 'service', 'offer']),
  itemId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1).default(1),
  image: z.string().optional(),
  data: z.record(z.any()).optional()
})

// Schéma pour la mise à jour de la quantité
const updateQuantitySchema = z.object({
  cartItemId: z.string(),
  quantity: z.number().min(0)
})

// Fonction pour nettoyer les paniers expirés
async function cleanExpiredCarts() {
  try {
    await prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors du nettoyage des paniers expirés:', error)
  }
}

// Fonction pour obtenir ou créer un panier
async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (!userId && !sessionId) {
    throw new Error('userId ou sessionId requis')
  }

  try {
    // Vérifier si les modèles Cart existent
    if (!prisma.cart) {
      throw new Error('Cart model not available')
    }

    let cart = await prisma.cart.findFirst({
      where: userId 
        ? { userId, expiresAt: { gt: new Date() } }
        : { sessionId, expiresAt: { gt: new Date() } },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!cart) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + GUEST_CART_EXPIRY_DAYS)

      cart = await prisma.cart.create({
        data: {
          userId,
          sessionId: userId ? null : sessionId,
          expiresAt
        },
        include: {
          items: true
        }
      })
    }

    return cart
  } catch (error) {
    console.error('Erreur dans getOrCreateCart:', error)
    if (error.message?.includes('Cart model') || error.code === 'P2021') {
      throw new Error('CART_MODEL_NOT_AVAILABLE')
    }
    throw error
  }
}

// GET : Récupérer le panier
export async function GET(request: NextRequest) {
  try {
    // Nettoyer les paniers expirés en arrière-plan
    cleanExpiredCarts()

    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json({ cart: null, items: [] })
    }

    const cart = await getOrCreateCart(session?.user?.id, sessionId || undefined)

    return NextResponse.json({
      cart: {
        id: cart.id,
        itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
        total: cart.items.reduce((total, item) => total + (parseFloat(item.price.toString()) * item.quantity), 0)
      },
      items: cart.items.map(item => ({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        name: item.name,
        price: parseFloat(item.price.toString()),
        quantity: item.quantity,
        image: item.image,
        data: item.data
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du panier' },
      { status: 500 }
    )
  }
}

// POST : Ajouter un item au panier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        { error: 'Session requise' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = addCartItemSchema.parse(body)

    const cart = await getOrCreateCart(session?.user?.id, sessionId || undefined)

    // Vérifier si l'item existe déjà dans le panier
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        type: validatedData.type,
        itemId: validatedData.itemId
      }
    })

    if (existingItem) {
      // Mettre à jour la quantité
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: existingItem.quantity + validatedData.quantity,
          updatedAt: new Date()
        }
      })
    } else {
      // Créer un nouveau item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          type: validatedData.type,
          itemId: validatedData.itemId,
          name: validatedData.name,
          price: validatedData.price,
          quantity: validatedData.quantity,
          image: validatedData.image,
          data: validatedData.data
        }
      })
    }

    // Retourner le panier mis à jour
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      cart: {
        id: updatedCart!.id,
        itemCount: updatedCart!.items.reduce((total, item) => total + item.quantity, 0),
        total: updatedCart!.items.reduce((total, item) => total + (parseFloat(item.price.toString()) * item.quantity), 0)
      },
      items: updatedCart!.items.map(item => ({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        name: item.name,
        price: parseFloat(item.price.toString()),
        quantity: item.quantity,
        image: item.image,
        data: item.data
      }))
    })
  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout au panier' },
      { status: 500 }
    )
  }
}

// PUT : Mettre à jour la quantité d'un item
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        { error: 'Session requise' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cartItemId, quantity } = updateQuantitySchema.parse(body)

    // Vérifier que l'item appartient au bon utilisateur/session
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item non trouvé' },
        { status: 404 }
      )
    }

    const isOwner = session?.user?.id 
      ? cartItem.cart.userId === session.user.id
      : cartItem.cart.sessionId === sessionId

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    if (quantity === 0) {
      // Supprimer l'item
      await prisma.cartItem.delete({
        where: { id: cartItemId }
      })
    } else {
      // Mettre à jour la quantité
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { 
          quantity,
          updatedAt: new Date()
        }
      })
    }

    // Retourner le panier mis à jour
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      cart: {
        id: updatedCart!.id,
        itemCount: updatedCart!.items.reduce((total, item) => total + item.quantity, 0),
        total: updatedCart!.items.reduce((total, item) => total + (parseFloat(item.price.toString()) * item.quantity), 0)
      },
      items: updatedCart!.items.map(item => ({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        name: item.name,
        price: parseFloat(item.price.toString()),
        quantity: item.quantity,
        image: item.image,
        data: item.data
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du panier:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du panier' },
      { status: 500 }
    )
  }
}

// DELETE : Supprimer un item ou vider le panier
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const cartItemId = searchParams.get('cartItemId')

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        { error: 'Session requise' },
        { status: 401 }
      )
    }

    if (cartItemId) {
      // Supprimer un item spécifique
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true }
      })

      if (!cartItem) {
        return NextResponse.json(
          { error: 'Item non trouvé' },
          { status: 404 }
        )
      }

      const isOwner = session?.user?.id 
        ? cartItem.cart.userId === session.user.id
        : cartItem.cart.sessionId === sessionId

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 403 }
        )
      }

      await prisma.cartItem.delete({
        where: { id: cartItemId }
      })

      return NextResponse.json({ success: true })
    } else {
      // Vider tout le panier
      const cart = await prisma.cart.findFirst({
        where: session?.user?.id 
          ? { userId: session.user.id }
          : { sessionId }
      })

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        })
      }

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
} 