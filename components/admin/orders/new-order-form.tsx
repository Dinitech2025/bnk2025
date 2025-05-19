'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import Image from 'next/image';
import { Decimal } from '@prisma/client/runtime/library';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Types
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  addresses: {
    id: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }[];
  orders: {
    id: string;
    createdAt: Date;
    status: string;
    total: Decimal | number;
  }[];
}

interface Platform {
  id: string;
  name: string;
  logo: string;
}

interface PlatformOffer {
  id: string;
  platform: Platform;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: Decimal | number;
  type: 'PRODUCT' | 'SERVICE' | 'OFFER';
  inventory?: number;
  duration?: number;
  durationUnit?: string;
  maxProfiles?: number;
  maxUsers?: number;
  images: {
    id: string;
    path: string;
  }[];
  category?: {
    id: string;
    name: string;
  } | null;
  features?: string[];
  platformOffers?: PlatformOffer[];
}

interface SubscriptionDetails {
  platformOfferId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

interface OrderItem {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
  productId?: string;
  serviceId?: string;
  offerId?: string;
  item?: Item;
  subscriptionDetails?: SubscriptionDetails;
}

interface NewOrderFormProps {
  users: User[];
  products: Item[];
  services: Item[];
  offers: Item[];
}

export function NewOrderForm({ users, products, services, offers }: NewOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [currentSubscriptionItem, setCurrentSubscriptionItem] = useState<OrderItem | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [selectedPlatformOfferId, setSelectedPlatformOfferId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  const [autoRenew, setAutoRenew] = useState(false);
  
  const [formData, setFormData] = useState({
    userId: '',
    status: 'PENDING',
    items: [] as OrderItem[],
    notes: '',
  });

  const [currentItem, setCurrentItem] = useState<{
    itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
    itemId: string;
    quantity: number;
  }>({
    itemType: 'PRODUCT',
    itemId: '',
    quantity: 1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'userId') {
      const user = users.find(u => u.id === value);
      setSelectedUser(user || null);
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: value,
    });
  };

  const handleItemTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemType = e.target.value as 'PRODUCT' | 'SERVICE' | 'OFFER';
    setCurrentItem({
      itemType,
      itemId: '',
      quantity: 1,
    });
  };

  const getItems = () => {
    switch (currentItem.itemType) {
      case 'PRODUCT':
        return products;
      case 'SERVICE':
        return services;
      case 'OFFER':
        return offers;
      default:
        return [];
    }
  };

  const addItem = () => {
    const items = getItems();
    const item = items.find(i => i.id === currentItem.itemId);
    
    if (!item) return;
    
    // Convertir le prix en nombre pour les opérations arithmétiques
    const unitPrice = typeof item.price === 'number' ? item.price : Number(item.price.toString());
    const totalPrice = unitPrice * currentItem.quantity;
    
    const newItem: OrderItem = {
      itemType: currentItem.itemType,
      quantity: currentItem.quantity,
      unitPrice,
      totalPrice,
      item,
    };
    
    // Ajouter les IDs spécifiques selon le type
    if (currentItem.itemType === 'PRODUCT') {
      newItem.productId = item.id;
      
      // Ajouter directement à la commande
      setFormData({
        ...formData,
        items: [...formData.items, newItem],
      });
      
      // Réinitialiser le formulaire d'ajout d'article
      setCurrentItem({
        itemType: 'PRODUCT',
        itemId: '',
        quantity: 1,
      });
    } 
    else if (currentItem.itemType === 'SERVICE') {
      newItem.serviceId = item.id;
      
      // Ajouter directement à la commande
      setFormData({
        ...formData,
        items: [...formData.items, newItem],
      });
      
      // Réinitialiser le formulaire d'ajout d'article
      setCurrentItem({
        itemType: 'PRODUCT',
        itemId: '',
        quantity: 1,
      });
    } 
    else if (currentItem.itemType === 'OFFER') {
      newItem.offerId = item.id;
      
      // Si c'est une offre avec des plateformes, on configure l'abonnement
      const platforms = item.platformOffers || [];
      const hasPlatforms = platforms.length > 0;
      
      // Calculer la date de fin en fonction de la durée de l'offre
      let calculatedEndDate = new Date();
      if (item.duration && item.durationUnit) {
        switch(item.durationUnit.toUpperCase()) {
          case 'DAY':
            calculatedEndDate.setDate(calculatedEndDate.getDate() + (item.duration));
            break;
          case 'WEEK': 
            calculatedEndDate.setDate(calculatedEndDate.getDate() + (item.duration * 7));
            break;
          case 'MONTH':
            calculatedEndDate.setMonth(calculatedEndDate.getMonth() + item.duration);
            break;
          case 'YEAR':
            calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + item.duration);
            break;
          default:
            calculatedEndDate.setMonth(calculatedEndDate.getMonth() + item.duration);
        }
      } else {
        // Par défaut, un mois
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);
      }
      
