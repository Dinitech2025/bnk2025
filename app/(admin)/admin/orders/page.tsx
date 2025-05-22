import React, { Suspense } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import OrdersList from '@/components/admin/orders/orders-list';
import OrdersLoading from './loading';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Type pour les données après conversion des Decimal en number
type OrderWithConvertedPrices = Omit<OrderWithRelations, 'total' | 'items'> & {
  total: number;
  items: Array<Omit<OrderWithRelations['items'][0], 'unitPrice' | 'totalPrice'> & {
    unitPrice: number;
    totalPrice: number;
  }>;
};

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
    items: {
      include: {
        offer: {
          select: {
            id: true;
            name: true;
          };
        };
        product: {
          select: {
            id: true;
            name: true;
          };
        };
        service: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

// Fonction pour obtenir les commandes directement depuis la base de données
async function getOrders(): Promise<OrderWithConvertedPrices[]> {
  try {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convertir les Decimal en nombres
    return orders.map(order => ({
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }));

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();

    return (
    <div className="p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
          <Link 
            href="/admin/orders/new" 
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-dark transition">
            <PlusCircle size={18} />
            <span>Nouvelle Commande</span>
          </Link>
        </div>
        
        <Suspense fallback={<OrdersLoading />}>
          <OrdersList orders={orders} />
        </Suspense>
        </div>
      </div>
    );
} 