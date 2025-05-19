import React from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { OrderForm } from '@/components/admin/orders/order-form';

export const metadata: Metadata = {
  title: 'Nouvelle commande',
  description: 'Créer une nouvelle commande',
};

async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: {
      firstName: 'asc',
    },
  });
}

async function getProducts() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
    },
    where: {
      published: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

async function getServices() {
  return await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
    },
    where: {
      published: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

async function getOffers() {
  return await prisma.offer.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      duration: true,
      durationUnit: true,
      type: true,
      maxProfiles: true,
      platformOffers: {
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              logo: true,
            }
          }
        }
      }
    },
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export default async function NewOrderPage() {
  const [usersRaw, products, services, offers] = await Promise.all([
    getUsers(),
    getProducts(),
    getServices(),
    getOffers(),
  ]);

  // Formater les données des utilisateurs (null -> chaîne vide)
  const users = usersRaw.map(user => ({
    ...user,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  }));

  // Formater les prix en nombre pour éviter les problèmes de sérialisation
  const formattedProducts = products.map(product => ({
    ...product,
    price: Number(product.price),
    description: product.description || undefined,
  }));

  const formattedServices = services.map(service => ({
    ...service,
    price: Number(service.price),
    description: service.description || undefined,
  }));

  const formattedOffers = offers.map(offer => ({
    ...offer,
    price: Number(offer.price),
    description: offer.description || undefined,
    platformOffers: offer.platformOffers?.map(po => ({
      ...po,
      platform: {
        ...po.platform,
        logo: po.platform.logo || undefined
      }
    }))
  }));

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Nouvelle commande</h1>
      <OrderForm
        users={users}
        products={formattedProducts}
        services={formattedServices}
        offers={formattedOffers}
      />
    </div>
  );
} 