'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Globe, Users, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlatformLogoUpload } from '@/components/ui/platform-logo-upload'

// Types de plateformes disponibles
const platformTypes = [
  { value: 'VIDEO', label: 'Vidéo' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'VPN', label: 'VPN' },
  { value: 'CLOUD', label: 'Cloud' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'OTHER', label: 'Autre' },
]

interface Platform {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  logoMediaId: string | null
  websiteUrl: string | null
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  isActive: boolean
}

export default function EditPlatformPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [platformData, setPlatformData] = useState<Platform>({
    id: '',
    name: '',
    slug: '',
    description: '',
    logo: '',
    logoMediaId: '',
    websiteUrl: '',
    type: 'VIDEO',
    hasProfiles: true,
    maxProfilesPerAccount: 5,
    isActive: true,
  })

  // Vérifier si le type de plateforme nécessite des profils
  const requiresProfiles = ['VIDEO', 'AUDIO', 'GAMING'].includes(platformData.type)

  // Récupérer les données de la plateforme
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
        
        setPlatformData({
          ...data,
          description: data.description || '',
          websiteUrl: data.websiteUrl || '',
          type: data.type || 'VIDEO',
        })
      } catch (error) {
        toast.error('Erreur lors de la récupération des données')
        router.push('/admin/streaming/platforms')
      } finally {
        setIsFetching(false)
      }
    }

    if (id) {
      fetchPlatform()
    }
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPlatformData(prev => ({ ...prev, [name]: value }))
    
    // Générer automatiquement le slug si le nom change
    if (name === 'name') {
      setPlatformData(prev => ({ ...prev, slug: slugify(value) }))
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPlatformData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const handleSwitchChange = (name: string, value: boolean) => {
    setPlatformData(prev => {
      if (name === 'hasProfiles') {
        return {
          ...prev,
          [name]: value,
          maxProfilesPerAccount: value ? 5 : null
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setPlatformData(prev => {
      if (name === 'type') {
        const defaultHasProfiles = ['VIDEO', 'AUDIO', 'GAMING'].includes(value)
        return {
          ...prev,
          [name]: value,
          hasProfiles: defaultHasProfiles,
          maxProfilesPerAccount: defaultHasProfiles ? 5 : null
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Erreur lors du téléchargement')
      
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    try {
      // Validation basique
      if (!platformData.name) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        setIsLoading(false)
        return
      }
      
      // S'assurer que le slug est correctement généré
      const dataToSubmit = {
        ...platformData,
        slug: slugify(platformData.name)
      }
      
      const response = await fetch(`/api/admin/streaming/platforms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la mise à jour de la plateforme')
      }
      
      toast.success('Plateforme mise à jour avec succès')
      router.push('/admin/streaming/platforms')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour de la plateforme')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/admin/streaming/platforms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Modifier la plateforme</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations de la plateforme</CardTitle>
            <CardDescription>
              Modifiez les informations de cette plateforme de streaming.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={platformData.name}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Slug: {platformData.slug || '(généré automatiquement)'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={platformData.description || ''}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de plateforme</Label>
                <div className="flex">
                  <Tag className="mr-2 h-4 w-4 mt-3 text-gray-400" />
                  <Select 
                    value={platformData.type} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Site web</Label>
                <div className="flex">
                  <Globe className="mr-2 h-4 w-4 mt-3 text-gray-400" />
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    placeholder="https://exemple.com"
                    value={platformData.websiteUrl || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gestion des profils</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer la gestion des profils pour cette plateforme
                  </p>
                </div>
                <Switch
                  checked={platformData.hasProfiles}
                  onCheckedChange={(checked) => handleSwitchChange('hasProfiles', checked)}
                />
              </div>

              {platformData.hasProfiles && (
                <div className="space-y-2">
                  <Label htmlFor="maxProfilesPerAccount">Nombre maximum de profils par compte</Label>
                  <Input
                    id="maxProfilesPerAccount"
                    name="maxProfilesPerAccount"
                    type="number"
                    min="1"
                    max="10"
                    value={platformData.maxProfilesPerAccount || ''}
                    onChange={handleNumberChange}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Limitez le nombre de profils que les utilisateurs peuvent créer (1-10)
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="isActive">Statut</Label>
              <div className="flex items-center space-x-2 mt-3">
                <Switch
                  id="isActive"
                  checked={platformData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {platformData.isActive ? 'Actif' : 'Inactif'}
                </Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <ImageUpload
                value={platformData.logo || ''}
                onChange={(url) => setPlatformData(prev => ({ ...prev, logo: url }))}
                onUpload={handleImageUpload}
                variant="logo"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/admin/streaming/platforms">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour la plateforme
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 