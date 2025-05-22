import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import slugify from 'slugify'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const parentId = formData.get('parentId') as string || null
    const imageFile = formData.get('image') as File | null

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
      const imageUrl = await uploadToCloudinary(imageFile)
      data.image = imageUrl
    }

    // Créer la catégorie
    const category = await prisma.category.create({
      data
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la catégorie' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
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
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des catégories' },
      { status: 500 }
    )
  }
} 