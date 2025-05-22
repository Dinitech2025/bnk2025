import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { InventoryForm } from '@/components/products/inventory-form'
import { convertDecimalToNumber } from '@/lib/utils'

interface AdjustInventoryPageProps {
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
      inventory: true
    }
  })

  if (!product) {
    notFound()
  }

  // Récupérer les variations du produit avec une requête SQL directe
  const variationsResult = await prisma.$queryRaw`
    SELECT v.id, v.sku, v.inventory, 
      (
        SELECT json_agg(a.*) 
        FROM "ProductAttribute" a 
        WHERE a."variationId" = v.id
      ) as attributes
    FROM "ProductVariation" v
    WHERE v."productId" = ${id}
  `

  const variations = Array.isArray(variationsResult) 
    ? convertDecimalToNumber(variationsResult) 
    : []
  
  // Calculer le stock total en incluant les variations
  const totalStock = product.inventory + 
    variations.reduce((sum: number, v: any) => sum + (Number(v.inventory) || 0), 0)
  
  return {
    ...product,
    variations,
    totalStock
  }
}

export default async function AdjustInventoryPage({ params }: AdjustInventoryPageProps) {
  const product = await getProduct(params.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajuster le stock</h1>
        <p className="text-sm text-gray-500">Modifiez la quantité en stock pour ce produit.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <InventoryForm 
          productId={product.id}
          currentStock={product.inventory}
          productName={product.name}
          variations={product.variations}
          totalStock={product.totalStock}
        />
      </div>
    </div>
  )
} 