'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Globe, Users, Calendar, Clock, Tag } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'

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

export default function PlatformDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatform = async () => {
      try {
        const response = await fetch(`/api/admin/streaming/platforms/${id}`)
        
        if (!response.ok) {
          toast.error('Impossible de récupérer les données de la plateforme')
          router.push('/admin/streaming/platforms')
          return
        }
        
        const data = await response.json()
        setPlatform(data)
      } catch (error) {
        toast.error('Erreur lors de la récupération des données')
        router.push('/admin/streaming/platforms')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchPlatform()
    }
  }, [id, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!platform) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            onClick={() => router.push('/admin/streaming/platforms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Détails de la plateforme</h1>
        </div>
        <div className="space-x-2">
          <Link href={`/admin/streaming/platforms/edit/${platform.id}`}>
            <Button>Modifier</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Détails de base de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-40 h-20 rounded-lg overflow-hidden bg-gray-100">
                {platform.logo ? (
                  <Image
                    src={platform.logo}
                    alt={platform.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {platform.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{platform.name}</h2>
                <p className="text-sm text-muted-foreground">Slug: {platform.slug}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {platform.description || 'Aucune description disponible'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Type de plateforme</p>
              <Badge variant={
                platform.type === 'VIDEO' ? 'default' :
                platform.type === 'AUDIO' ? 'secondary' :
                platform.type === 'GAMING' ? 'destructive' :
                'outline'
              }>
                {platform.type}
              </Badge>
            </div>

            {platform.websiteUrl && (
              <div className="space-y-2">
                <p className="font-medium">Site web</p>
                <a 
                  href={platform.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-500 hover:text-blue-700"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {platform.websiteUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration des profils</CardTitle>
            <CardDescription>Paramètres de gestion des profils</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Gestion des profils</p>
              <Badge variant={platform.hasProfiles ? 'default' : 'secondary'}>
                {platform.hasProfiles ? 'Activée' : 'Désactivée'}
              </Badge>
            </div>

            {platform.hasProfiles && (
              <div className="space-y-2">
                <p className="font-medium">Nombre maximum de profils</p>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{platform.maxProfilesPerAccount || 0} profils par compte</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-medium">Statut</p>
              <Badge variant={platform.isActive ? 'success' : 'secondary'}>
                {platform.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Créé le {formatDate(platform.createdAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Dernière mise à jour le {formatDate(platform.updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 