import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    console.log('📦 Création nouvelle commande:', {
      userId: session?.user?.id,
      itemsCount: body.items?.length,
      total: body.total,
      paymentMethod: body.paymentData?.method
    })

    console.log('📋 Données adresses reçues:', {
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress
    })

    // Logs détaillés pour debugging
    console.log('🔍 ANALYSE DÉTAILLÉE DES ADRESSES:')
    console.log('   📦 SHIPPING ADDRESS:')
    if (body.shippingAddress) {
      console.log('      • firstName:', body.shippingAddress.firstName)
      console.log('      • lastName:', body.shippingAddress.lastName)
      console.log('      • address:', body.shippingAddress.address || 'VIDE')
      console.log('      • city:', body.shippingAddress.city || 'VIDE')
      console.log('      • postalCode:', body.shippingAddress.postalCode || 'VIDE')
      console.log('      • country:', body.shippingAddress.country || 'VIDE')
      console.log('      • phone:', body.shippingAddress.phone || 'VIDE')
    } else {
      console.log('      • NULL ou UNDEFINED')
    }
    
    console.log('   🧾 BILLING ADDRESS:')
    if (body.billingAddress) {
      console.log('      • firstName:', body.billingAddress.firstName)
      console.log('      • lastName:', body.billingAddress.lastName)
      console.log('      • address:', body.billingAddress.address || 'VIDE')
      console.log('      • city:', body.billingAddress.city || 'VIDE')
      console.log('      • postalCode:', body.billingAddress.postalCode || 'VIDE')
      console.log('      • country:', body.billingAddress.country || 'VIDE')
      console.log('      • phone:', body.billingAddress.phone || 'VIDE')
    } else {
      console.log('      • NULL ou UNDEFINED')
    }

    // Extraire les données
    const {
      items,
      total,
      currency,
      shippingAddress,
      billingAddress,
      email,
      phone,
      firstName,
      lastName,
      paymentData,
      notes,
      exchangeRates,
      displayCurrency,
      baseCurrency
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article dans la commande' },
        { status: 400 }
      )
    }

    if (!paymentData || !paymentData.transactionId) {
      return NextResponse.json(
        { error: 'Données de paiement manquantes' },
        { status: 400 }
      )
    }

    // Générer un numéro de commande au format correct
    const currentYear = new Date().getFullYear()
    
    // Déterminer le préfixe selon le statut de paiement
    const prefix = paymentData.status === 'completed' ? 'CMD' : 'DEV'
    
    // Trouver le dernier numéro de commande avec ce préfixe
    const lastOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          startsWith: `${prefix}-${currentYear}`
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      take: 10
    })

    // Trouver le plus grand numéro séquentiel
    let maxSequentialNumber = 0
    for (const order of lastOrders) {
      const match = order.orderNumber?.match(new RegExp(`${prefix}-(\\d{4})-(\\d{4})`))
      if (match) {
        const num = parseInt(match[2], 10)
        if (num > maxSequentialNumber) {
          maxSequentialNumber = num
        }
      }
    }

    // Générer le nouveau numéro
    const sequentialNumber = maxSequentialNumber + 1
    const orderNumber = `${prefix}-${currentYear}-${sequentialNumber.toString().padStart(4, '0')}`
    
    console.log('📋 Génération numéro de commande:', {
      prefix,
      currentYear,
      lastMaxNumber: maxSequentialNumber,
      newSequentialNumber: sequentialNumber,
      generatedOrderNumber: orderNumber
    })

    // Gérer l'utilisateur (connecté ou invité)
    let userId = session?.user?.id
    
    if (!userId) {
      // Créer ou récupérer un utilisateur invité basé sur l'email
      const guestUser = await prisma.user.upsert({
        where: { email: email },
        update: {
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || ''
        },
        create: {
          email: email,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || '',
          role: 'CLIENT',
          name: `${firstName || ''} ${lastName || ''}`.trim() || 'Invité'
        }
      })
      userId = guestUser.id
    }

    // Créer ou réutiliser les adresses si fournies
    let shippingAddressId = null
    let billingAddressId = null

    if (shippingAddress) {
      console.log('📦 Vérification adresse de livraison:', {
        userId,
        street: shippingAddress.address,
        city: shippingAddress.city,
        zipCode: shippingAddress.postalCode,
        country: shippingAddress.country
      })
      
      // Vérifier si une adresse identique existe déjà (ignorer les adresses vides)
      const existingShippingAddress = await prisma.address.findFirst({
        where: {
          userId,
          street: shippingAddress.address || '',
          city: shippingAddress.city || '',
          zipCode: shippingAddress.postalCode || '',
          country: shippingAddress.country || 'Madagascar',
          // Ne pas réutiliser les adresses vides
          NOT: {
            AND: [
              { street: '' },
              { city: '' },
              { zipCode: '' }
            ]
          }
        }
      })

      if (existingShippingAddress) {
        console.log('♻️  Réutilisation adresse de livraison existante:', existingShippingAddress.id)
        shippingAddressId = existingShippingAddress.id
      } else {
        console.log('🆕 Création nouvelle adresse de livraison')
        const createdShippingAddress = await prisma.address.create({
          data: {
            userId,
            type: 'SHIPPING',
            street: shippingAddress.address || '',
            city: shippingAddress.city || '',
            zipCode: shippingAddress.postalCode || '',
            country: shippingAddress.country || 'Madagascar',
            phoneNumber: shippingAddress.phone || phone || ''
          }
        })
        shippingAddressId = createdShippingAddress.id
        console.log('✅ Nouvelle adresse de livraison créée:', createdShippingAddress.id)
      }
    }

    if (billingAddress) {
      console.log('🧾 Vérification adresse de facturation:', {
        userId,
        street: billingAddress.address,
        city: billingAddress.city,
        zipCode: billingAddress.postalCode,
        country: billingAddress.country
      })
      
      // Vérifier si une adresse identique existe déjà (ignorer les adresses vides)
      const existingBillingAddress = await prisma.address.findFirst({
        where: {
          userId,
          street: billingAddress.address || '',
          city: billingAddress.city || '',
          zipCode: billingAddress.postalCode || '',
          country: billingAddress.country || 'Madagascar',
          // Ne pas réutiliser les adresses vides
          NOT: {
            AND: [
              { street: '' },
              { city: '' },
              { zipCode: '' }
            ]
          }
        }
      })

      if (existingBillingAddress) {
        console.log('♻️  Réutilisation adresse de facturation existante:', existingBillingAddress.id)
        billingAddressId = existingBillingAddress.id
      } else {
        console.log('🆕 Création nouvelle adresse de facturation')
        const createdBillingAddress = await prisma.address.create({
          data: {
            userId,
            type: 'BILLING',
            street: billingAddress.address || '',
            city: billingAddress.city || '',
            zipCode: billingAddress.postalCode || '',
            country: billingAddress.country || 'Madagascar',
            phoneNumber: billingAddress.phone || phone || ''
          }
        })
        billingAddressId = createdBillingAddress.id
        console.log('✅ Nouvelle adresse de facturation créée:', createdBillingAddress.id)
      }
    }

    // Créer la commande en base de données
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        
        // Adresses
        addressId: shippingAddressId,
        billingAddressId: billingAddressId,
        
        // Informations client
        email: email || session?.user?.email,
        phone: phone || '',
        firstName: firstName || session?.user?.name?.split(' ')[0] || '',
        lastName: lastName || session?.user?.name?.split(' ').slice(1).join(' ') || '',
        
        // Montants
        total,
        currency: currency || 'Ar',
        
        // Paiement
        paymentMethod: paymentData.method,
        paymentStatus: paymentData.status === 'completed' ? 'PAID' : 'PENDING',
        transactionId: paymentData.transactionId,
        paymentDetails: JSON.stringify(paymentData),
        
        // Statut
        status: 'CONFIRMED',
        notes: notes || '',
        
        // Taux de change au moment de la commande
        exchangeRates: exchangeRates ? JSON.stringify(exchangeRates) : null,
        baseCurrency: baseCurrency || 'MGA',
        displayCurrency: displayCurrency || currency || 'MGA',
        exchangeRate: exchangeRates && displayCurrency ? exchangeRates[displayCurrency] : null,
        originalTotal: baseCurrency === (displayCurrency || currency) ? total : total, // À ajuster selon la logique
        
        // Articles de la commande
        items: {
          create: items.map((item: any) => ({
            productId: item.productId && item.productId !== 'test-product-1' ? item.productId : null,
            serviceId: item.serviceId || null,
            itemType: item.type || 'product',
            quantity: item.quantity || 1,
            unitPrice: item.price,
            totalPrice: item.price * (item.quantity || 1),
            metadata: item.metadata ? JSON.stringify(item.metadata) : JSON.stringify({
              name: item.name || 'Article',
              originalId: item.id || item.productId
            })
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                inventory: true
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('✅ Commande créée avec succès:', {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      itemsCount: order.items.length
    })

    // Créer l'enregistrement de paiement si le paiement est complété
    let payment = null;
    if (paymentData.status === 'completed') {
        payment = await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: total,
            currency: currency || 'Ar',
            method: paymentData.method,
            provider: paymentData.method === 'paypal' ? 'PAYPAL' : 'OTHER',
            status: 'COMPLETED',
            transactionId: paymentData.transactionId,
            reference: order.orderNumber,
            notes: `Paiement automatique pour commande ${order.orderNumber}`,
            processedBy: userId,
            
            // Taux de change au moment du paiement
            paymentExchangeRate: exchangeRates && displayCurrency ? exchangeRates[displayCurrency] : null,
            paymentBaseCurrency: baseCurrency || 'MGA',
            paymentDisplayCurrency: displayCurrency || currency || 'MGA',
            originalAmount: baseCurrency === (displayCurrency || currency) ? total : total
          }
        });

      console.log('✅ Paiement enregistré:', {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        transactionId: payment.transactionId
      });
    }

    // Log pour audit
    console.log(`📋 AUDIT COMMANDE: ${order.orderNumber}`)
    console.log(`   User: ${order.userId || 'Guest'} (${order.email})`)
    console.log(`   Total: ${order.total} ${order.currency}`)
    console.log(`   Payment: ${order.paymentMethod} - ${order.transactionId}`)
    console.log(`   Items: ${order.items.length} articles`)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        items: order.items,
        createdAt: order.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Erreur détaillée lors de la création de la commande:', {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la commande',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