      if (hasPlatforms) {
        if (platforms.length === 1) {
          // S'il n'y a qu'une seule plateforme, on l'utilise directement
          const platformId = platforms[0].id;
          console.log('Une seule plateforme disponible, configuration automatique:', platformId);
          
          newItem.subscriptionDetails = {
            platformOfferId: platformId,
            startDate: new Date(),
            endDate: calculatedEndDate,
            autoRenew: false,
          };
          
          // Ajouter directement à la commande
          setFormData({
            ...formData,
            items: [...formData.items, newItem],
          });
          
          // Réinitialiser le formulaire d'ajout d'article
          setCurrentItem({
            itemType: 'PRODUCT',
            itemId: '',
            quantity: 1,
          });
        } else {
          // Ouvrir le dialogue de configuration d'abonnement pour choisir la plateforme
          console.log('Plusieurs plateformes disponibles, ouverture du dialogue de configuration');
          setCurrentSubscriptionItem(newItem);
          setCurrentItemIndex(-1); // Nouvel item, pas encore dans la liste
          setSelectedPlatformOfferId('');
          setStartDate(new Date());
          setEndDate(calculatedEndDate);
          setAutoRenew(false);
          setShowSubscriptionDialog(true);
        }
      } else {
        // Pas de plateformes, ajouter directement
        console.log('Aucune plateforme disponible pour cette offre');
        setFormData({
          ...formData,
          items: [...formData.items, newItem],
        });
        
        // Réinitialiser le formulaire d'ajout d'article
        setCurrentItem({
          itemType: 'PRODUCT',
          itemId: '',
          quantity: 1,
        });
      }
    }
  };

  const saveSubscriptionDetails = () => {
    if (!currentSubscriptionItem) return;
    
    // Configuration de l'abonnement
    const updatedItem = {
      ...currentSubscriptionItem,
      subscriptionDetails: {
        platformOfferId: selectedPlatformOfferId,
        startDate,
        endDate,
        autoRenew,
      }
    };
    
    if (currentItemIndex >= 0) {
      // Mise à jour d'un item existant
      const updatedItems = [...formData.items];
      updatedItems[currentItemIndex] = updatedItem;
      
      setFormData({
        ...formData,
        items: updatedItems,
      });
    } else {
      // Ajout d'un nouvel item
      setFormData({
        ...formData,
        items: [...formData.items, updatedItem],
      });
    }
    
    // Fermer le dialogue
    setShowSubscriptionDialog(false);
    setCurrentSubscriptionItem(null);
    setCurrentItemIndex(-1);
    
    // Réinitialiser le formulaire d'ajout d'article
    setCurrentItem({
      itemType: 'PRODUCT',
      itemId: '',
      quantity: 1,
    });
  };

  const configureSubscription = (item: OrderItem, index: number) => {
    if (item.itemType !== 'OFFER' || !item.item) return;
    
    const platformOffers = item.item.platformOffers || [];
    if (platformOffers.length === 0) return;
    
    setCurrentSubscriptionItem(item);
    setCurrentItemIndex(index);
    
    // Initialiser avec les valeurs actuelles ou par défaut
    setSelectedPlatformOfferId(item.subscriptionDetails?.platformOfferId || '');
    setStartDate(item.subscriptionDetails?.startDate || new Date());
    setEndDate(item.subscriptionDetails?.endDate || (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    })());
    setAutoRenew(item.subscriptionDetails?.autoRenew || false);
    
    setShowSubscriptionDialog(true);
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const prepareFormData = () => {
    // Transformer les données pour l'API
    const subscriptionConfigs = formData.items
      .filter(item => item.itemType === 'OFFER' && item.subscriptionDetails)
      .map(item => ({
        offerId: item.offerId,
        platformOfferId: item.subscriptionDetails?.platformOfferId,
        startDate: item.subscriptionDetails?.startDate.toISOString(),
        endDate: item.subscriptionDetails?.endDate.toISOString(),
        autoRenew: item.subscriptionDetails?.autoRenew || false,
      }));
    
    console.log('Subscription configs to send:', subscriptionConfigs);
    
    const preparedData = {
      ...formData,
      items: formData.items.map(({ item, subscriptionDetails, ...rest }) => ({
        ...rest,
      })),
      // Ajouter les détails d'abonnement si nécessaire
      subscriptionConfigs,
    };
    
    return preparedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || formData.items.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un article.');
      return;
    }
    
    // Vérifier que tous les abonnements ont une plateforme sélectionnée
    const offerItems = formData.items.filter(
      item => item.itemType === 'OFFER'
    );
    
    console.log('Offres dans la commande:', offerItems.length);
    
    // Vérifier que chaque offre a des détails d'abonnement
    const itemsWithoutSubscriptionDetails = offerItems.filter(
      item => !item.subscriptionDetails
    );
    
    if (itemsWithoutSubscriptionDetails.length > 0) {
      console.error('Items without subscription details:', itemsWithoutSubscriptionDetails);
      alert('Certaines offres n\'ont pas été configurées correctement. Veuillez les configurer ou les supprimer.');
      return;
    }
    
    // Vérifier que tous les abonnements ont une plateforme sélectionnée si nécessaire
    const itemsWithPlatforms = offerItems.filter(
      item => item.item?.platformOffers && item.item.platformOffers.length > 0
    );
    
    const invalidSubscriptions = itemsWithPlatforms.filter(
      item => !item.subscriptionDetails?.platformOfferId
    );
    
    // Afficher des informations de debug
    console.log('Offre items requiring platform:', itemsWithPlatforms.length);
    console.log('Items with missing platformOfferId:', invalidSubscriptions.length);
    
    if (invalidSubscriptions.length > 0) {
      alert('Veuillez configurer tous les abonnements en sélectionnant une plateforme.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Préparation des données à envoyer
      const dataToSend = prepareFormData();
      console.log('Data to send:', JSON.stringify(dataToSend, null, 2));
      
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error('API error response:', errorData);
        throw new Error('Erreur lors de la création de la commande');
      }
      
      const responseData = await res.json();
      console.log('Order created successfully:', responseData);
      
      router.push('/admin/orders');
      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la création de la commande.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Sélectionner un client</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="PENDING">En attente</option>
                <option value="PROCESSING">En traitement</option>
                <option value="COMPLETED">Terminée</option>
                <option value="CANCELLED">Annulée</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Notes ou instructions spéciales..."
              />
            </div>
          </div>
          
          {selectedUser && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-3">Informations client</h3>
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">Nom:</span> {selectedUser.firstName} {selectedUser.lastName}</p>
                <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                {selectedUser.phone && <p><span className="font-medium">Téléphone:</span> {selectedUser.phone}</p>}
                
                {selectedUser.addresses.length > 0 && (
                  <div>
                    <p className="font-medium">Adresse principale:</p>
                    {(() => {
                      const defaultAddress = selectedUser.addresses.find(addr => addr.isDefault) || selectedUser.addresses[0];
                      return (
                        <div className="ml-3 mt-1">
                          <p>{defaultAddress.street}</p>
                          <p>{defaultAddress.zipCode} {defaultAddress.city}</p>
                          <p>{defaultAddress.country}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {selectedUser.orders.length > 0 && (
                  <div>
                    <p className="font-medium">Dernières commandes:</p>
                    <ul className="ml-3 mt-1 space-y-1">
                      {selectedUser.orders.map(order => (
                        <li key={order.id}>
                          <span className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</span> - 
                          <span className={`${order.status === 'COMPLETED' ? 'text-green-600' : order.status === 'CANCELLED' ? 'text-red-600' : 'text-yellow-600'} ml-1`}>{order.status}</span> - 
                          <span className="font-medium">{typeof order.total === 'number' ? order.total.toFixed(2) : Number(order.total.toString()).toFixed(2)} €</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Articles de la commande</h3>
          
          {formData.items.length > 0 ? (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Article
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prix unitaire
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantité
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.itemType === 'PRODUCT' ? 'Produit' : 
                         item.itemType === 'SERVICE' ? 'Service' : 'Offre'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {item.item?.images && item.item.images.length > 0 && (
                            <div className="h-8 w-8 rounded-md overflow-hidden mr-2 bg-gray-100 flex items-center justify-center">
                              <Image 
                                src={item.item.images[0].path} 
                                alt={item.item.name}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p>{item.item?.name}</p>
                            {item.itemType === 'OFFER' && item.subscriptionDetails && (
                              <div className="text-xs text-gray-500 mt-1">
                                <p>Du {format(item.subscriptionDetails.startDate, 'dd/MM/yyyy', { locale: fr })} au {format(item.subscriptionDetails.endDate, 'dd/MM/yyyy', { locale: fr })}</p>
                                {item.subscriptionDetails.platformOfferId && item.item?.platformOffers && (
                                  <p className="flex items-center gap-1 mt-0.5">
                                    <span>Plateforme:</span> 
                                    <span className="font-medium">
                                      {item.item.platformOffers.find(po => po.id === item.subscriptionDetails?.platformOfferId)?.platform.name || ''}
                                    </span>
                                  </p>
                                )}
                                <p className="mt-0.5">
                                  {item.subscriptionDetails.autoRenew ? (
                                    <span className="text-green-600">Renouvellement automatique</span>
                                  ) : (
                                    <span className="text-gray-500">Sans renouvellement</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {Number(item.unitPrice).toFixed(2)} €
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        {Number(item.totalPrice).toFixed(2)} €
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          {item.itemType === 'OFFER' && item.item?.platformOffers && item.item.platformOffers.length > 0 && (
                            <button
                              type="button"
                              onClick={() => configureSubscription(item, index)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Configurer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-right font-medium">
                      Total:
                    </td>
                    <td colSpan={2} className="px-4 py-2 font-bold text-green-600">
                      {Number(calculateTotal()).toFixed(2)} €
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-4">
              Aucun article ajouté à la commande
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ajouter un article</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label htmlFor="itemType" className="block text-xs font-medium text-gray-500">
                  Type d'article
                </label>
                <select
                  id="itemType"
                  name="itemType"
                  value={currentItem.itemType}
                  onChange={handleItemTypeChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="PRODUCT">Produit</option>
                  <option value="SERVICE">Service</option>
                  <option value="OFFER">Offre</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="itemId" className="block text-xs font-medium text-gray-500">
                  {currentItem.itemType === 'PRODUCT' ? 'Produit' : 
                   currentItem.itemType === 'SERVICE' ? 'Service' : 'Offre'}
                </label>
                <select
                  id="itemId"
                  name="itemId"
                  value={currentItem.itemId}
                  onChange={handleItemInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {getItems().map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {Number(typeof item.price === 'number' ? item.price : Number(item.price.toString())).toFixed(2)} €
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-xs font-medium text-gray-500">
                  Quantité
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  value={currentItem.quantity}
                  onChange={handleItemInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={addItem}
              disabled={!currentItem.itemId}
              className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Ajouter à la commande
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-dark transition"
            disabled={isLoading || !formData.userId || formData.items.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Création en cours...</span>
              </>
            ) : (
              <span>Créer la commande</span>
            )}
          </button>
        </div>
      </form>

      {/* Dialogue de configuration d'abonnement */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuration de l'abonnement</DialogTitle>
            <DialogDescription>
              Configurez les détails de l'abonnement {currentSubscriptionItem?.item?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {currentSubscriptionItem?.item?.platformOffers && currentSubscriptionItem.item.platformOffers.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Plateforme
                </label>
                <select
                  value={selectedPlatformOfferId}
                  onChange={(e) => setSelectedPlatformOfferId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Sélectionner une plateforme</option>
                  {currentSubscriptionItem.item.platformOffers.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.platform.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Date de début
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Date de fin
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                      locale={fr}
                      disabled={(date) => date < new Date() || date <= startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRenew" className="text-sm text-gray-700">
                Renouvellement automatique
              </label>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-700">
              <p>Après la création de la commande, vous pourrez configurer les comptes et profils pour cet abonnement depuis la section Abonnements.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowSubscriptionDialog(false)}>
              Annuler
            </Button>
            <Button variant="default" onClick={saveSubscriptionDetails}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 