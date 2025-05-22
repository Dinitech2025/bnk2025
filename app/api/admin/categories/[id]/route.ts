import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import slugify from 'slugify'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de la catégorie' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Récupérer la catégorie existante pour l'image
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id },
      select: { image: true }
    })

    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const parentId = formData.get('parentId') as string || null
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'

    // Créer le slug à partir du nom
    const slug = slugify(name, { lower: true, strict: true })

    // Préparer les données de base
    const data: any = {
      name,
      description,
      parentId,
      slug
    }

    // Gérer l'upload d'image si présente
    if (imageFile) {
      // Supprimer l'ancienne image si elle existe
      if (existingCategory?.image) {
        const publicId = existingCategory.image.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
      const imageUrl = await uploadToCloudinary(imageFile)
      data.image = imageUrl
    } else if (removeImage) {
      // Supprimer l'image existante de Cloudinary
      if (existingCategory?.image) {
        const publicId = existingCategory.image.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
      data.image = null
    }

    // Mettre à jour la catégorie
    const category = await prisma.category.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de la catégorie' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Vérifier si la catégorie a des produits associés
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    // Empêcher la suppression si la catégorie a des produits ou des sous-catégories
    if (category._count.products > 0 || category._count.children > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une catégorie qui contient des produits ou des sous-catégories' },
        { status: 400 }
      )
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (category.image) {
      const publicId = category.image.split('/').pop()?.split('.')[0]
      if (publicId) {
        await deleteFromCloudinary(publicId)
      }
    }

    // Supprimer la catégorie
    await prisma.category.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression de la catégorie' },
      { status: 500 }
    )
  }
} 