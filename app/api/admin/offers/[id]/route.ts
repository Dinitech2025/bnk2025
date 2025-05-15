import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        platformOffers: {
          include: {
            platform: true
          }
        }
      }
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'offre" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Mise à jour de l'offre
    const offerData: Prisma.OfferUpdateInput = {
      name: data.name,
      description: data.description,
      price: new Prisma.Decimal(data.price),
      duration: data.duration,
      profileCount: data.platformConfigs.reduce((sum: number, config: any) => sum + (config.profileCount || 1), 0),
      isPopular: Boolean(data.isPopular),
      isActive: data.isActive ?? true,
      features: Array.isArray(data.features) ? JSON.stringify(data.features) : "[]"
    };

    // Supprimer les anciennes configurations de plateforme
    await prisma.platformOffer.deleteMany({
      where: { offerId: params.id }
    });

    // Créer les nouvelles configurations
    await Promise.all(
      data.platformConfigs.map((config: any) =>
        prisma.platformOffer.create({
          data: {
            offerId: params.id,
            platformId: config.platformId,
            profileCount: config.profileCount || 1,
            isDefault: Boolean(config.isDefault)
          }
        })
      )
    );

    // Mettre à jour l'offre
    const offer = await prisma.offer.update({
      where: { id: params.id },
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
    console.error("Erreur lors de la mise à jour de l'offre:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Une offre avec ce nom existe déjà" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'offre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Vérifier si l'offre est utilisée dans des abonnements actifs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        offerId: params.id,
        status: "ACTIVE"
      }
    });

    if (activeSubscriptions.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une offre avec des abonnements actifs" },
        { status: 400 }
      );
    }

    // Supprimer l'offre (les platformOffers seront supprimés automatiquement grâce aux relations)
    await prisma.offer.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
} 