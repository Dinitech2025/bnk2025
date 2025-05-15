import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// GET - Récupérer toutes les plateformes
export async function GET(request: NextRequest) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par: const user = await requireStaff()
    
    // Récupérer toutes les plateformes
    const platforms = await db.platform.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        logoMedia: true,
      },
    })

    // Formater les données pour l'API
    const formattedPlatforms = platforms.map(platform => ({
      ...platform,
      logo: platform.logoMedia?.path || platform.logo,
    }))

    return NextResponse.json(formattedPlatforms)
  } catch (error) {
    console.error('Erreur lors de la récupération des plateformes:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle plateforme
export async function POST(request: NextRequest) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par:
    // const user = await requireStaff()
    // if (user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { message: 'Seuls les administrateurs peuvent créer des plateformes' },
    //     { status: 403 }
    //   )
    // }

    // Récupérer les données du corps de la requête
    const data = await request.json()

    // Valider les données requises
    if (!data.name) {
      return NextResponse.json(
        { message: 'Le nom est requis' },
        { status: 400 }
      )
    }

    // Générer le slug automatiquement s'il n'est pas fourni
    const slug = data.slug || slugify(data.name)
    
    // Vérifier si le slug existe déjà
    const existingPlatform = await db.platform.findUnique({
      where: {
        slug,
      },
    })

    if (existingPlatform) {
      return NextResponse.json(
        { message: 'Une plateforme avec ce slug existe déjà' },
        { status: 400 }
      )
    }

    // Créer la plateforme
    const platform = await db.platform.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        logo: data.logo || null,
        logoMediaId: data.logoMediaId || null,
        websiteUrl: data.websiteUrl || null,
        type: data.type || 'VIDEO',
        maxProfilesPerAccount: data.maxProfilesPerAccount !== null ? data.maxProfilesPerAccount : 
          ['VIDEO', 'AUDIO', 'GAMING'].includes(data.type || 'VIDEO') ? 5 : null,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json(platform, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 