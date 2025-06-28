import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, Truck, User, MapPin, CreditCard, Clock, Package, Users, Monitor, AlertCircle, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import OrderStatusBadge from '@/components/admin/orders/order-status-badge';
import { PriceWithConversion } from '@/components/ui/currency-selector';
import { prisma } from "@/lib/prisma";

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

interface PlatformOffer {
  id: string;
  platform: {
    id: string;
    name: string;
    logo?: string | null;
  };
}

interface Account {
  id: string;
  username: string;
  email: string;
  platform: {
    id: string;
    name: string;
    logo: string | null;
  };
}

interface AccountProfile {
  id: string;
  name: string;
  profileSlot: number;
  pin: string | null;
  isAssigned: boolean;
  accountId: string;
  account: {
    username: string;
    email: string;
    id: string;
  };
}

interface SubscriptionAccount {
  account: Account;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  platformOfferId: string;
  offer: {
    name: string;
  };
  platformOffer: PlatformOffer | null;
  subscriptionAccounts: SubscriptionAccount[];
  accountProfiles: AccountProfile[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  metadata: string | null;
  productId?: string;
  serviceId?: string;
  offerId?: string;
  product?: { id: string; name: string };
  service?: { id: string; name: string };
  offer?: { id: string; name: string };
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
  shippingAddress: Address | null;
  subscriptions: Subscription[];
}

// Fonction pour extraire les informations des métadonnées
function parseMetadata(metadata: string | null) {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}

// Fonction pour formater le mode de paiement
function formatPaymentMethod(method: string): string {
  const methods: { [key: string]: string } = {
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Virement bancaire',
    'cash_on_delivery': 'Paiement à la livraison',
    'credit_card': 'Carte bancaire',
    'card': 'Carte bancaire'
  };
  return methods[method] || method;
}

async function getOrder(id: string): Promise<Order> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
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
  
