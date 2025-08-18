'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ChevronLeft, ChevronRight, Eye, ShoppingCart, Heart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  featured: boolean;
  images: ProductImage[];
  category: {
    id: string;
    name: string;
  };
}

interface ProductsSectionProps {
  products: Product[];
  favorites: string[];
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
}

export default function ProductsSection({ 
  products, 
  favorites, 
  onAddToCart, 
  onToggleFavorite 
}: ProductsSectionProps) {
  const [productSlide, setProductSlide] = useState(0)

  const nextSlide = () => {
    setProductSlide(prev => (prev + 10) % Math.max(10, products.length))
  }

  const prevSlide = () => {
    setProductSlide(prev => (prev - 10 + Math.max(10, products.length)) % Math.max(10, products.length))
  }

  if (products.length === 0) return null

  return (
    <section className="relative overflow-hidden">
      {/* Fond décoratif premium rouge */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-rose-25 to-pink-50 rounded-2xl shadow-inner"></div>
      
      {/* Couche de texture mesh */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/10 via-transparent to-pink-100/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-100/5 to-transparent"></div>
      </div>
      
      {/* Motifs géométriques décoratifs */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-red-200/40 to-pink-200/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-pink-200/50 to-rose-200/50 rounded-full blur-2xl opacity-40"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-red-100/30 rounded-full blur-xl opacity-25"></div>
      <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-pink-100/40 rounded-full blur-lg opacity-30"></div>
      <div className="absolute top-1/4 right-10 w-8 h-8 bg-red-200/25 rounded-full blur-md opacity-35 animate-pulse" style={{animationDelay: '1s'}}></div>
      
      {/* Pattern de points décoratifs */}
      <div className="absolute top-16 left-1/4 w-1 h-1 bg-red-300/40 rounded-full"></div>
      <div className="absolute top-20 left-1/4 w-1 h-1 bg-pink-300/30 rounded-full"></div>
      <div className="absolute top-24 left-1/4 w-1 h-1 bg-rose-300/35 rounded-full"></div>
      <div className="absolute bottom-16 right-1/3 w-1 h-1 bg-red-300/40 rounded-full"></div>
      <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-pink-300/30 rounded-full"></div>
      
      {/* Lignes décoratives multiples */}
      <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-red-200/20 to-transparent"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-pink-200/15 to-transparent"></div>
      <div className="absolute top-0 left-2/3 w-px h-1/2 bg-gradient-to-b from-red-200/10 to-transparent"></div>
      
      {/* Formes géométriques enrichies */}
      <div className="absolute top-8 right-8 w-6 h-6 border border-red-200/30 rotate-45 opacity-40"></div>
      <div className="absolute bottom-12 left-12 w-4 h-4 bg-pink-200/25 rotate-12 opacity-50"></div>
      <div className="absolute top-1/3 left-16 w-3 h-12 bg-red-100/15 rotate-12 opacity-25 rounded-full"></div>
      <div className="absolute bottom-1/3 right-20 w-8 h-2 bg-pink-200/20 rotate-45 opacity-30 rounded-full"></div>
      
      {/* Effets de lumière */}
      <div className="absolute top-1/4 left-1/2 w-20 h-20 bg-gradient-radial from-red-200/20 to-transparent rounded-full blur-2xl opacity-40"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-gradient-radial from-pink-200/15 to-transparent rounded-full blur-xl opacity-30"></div>
      
      <div className="relative flex items-center justify-between mb-6 pt-6 px-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <Star className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Produits Populaires
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-red-200 hover:border-red-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4 text-red-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-red-200 hover:border-red-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4 text-red-600" />
          </Button>
          <Button variant="destructive" size="sm" className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full text-sm" asChild>
            <Link href="/products">
              Voir tout
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="relative px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {products.slice(productSlide, productSlide + 10).map((product) => (
          <Card key={product.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
            <CardHeader className="p-0 relative">
              <Link href={`/products/${product.id}`}>
                <div className="relative w-full aspect-square overflow-hidden">
                  <Image
                    src={product.images?.[0]?.url || '/placeholder-image.svg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Boutons overlay - Plus compacts */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
                        asChild
                      >
                        <Link href={`/products/${product.id}`}>
                          <Eye className="h-3 w-3 text-gray-700" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          onAddToCart(product)
                        }}
                        disabled={product.inventory <= 0}
                        className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.preventDefault()
                          onToggleFavorite(product.id)
                        }}
                        className={`h-8 w-8 p-0 shadow-lg border-0 rounded-full transition-all ${
                          favorites.includes(product.id) 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white/95 hover:bg-white text-gray-700'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </CardHeader>
            <CardContent className="p-2 flex flex-col flex-grow">
              {/* Badge de catégorie */}
              <div className="mb-1">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200 font-medium">
                  {product.category.name}
                </Badge>
              </div>
              
              {/* Indicateur de stock */}
              <div className="mb-1">
                {product.inventory > 0 ? (
                  <div className="flex items-center text-green-600 text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                    En stock
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                    Sur commande
                  </div>
                )}
              </div>
              
              {/* Nom du produit */}
              <Link href={`/products/${product.id}`}>
                <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight text-gray-900">
                  {product.name}
                </h3>
              </Link>
              
              {/* Prix */}
              <div className="mt-auto">
                <span className="text-sm font-semibold text-blue-600">
                  <PriceWithConversion price={Number(product.price)} />
                </span>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
