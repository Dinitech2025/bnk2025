import React, { Suspense } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { EnhancedOrdersList } from '@/components/admin/orders/enhanced-orders-list';
import { RefreshButton } from '@/components/admin/orders/refresh-button';
import OrdersLoading from './loading';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Désactiver le cache pour avoir les données en temps réel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Type pour les données après conversion des Decimal en number
type OrderWithConvertedPrices = Omit<OrderWithRelations, 'total' | 'items' | 'user' | 'createdAt' | 'updatedAt' | 'payments'> & {
  total: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items: Array<Omit<OrderWithRelations['items'][0], 'unitPrice' | 'totalPrice' | 'metadata'> & {
    unitPrice: number;
    totalPrice: number;
    metadata: string | null;
  }>;
  payments: Array<Omit<OrderWithRelations['payments'][0], 'amount' | 'createdAt'> & {
    amount: number;
    createdAt: string;
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
    payments: {
      select: {
        id: true;
        amount: true;
        currency: true;
        method: true;
        provider: true;
        createdAt: true;
      };
    };
  };
}>;

// Fonction pour obtenir les statistiques des commandes
async function getOrdersStats() {
  try {
    const [
      totalOrders,
      pendingOrders,
      paidOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      thisMonthOrders
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    return {
      totalOrders,
      pendingOrders,
      paidOrders,
      cancelledOrders,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      todayOrders,
      thisMonthOrders
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      paidOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      todayOrders: 0,
      thisMonthOrders: 0
    };
  }
}

// Fonction pour obtenir les commandes avec pagination
async function getOrders(page: number = 1, limit: number = 20): Promise<{
  orders: OrderWithConvertedPrices[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    console.log('🔍 getOrders appelé:', { page, limit });
    const skip = (page - 1) * limit;
    
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
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
          select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              provider: true,
              createdAt: true,
              status: true,
              paymentExchangeRate: true,
              paymentDisplayCurrency: true,
              paymentBaseCurrency: true
            }
          },
          billingAddress: true,
          shippingAddress: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count()
    ]);

    console.log('📊 Résultats requête:', { 
      ordersCount: orders.length, 
      totalCount,
      premièresCommandes: orders.slice(0, 3).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status
      }))
    });

    // Convertir les Decimal en nombres et les dates en strings
    const convertedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      // Conversion des champs de taux de change
      exchangeRate: order.exchangeRate ? Number(order.exchangeRate) : null,
      originalTotal: order.originalTotal ? Number(order.originalTotal) : null,
      user: {
        ...order.user,
        email: order.user.email || ""
      },
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountValue: item.discountValue ? Number(item.discountValue) : null,
        discountAmount: item.discountAmount ? Number(item.discountAmount) : null,
        metadata: item.metadata ? JSON.stringify(item.metadata) : null
      })),
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
        createdAt: payment.createdAt.toISOString(),
        paymentExchangeRate: payment.paymentExchangeRate ? Number(payment.paymentExchangeRate) : null
      }))
    }));

    const totalPages = Math.ceil(totalCount / limit);

    console.log('✅ getOrders terminé:', { 
      convertedOrdersCount: convertedOrders.length,
      totalPages,
      currentPage: page
    });

    return {
      orders: convertedOrders,
      totalCount,
      totalPages,
      currentPage: page
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return {
      orders: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;
  
  const [ordersData, stats] = await Promise.all([
    getOrders(page, limit),
    getOrdersStats()
  ]);

  return (
    <div className="p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Commandes</h1>
            <p className="text-muted-foreground">
              Gérez et suivez toutes vos commandes en temps réel
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RefreshButton />
            <Link 
              href="/admin/orders/new" 
              className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <PlusCircle size={18} />
              <span>Nouvelle Commande</span>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commandes</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.todayOrders} aujourd'hui
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              À traiter
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payées</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidOrders}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ce mois: {stats.thisMonthOrders}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalRevenue.toLocaleString('fr-FR')} Ar
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Commandes payées
            </p>
          </div>
        </div>
        
        {/* Liste des commandes */}
        <Suspense fallback={<OrdersLoading />}>
          <EnhancedOrdersList 
            orders={ordersData.orders} 
            stats={stats}
            pagination={{
              currentPage: ordersData.currentPage,
              totalPages: ordersData.totalPages,
              totalCount: ordersData.totalCount,
              limit: limit
            }}
          />
        </Suspense>
      </div>
    </div>
  );
} 