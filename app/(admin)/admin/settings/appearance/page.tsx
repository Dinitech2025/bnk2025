'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

interface AppearanceSettings {
  logoUrl: string
  faviconUrl: string
  adminLogoUrl: string
  bannerUrl: string
  useSiteLogo: string
  footerText: string
}

export default function AppearanceSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { register, handleSubmit, setValue, watch } = useForm<AppearanceSettings>()

  // Pour accéder aux valeurs actuelles
  const useSiteLogo = watch('useSiteLogo')
  const logoUrl = watch('logoUrl')
  const faviconUrl = watch('faviconUrl')
  const adminLogoUrl = watch('adminLogoUrl')
  const bannerUrl = watch('bannerUrl')

  // Charger les paramètres existants
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/settings/general')
        if (response.ok) {
          const data = await response.json()
          
          // Remplir le formulaire avec les données existantes
          Object.entries(data).forEach(([key, value]) => {
            if (key in { logoUrl: '', faviconUrl: '', adminLogoUrl: '', bannerUrl: '', useSiteLogo: '', footerText: '' }) {
              setValue(key as keyof AppearanceSettings, value as string)
            }
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres d'apparence",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [setValue])

  // Enregistrer les paramètres
  const onSubmit = async (data: AppearanceSettings) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Les paramètres d'apparence ont été enregistrés avec succès"
        })
        
        // Forcer le rechargement pour mettre à jour le cache
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres d'apparence",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres d'apparence</h1>
        <p className="text-muted-foreground">
          Configurez l'apparence visuelle de votre site
        </p>
      </div>
      
      <Separator />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration des logos</CardTitle>
            <CardDescription>
              Gérez les logos et éléments visuels de votre site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="useSiteLogo">Utiliser le logo au lieu du texte</Label>
                <Switch
                  id="useSiteLogo"
                  checked={useSiteLogo === 'true'}
                  onCheckedChange={(checked) => {
                    setValue('useSiteLogo', checked ? 'true' : 'false')
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Activez cette option pour afficher le logo au lieu du nom du site dans l'en-tête.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo du site</Label>
                <ImageUpload
                  value={logoUrl || ''}
                  onChange={(url) => setValue('logoUrl', url)}
                  disabled={isLoading || isSaving}
                  multiple={false}
                  variant="logo"
                />
                <p className="text-sm text-muted-foreground">
                  Logo principal affiché sur le site
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminLogoUrl">Logo admin</Label>
                <ImageUpload
                  value={adminLogoUrl || ''}
                  onChange={(url) => setValue('adminLogoUrl', url)}
                  disabled={isLoading || isSaving}
                  variant="logo"
                />
                <p className="text-sm text-muted-foreground">
                  Logo affiché dans l'administration
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon</Label>
                <ImageUpload
                  value={faviconUrl || ''}
                  onChange={(url) => setValue('faviconUrl', url)}
                  disabled={isLoading || isSaving}
                  multiple={false}
                  variant="favicon"
                />
                <p className="text-sm text-muted-foreground">
                  Icône affichée dans l'onglet du navigateur
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bannerUrl">Bannière</Label>
                <ImageUpload
                  value={bannerUrl || ''}
                  onChange={(url) => setValue('bannerUrl', url)}
                  disabled={isLoading || isSaving}
                  multiple={false}
                />
                <p className="text-sm text-muted-foreground">
                  Image de bannière pour les pages
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footerText">Texte de pied de page</Label>
              <Textarea
                id="footerText"
                {...register('footerText')}
                rows={3}
                placeholder="© 2024 Mon Site. Tous droits réservés."
              />
              <p className="text-sm text-muted-foreground">
                Texte affiché dans le pied de page du site
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 