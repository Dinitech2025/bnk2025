import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Récupérer les paramètres généraux
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et les autorisations
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer tous les paramètres
    const settings = await db.setting.findMany()

    // Transformer en objet clé-valeur
    const settingsObject: Record<string, string> = {}
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value || ''
    })

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// Mettre à jour les paramètres généraux
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les autorisations
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer les données du corps de la requête
    const data = await request.json()

    // Mettre à jour ou créer chaque paramètre
    for (const [key, value] of Object.entries(data)) {
      await db.setting.upsert({
        where: { key },
        update: { value: value as string },
        create: {
          key,
          value: value as string,
          type: determineType(value),
        },
      })
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour déterminer le type d'un paramètre
function determineType(value: any): string {
  if (typeof value === 'string') {
    if (value.startsWith('http') && (value.includes('.jpg') || value.includes('.png') || value.includes('.gif') || value.includes('.webp'))) {
      return 'IMAGE'
    }
    if (value.length > 100) {
      return 'TEXT'
    }
    return 'STRING'
  }
  if (typeof value === 'number') {
    return 'NUMBER'
  }
  if (typeof value === 'boolean') {
    return 'BOOLEAN'
  }
  return 'STRING'
} 