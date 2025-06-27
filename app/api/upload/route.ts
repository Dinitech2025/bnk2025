import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      console.log('Erreur d\'authentification:', session)
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403 }
      )
    }

    // Récupérer le fichier et le type d'image de la requête
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general'

    console.log('Type de fichier reçu:', type)
    console.log('Taille du fichier:', file?.size)

    if (!file) {
      console.log('Aucun fichier fourni')
      return new NextResponse(
        JSON.stringify({ error: 'Aucun fichier fourni' }),
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    const isValidImageType = file.type.startsWith('image/') || 
                            file.type === 'image/x-icon' || 
                            file.type === 'image/vnd.microsoft.icon' ||
                            file.name.toLowerCase().endsWith('.ico')
    
    if (!isValidImageType) {
      console.log('Type de fichier invalide:', file.type, 'Nom:', file.name)
      return new NextResponse(
        JSON.stringify({ error: 'Le fichier doit être une image (PNG, JPG, GIF, SVG, ICO)' }),
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('Buffer créé, taille:', buffer.length)

    // Configurer les options d'upload selon le type d'image
    const uploadOptions: any = {
      resource_type: 'auto',
    }

    switch (type) {
      case 'profile':
        uploadOptions.folder = 'bnk/profiles'
        uploadOptions.transformation = [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
        break
      case 'product':
        uploadOptions.folder = 'bnk/products'
        uploadOptions.transformation = [
          { width: 800, height: 800, crop: 'fill' }
        ]
        break
      case 'service':
        uploadOptions.folder = 'bnk/services'
        uploadOptions.transformation = [
          { width: 1200, crop: 'scale' }
        ]
        break
      case 'offer':
        uploadOptions.folder = 'bnk/offers'
        uploadOptions.transformation = [
          { width: 1200, height: 630, crop: 'fill' }
        ]
        break
      case 'logo':
        uploadOptions.folder = 'bnk/logos'
        // Vérifier si c'est un fichier .ico (favicon)
        if (file.name.toLowerCase().endsWith('.ico') || file.type === 'image/x-icon') {
          // Pour les fichiers .ico, pas de transformation
          uploadOptions.resource_type = 'raw'
          uploadOptions.format = 'ico'
        } else {
          // Pour les autres logos (PNG, JPG, etc.)
          uploadOptions.transformation = [
            { width: 500, height: 500, crop: 'fit', background: 'transparent' }
          ]
        }
        break
      case 'favicon':
        uploadOptions.folder = 'bnk/favicons'
        // Pour les favicons, pas de transformation pour préserver la compatibilité
        uploadOptions.resource_type = 'raw'
        if (file.name.toLowerCase().endsWith('.ico')) {
          uploadOptions.format = 'ico'
        }
        break
      default:
        uploadOptions.folder = 'bnk/general'
    }

    console.log('Options d\'upload:', uploadOptions)

    // Upload vers Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Erreur Cloudinary:', error)
            reject(error)
          } else {
            console.log('Upload réussi:', result)
            resolve(result)
          }
        }
      )

      uploadStream.end(buffer)
    })

    // Retourner l'URL de l'image
    return NextResponse.json({ 
      success: true,
      url: (result as any).secure_url
    })
  } catch (error) {
    console.error('Erreur détaillée lors du téléchargement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du fichier' },
      { status: 500 }
    )
  }
} 