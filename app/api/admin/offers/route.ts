import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const offers = await prisma.offer.findMany({
      orderBy: [
        { isPopular: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("[OFFERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const offer = await prisma.offer.create({
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
    console.error("[OFFERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 