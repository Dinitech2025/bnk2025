import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/products/product-form'

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

export default async function AddProductPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajouter un produit</h1>
        <p className="text-sm text-gray-500">Créez un nouveau produit dans votre catalogue.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  )
} 