'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Plus, Minus, ShoppingCart, ArrowLeft, Clock, Play, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface ServiceMedia {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  thumbnail?: string; // Pour les vidéos
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  images: ServiceMedia[]; // Maintenant ça peut être des images ou vidéos
  category: ServiceCategory;
}

export default function ServiceDetailPage() {
  const params = useParams()
  const serviceId = params.id as string
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/public/services?id=${serviceId}`)
        if (!res.ok) throw new Error('Service non trouvé')
        
        const services = await res.json()
        const foundService = services.find((s: Service) => s.id === serviceId)
        
        if (!foundService) throw new Error('Service non trouvé')
        
        // Transformer les images en format média si nécessaire
        if (foundService.images && foundService.images.length > 0) {
          foundService.images = foundService.images.map((img: any) => ({
            url: img.url || img,
            type: img.type || 'image',
            alt: img.alt,
            thumbnail: img.thumbnail
          }))
        }
        
        setService(foundService)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger le service.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const addToCart = () => {
    if (!service) return

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === service.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      // Utiliser la première image pour le panier
      const firstImage = service.images?.find(media => media.type === 'image')
      cart.push({ 
        id: service.id, 
        name: service.name, 
        price: service.price, 
        quantity: quantity, 
        image: firstImage?.url || service.images?.[0]?.url,
        currency: 'Ar',
        type: 'service'
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    toast({
      title: "Service ajouté!",
      description: `${quantity} x ${service.name} ajouté(s) à votre panier.`,
    })
  }

  const renderMainMedia = () => {
    const currentMedia = service?.images?.[selectedMediaIndex]
    if (!currentMedia) return null

    if (currentMedia.type === 'video') {
      return (
        <video
          controls
          className="w-full h-full object-cover rounded-lg"
          poster={currentMedia.thumbnail}
        >
          <source src={currentMedia.url} type="video/mp4" />
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      )
    }

    return (
      <Image
        src={currentMedia.url || '/placeholder-image.svg'}
        alt={currentMedia.alt || service.name}
        fill
        className="object-cover"
        priority
      />
    )
  }

  const renderMediaThumbnail = (media: ServiceMedia, index: number) => {
    const isSelected = selectedMediaIndex === index
    const isVideo = media.type === 'video'

    return (
      <button
        key={index}
        onClick={() => setSelectedMediaIndex(index)}
        className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
          isSelected ? 'border-primary' : 'border-gray-200'
        } hover:border-primary/50 transition-colors`}
      >
        {isVideo ? (
          <>
            <Image
              src={media.thumbnail || '/placeholder-image.svg'}
              alt={media.alt || `${service?.name} vidéo ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <>
            <Image
              src={media.url}
              alt={media.alt || `${service?.name} ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute top-1 right-1">
              <ImageIcon className="h-3 w-3 text-white drop-shadow-md" />
            </div>
          </>
        )}
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Service non trouvé</h1>
        <p className="text-gray-600 mb-8">Le service que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link href="/services">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: service?.category?.name || 'Catégorie', href: `/categories/${service?.category?.id}` },
          { label: service?.name || 'Service', current: true }
        ]} 
        className="mb-8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galerie médias (images + vidéos) */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-gray-100">
            {renderMainMedia()}
          </div>
          
          {service.images && service.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {service.images.map((media, index) => renderMediaThumbnail(media, index))}
            </div>
          )}

          {/* Indicateur du type de média actuel */}
          {service.images && service.images.length > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>{selectedMediaIndex + 1} / {service.images.length}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                {service.images[selectedMediaIndex]?.type === 'video' ? (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Vidéo</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    <span>Image</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Informations service */}
        <div className="space-y-6">
          <div>
            {service.category && (
              <Badge variant="secondary" className="mb-2">
                {service.category.name}
              </Badge>
            )}
            <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
            <div className="text-3xl font-bold text-primary mb-4">
              <PriceWithConversion price={Number(service.price)} />
            </div>
            <div className="flex items-center text-lg text-gray-600 mb-4">
              <Clock className="h-5 w-5 mr-2" />
              <span>{service.duration} minutes</span>
            </div>
          </div>

          {service.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{service.description}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Quantité:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={addToCart} 
                className="w-full h-12 text-lg"
                variant="danger"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ajouter au panier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 