  // Extraire les métadonnées du premier item pour les informations générales
  const firstItemMetadata = order.items.length > 0 ? parseMetadata(order.items[0].metadata) : null;
  const paymentMethod = firstItemMetadata?.paymentMethod;
  const billingAddress = firstItemMetadata?.billingAddress;
  const shippingAddress = firstItemMetadata?.shippingAddress;
  const notes = firstItemMetadata?.notes;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Commande {order.orderNumber || order.id.substring(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Créée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <div className="flex gap-2">
          {(order.status === 'Livrée' || order.status === 'Terminée') && (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Articles de la commande */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items.map((item, index) => {
                  const itemMetadata = parseMetadata(item.metadata);
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {item.product?.name || item.service?.name || item.offer?.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {item.itemType === 'PRODUCT' && 'Produit'}
                              {item.itemType === 'SERVICE' && 'Service'}
                              {item.itemType === 'OFFER' && 'Abonnement'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Quantité: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            <PriceWithConversion price={item.totalPrice} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × <PriceWithConversion price={item.unitPrice} />
                          </p>
                        </div>
                      </div>

                      {/* Détails spécifiques aux abonnements */}
                      {item.itemType === 'OFFER' && order.subscriptions.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                           {order.subscriptions
                             .filter(sub => sub.offer.name === item.offer?.name)
                             .map((subscription, subIndex) => (
                               <div key={subscription.id} className="space-y-3">
                                 {/* Informations de base de l'abonnement */}
                                 <div className="flex flex-wrap items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                                   <div className="flex items-center gap-2">
                                     {subscription.platformOffer?.platform?.logo && (
                                       <img 
                                         src={subscription.platformOffer.platform.logo} 
                                         alt={subscription.platformOffer.platform.name}
                                         className="w-5 h-5 rounded"
                                       />
                                     )}
                                     <Monitor className="h-4 w-4" />
                                     <span className="font-medium text-gray-700">
                                       {subscription.platformOffer?.platform?.name || 'Plateforme non spécifiée'}
                                     </span>
                                   </div>
                                   <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                     {subscription.status}
                                   </Badge>
                                   <span className="text-muted-foreground">
                                     {new Date(subscription.startDate).toLocaleDateString('fr-FR')} 
                                     → {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                                   </span>
                                 </div>

                                 {/* Comptes assignés */}
                                 {subscription.subscriptionAccounts && subscription.subscriptionAccounts.length > 0 && (
                                   <div className="bg-blue-50 rounded-lg p-3">
                                     <div className="flex items-center gap-2 mb-2">
                                       <User className="h-4 w-4 text-blue-600" />
                                       <span className="font-medium text-blue-800">Compte assigné</span>
                                     </div>
                                     {subscription.subscriptionAccounts.map((subAccount, accountIndex) => (
                                       <div key={accountIndex} className="text-sm space-y-1">
                                         <div className="flex items-center gap-2">
                                           <span className="font-medium">{subAccount.account.username}</span>
                                           <span className="text-muted-foreground">({subAccount.account.email})</span>
                                         </div>
                                         <div className="text-xs text-muted-foreground">
                                           Plateforme: {subAccount.account.platform.name}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 )}

                                 {/* Profils assignés */}
                                 {subscription.accountProfiles && subscription.accountProfiles.length > 0 && (
                                   <div className="bg-green-50 rounded-lg p-3">
                                     <div className="flex items-center gap-2 mb-2">
                                       <Users className="h-4 w-4 text-green-600" />
                                       <span className="font-medium text-green-800">
                                         Profils assignés ({subscription.accountProfiles.length})
                                       </span>
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                       {subscription.accountProfiles.map((profile, profileIndex) => (
                                         <div key={profile.id} className="text-sm bg-white rounded p-2 border">
                                           <div className="flex items-center justify-between">
                                             <span className="font-medium">{profile.name}</span>
                                             <Badge variant="outline" className="text-xs">
                                               Slot {profile.profileSlot}
                                             </Badge>
                                           </div>
                                           <div className="text-xs text-muted-foreground mt-1">
                                             Compte: {profile.account.username}
                                             {profile.pin && (
                                               <span className="ml-2">• PIN: {profile.pin}</span>
                                             )}
                                           </div>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 {/* Message si pas de compte/profil assigné */}
                                 {(!subscription.subscriptionAccounts || subscription.subscriptionAccounts.length === 0) && 
                                  (!subscription.accountProfiles || subscription.accountProfiles.length === 0) && (
                                   <div className="bg-yellow-50 rounded-lg p-3">
                                     <div className="flex items-center gap-2 text-yellow-700">
                                       <AlertCircle className="h-4 w-4" />
                                       <span className="text-sm font-medium">
                                         Aucun compte ou profil assigné à cet abonnement
                                       </span>
                                     </div>
                                     <p className="text-xs text-yellow-600 mt-1">
                                       L'abonnement doit être configuré avec un compte et des profils.
                                     </p>
                                   </div>
                                 )}
                               </div>
                             ))
                           }
                        </div>
                      )}

                      {/* Métadonnées spécifiques à l'article */}
                      {itemMetadata && itemMetadata.notes && (
                        <div className="border-t pt-4 mt-4">
                          <p className="text-sm font-medium text-muted-foreground">Notes spécifiques</p>
                          <p className="text-sm mt-1">{itemMetadata.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Historique des statuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Commande créée</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Dernière modification</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.updatedAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Statut actuel: {order.status}</p>
                    <p className="text-sm text-muted-foreground">
                      Dernière mise à jour: {new Date(order.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          
          {/* Résumé de la commande */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <PriceWithConversion price={order.total} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span>Gratuit</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <PriceWithConversion price={order.total} />
              </div>
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className="text-muted-foreground">{order.user.email}</p>
                {order.user.phone && (
                  <p className="text-muted-foreground">{order.user.phone}</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Voir le profil client
              </Button>
            </CardContent>
          </Card>

          {/* Mode de paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {paymentMethod ? formatPaymentMethod(paymentMethod) : 'Non spécifié'}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    order.status === 'Payée' ? 'bg-green-500' : 
                    order.status === 'Devis en attente de paiement' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-muted-foreground">
                    {order.status === 'Payée' ? 'Paiement reçu' : 
                     order.status === 'Devis en attente de paiement' ? 'En attente de paiement' : 'Statut de paiement inconnu'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {billingAddress && (
                <div>
                  <p className="font-medium mb-2">Adresse de facturation</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{billingAddress.street}</p>
                    <p>{billingAddress.city} {billingAddress.zipCode}</p>
                    <p>{billingAddress.country}</p>
                  </div>
                </div>
              )}
              
              {shippingAddress && shippingAddress !== billingAddress && (
                <div>
                  <Separator className="my-3" />
                  <p className="font-medium mb-2">Adresse de livraison</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{shippingAddress.street}</p>
                    <p>{shippingAddress.city} {shippingAddress.zipCode}</p>
                    <p>{shippingAddress.country}</p>
                  </div>
                </div>
              )}
              
              {order.shippingAddress && (
                <div>
                  <Separator className="my-3" />
                  <p className="font-medium mb-2">Adresse enregistrée</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city} {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
 