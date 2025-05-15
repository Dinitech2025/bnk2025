import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Supprimer toutes les données existantes
    await prisma.userProfile.deleteMany();
    await prisma.userSubscription.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.accountProfile.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platformOfferConfig.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.user.deleteMany();

    // Créer un administrateur
    const adminPassword = await hash("admin123", 12);
    await prisma.user.create({
      data: {
        email: "admin@boutiknaka.com",
        name: "Admin",
        firstName: "Admin",
        lastName: "System",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    // Créer un membre du staff
    const staffPassword = await hash("staff123", 12);
    await prisma.user.create({
      data: {
        email: "staff@boutiknaka.com",
        name: "Staff",
        firstName: "Staff",
        lastName: "Member",
        password: staffPassword,
        role: "STAFF",
      },
    });

    // Créer un client
    const clientPassword = await hash("client123", 12);
    await prisma.user.create({
      data: {
        email: "client@example.com",
        name: "Client",
        firstName: "John",
        lastName: "Doe",
        password: clientPassword,
        role: "CLIENT",
      },
    });

    // Créer les plateformes de streaming
    const platforms = [
      {
        name: "Netflix",
        slug: "netflix",
        description: "Le leader mondial du streaming avec un vaste catalogue de films, séries et documentaires.",
        type: "VIDEO",
        hasProfiles: true,
        maxProfilesPerAccount: 5,
        isActive: true,
        websiteUrl: "https://www.netflix.com",
        popularity: 5.0,
        features: JSON.stringify([
          "HD et Ultra HD disponibles",
          "Téléchargement hors-ligne",
          "Pas de publicités",
          "Annulation à tout moment"
        ]),
        pricingModel: "SUBSCRIPTION"
      },
      {
        name: "Disney+",
        slug: "disney-plus",
        description: "La maison de Disney, Marvel, Star Wars, Pixar et National Geographic.",
        type: "VIDEO",
        hasProfiles: true,
        maxProfilesPerAccount: 7,
        isActive: true,
        websiteUrl: "https://www.disneyplus.com",
        popularity: 4.8,
        features: JSON.stringify([
          "4K Ultra HD",
          "HDR",
          "Téléchargement illimité",
          "Jusqu'à 4 écrans simultanés"
        ]),
        pricingModel: "SUBSCRIPTION"
      },
      {
        name: "Prime Video",
        slug: "prime-video",
        description: "Le service de streaming d'Amazon avec des films, séries et contenus originaux.",
        type: "VIDEO",
        hasProfiles: true,
        maxProfilesPerAccount: 6,
        isActive: true,
        websiteUrl: "https://www.primevideo.com",
        popularity: 4.5,
        features: JSON.stringify([
          "HDR et 4K Ultra HD",
          "Téléchargement pour visionnage hors-ligne",
          "Inclus avec Amazon Prime",
          "Chaînes additionnelles disponibles"
        ]),
        pricingModel: "SUBSCRIPTION"
      },
      {
        name: "Canal+",
        slug: "canal-plus",
        description: "La référence française du cinéma et du sport en streaming.",
        type: "VIDEO",
        hasProfiles: true,
        maxProfilesPerAccount: 4,
        isActive: true,
        websiteUrl: "https://www.canalplus.com",
        popularity: 4.2,
        features: JSON.stringify([
          "Sport en direct",
          "Films récents",
          "Séries originales",
          "Multi-écrans"
        ]),
        pricingModel: "SUBSCRIPTION"
      }
    ];

    for (const platform of platforms) {
      await prisma.platform.create({
        data: platform
      });
    }

    // Créer quelques paramètres de base
    await prisma.setting.createMany({
      data: [
        {
          key: "siteName",
          value: "BoutikNaka",
          type: "STRING"
        },
        {
          key: "siteDescription",
          value: "Votre boutique en ligne de confiance",
          type: "STRING"
        },
        {
          key: "metaTitle",
          value: "BoutikNaka - Boutique en ligne",
          type: "STRING"
        },
        {
          key: "metaDescription",
          value: "BoutikNaka est votre destination en ligne pour le shopping et le streaming",
          type: "STRING"
        },
        {
          key: "metaKeywords",
          value: "boutique, ecommerce, streaming, produits, services",
          type: "STRING"
        }
      ]
    });

    console.log("Base de données initialisée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 