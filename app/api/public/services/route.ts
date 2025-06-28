import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const search = searchParams.get("search")
    const category = searchParams.get("category")

    // Si un ID spécifique est demandé
    if (id) {
      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          images: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
      
      if (service) {
        // Transformer les images pour l'API publique
        const transformedImages = service.images.map((image: any) => ({
          url: image.path,
          alt: image.alt || null,
          type: image.type || 'image',
          thumbnail: image.thumbnail || null,
          duration: image.duration || null,
        }))
        
        const serviceWithTransformedImages = {
          ...service,
          images: transformedImages,
        }
        
        return NextResponse.json([serviceWithTransformedImages])
      }
      
      return NextResponse.json([])
    }

    // Construction de la requête de base
    const whereClause: any = {
      published: true,
    }

    // Ajout des filtres de recherche
    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
      ]
    }

    // Filtre par catégorie
    if (category && category !== "all") {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          categoryId: category,
        },
      ]
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        images: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Transformer les images pour l'API publique
    const servicesWithTransformedImages = services.map(service => {
      const transformedImages = service.images.map((image: any) => ({
        url: image.path,
        alt: image.alt || null,
        type: image.type || 'image',
        thumbnail: image.thumbnail || null,
        duration: image.duration || null,
      }))
      
      return {
        ...service,
        images: transformedImages,
      }
    })

    return NextResponse.json(servicesWithTransformedImages)
  } catch (error) {
    console.error("[SERVICES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
