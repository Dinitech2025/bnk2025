import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Import dynamique d'ImageKit
    const ImageKit = (await import('imagekit')).default

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_ww3tp1IR2TWgySCwmbjiclv9auc=',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_KRAJobsgeMLRmi7FJNPVxXEVEvs=',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/q475ish3ih',
    })

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Déterminer le dossier selon le type
      let folder = 'bnk/general'
      switch (type) {
        case 'quote':
          folder = 'bnk/quotes'
          break
        case 'logo':
          folder = 'bnk/logos'
          break
        case 'favicon':
          folder = 'bnk/favicons'
          break
        case 'product':
          folder = 'bnk/products'
          break
        case 'service':
          folder = 'bnk/services'
          break
        default:
          folder = 'bnk/general'
      }

      return new Promise((resolve, reject) => {
        imagekit.upload({
          file: buffer,
          fileName: file.name,
          folder: folder,
          useUniqueFileName: true,
        }, (error, result) => {
          if (error) {
            console.error('Erreur ImageKit:', error)
            reject(error)
          } else {
            resolve(result?.url)
          }
        })
      })
    })

    const urls = await Promise.all(uploadPromises)

    return NextResponse.json({ 
      urls: urls.filter(Boolean),
      message: `${urls.length} fichier(s) uploadé(s) avec succès`
    })

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload des fichiers' 
    }, { status: 500 })
  }
} 