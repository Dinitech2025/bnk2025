'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Eye, 
  ShoppingCart, 
  Heart, 
  ArrowRight, 
  Star, 
  TrendingUp,
  Package,
  Wrench,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { PriceWithConversion } from '@/components/ui/price-with-conversion'

interface ProductImage {
  url: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: ProductImage[];
  category: Category;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  images: ProductImage[];
  category: Category;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  isPopular?: boolean;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carrousel states
  const [currentSlide, setCurrentSlide] = useState(0)
  const [productSlide, setProductSlide] = useState(0)
  const [serviceSlide, setServiceSlide] = useState(0)
  const [offerSlide, setOfferSlide] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, servicesRes, offersRes, categoriesRes] = await Promise.all([
          fetch('/api/public/products'),
          fetch('/api/public/services'),
          fetch('/api/public/offers'),
          fetch('/api/public/categories')
        ])

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData.slice(0, 12)) // Limiter à 12 produits
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.slice(0, 8)) // Limiter à 8 services
        }

        if (offersRes.ok) {
          const offersData = await offersRes.json()
          setOffers(offersData.slice(0, 8)) // Limiter à 8 offres
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          const allCategories = [...(categoriesData.products || []), ...(categoriesData.services || [])]
          setCategories(allCategories.slice(0, 6)) // Limiter à 6 catégories
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const addToCart = (item: Product | Service | Offer) => {
    // Logique d'ajout au panier ici
    console.log('Ajouté au panier:', item.name)
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Carrousel auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(1, categories.length))
    }, 5000)
    return () => clearInterval(interval)
  }, [categories.length])

  const nextSlide = (type: 'main' | 'product' | 'service' | 'offer') => {
    switch (type) {
      case 'main':
        setCurrentSlide(prev => (prev + 1) % Math.max(1, categories.length))
        break
      case 'product':
        setProductSlide(prev => (prev + 4) % Math.max(4, products.length))
        break
      case 'service':
        setServiceSlide(prev => (prev + 4) % Math.max(4, services.length))
        break
      case 'offer':
        setOfferSlide(prev => (prev + 4) % Math.max(4, offers.length))
        break
    }
  }

  const prevSlide = (type: 'main' | 'product' | 'service' | 'offer') => {
    switch (type) {
      case 'main':
        setCurrentSlide(prev => (prev - 1 + Math.max(1, categories.length)) % Math.max(1, categories.length))
        break
      case 'product':
        setProductSlide(prev => (prev - 4 + Math.max(4, products.length)) % Math.max(4, products.length))
        break
      case 'service':
        setServiceSlide(prev => (prev - 4 + Math.max(4, services.length)) % Math.max(4, services.length))
        break
      case 'offer':
        setOfferSlide(prev => (prev - 4 + Math.max(4, offers.length)) % Math.max(4, offers.length))
        break
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Hero Skeleton */}
        <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
        
        {/* Content Skeleton */}
        <div className="container mx-auto px-4 py-8 space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Card key={j} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Carrousel - Plus grand et plus impressionnant */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80">
          <div className="container mx-auto px-4 h-full flex items-center justify-between">
            <div className="text-white max-w-3xl z-10">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Bienvenue chez 
                <span className="block text-yellow-300">Boutik'nakà</span>
                </h1>
              <p className="text-xl md:text-3xl mb-8 opacity-95 leading-relaxed">
                Découvrez nos produits et services de qualité exceptionnelle
                </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all" asChild>
                <Link href="/products">
                    <Package className="mr-3 h-6 w-6" />
                    Explorer nos Produits
                </Link>
                </Button>
                <Button size="lg" variant="danger" className="text-lg px-8 py-4 h-auto text-white border-white hover:bg-white hover:text-primary shadow-lg hover:shadow-xl transition-all" asChild>
                <Link href="/services">
                    <Wrench className="mr-3 h-6 w-6" />
                    Découvrir nos Services
                </Link>
                </Button>
              </div>
            </div>
            
            {/* Carrousel des catégories - Plus grand */}
            {categories.length > 0 && (
              <div className="hidden lg:block relative z-10">
                <div className="w-[500px] h-[400px] relative overflow-hidden rounded-2xl shadow-2xl border-4 border-white/20">
                  {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === currentSlide ? 'translate-x-0 opacity-100' : 
                        index < currentSlide ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
                      }`}
                    >
                      <Image
                        src={category.image || '/placeholder-image.svg'}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                        <div className="p-8 text-white w-full">
                          <h3 className="text-2xl font-bold mb-3">{category.name}</h3>
                          {category.description && (
                            <p className="text-lg opacity-90 leading-relaxed">{category.description}</p>
                          )}
                          <Button variant="secondary" className="mt-4" asChild>
                            <Link href={`/categories/${category.id}`}>
                              Découvrir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation du carrousel - Plus stylée */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-6">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-full w-12 h-12 p-0 shadow-xl bg-white/90 hover:bg-white text-primary"
                    onClick={() => prevSlide('main')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-6">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-full w-12 h-12 p-0 shadow-xl bg-white/90 hover:bg-white text-primary"
                    onClick={() => nextSlide('main')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                
                {/* Indicateurs - Plus élégants */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex space-x-3">
                  {categories.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Formes décoratives */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-300/30 rounded-full blur-md"></div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-16 space-y-20">
        {/* Produits Populaires - Design amélioré */}
        {products.length > 0 && (
          <section className="relative">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Produits Populaires
                </h2>
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Tendance
                </Badge>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Découvrez notre sélection de produits les plus appréciés par nos clients
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div></div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => prevSlide('product')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => nextSlide('product')}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button variant="danger" size="lg" className="px-6 shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link href="/products">
                    Voir tout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(productSlide, productSlide + 4).map((product) => (
                <Card key={product.id} className="group overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-white">
                  <CardHeader className="p-0 relative">
                    <Link href={`/products/${product.id}`}>
                      <div className="relative w-full aspect-square overflow-hidden">
                        <Image
                          src={product.images?.[0]?.url || '/placeholder-image.svg'}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Badge populaire - Plus stylé */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Populaire
                          </Badge>
                        </div>
                        
                        {/* Boutons overlay - Plus élégants */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <div className="flex space-x-3">
                            <Button
                              size="lg"
                              variant="secondary"
                              className="h-12 w-12 p-0 bg-white/95 hover:bg-white shadow-2xl backdrop-blur-sm border-0 rounded-full"
                              asChild
                            >
                              <Link href={`/products/${product.id}`}>
                                <Eye className="h-5 w-5 text-gray-700" />
                              </Link>
                            </Button>
                            <Button
                              size="lg"
                              variant="danger"
                              onClick={(e) => {
                                e.preventDefault()
                                addToCart(product)
                              }}
                              disabled={product.stock <= 0}
                              className="h-12 w-12 p-0 shadow-2xl border-0 rounded-full"
                            >
                              <ShoppingCart className="h-5 w-5" />
                            </Button>
                            <Button
                              size="lg"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                toggleFavorite(product.id)
                              }}
                              className={`h-12 w-12 p-0 shadow-2xl border-0 rounded-full transition-all ${
                                favorites.includes(product.id) 
                                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white' 
                                  : 'bg-white/95 hover:bg-white text-gray-700'
                              }`}
                            >
                              <Heart className={`h-5 w-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-bold text-xl mb-3 line-clamp-2 hover:text-primary transition-colors leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
                        <PriceWithConversion price={Number(product.price)} />
                      </span>
                    </div>
                    {product.stock > 0 ? (
                      <div className="flex items-center text-green-600 font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Disponible en stock
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-600 font-medium">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Disponible en commande
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>
        )}

        {/* Services Populaires - Design amélioré */}
        {services.length > 0 && (
          <section className="relative">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Services Populaires
                </h2>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm px-3 py-1">
                  <Wrench className="h-3 w-3 mr-1" />
                  Services
                </Badge>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Profitez de nos services professionnels de haute qualité
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div></div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => prevSlide('service')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => nextSlide('service')}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button variant="danger" size="lg" className="px-6 shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link href="/services">
                    Voir tout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {services.slice(serviceSlide, serviceSlide + 4).map((service) => (
                <Card key={service.id} className="group overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-white">
                  <CardHeader className="p-0 relative">
                    <Link href={`/services/${service.id}`}>
                      <div className="relative w-full aspect-square overflow-hidden">
                        <Image
                          src={service.images?.[0]?.url || '/placeholder-image.svg'}
                          alt={service.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Badge service - Plus stylé */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg">
                            <Wrench className="h-3 w-3 mr-1 fill-current" />
                            Service
                          </Badge>
                        </div>
                        
                        {/* Boutons overlay - Plus élégants */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <div className="flex space-x-3">
                            <Button
                              size="lg"
                              variant="secondary"
                              className="h-12 w-12 p-0 bg-white/95 hover:bg-white shadow-2xl backdrop-blur-sm border-0 rounded-full"
                              asChild
                            >
                              <Link href={`/services/${service.id}`}>
                                <Eye className="h-5 w-5 text-gray-700" />
                              </Link>
                            </Button>
                            <Button
                              size="lg"
                              variant="danger"
                              onClick={(e) => {
                                e.preventDefault()
                                addToCart(service)
                              }}
                              className="h-12 w-12 p-0 shadow-2xl border-0 rounded-full"
                            >
                              <ShoppingCart className="h-5 w-5" />
                            </Button>
                            <Button
                              size="lg"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                toggleFavorite(service.id)
                              }}
                              className={`h-12 w-12 p-0 shadow-2xl border-0 rounded-full transition-all ${
                                favorites.includes(service.id) 
                                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white' 
                                  : 'bg-white/95 hover:bg-white text-gray-700'
                              }`}
                            >
                              <Heart className={`h-5 w-5 ${favorites.includes(service.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <Link href={`/services/${service.id}`}>
                      <h3 className="font-bold text-xl mb-3 line-clamp-2 hover:text-primary transition-colors leading-tight">
                        {service.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
                        <PriceWithConversion price={Number(service.price)} />
                      </span>
                      {service.duration && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {service.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-blue-600 font-medium">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                      Service disponible
                    </div>
                  </CardContent>
                </Card>
              ))}
                  </div>
          </section>
        )}

        {/* Abonnements Populaires - Design amélioré */}
        {offers.length > 0 && (
          <section className="relative">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Abonnements Populaires
                </h2>
                <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm px-3 py-1">
                  <Play className="h-3 w-3 mr-1" />
                  Streaming
                </Badge>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Découvrez nos offres d'abonnements aux meilleures plateformes de streaming
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div></div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => prevSlide('offer')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => nextSlide('offer')}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button variant="danger" size="lg" className="px-6 shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link href="/subscriptions">
                    Voir tout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {offers.slice(offerSlide, offerSlide + 4).map((offer) => (
                <Card key={offer.id} className="group overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-white">
                  <CardHeader className="p-0 relative">
                    <div className="relative w-full aspect-square overflow-hidden">
                      <Image
                        src={offer.images?.[0]?.url || '/placeholder-image.svg'}
                        alt={offer.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Badge abonnement - Plus stylé */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg">
                          <Play className="h-3 w-3 mr-1 fill-current" />
                          Abonnement
                        </Badge>
                      </div>
                      
                      {/* Badge de réduction si applicable */}
                      {offer.originalPrice && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                            -{Math.round((1 - offer.price / offer.originalPrice) * 100)}%
                          </Badge>
                        </div>
                      )}
                      
                      {/* Boutons overlay - Plus élégants */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="flex space-x-3">
                          <Button
                            size="lg"
                            variant="secondary"
                            className="h-12 w-12 p-0 bg-white/95 hover:bg-white shadow-2xl backdrop-blur-sm border-0 rounded-full"
                            asChild
                          >
                            <Link href={`/subscriptions`}>
                              <Eye className="h-5 w-5 text-gray-700" />
                            </Link>
                          </Button>
                          <Button
                            size="lg"
                            onClick={(e) => {
                              e.preventDefault()
                              addToCart(offer)
                            }}
                            className="h-12 w-12 p-0 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-2xl border-0 rounded-full"
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </Button>
                          <Button
                            size="lg"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault()
                              toggleFavorite(offer.id)
                            }}
                            className={`h-12 w-12 p-0 shadow-2xl border-0 rounded-full transition-all ${
                              favorites.includes(offer.id) 
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white' 
                                : 'bg-white/95 hover:bg-white text-gray-700'
                            }`}
                          >
                            <Heart className={`h-5 w-5 ${favorites.includes(offer.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <Link href={`/subscriptions`}>
                      <h3 className="font-bold text-xl mb-3 line-clamp-2 hover:text-primary transition-colors leading-tight">
                        {offer.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-primary">
                          <PriceWithConversion price={Number(offer.price)} />
                        </span>
                        {offer.originalPrice && (
                          <span className="text-lg text-gray-500 line-through">
                            <PriceWithConversion price={Number(offer.originalPrice)} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-purple-600 font-medium">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                      Abonnement disponible
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
          </section>
        )}
        </div>
    </div>
  )
} 