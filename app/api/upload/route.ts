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

    // Récupérer le fichier et le type de média de la requête
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general'

    console.log('Type de média reçu:', type)
    console.log('Taille du fichier:', file?.size)
    console.log('Type MIME:', file?.type)

    if (!file) {
      console.log('Aucun fichier fourni')
      return new NextResponse(
        JSON.stringify({ error: 'Aucun fichier fourni' }),
        { status: 400 }
      )
    }

    // Vérifier le type de fichier (images et vidéos)
    const isValidImageType = file.type.startsWith('image/') || 
                            file.type === 'image/x-icon' || 
                            file.type === 'image/vnd.microsoft.icon' ||
                            file.name.toLowerCase().endsWith('.ico')
    
    const isValidVideoType = file.type.startsWith('video/') ||
                            file.name.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
    
    if (!isValidImageType && !isValidVideoType) {
      console.log('Type de fichier invalide:', file.type, 'Nom:', file.name)
      return new NextResponse(
        JSON.stringify({ error: 'Le fichier doit être une image (PNG, JPG, GIF, SVG, ICO) ou une vidéo (MP4, WEBM, MOV, AVI)' }),
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('Buffer créé, taille:', buffer.length)

    // Déterminer le type de ressource
    const isVideo = isValidVideoType
    const resourceType = isVideo ? 'video' : 'auto'

    // Configurer les options d'upload selon le type de média
    const uploadOptions: any = {
      resource_type: resourceType,
    }

    switch (type) {
      case 'profile':
        uploadOptions.folder = 'bnk/profiles'
        if (!isVideo) {
          uploadOptions.transformation = [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        }
        break
      case 'product':
        uploadOptions.folder = 'bnk/products'
        if (isVideo) {
          // Pour les vidéos produits, générer un thumbnail automatiquement
          uploadOptions.eager = [
            { width: 800, height: 800, crop: 'fill', format: 'jpg', resource_type: 'image' }
          ]
        } else {
          uploadOptions.transformation = [
            { width: 800, height: 800, crop: 'fill' }
          ]
        }
        break
      case 'service':
        uploadOptions.folder = 'bnk/services'
        if (isVideo) {
          uploadOptions.eager = [
            { width: 1200, crop: 'scale', format: 'jpg', resource_type: 'image' }
          ]
        } else {
          uploadOptions.transformation = [
            { width: 1200, crop: 'scale' }
          ]
        }
        break
      case 'offer':
        uploadOptions.folder = 'bnk/offers'
        if (isVideo) {
          uploadOptions.eager = [
            { width: 1200, height: 630, crop: 'fill', format: 'jpg', resource_type: 'image' }
          ]
        } else {
          uploadOptions.transformation = [
            { width: 1200, height: 630, crop: 'fill' }
          ]
        }
        break
      case 'logo':
        uploadOptions.folder = 'bnk/logos'
        // Les logos ne devraient pas être des vidéos
        if (file.name.toLowerCase().endsWith('.ico') || file.type === 'image/x-icon') {
          uploadOptions.resource_type = 'raw'
          uploadOptions.format = 'ico'
        } else {
          uploadOptions.transformation = [
            { width: 500, height: 500, crop: 'fit', background: 'transparent' }
          ]
        }
        break
      case 'favicon':
        uploadOptions.folder = 'bnk/favicons'
        uploadOptions.resource_type = 'raw'
        if (file.name.toLowerCase().endsWith('.ico')) {
          uploadOptions.format = 'ico'
        }
        break
      default:
        uploadOptions.folder = 'bnk/general'
        if (isVideo) {
          uploadOptions.eager = [
            { width: 800, height: 600, crop: 'fill', format: 'jpg', resource_type: 'image' }
          ]
        }
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

    const cloudinaryResult = result as any

    // Préparer la réponse
    const response: any = {
      success: true,
      url: cloudinaryResult.secure_url,
      type: isVideo ? 'video' : 'image'
    }

    // Si c'est une vidéo, ajouter les informations de thumbnail et durée
    if (isVideo) {
      response.duration = cloudinaryResult.duration || null
      
      // Générer l'URL du thumbnail si disponible
      if (cloudinaryResult.eager && cloudinaryResult.eager.length > 0) {
        response.thumbnail = cloudinaryResult.eager[0].secure_url
      } else {
        // Générer un thumbnail par défaut (première frame)
        const publicId = cloudinaryResult.public_id
        response.thumbnail = cloudinary.url(publicId, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 800, height: 600, crop: 'fill' }
          ]
        })
      }
    }

    console.log('Réponse finale:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur détaillée lors du téléchargement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du fichier' },
      { status: 500 }
    )
  }
} 