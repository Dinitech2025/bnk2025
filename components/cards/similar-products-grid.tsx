'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Eye, Heart } from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { toast } from '@/components/ui/use-toast'

interface ProductImage {
  url: string
  type: 'image' | 'video'
  alt?: string
}

interface ProductCategory {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  images: ProductImage[]
  category: ProductCategory
}

interface SimilarProductsGridProps {
  categoryId: string
  currentProductId: string
  title?: string
  maxItems?: number
}

export function SimilarProductsGrid({
  categoryId,
  currentProductId,
  title = "Produits similaires",
  maxItems = 4
}: SimilarProductsGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        const res = await fetch(`/api/public/products?category=${categoryId}`)
        if (!res.ok) throw new Error('Erreur lors du chargement')
        
        const allProducts = await res.json()
        
        // Filtrer pour exclure le produit actuel et limiter le nombre
        const similarProducts = allProducts
          .filter((product: Product) => product.id !== currentProductId)
          .slice(0, maxItems)
        
        setProducts(similarProducts)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (categoryId && currentProductId) {
      fetchSimilarProducts()
    }
  }, [categoryId, currentProductId, maxItems])

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      const firstImage = product.images?.find(img => img.type === 'image')
      cart.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        image: firstImage?.url || product.images?.[0]?.url,
        currency: 'Ar',
        type: 'product'
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    toast({
      title: "Produit ajouté!",
      description: `${product.name} ajouté à votre panier.`,
    })
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId]
    
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    
    toast({
      title: favorites.includes(productId) ? "Retiré des favoris" : "Ajouté aux favoris",
      description: "Vos favoris ont été mis à jour.",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: maxItems }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse border-0 shadow-md bg-white">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const firstImage = product.images?.find(img => img.type === 'image')
          
          return (
            <Card key={product.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
              <CardHeader className="p-0 relative">
                <Link href={`/products/${product.id}`}>
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={firstImage?.url || '/placeholder-image.svg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Boutons overlay modernes */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-xl backdrop-blur-sm border-0 rounded-full"
                          asChild
                        >
                          <Link href={`/products/${product.id}`}>
                            <Eye className="h-4 w-4 text-gray-700" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.preventDefault()
                            addToCart(product)
                          }}
                          disabled={product.stock <= 0}
                          className="h-10 w-10 p-0 shadow-xl border-0 rounded-full"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleFavorite(product.id)
                          }}
                          className={`h-10 w-10 p-0 shadow-xl border-0 rounded-full ${
                            favorites.includes(product.id) 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-white/95 hover:bg-white text-gray-700'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {product.category.name}
                  </Badge>
                  <div className="flex items-center text-xs">
                    {product.stock > 0 ? (
                      <div className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        En stock
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                        Sur commande
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="text-xl font-bold text-primary">
                  <PriceWithConversion price={Number(product.price)} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 