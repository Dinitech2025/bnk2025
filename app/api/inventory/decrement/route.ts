import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity } = body

    console.log(`📦 Décrémentation inventaire: Produit ${productId}, Quantité -${quantity}`)

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Données invalides - productId et quantity requis' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe et a assez de stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
        trackInventory: true
      }
    })

    if (!product) {
      console.warn(`⚠️ Produit non trouvé: ${productId}`)
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Si le suivi d'inventaire n'est pas activé, pas besoin de décrémenter
    if (!product.trackInventory) {
      console.log(`ℹ️ Suivi inventaire désactivé pour ${product.name}`)
      return NextResponse.json({
        success: true,
        message: 'Suivi inventaire désactivé',
        productId,
        oldStock: product.stock,
        newStock: product.stock,
        changed: false
      })
    }

    // Vérifier le stock disponible
    if (product.stock < quantity) {
      console.warn(`⚠️ Stock insuffisant: ${product.name} (${product.stock} disponible, ${quantity} demandé)`)
      return NextResponse.json(
        { 
          error: 'Stock insuffisant',
          available: product.stock,
          requested: quantity
        },
        { status: 400 }
      )
    }

    // Décrémenter le stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity
        }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        trackInventory: true
      }
    })

    console.log(`✅ Inventaire décrémenté: ${product.name}`)
    console.log(`   Stock avant: ${product.stock}`)
    console.log(`   Quantité vendue: ${quantity}`)
    console.log(`   Stock après: ${updatedProduct.stock}`)

    // Log d'audit
    console.log(`📋 AUDIT INVENTAIRE: ${product.name} (${productId})`)
    console.log(`   Opération: VENTE (-${quantity})`)
    console.log(`   Stock: ${product.stock} → ${updatedProduct.stock}`)

    // Alerte si stock faible
    if (updatedProduct.stock <= 5) {
      console.log(`🔔 ALERTE STOCK FAIBLE: ${product.name} (${updatedProduct.stock} restant)`)
    }

    return NextResponse.json({
      success: true,
      message: 'Inventaire mis à jour avec succès',
      productId,
      productName: product.name,
      oldStock: product.stock,
      newStock: updatedProduct.stock,
      decremented: quantity,
      changed: true,
      lowStockAlert: updatedProduct.stock <= 5
    })

  } catch (error) {
    console.error('❌ Erreur décrémentation inventaire:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour de l\'inventaire',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
