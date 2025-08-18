import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Récupérer les slides actifs pour le public
export async function GET() {
  try {
    const slides = await db.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(slides)
  } catch (error) {
    console.error('Erreur lors de la récupération des slides publics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des slides' },
      { status: 500 }
    )
  }
}
