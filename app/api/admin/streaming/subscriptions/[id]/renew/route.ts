import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Route pour renouveler un abonnement en créant un nouvel abonnement
 * avec les mêmes paramètres (offre, comptes, profils) que l'abonnement précédent
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const subscriptionId = params.id
    
    // Vérifier si l'abonnement existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId
      },
      include: {
        offer: true,
        subscriptionAccounts: {
          include: {
            account: {
              include: {
                profiles: true
              }
            }
          }
        }
      }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    // Créer le nouvel abonnement
    const newSubscription = await prisma.$transaction(async (tx) => {
      // Créer l'abonnement de base
      const subscription = await tx.subscription.create({
        data: {
          userId: existingSubscription.userId,
          offerId: existingSubscription.offerId,
          platformOfferId: existingSubscription.platformOfferId,
          startDate: new Date(),
          endDate: existingSubscription.endDate,
          status: 'ACTIVE',
          autoRenew: existingSubscription.autoRenew
        }
      })

      // Copier les comptes de plateforme
      for (const subscriptionAccount of existingSubscription.subscriptionAccounts) {
        await tx.subscriptionAccount.create({
          data: {
            subscriptionId: subscription.id,
            accountId: subscriptionAccount.accountId,
            status: 'ACTIVE'
          }
        })
      }

      return subscription
    })

    return NextResponse.json(newSubscription)
  } catch (error) {
    console.error('Erreur lors du renouvellement de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du renouvellement de l\'abonnement' },
      { status: 500 }
    )
  }
}

/**
 * Calcule la date de fin en fonction de la durée et de l'unité
 */
function calculateEndDate(startDate: Date, duration: number, unit: string): Date {
  switch (unit) {
    case 'DAY':
      return addDays(startDate, duration)
    case 'WEEK':
      return addWeeks(startDate, duration)
    case 'YEAR':
      return addYears(startDate, duration)
    case 'MONTH':
    default:
      return addMonths(startDate, duration)
  }
} 