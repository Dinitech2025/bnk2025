import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer les catégories de produits
    const productCategories = await prisma.productCategory.findMany({
      where: {
        parentId: null, // Seulement les catégories principales
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 10 // Limiter à 10 catégories pour le menu
    })

    // Récupérer les catégories de services
    const serviceCategories = await prisma.serviceCategory.findMany({
      where: {
        parentId: null, // Seulement les catégories principales
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 10 // Limiter à 10 catégories pour le menu
    })

    return NextResponse.json({
      products: productCategories,
      services: serviceCategories
    })
  } catch (error) {
    console.error('[CATEGORIES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 