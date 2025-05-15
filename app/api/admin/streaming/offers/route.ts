import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const data = await req.json();
    console.log("Données reçues:", JSON.stringify(data, null, 2));

    const {
      name,
      description,
      type,
      price,
      duration,
      durationUnit,
      isPopular,
      isActive,
      features,
      platformConfigs,
      images
    } = data;

    // Validation améliorée des données
    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    // Validation du prix
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: "Le prix doit être un nombre positif" }, { status: 400 });
    }

    // Validation de la durée
    const numericDuration = typeof duration === 'string' ? parseInt(duration) : duration;
    if (isNaN(numericDuration) || numericDuration <= 0) {
      return NextResponse.json({ error: "La durée doit être un nombre positif" }, { status: 400 });
    }

    if (!platformConfigs || !Array.isArray(platformConfigs) || platformConfigs.length === 0) {
      return NextResponse.json(
        { error: "Au moins une plateforme doit être sélectionnée" },
        { status: 400 }
      );
    }

    // Validation du type d'offre
    if (type === "SINGLE" && platformConfigs.length > 1) {
      return NextResponse.json(
        { error: "Une offre simple ne peut avoir qu'une seule plateforme" },
        { status: 400 }
      );
    }

    try {
      // Vérification des plateformes
      const platformIds = platformConfigs.map(config => config.platformId);
      const existingPlatforms = await prisma.platform.findMany({
        where: {
          id: {
            in: platformIds
          }
        }
      });

      if (existingPlatforms.length !== platformIds.length) {
        const missingPlatforms = platformIds.filter(
          id => !existingPlatforms.find(p => p.id === id)
        );
        return NextResponse.json(
          { 
            error: "Certaines plateformes sélectionnées n'existent pas",
            details: `Plateformes non trouvées: ${missingPlatforms.join(", ")}`
          },
          { status: 400 }
        );
      }

      // Traitement des features
      let processedFeatures;
      if (Array.isArray(features)) {
        processedFeatures = JSON.stringify(features.filter(f => f?.trim()));
      } else if (typeof features === 'string') {
        processedFeatures = JSON.stringify(
          features.split('\n')
            .map(f => f.trim())
            .filter(Boolean)
        );
      } else {
        processedFeatures = '[]';
      }

      // Création de l'offre
      const offerData = {
        name: name.trim(),
        slug: slugify(name, { lower: true, strict: true }),
        description: description?.trim() || null,
        type,
        price: numericPrice,
        duration: numericDuration,
        durationUnit: durationUnit || "DAYS",
        isPopular: Boolean(isPopular),
        isActive: isActive ?? true,
        profileCount: platformConfigs.reduce((sum, config) => {
          const count = parseInt(config.profileCount) || 1;
          return sum + (isNaN(count) ? 1 : count);
        }, 0),
        features: processedFeatures,
        platformConfigs: {
          create: platformConfigs.map(config => ({
            platformId: config.platformId,
            profileCount: parseInt(config.profileCount) || 1,
            isDefault: Boolean(config.isDefault)
          }))
        }
      };

      // Vérification et connexion des images
      if (images && Array.isArray(images)) {
        const validImages = await prisma.media.findMany({
          where: {
            path: {
              in: images.filter(Boolean)
            }
          }
        });

        if (validImages.length > 0) {
          offerData.images = {
            connect: validImages.map(img => ({ path: img.path }))
          };
        }
      }

      console.log("Données de l'offre à créer:", JSON.stringify(offerData, null, 2));

      const offer = await prisma.offer.create({
        data: offerData,
        include: {
          platformConfigs: {
            include: {
              platform: true
            }
          },
          images: true
        }
      });

      return NextResponse.json(offer);
    } catch (dbError) {
      console.error("Erreur Prisma:", dbError);
      
      // Gestion des erreurs spécifiques
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "Une offre avec ce nom existe déjà", details: dbError.message },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: "Erreur lors de la création en base de données", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre", details: error.message },
      { status: 500 }
    );
  }
}