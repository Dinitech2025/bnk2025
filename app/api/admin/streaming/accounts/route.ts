import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { requireStaff } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, Account, AccountProfile, GiftCard, Platform } from '@prisma/client'

type AccountWithDetails = {
  id: string;
  platformId: string;
  username: string;
  email: string | null;
  password: string;
  status: string;
  expiresAt: Date | null;
  platform: Platform;
  accountProfiles: AccountProfile[];
}

type AccountWithRelations = Account & {
  platform: { id: string; hasProfiles: boolean };
  accountProfiles: AccountProfile[];
  usedGiftCards: GiftCard[];
}

// GET - Récupérer tous les comptes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')
    
    if (platformId) {
      // Vérifier si la plateforme existe
      const platform = await prisma.platform.findUnique({
        where: { id: platformId }
      })

      if (!platform) {
        return NextResponse.json(
          { error: 'Plateforme non trouvée' },
          { status: 404 }
        )
      }
    }

    // Récupérer les comptes avec leurs offres fournisseur en utilisant SQL brut
    const accounts = await prisma.$queryRaw<any[]>`
      SELECT 
        a.id,
        a."platformId",
        a.username,
        a.email,
        a.password,
        a.status,
        a."expiresAt",
        a.availability,
        a."createdAt",
        a."updatedAt",
        a."providerOfferId",
        p.id as "platform_id",
        p.name as "platform_name",
        p.logo as "platform_logo",
        p.type as "platform_type",
        p."hasProfiles" as "platform_hasProfiles",
        p."hasGiftCards" as "platform_hasGiftCards",
        po.id as "providerOffer_id",
        po.name as "providerOffer_name",
        po.price as "providerOffer_price",
        po.currency as "providerOffer_currency"
      FROM "Account" a
      LEFT JOIN "Platform" p ON a."platformId" = p.id
      LEFT JOIN "PlatformProviderOffer" po ON a."providerOfferId" = po.id
      ${platformId ? Prisma.sql`WHERE a."platformId" = ${platformId}` : Prisma.empty}
      ORDER BY a."createdAt" DESC
    `

    // Récupérer les profils pour chaque compte
    const accountIds = accounts.map((account: any) => account.id)
    const profiles = await prisma.accountProfile.findMany({
        where: {
        accountId: { in: accountIds }
      }
    })

    // Formatter les données
    const formattedAccounts = accounts.map((account: any) => {
      const accountProfiles = profiles.filter((profile: any) => profile.accountId === account.id)
      
      return {
        id: account.id,
        username: account.username,
        email: account.email,
        status: account.status,
        availability: account.availability,
        createdAt: account.createdAt,
        expiresAt: account.expiresAt,
        platform: {
          id: account.platform_id,
          name: account.platform_name,
          logo: account.platform_logo,
          type: account.platform_type,
          hasProfiles: account.platform_hasProfiles,
          hasGiftCards: account.platform_hasGiftCards
        },
        providerOffer: account.providerOffer_id ? {
          id: account.providerOffer_id,
          name: account.providerOffer_name,
          price: account.providerOffer_price,
          currency: account.providerOffer_currency
        } : null,
        accountProfiles: accountProfiles.map((profile: any) => ({
          id: profile.id,
          isAssigned: profile.isAssigned
        }))
          }
    })

    // Mettre à jour la disponibilité de tous les comptes
    const updatedAccounts = await Promise.all(formattedAccounts.map(async (account: any) => {
      const isActive = account.status === 'ACTIVE'
      let isAvailable = false
      let activeSubscription = null

      if (isActive) {
        if (account.platform.hasProfiles) {
          // Pour les plateformes avec profils, vérifier s'il y a des profils non assignés
          const hasUnassignedProfiles = account.accountProfiles.some((profile: any) => !profile.isAssigned)
          isAvailable = hasUnassignedProfiles
        } else {
          // Pour les plateformes sans profils, vérifier s'il y a un abonnement actif
          activeSubscription = await prisma.subscription.findFirst({
            where: {
              subscriptionAccounts: {
                some: {
                  accountId: account.id
                }
              },
              status: 'ACTIVE',
              endDate: {
                gte: new Date() // Date de fin dans le futur
              }
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          })

          // Le compte est disponible seulement s'il n'y a pas d'abonnement actif
          isAvailable = !activeSubscription
        }
      }

      // Mettre à jour la disponibilité si nécessaire
      if (account.availability !== isAvailable) {
        await prisma.$executeRaw`
          UPDATE "Account" 
          SET availability = ${isAvailable}
          WHERE id = ${account.id}
        `
      }

      // Retourner le compte avec la disponibilité mise à jour et l'abonnement actif
      return {
        ...account,
        availability: isAvailable,
        activeSubscription: activeSubscription
      }
    }))

    return NextResponse.json(updatedAccounts)

  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des comptes' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau compte
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }
    
    const data = await request.json()

    // Validation des données
    if (!data.username || !data.password || !data.platformId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier si la plateforme existe
    const platform = await prisma.platform.findUnique({
      where: { id: data.platformId }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Si une carte cadeau est spécifiée, vérifier qu'elle est disponible
    if (data.giftCardId) {
      const giftCard = await prisma.giftCard.findFirst({
        where: {
          id: data.giftCardId,
          platformId: platform.id,
          status: 'ACTIVE',
          usedById: null
        }
      })

      if (!giftCard) {
        return NextResponse.json(
          { error: 'Carte cadeau invalide ou déjà utilisée' },
          { status: 400 }
        )
      }
    }

    // Déterminer la date d'expiration
    let expirationDate = data.expiresAt ? new Date(data.expiresAt) : null
    
    // Déterminer le statut en fonction de la date d'expiration
    const now = new Date()
    const isActive = expirationDate ? expirationDate > now : false
    const status = isActive ? 'ACTIVE' : 'INACTIVE'

    // Créer le compte dans une transaction
    const account = await prisma.$transaction(async (tx) => {
    // Créer le compte
      const newAccount = await tx.account.create({
        data: {
          username: data.username,
          email: data.email || null,
          password: data.password,
          status: status,
          expiresAt: expirationDate,
          platform: {
            connect: {
              id: data.platformId
            }
          },
          ...(data.providerOfferId && {
            providerOffer: {
              connect: {
                id: data.providerOfferId
              }
            }
          })
        }
      })

      // Si une carte cadeau est fournie, l'associer au compte
      if (data.giftCardId) {
        await tx.giftCard.update({
          where: { id: data.giftCardId },
      data: {
            status: 'USED',
            usedById: newAccount.id,
            usedAt: new Date()
          }
        })
      }

      // Si la plateforme utilise des profils, créer les profils par défaut
      if (platform.hasProfiles) {
        const maxProfiles = platform.maxProfilesPerAccount || 1
        const profiles = Array.from({ length: maxProfiles }).map((_, index) => ({
          accountId: newAccount.id,
            profileSlot: index + 1,
          name: index === 0 ? 'Principal' : `Profil ${index + 1}`,
          pin: null,
            isAssigned: false
          }))

        await tx.accountProfile.createMany({
          data: profiles
        })
      }

      // Récupérer le compte avec tous les détails
      const accountWithDetails = await tx.account.findUnique({
        where: { id: newAccount.id },
      include: {
        platform: true,
        accountProfiles: true
      }
      })

      if (!accountWithDetails) {
        throw new Error('Compte non trouvé après création')
      }

      // Déterminer la disponibilité selon les nouvelles règles
      let isAvailable = false
      let activeSubscription = null
      
      if (status === 'ACTIVE') {
        if (platform.hasProfiles) {
          // Pour les plateformes avec profils, vérifier s'il y a des profils non assignés
          const hasUnassignedProfiles = accountWithDetails.accountProfiles.some(profile => !profile.isAssigned)
          isAvailable = hasUnassignedProfiles
        } else {
          // Pour les plateformes sans profils, vérifier s'il y a un abonnement actif
          activeSubscription = await prisma.subscription.findFirst({
            where: {
              subscriptionAccounts: {
                some: {
                  accountId: accountWithDetails.id
                }
              },
              status: 'ACTIVE',
              endDate: {
                gte: new Date() // Date de fin dans le futur
              }
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          })

          // Le compte est disponible seulement s'il n'y a pas d'abonnement actif
          isAvailable = !activeSubscription
        }
      }

      // Mettre à jour la disponibilité
      await tx.$executeRaw`
        UPDATE "Account" 
        SET availability = ${isAvailable}
        WHERE id = ${newAccount.id}
      `

      return accountWithDetails
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    )
  }
} 