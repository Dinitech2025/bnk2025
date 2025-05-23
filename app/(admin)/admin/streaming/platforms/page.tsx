'use client'

import { 
  PlusCircle, 
  Search, 
  Globe, 
  Users, 
  Calendar, 
  Eye, 
  Pencil, 
  Trash,
  Check,
  X as XIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Platform {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await fetch('/api/admin/streaming/platforms', {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push('/login')
            return
          }
          throw new Error('Erreur lors de la récupération des plateformes')
        }
        
        const data = await response.json()
        setPlatforms(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [router])

  const handleDelete = async (platformId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette plateforme ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/streaming/platforms/${platformId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'FOREIGN_KEY_CONSTRAINT') {
          toast.error('Impossible de supprimer cette plateforme car elle est utilisée par des comptes ou des cartes cadeaux')
          return
        }
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      setPlatforms(prev => prev.filter(p => p.id !== platformId))
      toast.success('Plateforme supprimée avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression de la plateforme')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plateformes de streaming</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une plateforme..."
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link href="/admin/streaming/platforms/add">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle plateforme
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Plateforme</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Profils</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date de création</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platforms.map((platform: Platform) => (
                <tr key={platform.id} className="hover:bg-gray-50">
                  {/* Plateforme info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {platform.logo ? (
                          <img 
                            src={platform.logo} 
                            alt={platform.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Globe className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{platform.name}</div>
                        <div className="text-sm text-gray-500">{platform.slug}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Type */}
                  <td className="px-6 py-4">
                    <Badge variant={
                      platform.type === 'VIDEO' ? 'default' :
                      platform.type === 'AUDIO' ? 'secondary' :
                      platform.type === 'GAMING' ? 'destructive' :
                      'outline'
                    }>
                      {platform.type}
                    </Badge>
                  </td>
                  
                  {/* Profils */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {platform.hasProfiles ? (
                          platform.maxProfilesPerAccount ? 
                            `${platform.maxProfilesPerAccount} max` : 
                            'Illimité'
                        ) : (
                          'Non supporté'
                        )}
                      </span>
                    </div>
                  </td>
                  
                  {/* Statut */}
                  <td className="px-6 py-4">
                    <Badge variant={platform.isActive ? 'success' : 'secondary'}>
                      {platform.isActive ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 mr-1" />
                      )}
                      {platform.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{formatDate(platform.createdAt)}</span>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-3">
                      <Link 
                        href={`/admin/streaming/platforms/${platform.id}`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 text-primary hover:text-primary-dark transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/admin/streaming/platforms/edit/${platform.id}`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(platform.id)}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {platforms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune plateforme trouvée
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
