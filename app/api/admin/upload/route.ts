import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Le fichier doit être une image' },
        { status: 400 }
      )
    }

    // Limiter la taille du fichier (5 Mo)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'La taille du fichier ne doit pas dépasser 5 Mo' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // Créer le chemin de destination
    const publicDir = join(process.cwd(), 'public')
    const uploadsDir = join(publicDir, 'uploads')
    const filePath = join(uploadsDir, fileName)
    const fileUrl = `/uploads/${fileName}`

    // Créer le dossier uploads s'il n'existe pas
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Écrire le fichier sur le disque
    try {
      await writeFile(filePath, buffer)
    } catch (error) {
      console.error('Erreur lors de l\'écriture du fichier:', error)
      return NextResponse.json(
        { message: 'Erreur lors de l\'enregistrement du fichier' },
        { status: 500 }
      )
    }

    // Retourner l'URL du fichier téléchargé
    return NextResponse.json({ url: fileUrl }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 