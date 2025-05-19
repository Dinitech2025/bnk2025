import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { NewOrderForm } from '@/components/admin/orders/new-order-form';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Nouvelle commande',
};

async function getFormData() {
  const [users, products, services, offers] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'CLIENT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        addresses: {
          select: {
            id: true,
            street: true,
            city: true,
            zipCode: true,
            country: true,
            isDefault: true,
          },
        },
        orders: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            total: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    }),
    prisma.product.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        inventory: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.service.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.offer.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        durationUnit: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
        platformOffers: {
          select: {
            id: true,
            platform: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  const transformedProducts = products.map(product => ({
    ...product,
    type: 'PRODUCT',
  }));

  const transformedServices = services.map(service => ({
    ...service,
    type: 'SERVICE',
  }));

  const transformedOffers = offers.map(offer => ({
    ...offer,
    type: 'OFFER',
    features: offer.description ? offer.description.split('\n').filter(item => item.trim().length > 0) : [],
  }));

  return { 
    users, 
    products: transformedProducts, 
    services: transformedServices, 
    offers: transformedOffers 
  };
}

export default function CreateOrderPage() {
  // Rediriger vers la nouvelle page de création de commande
  redirect('/admin/orders/new');
} 