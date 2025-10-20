import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Supprimer les paniers vides ou anciens (plus de 7 jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const deletedCarts = await prisma.cart.deleteMany({
      where: {
        OR: [
          {
            items: {
              none: {}
            }
          },
          {
            updatedAt: {
              lt: sevenDaysAgo
            }
          }
        ]
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedCarts.count,
      message: `${deletedCarts.count} paniers supprimés`
    })
  } catch (error) {
    console.error('Erreur lors du nettoyage des paniers:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du nettoyage des paniers' },
      { status: 500 }
    )
  }
}