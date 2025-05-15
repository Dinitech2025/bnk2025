import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: params.id }
    });

    if (!offer) {
      return new NextResponse("Offer not found", { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("[OFFER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      description, 
      price, 
      duration, 
      profileCount,
      isPopular,
      isActive,
      maxUsers,
      features 
    } = body;

    if (!name || !price || !duration || !profileCount) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price,
        duration,
        profileCount,
        isPopular: isPopular || false,
        isActive: isActive ?? true,
        maxUsers: maxUsers || 1,
        features: features ? JSON.stringify(features) : null
      }
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("[OFFER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Vérifier si l'offre est utilisée dans des abonnements actifs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        offerId: params.id,
        status: "ACTIVE"
      }
    });

    if (activeSubscriptions.length > 0) {
      return new NextResponse(
        "Cannot delete offer with active subscriptions",
        { status: 400 }
      );
    }

    await prisma.offer.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[OFFER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 