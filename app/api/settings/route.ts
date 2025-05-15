import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Récupérer les paramètres généraux (version publique)
export async function GET(request: NextRequest) {
  try {
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