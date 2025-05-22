import { Plus, Search, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

async function getCategories() {
  return await prisma.category.findMany({
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
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Catégories</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link href="/admin/products/categories/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Catégorie parente</th>
                <th className="px-6 py-3">Nombre de produits</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {category.image ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <Image 
                            src={category.image} 
                            alt={category.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">No img</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500">{category.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {category.parent?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {category._count.products} produits
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-3">
                      <Link 
                        href={`/admin/products/categories/${category.id}/edit`}
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

              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucune catégorie trouvée
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