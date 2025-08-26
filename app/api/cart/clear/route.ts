import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('🗑️ Vidage du panier pour:', session?.user?.id || 'utilisateur anonyme')

    if (session?.user?.id) {
      // Utilisateur connecté - vider le panier en base
      const deletedItems = await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId: session.user.id
          }
        }
      })

      console.log(`✅ ${deletedItems.count} articles supprimés du panier en base`)

      return NextResponse.json({
        success: true,
        message: 'Panier vidé avec succès',
        deletedItems: deletedItems.count
      })
    } else {
      // Utilisateur anonyme - le panier sera vidé côté client via localStorage
      console.log('ℹ️ Utilisateur anonyme - vidage côté client')
      
      return NextResponse.json({
        success: true,
        message: 'Panier vidé (côté client)',
        deletedItems: 0
      })
    }

  } catch (error) {
    console.error('❌ Erreur vidage panier:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du vidage du panier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
