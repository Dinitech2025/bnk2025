import { Plus, Search, Edit, Trash, Eye, ChevronDown, ChevronRight, Package, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice, convertDecimalToNumber } from '@/lib/utils'
import Image from 'next/image'
import { Fragment } from 'react'
import { PriceWithConversion } from '@/components/ui/currency-selector'

export const dynamic = 'force-dynamic'

async function getProducts() {
  // Récupérer les produits avec leur données basiques et dates
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      inventory: true,
      price: true,
      published: true,
      featured: true, 
      createdAt: true,
      updatedAt: true,
      category: true,
      images: true,
      barcode: true,
      compareAtPrice: true,
      dimensions: true,
      weight: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Pour chaque produit, récupérer les variations avec une requête SQL directe
  const productsWithVariations = await Promise.all(
    products.map(async (product) => {
      const variationsResult = await prisma.$queryRaw`
        SELECT v.*, 
          (
            SELECT json_agg(a.*) 
            FROM "ProductAttribute" a 
            WHERE a."variationId" = v.id
          ) as attributes
        FROM "ProductVariation" v
        WHERE v."productId" = ${product.id}
      `

      const variations = Array.isArray(variationsResult) ? variationsResult : []

      // Récupérer les attributs directement liés au produit 
      const productAttributesResult = await prisma.$queryRaw`
        SELECT * FROM "ProductAttribute"
        WHERE "productId" = ${product.id}
      `
      
      const productAttributes = Array.isArray(productAttributesResult) 
        ? productAttributesResult 
        : []
      
      const discountPercentage = product.compareAtPrice && product.price ?
        Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100) : 0

      return {
        ...product,
        variations: convertDecimalToNumber(variations),
        attributes: productAttributes,
        totalInventory: product.inventory + (
          Array.isArray(variations) 
            ? variations.reduce((sum, v) => sum + (Number(v.inventory) || 0), 0)
            : 0
        ),
        hasDiscount: product.compareAtPrice ? 
          product.compareAtPrice > product.price : false,
        discountPercentage: discountPercentage
      }
    })
  )

  return productsWithVariations
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Produits</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link href="/admin/products/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Produit</th>
                <th className="px-6 py-3">Informations</th>
                <th className="px-6 py-3">Prix</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Variations</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.images && product.images[0] ? (
                        <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <Image 
                            src={product.images[0].path} 
                            alt={product.name}
                            width={56}
                            height={56}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{product.sku || 'Sans référence'}</span>
                          {product.barcode && (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {product.barcode}
                            </span>
                          )}
                        </div>
                        {product.featured && (
                          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <Tag className="h-3 w-3 mr-1" />
                            Mis en avant
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Catégorie:</span>{' '}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category?.name || 'Sans catégorie'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Date:</span>{' '}
                        <span className="text-gray-500 flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(product.createdAt)}
                        </span>
                      </div>
                      {(product.dimensions || product.weight) && (
                        <div className="text-xs text-gray-500">
                          {product.dimensions && <span className="mr-2">{String(product.dimensions)}</span>}
                          {product.weight && <span>{Number(product.weight)} kg</span>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        <PriceWithConversion price={Number(product.price)} />
                      </div>
                      {product.compareAtPrice && Number(product.compareAtPrice) > 0 && (
                        <div className="text-sm text-gray-500 line-through">
                          <PriceWithConversion price={Number(product.compareAtPrice)} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.totalInventory > 10 
                          ? 'bg-green-100 text-green-800'
                          : product.totalInventory > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.totalInventory} en stock
                      </span>
                      {product.inventory > 0 && (
                        <div className="text-xs text-gray-500">
                          {product.inventory} unités (produit de base)
                        </div>
                      )}
                      {product.variations.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {product.variations.reduce((sum: number, v: any) => sum + Number(v.inventory || 0), 0)} unités (variations)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.variations.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {product.variations.length} variation(s)
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {product.variations.slice(0, 2).map((variation: any, index: number) => (
                            <span key={index} className="mr-1">
                              {variation.attributes && variation.attributes.length > 0 
                                ? variation.attributes.map((attr: any) => 
                                    `${attr.name}: ${attr.value}`
                                  ).join(', ')
                                : `Variation ${index + 1}`
                              }
                              {index < Math.min(product.variations.length, 2) - 1 && ", "}
                            </span>
                          ))}
                          {product.variations.length > 2 && "..."}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Aucune variation</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.published ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-3">
                      <Link 
                        href={`/admin/products/${product.id}`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 