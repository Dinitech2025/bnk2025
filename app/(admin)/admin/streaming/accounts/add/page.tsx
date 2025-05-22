'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  websiteUrl: string | null
  hasProfiles: boolean
}

interface FormData {
  username: string
  email: string
  password: string
  isActive: boolean
  platformId: string
}

export default function AddAccountPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    isActive: true,
    platformId: ''
  })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)

  useEffect(() => {
    fetchPlatforms()
  }, [])

  const fetchPlatforms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/streaming/platforms')
      if (!response.ok) throw new Error('Erreur lors du chargement des plateformes')
      const data = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des plateformes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, platformId: value }))
    
    // Mettre à jour la plateforme sélectionnée
    const platform = platforms.find(p => p.id === value) || null
    setSelectedPlatform(platform)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Valider les données du formulaire
    if (!formData.username || !formData.password || !formData.platformId) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/streaming/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) throw new Error('Erreur lors de la création du compte')
      
      const data = await response.json()
      toast.success('Compte créé avec succès')
      router.push(`/admin/streaming/accounts/${data.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création du compte')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            onClick={fetchPlatforms}
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm"
          className="mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Ajouter un nouveau compte</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Nouveau compte de streaming</CardTitle>
            <CardDescription>
              Créez un nouveau compte de streaming avec les profils associés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platformId">Plateforme</Label>
              <Select 
                value={formData.platformId} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger id="platformId">
                  <SelectValue placeholder="Sélectionner une plateforme" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlatform && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mr-4">
                    {selectedPlatform.logo ? (
                      <Image
                        src={selectedPlatform.logo}
                        alt={selectedPlatform.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">
                        {selectedPlatform.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{selectedPlatform.name}</div>
                    <Badge variant="outline">{selectedPlatform.type}</Badge>
                  </div>
                </div>
                
                {selectedPlatform.hasProfiles && (
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {selectedPlatform.maxProfilesPerAccount || 1} profil{selectedPlatform.maxProfilesPerAccount !== 1 && 's'} sera{selectedPlatform.maxProfilesPerAccount !== 1 && 'ont'} automatiquement créé{selectedPlatform.maxProfilesPerAccount !== 1 && 's'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Separator />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Générer un mot de passe aléatoire
                  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
                  let result = '';
                  const length = 12;
                  for (let i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * characters.length));
                  }
                  setFormData(prev => ({ ...prev, password: result }));
                }}
                className="mt-2"
                size="sm"
              >
                Générer un mot de passe
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isActive">Compte actif</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !formData.platformId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer le compte
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
} 