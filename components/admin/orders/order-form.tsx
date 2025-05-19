'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Calendar as CalendarIcon, X, Settings, Edit, Info, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface PlatformOffer {
  id: string;
  platform: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface Offer {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration: number;
  durationUnit?: string;
  type?: string;
  platformOffers?: PlatformOffer[];
  maxProfiles?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface SubscriptionDetails {
  platformOfferId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  platformAccounts?: Array<{
    platformOfferId: string;
    accountId: string;
    profileIds: string[];
  }>;
}

interface OrderItem {
  itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
  itemId: string;
  offerId?: string;
  productId?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item?: Product | Service | Offer;
  subscriptionDetails?: SubscriptionDetails;
}

interface OrderFormData {
  userId: string;
  status: string;
  total: number;
  items: OrderItem[];
  notes?: string;
}

interface OrderFormProps {
  users: User[];
  products: Product[];
  services: Service[];
  offers: Offer[];
  initialData?: OrderFormData;
}

interface Profile {
  id: string;
  name: string | null;
  profileSlot: number;
  isAssigned: boolean;
  pin?: string | null;
}

interface Account {
  id: string;
  username: string | null;
  email: string | null;
  platformId: string;
  accountProfiles: Profile[];
}

interface PlatformAccountsData {
  platformOfferId: string;
  accountId: string | null;
  selectedProfiles: string[];
  platform: {
    id: string;
    name: string;
    logo?: string | null;
  };
}

export function OrderForm({ users, products, services, offers, initialData }: OrderFormProps) {
  const router = useRouter();
  
  // État du formulaire
  const [formData, setFormData] = useState<OrderFormData>({
    userId: '',
    status: 'QUOTE',
    total: 0,
    items: [],
    notes: '',
  });
  
  // État pour l'élément en cours d'ajout
  const [currentItem, setCurrentItem] = useState({
    itemType: 'PRODUCT' as 'PRODUCT' | 'SERVICE' | 'OFFER',
    itemId: '',
    quantity: 1,
  });
  
  // État pour la configuration d'un abonnement
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [currentSubscriptionItem, setCurrentSubscriptionItem] = useState<OrderItem | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(-1);
  const [selectedPlatformOfferId, setSelectedPlatformOfferId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addMonths(new Date(), 1));
  const [autoRenew, setAutoRenew] = useState(false);
  
  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);
  
  // Nouvel état pour le popup de configuration des profils
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [currentSubscriptionConfig, setCurrentSubscriptionConfig] = useState<{
    item: OrderItem;
    index: number;
  } | null>(null);
  
  // Mettre à jour le total à chaque changement de la liste d'articles
  useEffect(() => {
    const total = formData.items.reduce((total, item) => total + item.totalPrice, 0);
    setFormData(prev => ({ ...prev, total }));
  }, [formData.items]);
  
  // Gérer le changement d'utilisateur
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, userId: e.target.value });
  };
  
  // Gérer le changement de type d'élément
  const handleItemTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentItem({
      ...currentItem,
      itemType: e.target.value as 'PRODUCT' | 'SERVICE' | 'OFFER',
      itemId: '',
    });
  };
  
  // Obtenir la liste d'éléments en fonction du type
  const getItemsForType = () => {
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
  
  // Gérer le changement d'élément
  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentItem({
      ...currentItem,
      itemId: e.target.value,
    });
  };
  
  // Gérer le changement de quantité
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 1;
    setCurrentItem({
      ...currentItem,
      quantity: Math.max(1, quantity),
    });
  };
  
  // Gérer le changement de statut
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, status: e.target.value });
  };
  
  // Ajouter un article à la commande
  const addItem = () => {
    if (!currentItem.itemId) return;
    
    const items = getItemsForType();
    const selectedItem = items.find(item => item.id === currentItem.itemId);
    
    if (!selectedItem) return;
    
    // Créer le nouvel élément de commande
    const newItem: OrderItem = {
      itemType: currentItem.itemType,
      itemId: selectedItem.id,
      quantity: currentItem.quantity,
      unitPrice: selectedItem.price,
      totalPrice: selectedItem.price * currentItem.quantity,
      item: selectedItem,
    };
    
    // Ajouter les champs spécifiques en fonction du type
    switch (currentItem.itemType) {
      case 'PRODUCT':
        newItem.productId = selectedItem.id;
        break;
      case 'SERVICE':
        newItem.serviceId = selectedItem.id;
        break;
      case 'OFFER':
        newItem.offerId = selectedItem.id;
        
        // Vérifier si l'offre a des plateformes
        const offer = selectedItem as Offer;
        const hasPlatforms = offer.platformOffers && offer.platformOffers.length > 0;
        
        // Calculer la date de fin en fonction de la durée de l'offre
        const calculatedEndDate = calculateEndDate(offer);
        
        if (hasPlatforms) {
          // Ouvrir le dialogue pour configurer les comptes et profils
          setCurrentSubscriptionConfig({
            item: newItem,
            index: -1 // Nouvel item
          });
          setShowProfilesModal(true);
        } else {
          // Pas de plateformes, ajouter directement
          console.log('Aucune plateforme disponible pour cette offre');
          newItem.subscriptionDetails = {
            startDate: new Date(),
            endDate: calculatedEndDate,
            autoRenew: false
          };
          
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
        break;
    }
  };
  
  // Calculer la date de fin en fonction de la durée de l'offre
  const calculateEndDate = (offer: Offer) => {
    const startDate = new Date();
    const durationUnit = offer.durationUnit?.toUpperCase() || 'MONTH';
    const duration = offer.duration || 1;
    
    switch (durationUnit) {
      case 'DAY':
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration);
        return endDate;
      case 'WEEK':
        const weekEndDate = new Date(startDate);
        weekEndDate.setDate(startDate.getDate() + (duration * 7));
        return weekEndDate;
      case 'MONTH':
        return addMonths(startDate, duration);
      case 'YEAR':
        return addYears(startDate, duration);
      default:
        return addMonths(startDate, duration);
    }
  };
  
  // Configurer un abonnement existant
  const configureSubscription = (item: OrderItem, index: number) => {
    if (item.itemType !== 'OFFER' || !item.item) return;
    
    const offer = item.item as Offer;
    const hasPlatforms = offer.platformOffers && offer.platformOffers.length > 0;
    
    if (hasPlatforms) {
      // Ouvrir le dialogue pour configurer les comptes et profils
      setCurrentSubscriptionConfig({
        item,
        index
      });
      setShowProfilesModal(true);
    } else {
      // Ouvrir le dialogue de configuration d'abonnement classique
      setCurrentSubscriptionItem(item);
      setCurrentItemIndex(index);
      
      // Initialiser avec les valeurs actuelles ou par défaut
      setSelectedPlatformOfferId(item.subscriptionDetails?.platformOfferId || '');
      setStartDate(item.subscriptionDetails?.startDate || new Date());
      setEndDate(item.subscriptionDetails?.endDate || addMonths(new Date(), 1));
      setAutoRenew(item.subscriptionDetails?.autoRenew || false);
      
      setShowSubscriptionDialog(true);
    }
  };
  
  // Gérer la confirmation de la sélection des comptes et profils
  const handleProfilesConfirmation = (platformAccountsData: PlatformAccountsData[]) => {
    if (!currentSubscriptionConfig) return;
    
    const { item, index } = currentSubscriptionConfig;
    
    // Les données de configuration des comptes et profils seront incluses dans les détails d'abonnement
    const enrichedItem: OrderItem = {
      ...item,
      subscriptionDetails: {
        startDate: new Date(),
        endDate: calculateEndDate(item.item as Offer),
        autoRenew: false,
        platformAccounts: platformAccountsData.map(pad => ({
          platformOfferId: pad.platformOfferId,
          accountId: pad.accountId || '',
          profileIds: pad.selectedProfiles
        }))
      }
    };
    
    if (index >= 0) {
      // Mettre à jour un item existant
      const updatedItems = [...formData.items];
      updatedItems[index] = enrichedItem;
      
      setFormData({
        ...formData,
        items: updatedItems
      });
    } else {
      // Ajouter un nouvel item
      setFormData({
        ...formData,
        items: [...formData.items, enrichedItem]
      });
      
      // Réinitialiser le formulaire d'ajout d'article
      setCurrentItem({
        itemType: 'PRODUCT',
        itemId: '',
        quantity: 1
      });
    }
    
    // Fermer le modal
    setShowProfilesModal(false);
    setCurrentSubscriptionConfig(null);
  };
  
  // Supprimer un article
  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems,
    });
  };
  
  // Préparer les données pour l'API
  const prepareFormData = () => {
    // Transformer les données pour l'API
    const subscriptionConfigs = formData.items
      .filter(item => item.itemType === 'OFFER' && item.subscriptionDetails)
      .map(item => {
        const config = {
          offerId: item.offerId,
          platformOfferId: item.subscriptionDetails?.platformOfferId,
          startDate: item.subscriptionDetails?.startDate.toISOString(),
          endDate: item.subscriptionDetails?.endDate.toISOString(),
          autoRenew: item.subscriptionDetails?.autoRenew || false,
          platformAccounts: item.subscriptionDetails?.platformAccounts || []
        };
        
        return config;
      });
    
    console.log('Subscription configs to send:', subscriptionConfigs);
    
    const preparedData = {
      ...formData,
      items: formData.items.map(({ item, subscriptionDetails, ...rest }) => ({
        ...rest,
      })),
      subscriptionConfigs,
    };
    
    return preparedData;
  };
  
  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || formData.items.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un article.');
      return;
    }
    
    // Vérifier que tous les abonnements ont une plateforme sélectionnée si nécessaire
    const offerItems = formData.items.filter(
      item => item.itemType === 'OFFER'
    );
    
    // Vérifier que chaque offre a des détails d'abonnement si nécessaire
    const itemsWithoutSubscriptionDetails = offerItems.filter(
      item => item.item && (item.item as Offer).platformOffers && (item.item as Offer).platformOffers!.length > 0 && !item.subscriptionDetails
    );
    
    if (itemsWithoutSubscriptionDetails.length > 0) {
      alert('Certaines offres n\'ont pas été configurées correctement. Veuillez les configurer ou les supprimer.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Préparation des données à envoyer
      const dataToSend = prepareFormData();
      console.log('Données envoyées à l\'API:', JSON.stringify(dataToSend, null, 2));
      
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => null);
        console.error('Erreur API:', res.status, errorText);
        throw new Error('Erreur lors de la création de la commande');
      }
      
      // Récupérer la réponse pour obtenir l'ID de la commande
      const orderData = await res.json();
      console.log('Commande créée avec succès:', orderData);
      
      // Rediriger vers la liste des commandes au lieu de la page détail
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Section client */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Information client</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={handleUserChange}
                  className="w-full border border-gray-300 rounded-md p-2"
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
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Statut de la commande
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="QUOTE">Devis en attente de paiement</option>
                  <option value="PENDING">En attente</option>
                  <option value="PAID">Commande payée</option>
                  <option value="PROCESSING">En traitement</option>
                  <option value="SHIPPING">En cours de livraison</option>
                  <option value="DELIVERED">Commande livrée</option>
                  <option value="CANCELLED">Commande annulée</option>
                  <option value="FINISHED">Commande terminée</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Section articles */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Articles de la commande</h2>
            
            {/* Liste des articles ajoutés */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Article
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix unitaire
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <Badge variant={
                            item.itemType === 'PRODUCT' ? 'default' :
                            item.itemType === 'SERVICE' ? 'secondary' :
                            'outline'
                          }>
                            {item.itemType === 'PRODUCT' ? 'Produit' :
                             item.itemType === 'SERVICE' ? 'Service' :
                             'Offre'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.item?.name}
                          {item.itemType === 'OFFER' && item.subscriptionDetails && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {(item.item as Offer).platformOffers?.find(
                                  po => po.id === item.subscriptionDetails?.platformOfferId
                                )?.platform.name || 'Plateforme non spécifiée'}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.unitPrice.toFixed(2)}€
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.totalPrice.toFixed(2)}€
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex gap-2">
                            {item.itemType === 'OFFER' && item.item && (() => {
                              const offer = item.item as Offer;
                              const hasPlatformOffers = offer.platformOffers && offer.platformOffers.length > 0;
                              return hasPlatformOffers && (
                                <button
                                  type="button"
                                  onClick={() => configureSubscription(item, index)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Configurer l'abonnement"
                                >
                                  <Settings size={16} />
                                </button>
                              );
                            })()}
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td colSpan={4} className="px-3 py-3 text-right text-sm">
                        Total:
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {formData.total.toFixed(2)}€
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Formulaire d'ajout d'article */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4 items-end bg-gray-50 p-4 rounded-md">
              <div>
                <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'article
                </label>
                <select
                  id="itemType"
                  value={currentItem.itemType}
                  onChange={handleItemTypeChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="PRODUCT">Produit</option>
                  <option value="SERVICE">Service</option>
                  <option value="OFFER">Offre/Abonnement</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                  Article
                </label>
                <select
                  id="itemId"
                  value={currentItem.itemId}
                  onChange={handleItemChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Sélectionner un article</option>
                  {getItemsForType().map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.price.toFixed(2)}€
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={handleQuantityChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!currentItem.itemId}
                  className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
                >
                  Ajouter à la commande
                </button>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 h-24"
              placeholder="Notes internes concernant cette commande..."
            />
          </div>
          
          {/* Bouton de soumission */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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
        </div>
      </form>
      
      {/* Dialogue de configuration d'abonnement */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration de l'abonnement</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {currentSubscriptionItem && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Plateforme
                  </label>
                  <Select
                    value={selectedPlatformOfferId}
                    onValueChange={setSelectedPlatformOfferId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currentSubscriptionItem.item as Offer).platformOffers?.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
                          onSelect={(date) => {
                            if (date) {
                              setStartDate(date);
                              // S'assurer que la date de fin est après la date de début
                              if (date >= endDate) {
                                const newEndDate = new Date(date);
                                newEndDate.setMonth(newEndDate.getMonth() + 1);
                                setEndDate(newEndDate);
                              }
                            }
                          }}
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
                  <Label htmlFor="autoRenew" className="text-sm font-medium text-gray-700">
                    Renouvellement automatique
                  </Label>
                  <Switch
                    id="autoRenew"
                    checked={autoRenew}
                    onCheckedChange={setAutoRenew}
                  />
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Après la création de la commande, vous pourrez configurer les comptes et profils pour cet abonnement depuis la section Abonnements.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => {}}
              disabled={!selectedPlatformOfferId}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Nouveau modal pour la configuration des comptes et profils */}
      {showProfilesModal && (
        <SubscriptionProfilesModal
          isOpen={showProfilesModal}
          onClose={() => {
            setShowProfilesModal(false);
            setCurrentSubscriptionConfig(null);
          }}
          offer={currentSubscriptionConfig?.item.item as Offer}
          onConfirm={handleProfilesConfirmation}
        />
      )}
    </div>
  );
}

// Composant modal pour configurer les comptes et profils
function SubscriptionProfilesModal({
  isOpen,
  onClose,
  offer,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  onConfirm: (data: PlatformAccountsData[]) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({});
  const [platformSelections, setPlatformSelections] = useState<PlatformAccountsData[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('');

  // Initialisation des sélections de plateformes
  useEffect(() => {
    if (offer && offer.platformOffers && offer.platformOffers.length > 0) {
      // Réinitialiser les sélections
      const selections = offer.platformOffers.map(po => ({
        platformOfferId: po.id,
        accountId: null,
        selectedProfiles: [],
        platform: po.platform
      }));
      
      setPlatformSelections(selections);
      setCurrentTab(offer.platformOffers[0].id);
      
      // Charger les comptes pour chaque plateforme
      offer.platformOffers.forEach(po => {
        fetchAccounts(po.platform.id);
      });
    }
  }, [offer]);

  // Récupérer les comptes disponibles pour une plateforme
  const fetchAccounts = async (platformId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/streaming/accounts?platformId=${platformId}&status=AVAILABLE`);
      if (response.ok) {
        const data = await response.json();
        setAccountsMap(prev => ({
          ...prev,
          [platformId]: data
        }));
      } else {
        console.error('Erreur lors de la récupération des comptes');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le changement de compte sélectionné
  const handleAccountSelection = (platformOfferId: string, accountId: string) => {
    setPlatformSelections(prev => 
      prev.map(selection => 
        selection.platformOfferId === platformOfferId 
          ? { 
              ...selection, 
              accountId, 
              selectedProfiles: [] // Réinitialiser les profils sélectionnés
            }
          : selection
      )
    );
  };

  // Gérer la sélection/désélection d'un profil
  const handleProfileToggle = (platformOfferId: string, profileId: string) => {
    setPlatformSelections(prev => 
      prev.map(selection => {
        if (selection.platformOfferId !== platformOfferId) return selection;
        
        const maxProfiles = offer?.maxProfiles || 1;
        const profiles = selection.selectedProfiles;
        
        if (profiles.includes(profileId)) {
          // Retirer le profil
          return {
            ...selection,
            selectedProfiles: profiles.filter(id => id !== profileId)
          };
        } else {
          // Ajouter le profil si la limite n'est pas atteinte
          if (profiles.length < maxProfiles) {
            return {
              ...selection,
              selectedProfiles: [...profiles, profileId]
            };
          }
          return selection;
        }
      })
    );
  };

  // Vérifier si la configuration est valide
  const isConfigValid = (): boolean => {
    return platformSelections.every(selection => {
      // Chaque plateforme doit avoir un compte sélectionné
      if (!selection.accountId) return false;
      
      // Si la plateforme a des profils et que l'offre requiert des profils,
      // vérifier que le bon nombre de profils est sélectionné
      const platform = selection.platform;
      const accounts = accountsMap[platform.id] || [];
      const account = accounts.find(a => a.id === selection.accountId);
      
      if (!account) return false;
      
      const hasProfiles = account.accountProfiles && account.accountProfiles.length > 0;
      if (hasProfiles && offer && (offer.maxProfiles ?? 0) > 0) {
        return selection.selectedProfiles.length === (offer.maxProfiles ?? 1);
      }
      
      return true;
    });
  };

  // Gérer la confirmation de la sélection
  const handleConfirm = () => {
    if (isConfigValid()) {
      onConfirm(platformSelections);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-4/5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuration des comptes et profils</DialogTitle>
          <DialogDescription>
            Sélectionnez les comptes et profils à utiliser pour chaque plateforme de l'abonnement.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Chargement des comptes...</span>
          </div>
        ) : (
          <>
            {platformSelections.length > 0 && (
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="mb-4 flex flex-wrap">
                  {platformSelections.map((selection) => (
                    <TabsTrigger 
                      key={selection.platformOfferId}
                      value={selection.platformOfferId}
                      className="flex items-center gap-2"
                    >
                      {selection.platform.logo ? (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{selection.platform.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          {selection.platform.name.substring(0, 2)}
                        </div>
                      )}
                      <span>{selection.platform.name}</span>
                      {selection.accountId ? (
                        <Badge variant="success" className="ml-1"><Check className="h-3 w-3" /></Badge>
                      ) : (
                        <Badge variant="outline" className="ml-1">À configurer</Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {platformSelections.map((selection) => {
                  const platformId = selection.platform.id;
                  const accounts = accountsMap[platformId] || [];
                  
                  return (
                    <TabsContent 
                      key={selection.platformOfferId} 
                      value={selection.platformOfferId}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-lg font-medium mb-3">Sélection du compte</h3>
                        {accounts.length === 0 ? (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Aucun compte disponible pour cette plateforme.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <RadioGroup
                            value={selection.accountId || ''}
                            onValueChange={(value) => handleAccountSelection(selection.platformOfferId, value)}
                          >
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                              {accounts.map((account) => (
                                <div
                                  key={account.id}
                                  className={`border rounded-md p-4 cursor-pointer hover:border-primary ${
                                    selection.accountId === account.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                                  }`}
                                >
                                  <RadioGroupItem
                                    value={account.id}
                                    id={account.id}
                                    className="sr-only"
                                  />
                                  <label
                                    htmlFor={account.id}
                                    className="flex flex-col gap-2 cursor-pointer"
                                  >
                                    <div className="font-medium">
                                      {account.username || account.email || `Compte ${account.id.substring(0, 6)}`}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {account.accountProfiles.length} profils disponibles
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                      </div>
                      
                      {selection.accountId && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Sélection des profils
                            {offer && (
                              <span className="text-sm font-normal text-gray-500 ml-2">
                                (Sélectionnez {offer.maxProfiles ?? 1} profil{(offer.maxProfiles ?? 1) > 1 ? 's' : ''})
                              </span>
                            )}
                          </h3>
                          
                          {(() => {
                            const account = accounts.find(a => a.id === selection.accountId);
                            if (!account) return null;
                            
                            const availableProfiles = account.accountProfiles.filter(p => !p.isAssigned);
                            
                            if (availableProfiles.length === 0) {
                              return (
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    Aucun profil disponible pour ce compte.
                                  </AlertDescription>
                                </Alert>
                              );
                            }
                            
                            return (
                              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {availableProfiles.map((profile) => {
                                  const isSelected = selection.selectedProfiles.includes(profile.id);
                                  const maxReached = selection.selectedProfiles.length >= (offer?.maxProfiles ?? 1) && !isSelected;
                                  
                                  return (
                                    <div
                                      key={profile.id}
                                      className={`border rounded-md p-4 cursor-pointer ${
                                        isSelected 
                                          ? 'border-primary bg-primary/5' 
                                          : maxReached 
                                            ? 'border-gray-200 opacity-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                      onClick={() => !maxReached && handleProfileToggle(selection.platformOfferId, profile.id)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                          <Checkbox
                                            checked={isSelected}
                                            disabled={maxReached}
                                            onCheckedChange={() => {}}
                                            className="h-5 w-5"
                                          />
                                        </div>
                                        <div>
                                          <div className="font-medium">
                                            {profile.name || `Profil ${profile.profileSlot}`}
                                          </div>
                                          {profile.pin && (
                                            <div className="text-xs text-gray-500">PIN: {profile.pin}</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isConfigValid() || isLoading}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 