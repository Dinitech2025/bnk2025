import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, PrismaClient } from '@prisma/client'

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offer: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            durationUnit: true,
            maxProfiles: true,
            maxUsers: true,
          },
        },
        platformOffer: {
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
                hasProfiles: true,
                maxProfilesPerAccount: true,
                type: true,
              },
            },
          },
        },
        subscriptionAccounts: {
          include: {
            account: {
              include: {
                platform: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                    hasProfiles: true,
                  }
                }
              }
            },
          },
        },
        accountProfiles: {
          select: {
            id: true,
            name: true,
            profileSlot: true,
            pin: true,
            isAssigned: true,
            accountId: true,
            account: {
              select: {
                username: true,
                email: true,
                id: true,
              }
            }
          }
        },
        Profile: {
          select: {
            id: true,
            name: true,
            profileSlot: true,
            accountId: true,
          }
        },
        UserSubscription: {
          include: {
            userProfiles: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Formater les dates pour la serialisation JSON
    const formattedSubscriptions = subscriptions.map((subscription: any) => ({
      ...subscription,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedSubscriptions)
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération des abonnements.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validation des données requises
    if (!data.userId || !data.offerId || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { message: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Récupération de l'offre
    const offer = await prisma.offer.findUnique({
      where: { id: data.offerId },
      include: {
        platformOffers: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { message: 'Offre non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier les données des plateformes
    if (!data.platformAccounts || !Array.isArray(data.platformAccounts) || data.platformAccounts.length === 0) {
      return NextResponse.json(
        { message: 'Aucune plateforme ou compte spécifié' },
        { status: 400 }
      )
    }

    // Création de l'abonnement de base
    const subscriptionData = {
      userId: data.userId,
      offerId: data.offerId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'PENDING',
      autoRenew: data.autoRenew || false,
    };

    // Transactions pour créer l'abonnement et toutes ses relations
    const subscription = await prisma.$transaction(
      async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
        // Création de l'abonnement initial
        const newSubscription = await tx.subscription.create({
          data: subscriptionData,
          include: {
            user: true,
            offer: true,
          },
        });

        // Pour chaque platform-compte
        for (const platformAccount of data.platformAccounts) {
          const { platformOfferId, accountId, profileIds } = platformAccount;

          // Vérifier que le platformOfferId existe dans l'offre
          const platformOffer = offer.platformOffers.find((po: { id: string }) => po.id === platformOfferId);
          if (!platformOffer) {
            throw new Error(`PlatformOffer ${platformOfferId} n'appartient pas à l'offre ${offer.id}`);
          }

          // Si un compte est spécifié
          if (accountId) {
            // Obtenir les informations du compte
            const account = await tx.account.findUnique({
              where: { id: accountId },
              include: {
                accountProfiles: true,
                platform: true,
              },
            });

            if (!account) {
              throw new Error(`Compte ${accountId} non trouvé`);
            }

            // Vérifier la compatibilité entre la plateforme du compte et celle de l'offre
            if (account.platformId !== platformOffer.platform.id) {
              throw new Error(`Incompatibilité entre la plateforme du compte ${account.platformId} et celle de l'offre ${platformOffer.platform.id}`);
            }

            // Associer le compte à l'abonnement
            await tx.subscriptionAccount.create({
              data: {
                subscriptionId: newSubscription.id,
                accountId: account.id,
                status: 'ACTIVE',
              },
            });

            // Si la plateforme utilise des profils et qu'on a spécifié des profils
            if (platformOffer.platform.hasProfiles && profileIds && profileIds.length > 0) {
              // Vérifier que les profils appartiennent bien au compte
              const profiles = await tx.accountProfile.findMany({
                where: {
                  id: { in: profileIds },
                  accountId: account.id,
                  isAssigned: false,
                },
              });

              if (profiles.length !== profileIds.length) {
                throw new Error(`Certains profils n'existent pas ou sont déjà assignés`);
              }

              // Vérifier qu'on a assez de profils
              if (profiles.length < offer.maxProfiles) {
                throw new Error(`Pas assez de profils sélectionnés (${profiles.length}/${offer.maxProfiles})`);
              }

              // Connecter les profils à l'abonnement
              await tx.subscription.update({
                where: { id: newSubscription.id },
                data: {
                  accountProfiles: {
                    connect: profiles.map((profile: { id: string }) => ({ id: profile.id })),
                  },
                },
              });

              // Marquer les profils comme assignés
              await tx.accountProfile.updateMany({
                where: {
                  id: { in: profileIds },
                },
                data: {
                  isAssigned: true,
                },
              });
            }
          } else {
            // Si aucun compte n'est spécifié, rechercher un compte disponible automatiquement
            const account = await tx.account.findFirst({
              where: {
                platformId: platformOffer.platform.id,
                status: 'AVAILABLE',
                accountProfiles: platformOffer.platform.hasProfiles ? {
                  some: {
                    isAssigned: false,
                  },
                  // Vérifier qu'il y a assez de profils disponibles
                  _count: {
                    lte: platformOffer.platform.maxProfilesPerAccount! - offer.maxProfiles,
                  },
                } : undefined,
              },
              include: {
                accountProfiles: platformOffer.platform.hasProfiles,
              },
            });

            if (!account) {
              throw new Error(`Aucun compte disponible pour la plateforme ${platformOffer.platform.name}`);
            }

            // Associer le compte à l'abonnement
            await tx.subscriptionAccount.create({
              data: {
                subscriptionId: newSubscription.id,
                accountId: account.id,
                status: 'ACTIVE',
              },
            });

            // Si la plateforme a des profils, on les assigne automatiquement
            if (platformOffer.platform.hasProfiles && account.accountProfiles) {
              const availableProfiles = account.accountProfiles
                .filter((profile: any) => !profile.isAssigned)
                .slice(0, offer.maxProfiles);

              // Connecter les profils à l'abonnement
              await tx.subscription.update({
                where: { id: newSubscription.id },
                data: {
                  accountProfiles: {
                    connect: availableProfiles.map((profile: any) => ({ id: profile.id })),
                  },
                },
              });

              // Marquer les profils comme assignés
              await tx.accountProfile.updateMany({
                where: {
                  id: {
                    in: availableProfiles.map((profile: any) => profile.id),
                  },
                },
                data: {
                  isAssigned: true,
                },
              });
            }
          }
        }

        // Récupérer l'abonnement complet avec toutes ses relations
        return tx.subscription.findUnique({
          where: { id: newSubscription.id },
          include: {
            user: true,
            offer: true,
            platformOffer: {
              include: {
                platform: true,
              },
            },
            subscriptionAccounts: {
              include: {
                account: true,
              },
            },
            accountProfiles: true,
          },
        });
      },
      {
        timeout: 15000 // Timeout de 15 secondes pour les transactions complexes
      }
    );

    return NextResponse.json(subscription)
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { message: error.message || 'Une erreur est survenue lors de la création de l\'abonnement.' },
      { status: 500 }
    )
  }
} 

