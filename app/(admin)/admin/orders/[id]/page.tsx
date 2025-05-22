import React from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Receipt, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OrderStatusBadge from '@/components/admin/orders/order-status-badge';
import { PriceDisplay } from '@/components/ui/price-display';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  productId?: string;
  serviceId?: string;
  offerId?: string;
  product?: { id: string; name: string };
  service?: { id: string; name: string };
  offer?: { id: string; name: string };
  subscriptionDetails?: {
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    platformAccounts: Array<{
      platformOfferId: string;
      accountId: string;
      profileIds: string[];
      platform?: {
        name: string;
      };
    }>;
  };
}

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  items: OrderItem[];
  notes?: string;
}

async function getOrder(id: string): Promise<Order> {
  const baseUrl = headers().get('x-url') || '';
  const response = await fetch(`${baseUrl}/api/admin/orders/${encodeURIComponent(id)}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error('Erreur lors de la récupération de la commande');
  }

  return response.json();
}

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            Commande {order.orderNumber || order.id.substring(0, 8)}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <div className="flex gap-2">
          {(order.status === 'DELIVERED' || order.status === 'FINISHED') && (
            <Button variant="outline" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Bon de livraison
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Facture
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations client */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">
                {order.user.firstName} {order.user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{order.user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Informations commande */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la commande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date de création</span>
                <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière modification</span>
                <span>{new Date(order.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-medium">
                <span>Total</span>
                <PriceDisplay price={order.total} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {order.notes || 'Aucune note'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Articles de la commande */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">
                      {item.product?.name || item.service?.name || item.offer?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.itemType === 'PRODUCT' && 'Produit'}
                      {item.itemType === 'SERVICE' && 'Service'}
                      {item.itemType === 'OFFER' && 'Offre'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      <PriceDisplay price={item.totalPrice} />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x <PriceDisplay price={item.unitPrice} />
                    </p>
                  </div>
                </div>

                {item.subscriptionDetails && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Détails de l'abonnement</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date de début</p>
                        <p>{new Date(item.subscriptionDetails.startDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date de fin</p>
                        <p>{new Date(item.subscriptionDetails.endDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">Comptes associés</p>
                        {item.subscriptionDetails.platformAccounts.map((account, index) => (
                          <div key={index} className="pl-2 border-l-2 border-gray-200 mb-2">
                            <p className="font-medium">{account.platform?.name || 'Plateforme'}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.profileIds.length} profil(s) associé(s)
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
 