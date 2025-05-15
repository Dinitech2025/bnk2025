import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer le fichier de la requête
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'Aucun fichier fourni' }),
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Le fichier doit être une image' }),
        { status: 400 }
      )
    }

    // Créer un nom de fichier unique
    const buffer = Buffer.from(await file.arrayBuffer())
    const uniqueId = uuidv4()
    const extension = file.name.split('.').pop()
    const fileName = `${uniqueId}.${extension}`

    // Créer le chemin du dossier public/uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    
    try {
      await writeFile(join(uploadsDir, fileName), buffer)
    } catch (error) {
      console.error('Erreur lors de l\'écriture du fichier:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Erreur lors de l\'enregistrement du fichier' }),
        { status: 500 }
      )
    }

    // Retourner l'URL de l'image
    const imageUrl = `/uploads/${fileName}`
    
    return NextResponse.json({ 
      success: true,
      url: imageUrl
    })
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 