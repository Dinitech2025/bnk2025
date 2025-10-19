import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/invoice-generator';

// Route GET pour la compatibilité
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handleInvoiceGeneration(params.id);
}

// Route POST pour la conversion de devise
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { conversionData } = await request.json();
  return handleInvoiceGeneration(params.id, conversionData);
}

/**
 * Récupère le numéro de commande formaté
 */
function generateOrderNumber(order: any): string {
  // Utiliser le numéro de commande existant
  if (order.orderNumber) {
    return order.orderNumber;
  }
  
  // Fallback au cas où il n'y a pas de numéro
  const year = new Date(order.createdAt).getFullYear();
  const prefix = order.status === 'QUOTE' ? 'DEV' : 'CMD';
  return `${prefix}-${year}-0001`;
}

/**
 * Récupère le symbole de la devise
 */
function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'EUR': '€',
    'USD': '$',
    'Ar': 'Ar',
    'MGA': 'Ar'
  };
  return symbols[currency] || currency;
}

async function handleInvoiceGeneration(orderId: string, conversionData?: { targetCurrency: string; exchangeRate: number }) {
  try {
    // Vérifier que la commande existe et récupérer les détails nécessaires pour la facture
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        billingAddress: true,
        shippingAddress: true,
        items: {
          include: {
            product: true,
            service: true,
            offer: true,
          },
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            method: true,
            amount: true,
            provider: true,
            createdAt: true
          }
        }
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    if (!order.user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé pour cette commande' },
        { status: 404 }
      );
    }

    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article trouvé dans cette commande' },
        { status: 400 }
      );
    }

    // Fonction pour convertir les prix si nécessaire
    const convertPrice = (price: number): number => {
      if (conversionData?.targetCurrency && conversionData?.exchangeRate) {
        return price * conversionData.exchangeRate;
      }
      return price;
    };

    // Préparer les prix convertis
    const convertedPrices: Record<string, number> = {};
    const orderTotal = Number(order.total);

    if (conversionData?.targetCurrency && conversionData?.exchangeRate) {
      // Convertir tous les prix utilisés dans la facture
      order.items.forEach(item => {
        const unitPrice = Number(item.unitPrice);
        const totalPrice = Number(item.totalPrice);
        convertedPrices[`${unitPrice}`] = convertPrice(unitPrice);
        convertedPrices[`${totalPrice}`] = convertPrice(totalPrice);
      });

      // Convertir les totaux
      convertedPrices[`${orderTotal}`] = convertPrice(orderTotal);
      const totalHT = orderTotal / 1.2;
      const tva = orderTotal - totalHT;
      convertedPrices[`${totalHT}`] = convertPrice(totalHT);
      convertedPrices[`${tva}`] = convertPrice(tva);
      
      // Convertir les montants des paiements
      order.payments?.forEach(payment => {
        const paymentAmount = Number(payment.amount);
        convertedPrices[`${paymentAmount}`] = convertPrice(paymentAmount);
      });

      // Convertir les montants de réduction
      order.items.forEach(item => {
        if (item.discountAmount) {
          const discountAmount = Number(item.discountAmount);
          convertedPrices[`${discountAmount}`] = convertPrice(discountAmount);
        }
      });

      // Convertir la réduction globale
      if (order.globalDiscountAmount) {
        const globalDiscountAmount = Number(order.globalDiscountAmount);
        convertedPrices[`${globalDiscountAmount}`] = convertPrice(globalDiscountAmount);
      }
    }

    // Structurer les données de la commande pour la facture
    const invoiceData = {
      id: order.id,
      orderNumber: generateOrderNumber(order),
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: orderTotal,
      currency: conversionData?.targetCurrency || order.currency || 'Ar',
      currencySymbol: getCurrencySymbol(conversionData?.targetCurrency || order.currency || 'Ar'),
      exchangeRate: conversionData?.exchangeRate,
      customer: {
        id: order.user.id,
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        email: order.user.email || "",
        phone: order.user.phone || undefined
      },
      billingAddress: order.billingAddress && (order.billingAddress.street || order.billingAddress.city) ? {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        address: order.billingAddress.street || '',
        city: order.billingAddress.city || '',
        postalCode: order.billingAddress.zipCode || '',
        country: order.billingAddress.country || '',
        phone: order.billingAddress.phoneNumber || undefined
      } : undefined,
      shippingAddress: order.shippingAddress && (order.shippingAddress.street || order.shippingAddress.city) ? {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        address: order.shippingAddress.street || '',
        city: order.shippingAddress.city || '',
        postalCode: order.shippingAddress.zipCode || '',
        country: order.shippingAddress.country || '',
        phone: order.shippingAddress.phoneNumber || undefined
      } : undefined,
      payments: order.payments?.map(payment => ({
        method: payment.method,
        amount: Number(payment.amount),
        provider: payment.provider || undefined,
        createdAt: payment.createdAt
      })) || [],
      items: order.items.map(item => {
        // Récupérer le nom depuis les relations ou les métadonnées
        let itemName = item.product?.name || item.service?.name || item.offer?.name;
        
        // Si pas de nom trouvé, vérifier les métadonnées
        if (!itemName && item.metadata) {
          try {
            const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
            itemName = metadata.name;
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
        
        return {
          id: item.id,
          name: itemName || 'Article inconnu',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          type: item.itemType,
          discountType: item.discountType || undefined,
          discountValue: item.discountValue ? Number(item.discountValue) : undefined,
          discountAmount: item.discountAmount ? Number(item.discountAmount) : undefined,
        };
      }),
      globalDiscount: (order.globalDiscountType && order.globalDiscountValue && order.globalDiscountAmount) ? {
        type: order.globalDiscountType,
        value: Number(order.globalDiscountValue),
        amount: Number(order.globalDiscountAmount)
      } : undefined,
      convertedPrices: Object.keys(convertedPrices).length > 0 ? convertedPrices : undefined
    };

    // Générer le PDF
    const pdfBase64 = generateInvoicePDF(invoiceData);

    return NextResponse.json({
      ...invoiceData,
      pdfBase64
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la génération de la facture:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Erreur lors de la génération de la facture: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur interne lors de la génération de la facture' },
      { status: 500 }
    );
  }
} 