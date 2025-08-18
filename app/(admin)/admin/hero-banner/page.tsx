'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'
import { ImageUpload } from '@/components/image-upload'
import { Save, RefreshCw, Eye } from 'lucide-react'
import Image from 'next/image'

interface HeroBanner {
  id?: string
  title: string
  subtitle: string
  description: string
  backgroundImage: string
  
  // Couleurs de texte
  titleColor: string
  subtitleColor: string
  descriptionColor: string
  
  // Boutons
  primaryButtonText: string
  primaryButtonLink: string
  primaryButtonColor: string
  primaryButtonBg: string
  
  secondaryButtonText: string
  secondaryButtonLink: string
  secondaryButtonColor: string
  secondaryButtonBg: string
  secondaryButtonBorder: string
  
  // Effets
  backgroundBlur: number
  backgroundOpacity: number
}

export default function HeroBannerAdminPage() {
  const [banner, setBanner] = useState<HeroBanner>({
    title: 'Bienvenue chez',
    subtitle: "Boutik'nakà",
    description: 'Découvrez nos produits et services de qualité exceptionnelle',
    backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    
    // Couleurs de texte
    titleColor: '#ffffff',
    subtitleColor: '#fde047',
    descriptionColor: '#ffffff',
    
    // Boutons
    primaryButtonText: 'Explorer nos Produits',
    primaryButtonLink: '/products',
    primaryButtonColor: '#ffffff',
    primaryButtonBg: '#3b82f6',
    
    secondaryButtonText: 'Découvrir nos Services',
    secondaryButtonLink: '/services',
    secondaryButtonColor: '#ffffff',
    secondaryButtonBg: 'transparent',
    secondaryButtonBorder: '#ffffff',
    
    // Effets
    backgroundBlur: 0,
    backgroundOpacity: 40
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    fetchBanner()
  }, [])

  const fetchBanner = async () => {
    try {
      const response = await fetch('/api/admin/hero-banner')
      if (response.ok) {
        const data = await response.json()
        setBanner(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la bannière:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la bannière',
        variant: 'destructive'
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/hero-banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(banner)
      })

      if (response.ok) {
        const updatedBanner = await response.json()
        setBanner(updatedBanner)
        toast({
          title: 'Succès',
          description: 'Bannière mise à jour avec succès'
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la bannière',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (urls: string[]) => {
    setBanner({ ...banner, backgroundImage: urls[0] || '' })
  }

  const handleImageRemove = () => {
    setBanner({ ...banner, backgroundImage: '' })
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration de la Bannière Principale</h1>
          <p className="text-muted-foreground">
            Personnalisez le texte, les boutons et l'image de fond de votre page d'accueil
          </p>
        </div>
        <Button onClick={() => window.open('/', '_blank')} variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Aperçu
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire de configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Contenu de la Bannière</CardTitle>
            <CardDescription>
              Modifiez le texte et les liens de votre bannière principale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre Principal</Label>
              <Input
                id="title"
                value={banner.title}
                onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                placeholder="Bienvenue chez"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={banner.subtitle}
                onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
                placeholder="Boutik'nakà"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={banner.description}
                onChange={(e) => setBanner({ ...banner, description: e.target.value })}
                placeholder="Découvrez nos produits et services..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="primaryButtonText">Bouton Principal - Texte</Label>
                <Input
                  id="primaryButtonText"
                  value={banner.primaryButtonText}
                  onChange={(e) => setBanner({ ...banner, primaryButtonText: e.target.value })}
                  placeholder="Explorer nos Produits"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primaryButtonLink">Bouton Principal - Lien</Label>
                <Input
                  id="primaryButtonLink"
                  value={banner.primaryButtonLink}
                  onChange={(e) => setBanner({ ...banner, primaryButtonLink: e.target.value })}
                  placeholder="/products"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="secondaryButtonText">Bouton Secondaire - Texte</Label>
                <Input
                  id="secondaryButtonText"
                  value={banner.secondaryButtonText}
                  onChange={(e) => setBanner({ ...banner, secondaryButtonText: e.target.value })}
                  placeholder="Découvrir nos Services"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secondaryButtonLink">Bouton Secondaire - Lien</Label>
                <Input
                  id="secondaryButtonLink"
                  value={banner.secondaryButtonLink}
                  onChange={(e) => setBanner({ ...banner, secondaryButtonLink: e.target.value })}
                  placeholder="/services"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Image de Fond</Label>
              <ImageUpload
                value={banner.backgroundImage ? [banner.backgroundImage] : []}
                onChange={handleImageChange}
                onRemove={handleImageRemove}
                imageType="banner"
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder la Bannière
            </Button>
          </CardContent>
        </Card>

        {/* Options de personnalisation avancées */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation Avancée</CardTitle>
            <CardDescription>
              Configurez les couleurs, effets et apparence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Couleurs de texte */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Couleurs du Texte</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="titleColor" className="w-20">Titre</Label>
                  <Input
                    id="titleColor"
                    type="color"
                    value={banner.titleColor}
                    onChange={(e) => setBanner({ ...banner, titleColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{banner.titleColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="subtitleColor" className="w-20">Sous-titre</Label>
                  <Input
                    id="subtitleColor"
                    type="color"
                    value={banner.subtitleColor}
                    onChange={(e) => setBanner({ ...banner, subtitleColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{banner.subtitleColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="descriptionColor" className="w-20">Description</Label>
                  <Input
                    id="descriptionColor"
                    type="color"
                    value={banner.descriptionColor}
                    onChange={(e) => setBanner({ ...banner, descriptionColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-muted-foreground">{banner.descriptionColor}</span>
                </div>
              </div>
            </div>

            {/* Couleurs des boutons */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Boutons</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Label className="w-20 text-xs">Btn 1 Fond</Label>
                  <Input
                    type="color"
                    value={banner.primaryButtonBg}
                    onChange={(e) => setBanner({ ...banner, primaryButtonBg: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <Input
                    type="color"
                    value={banner.primaryButtonColor}
                    onChange={(e) => setBanner({ ...banner, primaryButtonColor: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-20 text-xs">Btn 2 Fond</Label>
                  <Input
                    type="color"
                    value={banner.secondaryButtonBg}
                    onChange={(e) => setBanner({ ...banner, secondaryButtonBg: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                  <Input
                    type="color"
                    value={banner.secondaryButtonBorder}
                    onChange={(e) => setBanner({ ...banner, secondaryButtonBorder: e.target.value })}
                    className="w-16 h-8 p-1 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Effets visuels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Effets Visuels</h4>
              <div className="space-y-3">
                <div>
                  <Label>Flou de l'image de fond: {banner.backgroundBlur}px</Label>
                  <Slider
                    value={[banner.backgroundBlur]}
                    onValueChange={(value) => setBanner({ ...banner, backgroundBlur: value[0] })}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Opacité de l'overlay: {banner.backgroundOpacity}%</Label>
                  <Slider
                    value={[banner.backgroundOpacity]}
                    onValueChange={(value) => setBanner({ ...banner, backgroundOpacity: value[0] })}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu de la bannière */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de la Bannière</CardTitle>
            <CardDescription>
              Voici comment votre bannière apparaîtra sur la page d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 rounded-lg overflow-hidden">
              {banner.backgroundImage && (
                <Image
                  src={banner.backgroundImage}
                  alt="Aperçu bannière"
                  fill
                  className={`object-cover ${banner.backgroundBlur > 0 ? `blur-[${banner.backgroundBlur}px]` : ''}`}
                />
              )}
              <div 
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${banner.backgroundOpacity / 100})`
                }}
              >
                <div className="text-center space-y-4">
                  <div>
                    <h2 
                      className="text-xl font-bold"
                      style={{ color: banner.titleColor }}
                    >
                      {banner.title}
                    </h2>
                    <h3 
                      className="text-2xl font-extrabold"
                      style={{ color: banner.subtitleColor }}
                    >
                      {banner.subtitle}
                    </h3>
                  </div>
                  <p 
                    className="text-sm opacity-90 max-w-md"
                    style={{ color: banner.descriptionColor }}
                  >
                    {banner.description}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      size="sm" 
                      className="border-0"
                      style={{
                        backgroundColor: banner.primaryButtonBg,
                        color: banner.primaryButtonColor
                      }}
                    >
                      {banner.primaryButtonText}
                    </Button>
                    <Button 
                      size="sm" 
                      className="border-2"
                      style={{
                        backgroundColor: banner.secondaryButtonBg,
                        color: banner.secondaryButtonColor,
                        borderColor: banner.secondaryButtonBorder
                      }}
                    >
                      {banner.secondaryButtonText}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
