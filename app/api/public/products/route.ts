import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        published: true,
      },
      include: {
        images: {
          take: 1, // On ne prend que la première image pour la liste
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('[PRODUCTS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 