'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Plus, Minus, ShoppingCart, ArrowLeft, Play, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface ProductMedia {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  thumbnail?: string; // Pour les vidéos
}

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: ProductMedia[]; // Maintenant ça peut être des images ou vidéos
  category: ProductCategory;
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/public/products?id=${productId}`)
        if (!res.ok) throw new Error('Produit non trouvé')
        
        const products = await res.json()
        const foundProduct = products.find((p: Product) => p.id === productId)
        
        if (!foundProduct) throw new Error('Produit non trouvé')
        
        // Transformer les images en format média si nécessaire
        if (foundProduct.images && foundProduct.images.length > 0) {
          foundProduct.images = foundProduct.images.map((img: any) => ({
            url: img.url || img,
            type: img.type || 'image',
            alt: img.alt,
            thumbnail: img.thumbnail
          }))
        }
        
        setProduct(foundProduct)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger le produit.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const addToCart = () => {
    if (!product) return

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      // Utiliser la première image pour le panier
      const firstImage = product.images?.find(media => media.type === 'image')
      cart.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: quantity, 
        image: firstImage?.url || product.images?.[0]?.url,
        currency: 'Ar',
        type: 'product'
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    toast({
      title: "Produit ajouté!",
      description: `${quantity} x ${product.name} ajouté(s) à votre panier.`,
    })
  }

  const renderMainMedia = () => {
    const currentMedia = product?.images?.[selectedMediaIndex]
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
        alt={currentMedia.alt || product.name}
        fill
        className="object-cover"
        priority
      />
    )
  }

  const renderMediaThumbnail = (media: ProductMedia, index: number) => {
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
              alt={media.alt || `${product?.name} vidéo ${index + 1}`}
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
              alt={media.alt || `${product?.name} ${index + 1}`}
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <p className="text-gray-600 mb-8">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link href="/products">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb 
        items={[
          { label: product?.category?.name || 'Catégorie', href: `/categories/${product?.category?.id}` },
          { label: product?.name || 'Produit', current: true }
        ]} 
        className="mb-8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galerie médias (images + vidéos) */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-gray-100">
            {renderMainMedia()}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((media, index) => renderMediaThumbnail(media, index))}
            </div>
          )}

          {/* Indicateur du type de média actuel */}
          {product.images && product.images.length > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>{selectedMediaIndex + 1} / {product.images.length}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                {product.images[selectedMediaIndex]?.type === 'video' ? (
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

        {/* Informations produit */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category.name}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="text-3xl font-bold text-primary mb-4">
              <PriceWithConversion price={Number(product.price)} />
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
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
                    disabled={product.stock > 0 && quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {product.stock > 0 ? (
                <p className="text-sm text-green-600 font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Disponible en stock
                </p>
              ) : (
                <p className="text-sm text-orange-600 font-medium flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Disponible en commande
                </p>
              )}

              <Button 
                onClick={addToCart} 
                className="w-full h-12 text-lg"
                disabled={product.stock <= 0}
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