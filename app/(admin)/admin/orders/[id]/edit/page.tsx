import React from 'react';
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import { Eye, Pencil, ShoppingCart, ArrowLeft, Edit2 } from 'lucide-react'
import OrderStatusBadge from '@/components/admin/orders/order-status-badge'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { InvoiceGeneratorButton } from '@/components/admin/orders/invoice-generator'

interface PageProps {
  params: {
    id: string
  }
}

// Étendre l'interface Order pour inclure le champ orderNumber
interface OrderWithDetails {
  id: string;
  orderNumber?: string;
  status: string;
  total: any;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    phone?: string | null;
  };
  items: Array<any>;
  subscriptions: Array<any>;
  shippingAddress?: any;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const orderData = await prisma.order.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!orderData) {
    return {
      title: 'Commande non trouvée',
    }
  }

  // Utiliser l'assertion de type
  const order = orderData as unknown as OrderWithDetails;

  return {
    title: `Commande de ${order.user.firstName} ${order.user.lastName}`,
    description: `Détails de la commande ${order.orderNumber || '#' + order.id.substring(0, 8)}`,
  }
}

async function getOrder(id: string): Promise<OrderWithDetails> {
  const orderData = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          offer: true,
          product: true,
          service: true,
        },
      },
      subscriptions: {
        include: {
          offer: true,
          platformOffer: {
            include: {
              platform: true,
            },
          },
        },
      },
      shippingAddress: true,
    }
  });

  if (!orderData) {
    notFound();
  }

  // Utiliser l'assertion de type
  return orderData as unknown as OrderWithDetails;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">En attente</Badge>
    case 'PAID':
      return <Badge variant="success">Payé</Badge>
    case 'SHIPPED':
      return <Badge variant="default">Expédié</Badge>
    case 'DELIVERED':
      return <Badge variant="outline">Livré</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive">Annulé</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default async function OrderPage({ params }: PageProps) {
  const order = await getOrder(params.id)

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Commande non trouvée. L'identifiant {params.id} n'existe pas ou la commande a été supprimée.
        </div>
        <div className="mt-4">
          <Link href="/admin/orders" className="text-blue-600 flex items-center gap-2">
            <ArrowLeft size={16} />
            <span>Retour à la liste des commandes</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            Détails de la commande {order.orderNumber || '#' + order.id.substring(0, 8)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceGeneratorButton orderId={order.id} />
          <Link 
            href={`/admin/orders/${order.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition">
            <Edit2 size={18} />
            <span>Modifier</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Information du client</h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium">Nom: </span>
              {order.user.firstName} {order.user.lastName}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Email: </span>
              {order.user.email}
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Détails de la commande</h2>
          <div className="space-y-3">
            {order.orderNumber && (
              <p className="text-gray-600">
                <span className="font-medium">Numéro: </span>
                {order.orderNumber}
              </p>
            )}
            <p className="text-gray-600">
              <span className="font-medium">Statut: </span>
              <OrderStatusBadge status={order.status} />
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Date: </span>
              {new Date(order.createdAt).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Total: </span>
              <span className="text-lg font-semibold text-green-600">
                <PriceDisplay price={Number(order.total)} size="large" />
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Récapitulatif</h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              <span className="font-medium">Nombre d'articles: </span>
              {order.items.length}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Nombre de produits: </span>
              {order.items.filter(item => item.itemType === 'PRODUCT').length}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Nombre d'abonnements: </span>
              {order.subscriptions?.length || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <h2 className="text-lg font-semibold p-6 border-b">Produits et services commandés</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix unitaire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => {
                let itemName = 'Inconnu';
                if (item.product) itemName = item.product.name;
                if (item.service) itemName = item.service.name;
                if (item.offer) itemName = item.offer.name;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.itemType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriceWithConversion price={Number(item.unitPrice)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <PriceWithConversion price={Number(item.totalPrice)} />
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold">
                  Total de la commande:
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                  <PriceWithConversion price={Number(order.total)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {order.subscriptions && order.subscriptions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <h2 className="text-lg font-semibold p-6 border-b">Abonnements associés</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date début
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date fin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscription.offer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={subscription.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 