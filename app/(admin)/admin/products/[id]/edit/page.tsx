import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/products/product-form'
import { notFound } from 'next/navigation'
import { Prisma } from '@prisma/client'

interface EditProductPageProps {
  params: {
    id: string
  }
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      inventory: true,
      categoryId: true,
      published: true,
      featured: true,
      barcode: true,
      weight: true,
      dimensions: true,
    }
  })

  if (!product) {
    notFound()
  }

  const images = await prisma.media.findMany({
    where: {
      products: {
        some: { id }
      }
    },
    select: {
      id: true,
      path: true,
    }
  })

  const attributesResult = await prisma.$queryRaw`
    SELECT * FROM "ProductAttribute" 
    WHERE "productId" = ${id}
  `
  
  const attributes = Array.isArray(attributesResult) ? attributesResult : []

  const variationsResult = await prisma.$queryRaw`
    SELECT v.*, 
      (
        SELECT json_agg(a.*) 
        FROM "ProductAttribute" a 
        WHERE a."variationId" = v.id
      ) as attributes
    FROM "ProductVariation" v
    WHERE v."productId" = ${id}
  `
  
  const variations = Array.isArray(variationsResult) ? variationsResult : []

  return {
    ...product,
    images,
    variations,
    attributes
  }
}

async function getCategories() {
  return await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier le produit</h1>
        <p className="text-sm text-gray-500">Modifiez les informations du produit.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProductForm 
          categories={categories} 
          initialData={{
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            inventory: product.inventory,
            categoryId: product.categoryId,
            published: product.published,
            featured: product.featured,
            barcode: product.barcode,
            weight: product.weight ? Number(product.weight) : null,
            dimensions: product.dimensions,
            images: product.images || [],
            variations: product.variations || [],
            attributes: product.attributes || []
          }} 
        />
      </div>
    </div>
  )
} 