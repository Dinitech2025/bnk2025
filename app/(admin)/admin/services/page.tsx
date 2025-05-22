import { prisma } from '@/lib/prisma'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { PriceWithConversion } from '@/components/ui/currency-selector'

export const dynamic = 'force-dynamic'

async function getServices() {
  return await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      duration: true,
      published: true,
      images: {
        take: 1,
        select: {
          path: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

// Récupérer les paramètres de devise depuis la base de données
async function getCurrencySettings() {
  const currencySettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['currency', 'currencySymbol']
      }
    }
  })
  
  const settings: Record<string, string> = {}
  currencySettings.forEach(setting => {
    settings[setting.key] = setting.value || ''
  })
  
  return {
    currency: settings.currency || 'EUR',
    currencySymbol: settings.currencySymbol || '€'
  }
}

export default async function ServicesPage() {
  const services = await getServices()
  const { currency, currencySymbol } = await getCurrencySettings()
  
  // Fonction pour formater les prix avec la devise de l'application
  const formatServicePrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} ${currencySymbol}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un service..."
              className="pl-10 pr-4 py-2 w-64"
            />
          </div>
          <Link href="/admin/services/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau service
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Prix</th>
                <th className="px-6 py-3">Durée</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {service.images[0]?.path ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <Image 
                            src={service.images[0].path} 
                            alt={service.name}
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
                        <div className="font-medium text-gray-900">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-gray-500">{service.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {service.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    <PriceWithConversion price={Number(service.price)} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {service.duration} minutes
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-3">
                      <Link 
                        href={`/admin/services/${service.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Modifier
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link 
                        href={`/admin/services/${service.id}/delete`}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun service trouvé
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