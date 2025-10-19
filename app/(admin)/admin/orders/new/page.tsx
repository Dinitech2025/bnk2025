import React from 'react';
import { prisma } from '@/lib/prisma';
import { EnhancedOrderForm } from '@/components/admin/orders/enhanced-order-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouvelle commande',
  description: 'Créer une nouvelle commande',
};

export default async function NewOrderPage() {
  // Récupérer les données nécessaires
  const [users, products, services, offers] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'CLIENT'
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
            type: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            phoneNumber: true,
            isDefault: true
          },
          orderBy: {
            isDefault: 'desc' // Adresse par défaut en premier
          }
        }
      }
    }),
    prisma.product.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.service.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.offer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        platformOffers: {
          select: {
            id: true,
            platform: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  // Formater les données
  const formattedData = {
    users: users.map(user => ({
      ...user,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || ""
    })),
    products: products.map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      description: product.description || undefined
    })),
    services: services.map(service => ({
      id: service.id,
      name: service.name,
      price: Number(service.price),
      description: service.description || undefined
    })),
    offers: offers.map(offer => ({
      id: offer.id,
      name: offer.name,
      price: Number(offer.price),
      description: offer.description || undefined,
      duration: offer.duration,
      platformOffers: offer.platformOffers.map(po => ({
        id: po.id,
        platform: {
          id: po.platform.id,
          name: po.platform.name,
          logo: po.platform.logo || undefined
        }
      }))
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <EnhancedOrderForm {...formattedData} />
      </div>
    </div>
  );
} 