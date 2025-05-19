import React from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import OrdersList from '@/components/admin/orders/orders-list';

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
}

async function getOrders() {
  // Utiliser l'URL complète plutôt que de s'appuyer sur NEXT_PUBLIC_API_URL
  const url = `http://localhost:3000/api/admin/orders?t=${Date.now()}`;
  console.log('Appel API:', url);
  
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      console.error('Réponse API non OK:', res.status, res.statusText);
      throw new Error(`Erreur lors du chargement des commandes: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Commandes récupérées:', data.length, data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return [];
  }
}

// Fonction pour obtenir les commandes via notre API de débogage
async function getDebugOrders() {
  try {
    const res = await fetch(`/api/debug/orders?t=${Date.now()}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.error('Erreur API de débogage:', res.status, res.statusText);
      return [];
    }
    
    const data = await res.json();
    console.log('Commandes via API de débogage:', data.length);
    return data;
  } catch (error) {
    console.error('Erreur API débogage:', error);
    return [];
  }
}

export default async function OrdersPage() {
  try {
    // Récupérer les commandes via l'API standard et l'API de débogage
    const [orders, debugOrders] = await Promise.all([
      getOrders(),
      getDebugOrders()
    ]);
    
    const ordersCount = Array.isArray(orders) ? orders.length : 0;
    const debugOrdersCount = Array.isArray(debugOrders) ? debugOrders.length : 0;
    
    // Utiliser les commandes de l'API standard qui contiennent des données
    const displayOrders = orders;

    console.log('Données à afficher:', {
      ordersFromAPI: ordersCount,
      ordersFromDebug: debugOrdersCount,
      displayOrdersCount: displayOrders.length
    });

    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
          <Link 
            href="/admin/orders/new" 
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-dark transition">
            <PlusCircle size={18} />
            <span>Nouvelle Commande</span>
          </Link>
        </div>
        
        {/* Information de débogage */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4 text-sm">
          <div><strong>Informations de débogage:</strong></div>
          <div>API standard: {ordersCount} commandes trouvées</div>
          <div>API débogage: {debugOrdersCount} commandes trouvées</div>
        </div>

        {/* Composant client pour la liste des commandes */}
        <OrdersList orders={displayOrders} />
      </div>
    );
  } catch (error) {
    console.error('Erreur non gérée dans OrdersPage:', error);
    
    // Page de secours en cas d'erreur
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Erreur de chargement des commandes</h1>
          <p className="mb-4">Une erreur est survenue lors du chargement des commandes. Veuillez réessayer ultérieurement.</p>
          <div className="mt-4">
            <Link href="/debug/orders" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Voir les commandes (page de débogage)
            </Link>
          </div>
        </div>
      </div>
    );
  }
} 