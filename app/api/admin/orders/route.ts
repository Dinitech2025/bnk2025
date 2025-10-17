import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET() {
  try {
    console.log('GET /api/admin/orders - Récupération des commandes');
    
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            offer: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            provider: true,
            createdAt: true
          }
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            offer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`${orders.length} commandes trouvées`);
    
    // Formater les dates pour la serialisation JSON
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      subscriptions: order.subscriptions.map((sub: any) => ({
        ...sub,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
      })),
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la récupération des commandes.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log('Received data:', JSON.stringify(data, null, 2))

    // Validation des données minimales requises
    if (!data.userId || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.error('Validation error: userId or items missing or invalid');
      return NextResponse.json(
        { message: 'Données invalides: userId et items sont requis' },
        { status: 400 }
      )
    }
    
    // Vérifier si l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: data.userId },
    })
    
    if (!userExists) {
      console.error('User not found:', data.userId);
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Calcul du total
    let total = 0
    const orderItems = data.items.map((item: any) => {
      const totalPrice = Number(item.unitPrice) * item.quantity
      total += totalPrice
      
      const orderItem: any = {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        itemType: item.itemType,
      }
      
      // Ajouter les IDs spécifiques selon le type d'item
      if (item.productId) {
        orderItem.productId = item.productId;
      } 
      if (item.serviceId) {
        orderItem.serviceId = item.serviceId;
      }
      if (item.offerId) {
        orderItem.offerId = item.offerId;
      }
      
      return orderItem;
    })

    console.log('Order items prepared:', JSON.stringify(orderItems, null, 2));
    
    // Récupérer le dernier numéro de commande pour générer le suivant
    const currentYear = new Date().getFullYear();
    
    // Trouver le dernier numéro séquentiel utilisé cette année
    const lastOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          contains: currentYear.toString()
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      take: 10 // Prendre les 10 derniers pour être sûr
    });

    // Trouver le plus grand numéro séquentiel
    let maxSequentialNumber = 0;
    for (const order of lastOrders) {
      const match = order.orderNumber?.match(/(?:DEV|CMD)-\d{4}-(\d{4})/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSequentialNumber) {
          maxSequentialNumber = num;
        }
      }
    }

    // Générer le nouveau numéro avec le préfixe approprié
    const prefix = data.status === 'QUOTE' ? `DEV-${currentYear}-` : `CMD-${currentYear}-`;
    const sequentialNumber = maxSequentialNumber + 1;
    const orderNumber = `${prefix}${sequentialNumber.toString().padStart(4, '0')}`;

    console.log('Creating order with:', {
      userId: data.userId,
      orderNumber,
      status: data.status || 'PENDING',
      total
    });

    // Création de la commande avec transaction pour gérer les abonnements
    const result = await prisma.$transaction(async (prismaClient) => {
      try {
        // Création de la commande de base
        const order = await prismaClient.order.create({
          data: {
            userId: data.userId,
            orderNumber: orderNumber,
            status: data.status || 'PENDING',
            total,
            addressId: data.addressId,
            items: {
              create: orderItems,
            },
          },
          include: {
            user: true,
            items: {
              include: {
                offer: true,
                product: true,
                service: true,
              },
            },
          },
        })

        console.log('Order created:', order.id)
        
        // Création automatique des abonnements à partir de subscriptionConfigs
        if (data.subscriptionConfigs && Array.isArray(data.subscriptionConfigs) && data.subscriptionConfigs.length > 0) {
          console.log(`Création d'abonnements à partir de subscriptionConfigs: ${data.subscriptionConfigs.length}`);
          
          for (const config of data.subscriptionConfigs) {
            if (!config.offerId) continue;
            
            const subscriptionData: any = {
              userId: data.userId,
              offerId: config.offerId,
              orderId: order.id,
              status: 'ACTIVE',
              startDate: new Date(config.startDate),
              endDate: new Date(config.endDate),
              autoRenew: config.autoRenew || false,
            };
            
            // Si une plateforme spécifique est sélectionnée
            if (config.platformOfferId) {
              subscriptionData.platformOfferId = config.platformOfferId;
            }
            
            // Créer l'abonnement
            const subscription = await prismaClient.subscription.create({
              data: subscriptionData
            });
            
            console.log(`Abonnement créé depuis subscriptionConfigs: ${subscription.id}`);
            
            // Si des comptes et profils ont été sélectionnés
            if (config.platformAccounts && Array.isArray(config.platformAccounts) && config.platformAccounts.length > 0) {
              for (const pa of config.platformAccounts) {
                if (pa.accountId && pa.platformOfferId) {
                  // Créer l'association entre l'abonnement et le compte
                  await prismaClient.subscriptionAccount.create({
                    data: {
                      subscriptionId: subscription.id,
                      accountId: pa.accountId,
                      status: 'ACTIVE'
                    }
                  });
                  
                  console.log(`Association compte-abonnement créée: ${subscription.id} - ${pa.accountId}`);
                  
                  // Assigner les profils sélectionnés
                  if (pa.profileIds && pa.profileIds.length > 0) {
                    // Obtenir les profils du compte
                    const accountProfiles = await prismaClient.accountProfile.findMany({
                      where: {
                        accountId: pa.accountId
                      }
                    });
                    
                    // Mettre à jour chaque profil sélectionné
                    for (const profileId of pa.profileIds) {
                      const profile = accountProfiles.find(p => p.id === profileId);
                      if (profile) {
                        await prismaClient.accountProfile.update({
                          where: { id: profile.id },
                          data: {
                            isAssigned: true,
                            subscriptionId: subscription.id
                          }
                        });
                        console.log(`Profil assigné à l'abonnement: ${profile.id} -> ${subscription.id}`);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        // Création automatique des abonnements pour les offres avec subscriptionDetails
        for (const item of data.items) {
          if (item.itemType === 'OFFER' && item.subscriptionDetails) {
            console.log(`Création d'abonnement à partir de item.subscriptionDetails pour l'item: ${item.offerId}`);
            
            // Créer l'abonnement avec le type correct
            const subscription = await prismaClient.subscription.create({
              data: {
                userId: data.userId,
                orderId: order.id,
                status: 'ACTIVE',
                startDate: new Date(item.subscriptionDetails.startDate),
                endDate: new Date(item.subscriptionDetails.endDate),
                autoRenew: item.subscriptionDetails.autoRenew || false,
                platformOfferId: item.subscriptionDetails.platformOfferId,
                offerId: item.offerId
              }
            });
            
            console.log(`Abonnement créé depuis item.subscriptionDetails: ${subscription.id}`);

            // Gestion des comptes et profils sélectionnés
            if (item.subscriptionDetails.platformAccounts && 
                Array.isArray(item.subscriptionDetails.platformAccounts) && 
                item.subscriptionDetails.platformAccounts.length > 0) {
              
              for (const pa of item.subscriptionDetails.platformAccounts) {
                if (pa.accountId && pa.platformOfferId) {
                  // Créer l'association entre l'abonnement et le compte
                  const subscriptionAccount = await prismaClient.subscriptionAccount.create({
                    data: {
                      subscriptionId: subscription.id,
                      accountId: pa.accountId,
                      status: 'ACTIVE'
                    }
                  });
                  
                  console.log(`Association compte-abonnement créée: ${subscription.id} - ${pa.accountId}`);
                  
                  // Assigner les profils sélectionnés
                  if (pa.profileIds && pa.profileIds.length > 0) {
                    // Obtenir les profils du compte
                    const accountProfiles = await prismaClient.accountProfile.findMany({
                      where: {
                        accountId: pa.accountId
                      }
                    });
                    
                    // Mettre à jour chaque profil sélectionné
                    for (const profileId of pa.profileIds) {
                      const profile = accountProfiles.find(p => p.id === profileId);
                      if (profile) {
                        await prismaClient.accountProfile.update({
                          where: { id: profile.id },
                          data: {
                            isAssigned: true,
                            subscriptionId: subscription.id
                          }
                        });
                        console.log(`Profil assigné à l'abonnement: ${profile.id} -> ${subscription.id}`);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        return order;
      } catch (innerError) {
        console.error('Error in transaction:', innerError);
        throw innerError;
      }
    },
    {
      timeout: 10000, // Augmenter le timeout à 10 secondes
      maxWait: 15000, // Temps d'attente maximum pour obtenir une connexion
    })

    console.log('Order created successfully:', result.id);
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la création de la commande.' },
      { status: 500 }
    )
  }
} 
