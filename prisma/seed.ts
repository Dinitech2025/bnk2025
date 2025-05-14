import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding...');

  // Suppression des données existantes
  await prisma.user.deleteMany({});
  
  // Création des utilisateurs de test
  const hashedPassword = await hash('password123', 10);
  
  // Utilisateur Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@boutiknaka.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Utilisateur admin créé:', admin.email);
  
  // Utilisateur Staff
  const staff = await prisma.user.create({
    data: {
      name: 'Staff',
      email: 'staff@boutiknaka.com',
      password: hashedPassword,
      role: 'STAFF',
    },
  });
  console.log('Utilisateur staff créé:', staff.email);
  
  // Utilisateur Client
  const client = await prisma.user.create({
    data: {
      name: 'Client',
      email: 'client@boutiknaka.com',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  console.log('Utilisateur client créé:', client.email);

  // Création d'une adresse pour le client
  await prisma.address.create({
    data: {
      userId: client.id,
      type: 'SHIPPING',
      street: '123 Rue du Commerce',
      city: 'Paris',
      state: 'Île-de-France',
      zipCode: '75001',
      country: 'France',
      isDefault: true,
    },
  });

  // Création de catégories d'exemple
  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronique' },
    update: {},
    create: {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Produits électroniques et gadgets',
    },
  });

  const clothingCategory = await prisma.category.upsert({
    where: { slug: 'vetements' },
    update: {},
    create: {
      name: 'Vêtements',
      slug: 'vetements',
      description: 'Vêtements et accessoires',
    },
  });

  // Création de produits d'exemple
  await prisma.product.upsert({
    where: { slug: 'smartphone-premium' },
    update: {},
    create: {
      name: 'Smartphone Premium',
      slug: 'smartphone-premium',
      description: 'Le dernier smartphone haut de gamme',
      price: 899.99,
      compareAtPrice: 999.99,
      sku: 'SP-001',
      barcode: '123456789',
      inventory: 50,
      weight: 0.2,
      dimensions: '15x7x0.8',
      categoryId: electronicsCategory.id,
      featured: true,
      published: true,
      attributes: {
        create: [
          {
            name: 'Couleur',
            value: 'Noir',
          },
          {
            name: 'Stockage',
            value: '128 Go',
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: 't-shirt-coton' },
    update: {},
    create: {
      name: 'T-Shirt Coton',
      slug: 't-shirt-coton',
      description: 'T-shirt en coton bio de qualité supérieure',
      price: 29.99,
      compareAtPrice: 39.99,
      sku: 'TS-001',
      barcode: '987654321',
      inventory: 100,
      weight: 0.2,
      dimensions: '30x20x2',
      categoryId: clothingCategory.id,
      featured: false,
      published: true,
      attributes: {
        create: [
          {
            name: 'Taille',
            value: 'M',
          },
          {
            name: 'Couleur',
            value: 'Blanc',
          },
        ],
      },
    },
  });

  // Création d'un service d'exemple
  await prisma.service.create({
    data: {
      name: 'Réparation Smartphone',
      slug: 'reparation-smartphone',
      description: 'Service de réparation pour tous types de smartphones',
      price: 49.99,
      duration: 60,
      categoryId: electronicsCategory.id,
      published: true,
    },
  });

  // Création de plateformes streaming
  const netflixPlatform = await prisma.platform.upsert({
    where: { slug: 'netflix' },
    update: {},
    create: {
      name: 'Netflix',
      slug: 'netflix',
      description: 'Service de streaming de films et séries',
      websiteUrl: 'https://www.netflix.com',
      maxProfilesPerAccount: 5,
      isActive: true,
      supportEmail: 'support@netflix.com',
      supportPhone: '+33123456789',
    },
  });

  const disneyPlatform = await prisma.platform.upsert({
    where: { slug: 'disney-plus' },
    update: {},
    create: {
      name: 'Disney+',
      slug: 'disney-plus',
      description: 'Service de streaming Disney, Marvel, Star Wars',
      websiteUrl: 'https://www.disneyplus.com',
      maxProfilesPerAccount: 4,
      isActive: true,
      supportEmail: 'support@disneyplus.com',
      supportPhone: '+33987654321',
    },
  });

  // Création d'offres
  const netflixOffer = await prisma.offer.create({
    data: {
      name: 'Netflix Premium',
      description: 'Accès à un profil Netflix Premium',
      price: 12.99,
      duration: 30,
      profileCount: 1,
      features: 'Accès illimité, HD, 1 profil',
      isPopular: true,
      isActive: true,
      maxUsers: 1,
    },
  });

  const disneyOffer = await prisma.offer.create({
    data: {
      name: 'Disney+ Standard',
      description: 'Accès à un profil Disney+',
      price: 9.99,
      duration: 30,
      profileCount: 1,
      features: 'Accès illimité, HD, 1 profil',
      isPopular: false,
      isActive: true,
      maxUsers: 1,
    },
  });

  // Création des PlatformOffers
  await prisma.platformOffer.create({
    data: {
      offerId: netflixOffer.id,
      platformId: netflixPlatform.id,
      profileCount: 1,
      isDefault: true,
    },
  });

  await prisma.platformOffer.create({
    data: {
      offerId: disneyOffer.id,
      platformId: disneyPlatform.id,
      profileCount: 1,
      isDefault: true,
    },
  });

  // Création de comptes streaming
  const netflixAccount = await prisma.account.create({
    data: {
      platformId: netflixPlatform.id,
      username: 'compte_netflix_1',
      email: 'netflix1@boutiknaka.com',
      password: 'password123',
      status: 'AVAILABLE',
      accountProfiles: {
        create: Array.from({ length: 5 }, (_, i) => ({
          profileSlot: i + 1,
          isAssigned: false,
        })),
      },
    },
  });

  const disneyAccount = await prisma.account.create({
    data: {
      platformId: disneyPlatform.id,
      username: 'compte_disney_1',
      email: 'disney1@boutiknaka.com',
      password: 'password123',
      status: 'AVAILABLE',
      accountProfiles: {
        create: Array.from({ length: 4 }, (_, i) => ({
          profileSlot: i + 1,
          isAssigned: false,
        })),
      },
    },
  });

  // Création d'un employé
  await prisma.employee.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@boutiknaka.com',
      role: 'manager',
      permissions: JSON.stringify(['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS']),
    },
  });

  // Création de paramètres système
  await prisma.setting.createMany({
    data: [
      {
        key: 'site_name',
        value: "Boutik'nakà",
        type: 'string',
      },
      {
        key: 'site_description',
        value: 'Plateforme e-commerce et streaming',
        type: 'string',
      },
      {
        key: 'currency',
        value: 'EUR',
        type: 'string',
      },
    ],
  });

  console.log('Seeding terminé!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 