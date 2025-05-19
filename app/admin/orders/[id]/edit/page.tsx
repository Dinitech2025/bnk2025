import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OrderForm } from '@/components/admin/orders/order-form';
import { notFound } from 'next/navigation';

// Interface décrivant l'objet retourné par l'API
interface OrderItemFromAPI {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
  productId?: string;
  serviceId?: string;
  offerId?: string;
}

interface OrderFromAPI {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: OrderItemFromAPI[];
}

// Interfaces utilisées par le composant OrderForm
interface OrderItem {
  itemType: 'PRODUCT' | 'SERVICE' | 'OFFER';
  itemId: string;
  offerId?: string;
  productId?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderFormData {
  userId: string;
  status: string;
  total: number;
  items: OrderItem[];
  notes?: string;
}

async function getOrder(id: string): Promise<OrderFromAPI | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/orders/${id}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return null;
  }
}

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);

  if (!order) {
    return notFound();
  }

  // Convertir l'ordre pour respecter le format attendu par OrderForm
  const formattedOrder: OrderFormData = {
    userId: order.userId,
    status: order.status,
    total: order.total,
    // Transformer les items pour ajouter la propriété itemId requise
    items: order.items.map(item => ({
      itemType: item.itemType,
      itemId: item.productId || item.serviceId || item.offerId || '',
      offerId: item.offerId,
      productId: item.productId,
      serviceId: item.serviceId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/admin/orders/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Modifier la commande #{order.id.substring(0, 8)}</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <OrderForm 
          users={[]} 
          products={[]} 
          services={[]} 
          offers={[]} 
          initialData={formattedOrder}
        />
      </div>
    </div>
  );
} 