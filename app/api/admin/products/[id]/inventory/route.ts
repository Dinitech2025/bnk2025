import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { type, quantity, reason } = body

    // Récupérer le stock actuel
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { inventory: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Calculer le nouveau stock
    let newInventory = product.inventory
    switch (type) {
      case 'add':
        newInventory += quantity
        break
      case 'remove':
        newInventory = Math.max(0, newInventory - quantity) // Empêcher le stock négatif
        break
      case 'set':
        newInventory = Math.max(0, quantity) // Empêcher le stock négatif
        break
      default:
        return NextResponse.json(
          { error: 'Type d\'ajustement invalide' },
          { status: 400 }
        )
    }

    // Mettre à jour le stock
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: { inventory: newInventory }
    })

    // Enregistrer l'historique de l'ajustement
    await prisma.inventoryHistory.create({
      data: {
        productId: params.id,
        type,
        quantity,
        previousQuantity: product.inventory,
        newQuantity: newInventory,
        reason
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'ajustement du stock' },
      { status: 500 }
    )
  }
} 