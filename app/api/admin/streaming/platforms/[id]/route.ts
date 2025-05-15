import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// GET - Récupérer une plateforme spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par: const user = await requireStaff()

    // Récupérer la plateforme
    const platform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
      include: {
        logoMedia: true,
      },
    })

    if (!platform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Formater les données pour l'API
    const formattedPlatform = {
      ...platform,
      logo: platform.logoMedia?.path || platform.logo,
    }

    return NextResponse.json(formattedPlatform)
  } catch (error) {
    console.error('Erreur lors de la récupération de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une plateforme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par:
    // const user = await requireStaff()
    // if (user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { message: 'Seuls les administrateurs peuvent modifier des plateformes' },
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
    
    // Générer le slug automatiquement à partir du nom
    const slug = slugify(data.name)

    // Vérifier si la plateforme existe
    const existingPlatform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier si le slug est déjà utilisé par une autre plateforme
    if (slug !== existingPlatform.slug) {
      const slugExists = await db.platform.findUnique({
        where: {
          slug,
        },
      })

      if (slugExists && slugExists.id !== params.id) {
        return NextResponse.json(
          { message: 'Une plateforme avec ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour la plateforme
    const updatedPlatform = await db.platform.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        logo: data.logo || null,
        logoMediaId: data.logoMediaId || null,
        websiteUrl: data.websiteUrl || null,
        type: data.type || existingPlatform.type || 'VIDEO',
        maxProfilesPerAccount: data.maxProfilesPerAccount !== undefined ? 
          (data.maxProfilesPerAccount === null ? null : data.maxProfilesPerAccount) : 
          (existingPlatform.maxProfilesPerAccount || 
            (['VIDEO', 'AUDIO', 'GAMING'].includes(data.type || existingPlatform.type || 'VIDEO') ? 5 : null)),
        isActive: data.isActive ?? existingPlatform.isActive,
      },
    })

    return NextResponse.json(updatedPlatform)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour partiellement une plateforme (ex: statut actif/inactif)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par: const user = await requireStaff()

    // Récupérer les données du corps de la requête
    const data = await request.json()

    // Vérifier si la plateforme existe
    const existingPlatform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Si le nom est fourni, générer un nouveau slug
    let updateData = { ...data }
    if (data.name) {
      updateData.slug = slugify(data.name)
    }

    // Mettre à jour la plateforme
    const updatedPlatform = await db.platform.update({
      where: {
        id: params.id,
      },
      data: updateData,
    })

    return NextResponse.json(updatedPlatform)
  } catch (error) {
    console.error('Erreur lors de la mise à jour partielle de la plateforme:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une plateforme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mode développement - désactiver temporairement l'authentification
    // En production, ce code serait remplacé par:
    // const user = await requireStaff()
    // if (user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { message: 'Seuls les administrateurs peuvent supprimer des plateformes' },
    //     { status: 403 }
    //   )
    // }

    // Vérifier si la plateforme existe
    const existingPlatform = await db.platform.findUnique({
      where: {
        id: params.id,
      },
      include: {
        accounts: true,
        platformOffers: true,
      },
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la plateforme
    await db.platform.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json(
      { message: 'Plateforme supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de la plateforme:', error)
    
    // Vérifier si l'erreur est liée à des contraintes de clé étrangère
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { 
          message: 'Impossible de supprimer cette plateforme car elle est utilisée par des comptes ou des offres',
          error: 'FOREIGN_KEY_CONSTRAINT'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 