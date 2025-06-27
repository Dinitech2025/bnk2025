import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        published: true,
      },
      include: {
        images: {
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error('[SERVICES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 