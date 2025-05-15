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
  await prisma.service.upsert({
    where: { slug: 'reparation-smartphone' },
    update: {},
    create: {
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
      type: 'VIDEO',
      pricingModel: 'SUBSCRIPTION'
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
      type: 'VIDEO',
      pricingModel: 'SUBSCRIPTION'
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

  // Création de paramètres système
  console.log('🌱 Initialisation des paramètres généraux...');

  const defaultSettings = [
    { key: 'siteName', value: 'BoutikNaka', type: 'STRING' },
    { key: 'siteDescription', value: 'Votre boutique en ligne pour tous vos besoins', type: 'TEXT' },
    { key: 'siteTagline', value: 'Qualité et service à prix abordable', type: 'STRING' },
    { key: 'contactEmail', value: 'contact@boutiknaka.com', type: 'STRING' },
    { key: 'contactPhone', value: '+261 34 00 000 00', type: 'STRING' },
    { key: 'address', value: 'Antananarivo, Madagascar', type: 'TEXT' },
    { key: 'logoUrl', value: '/images/logo.png', type: 'IMAGE' },
    { key: 'faviconUrl', value: '/favicon.ico', type: 'IMAGE' },
    { key: 'adminLogoUrl', value: '/images/admin-logo.png', type: 'IMAGE' },
    { key: 'currency', value: 'MGA', type: 'STRING' },
    { key: 'currencySymbol', value: 'Ar', type: 'STRING' },
    { key: 'facebookUrl', value: 'https://facebook.com/boutiknaka', type: 'STRING' },
    { key: 'instagramUrl', value: 'https://instagram.com/boutiknaka', type: 'STRING' },
    { key: 'twitterUrl', value: 'https://twitter.com/boutiknaka', type: 'STRING' },
    { key: 'youtubeUrl', value: '', type: 'STRING' },
    { key: 'footerText', value: '© 2023 BoutikNaka. Tous droits réservés.', type: 'TEXT' },
    { key: 'metaTitle', value: 'BoutikNaka - Votre boutique en ligne', type: 'STRING' },
    { key: 'metaDescription', value: 'BoutikNaka est votre boutique en ligne pour tous vos besoins numériques et électroniques.', type: 'TEXT' },
    { key: 'metaKeywords', value: 'boutique, e-commerce, madagascar, streaming, produits, services', type: 'STRING' },
    { key: 'sloganMG', value: 'Kalitao sy serivisy amin\'ny vidiny mora', type: 'STRING' },
    { key: 'sloganFR', value: 'Qualité et service à prix abordable', type: 'STRING' },
  ];

  // Supprimer les paramètres existants
  await prisma.setting.deleteMany({});

  // Insérer les nouveaux paramètres
  for (const setting of defaultSettings) {
    await prisma.setting.create({
      data: setting
    });
  }

  console.log('✅ Paramètres généraux initialisés avec succès!');

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