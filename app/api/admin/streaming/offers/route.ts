import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const offers = await prisma.offer.findMany({
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des offres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validation des données
    if (!data.name || !data.price || !data.duration || !data.platformConfigs?.length) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    // Création de l'offre
    const offerData: Prisma.OfferCreateInput = {
      name: data.name,
      description: data.description,
      price: new Prisma.Decimal(data.price),
      duration: data.duration,
      profileCount: data.platformConfigs.reduce((sum: number, config: any) => sum + (config.profileCount || 1), 0),
      isPopular: Boolean(data.isPopular),
      isActive: data.isActive ?? true,
      features: Array.isArray(data.features) ? JSON.stringify(data.features) : "[]",
      platformOffers: {
        create: data.platformConfigs.map((config: any) => ({
          profileCount: config.profileCount || 1,
          isDefault: Boolean(config.isDefault),
          platform: {
            connect: {
              id: config.platformId
            }
          }
        }))
      }
    };

    const offer = await prisma.offer.create({
      data: offerData,
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Erreur lors de la création de l'offre:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Une offre avec ce nom existe déjà" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre" },
      { status: 500 }
    );
  }
}