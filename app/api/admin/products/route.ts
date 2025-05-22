import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/upload'
import slugify from 'slugify'
import { convertDecimalToNumber } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    // Récupérer les données du produit
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const sku = formData.get('reference') as string
    const price = parseFloat(formData.get('price') as string)
    const compareAtPrice = formData.get('compareAtPrice') ? parseFloat(formData.get('compareAtPrice') as string) : null
    const inventory = parseInt(formData.get('quantity') as string)
    const categoryId = formData.get('categoryId') as string || null
    const published = formData.get('isActive') === 'true'
    const featured = formData.get('featured') === 'true'
    const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : null
    const dimensions = formData.get('dimensions') as string || null
    const barcode = formData.get('barcode') as string || null

    // Récupérer les attributs du produit
    const attributes = JSON.parse(formData.get('attributes') as string || '[]')
    
    // Récupérer les variations du produit
    const variations = JSON.parse(formData.get('variations') as string || '[]')
    
    // Créer le produit avec ses attributs
    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name, { lower: true }),
        description,
        sku,
        barcode,
        price,
        compareAtPrice,
        inventory,
        weight,
        dimensions,
        categoryId,
        published,
        featured,
        attributes: {
          create: attributes.map((attr: { name: string, value: string }) => ({
            name: attr.name,
            value: attr.value
          }))
        }
      }
    })

    // Créer les variations séparément
    if (variations.length > 0) {
      await Promise.all(variations.map((variation: {
        sku: string,
        price: number,
        inventory: number,
        attributes: { name: string, value: string }[]
      }) => 
        prisma.productVariation.create({
          data: {
            sku: variation.sku,
            price: variation.price,
            inventory: variation.inventory,
            product: {
              connect: { id: product.id }
            },
            attributes: {
              create: variation.attributes.map(attr => ({
                name: attr.name,
                value: attr.value
              }))
            }
          }
        })
      ))
    }

    // Gérer les images du produit principal
    const images = formData.getAll('images') as File[]
    if (images.length > 0) {
      const uploadPromises = images.map(async (image) => {
        const path = await uploadImage(image, 'product')
        return prisma.media.create({
          data: {
            name: image.name,
            fileName: image.name,
            path,
            size: image.size,
            mimeType: image.type,
            alt: null,
            products: {
              connect: { id: product.id }
            }
          },
        })
      })

      await Promise.all(uploadPromises)
    }

    // Gérer les images des variations
    const variationImages = formData.getAll('variationImages') as File[]
    if (variationImages.length > 0) {
      const variationImageData = JSON.parse(formData.get('variationImageMapping') as string || '[]')
      
      const uploadVariationPromises = variationImages.map(async (image, index) => {
        const path = await uploadImage(image, 'product')
        const variationId = variationImageData[index].variationId
        
        return prisma.media.create({
          data: {
            name: image.name,
            fileName: image.name,
            path,
            size: image.size,
            mimeType: image.type,
            alt: null,
            variations: {
              connect: [{ id: variationId }]
            }
          },
        })
      })

      await Promise.all(uploadVariationPromises)
    }

    // Retourner le produit avec toutes ses relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        attributes: true,
        variations: {
          include: {
            attributes: true,
            images: true
          }
        },
        images: true
      }
    })

    return NextResponse.json(convertDecimalToNumber(completeProduct))
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du produit' },
      { status: 500 }
    )
  }
} 