'use client'

import { Metadata } from 'next'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
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
import ProfilesManager from '@/app/components/streaming/ProfilesManager'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  websiteUrl: string | null
}

interface Profile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
}

interface Account {
  id: string
  username: string | null
  email: string | null
  password: string
  status: string
  platformId: string
  platform: Platform
  accountProfiles: Profile[]
}

interface FormData {
  username: string | null
  email: string | null
  password: string
  status: string
  platformId: string
}

export default function EditAccountPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [account, setAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState<FormData>({
    username: null,
    email: null,
    password: '',
    status: 'AVAILABLE',
    platformId: ''
  })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAccountDetails()
    fetchPlatforms()
  }, [id])

  const fetchAccountDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/streaming/accounts/${id}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails du compte')
      
      const data = await response.json()
      setAccount(data)
      setFormData({
        username: data.username,
        email: data.email,
        password: data.password,
        status: data.status,
        platformId: data.platformId
      })
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des détails du compte')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/admin/streaming/platforms')
      if (!response.ok) throw new Error('Erreur lors du chargement des plateformes')
      const data = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des plateformes')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, platformId: value }))
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
      const response = await fetch(`/api/admin/streaming/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du compte')
      
      toast.success('Compte mis à jour avec succès')
      router.push(`/admin/streaming/accounts/${id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du compte')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchAccountDetails}
            className="mt-4"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !account) {
    return (
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
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
        <h1 className="text-2xl font-bold">Modifier le compte</h1>
      </div>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>
                Modifiez les informations du compte de streaming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username || ''}
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
                    value={formData.email || ''}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plateforme</Label>
                <Select
                  value={formData.platformId}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une plateforme" />
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
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Gestion des profils</CardTitle>
            <CardDescription>
              Gérez les profils associés à ce compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilesManager
              accountId={account.id}
              profiles={account.accountProfiles}
              maxProfiles={account.platform.maxProfilesPerAccount || 1}
              onProfilesChange={fetchAccountDetails}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 