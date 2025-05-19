import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { PrismaClient } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Route pour renouveler un abonnement en créant un nouvel abonnement
 * avec les mêmes paramètres (offre, comptes, profils) que l'abonnement précédent
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    // Récupérer l'abonnement à renouveler avec toutes ses relations
    const oldSubscription = await prisma.subscription.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: true,
        offer: true,
        platformOffer: true,
        subscriptionAccounts: {
          include: {
            account: true,
          },
        },
        accountProfiles: true,
      },
    })

    if (!oldSubscription) {
      return NextResponse.json(
        { message: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    // Calculer les nouvelles dates
    const now = new Date()
    const endDate = calculateEndDate(now, oldSubscription.offer.duration, oldSubscription.offer.durationUnit || 'MONTH')

    // Créer le nouvel abonnement
    const newSubscription = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      // Créer l'abonnement de base
      const subscription = await tx.subscription.create({
        data: {
          userId: oldSubscription.userId,
          offerId: oldSubscription.offerId,
          platformOfferId: oldSubscription.platformOfferId,
          startDate: now,
          endDate: endDate,
          status: 'ACTIVE',
          autoRenew: oldSubscription.autoRenew,
        },
      })

      // Associer les mêmes comptes
      for (const subscriptionAccount of oldSubscription.subscriptionAccounts) {
        await tx.subscriptionAccount.create({
          data: {
            subscriptionId: subscription.id,
            accountId: subscriptionAccount.accountId,
            status: 'ACTIVE',
          },
        })
      }

      // Libérer les anciens profils de compte
      if (oldSubscription.accountProfiles.length > 0) {
        await tx.accountProfile.updateMany({
          where: {
            id: {
              in: oldSubscription.accountProfiles.map((profile: { id: string }) => profile.id),
            },
          },
          data: {
            isAssigned: false,
            subscriptionId: null,
          },
        })
      }

      // Récupérer les profils disponibles pour les mêmes comptes
      const availableProfiles = await tx.accountProfile.findMany({
        where: {
          accountId: {
            in: oldSubscription.subscriptionAccounts.map((sa: { accountId: string }) => sa.accountId),
          },
          isAssigned: false,
        },
        take: oldSubscription.accountProfiles.length,
      })

      if (availableProfiles.length < oldSubscription.accountProfiles.length) {
        throw new Error('Pas assez de profils disponibles pour renouveler l\'abonnement')
      }

      // Assigner les profils au nouvel abonnement
      await tx.accountProfile.updateMany({
        where: {
          id: {
            in: availableProfiles.map((profile: { id: string }) => profile.id),
          },
        },
        data: {
          isAssigned: true,
          subscriptionId: subscription.id,
        },
      })

      return subscription
    })

    return NextResponse.json(newSubscription)
  } catch (error) {
    console.error('Error renewing subscription:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors du renouvellement de l\'abonnement.' },
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