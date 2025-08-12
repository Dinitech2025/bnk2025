'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, ChevronLeft, ChevronRight, Eye, ShoppingCart, Heart, Star, Play, Package, Wrench, Clock, Users, TrendingUp, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { useCart } from '@/lib/hooks/use-cart'
import { QuoteRequestForm } from '@/components/quotes/quote-request-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  pricingType?: 'FIXED' | 'NEGOTIABLE' | 'RANGE' | 'QUOTE_REQUIRED';
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
  const { toast } = useToast()
  const { addToCart: addToDbCart } = useCart()
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
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

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

  const addToCart = async (item: Product | Service | Offer) => {
    // Pour les services avec devis requis, ouvrir le modal
    if ('pricingType' in item && item.pricingType === 'QUOTE_REQUIRED') {
      setSelectedService(item as Service)
      setQuoteModalOpen(true)
      return
    }

    try {
      // Déterminer le type d'item
      let itemType: 'product' | 'service' | 'offer' = 'product'
      if ('duration' in item) {
        itemType = 'service'
      } else if ('originalPrice' in item) {
        itemType = 'offer'
      }

      // Préparer les données additionnelles selon le type
      let data: Record<string, any> = {}
      if (itemType === 'service' && 'duration' in item) {
        data.duration = item.duration
      }

      await addToDbCart({
        type: itemType,
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: 1,
        image: item.images?.[0]?.url,
        data: Object.keys(data).length > 0 ? data : undefined
      })

      // Afficher une notification toast
      let typeText = 'Produit'
      if (itemType === 'service') typeText = 'Service'
      else if (itemType === 'offer') typeText = 'Abonnement'
      
      toast({
        title: `${typeText} ajouté!`,
        description: `${item.name} a été ajouté à votre panier.`,
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'article au panier.',
        variant: 'destructive'
      })
    }
  }

  const handleQuoteSuccess = (quoteId: string) => {
    setQuoteModalOpen(false)
    setSelectedService(null)
    toast({
      title: "Demande envoyée !",
      description: "Votre demande de devis a été transmise. Vous pouvez suivre son évolution dans votre profil.",
    })
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
        setProductSlide(prev => (prev + 10) % Math.max(10, products.length))
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
        setProductSlide(prev => (prev - 10 + Math.max(10, products.length)) % Math.max(10, products.length))
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      {/* Hero Carrousel - Responsive et impressionnant */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80">
          <div className="container mx-auto px-4 h-full flex flex-col lg:flex-row items-center justify-between">
            <div className="text-white max-w-lg z-10 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                Bienvenue chez 
                <span className="block text-yellow-300">Boutik'nakà</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-8 opacity-95 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Découvrez nos produits et services de qualité exceptionnelle
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto shadow-lg hover:shadow-xl transition-all" 
                  asChild
                >
                  <Link href="/products">
                    <Package className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Explorer nos </span>Produits
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="danger" 
                  className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto text-white border-white hover:bg-white hover:text-primary shadow-lg hover:shadow-xl transition-all" 
                  asChild
                >
                  <Link href="/services">
                    <Wrench className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Découvrir nos </span>Services
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Carrousel des catégories - Responsive */}
            {categories.length > 0 && (
              <div className="hidden xl:block relative z-10 mt-8 lg:mt-0">
                <div className="w-[700px] h-[400px] xl:w-[800px] xl:h-[400px] relative overflow-hidden rounded-2xl shadow-2xl border-4 border-white/20">
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
                        <div className="p-6 xl:p-8 text-white w-full">
                          <h3 className="text-xl xl:text-2xl font-bold mb-2 xl:mb-3">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm xl:text-lg opacity-90 leading-relaxed line-clamp-2">{category.description}</p>
                          )}
                          <Button variant="secondary" className="mt-3 xl:mt-4 text-sm" asChild>
                            <Link href={`/categories/${category.id}`}>
                              Découvrir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation du carrousel - Responsive */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-6 xl:-left-8">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full w-10 h-10 xl:w-14 xl:h-14 p-0 shadow-xl bg-white/90 hover:bg-white text-primary"
                    onClick={() => prevSlide('main')}
                  >
                    <ChevronLeft className="h-5 w-5 xl:h-7 xl:w-7" />
                  </Button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-6 xl:-right-8">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full w-10 h-10 xl:w-14 xl:h-14 p-0 shadow-xl bg-white/90 hover:bg-white text-primary"
                    onClick={() => nextSlide('main')}
                  >
                    <ChevronRight className="h-5 w-5 xl:h-7 xl:w-7" />
                  </Button>
                </div>
                
                {/* Indicateurs - Responsive */}
                <div className="absolute -bottom-10 xl:-bottom-14 left-1/2 -translate-x-1/2 flex space-x-3 xl:space-x-4">
                  {categories.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 xl:w-4 xl:h-4 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Mini carrousel pour tablettes */}
            {categories.length > 0 && (
              <div className="hidden lg:block xl:hidden relative z-10 mt-6">
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                  {categories.slice(0, 3).map((category, index) => (
                    <Link 
                      key={category.id} 
                      href={`/categories/${category.id}`}
                      className="flex-shrink-0 w-32 h-20 relative overflow-hidden rounded-lg shadow-lg border-2 border-white/20 hover:scale-105 transition-transform"
                    >
                      <Image
                        src={category.image || '/placeholder-image.svg'}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold text-center px-2">{category.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Formes décoratives - Responsive */}
          <div className="absolute top-5 right-5 md:top-10 md:right-10 w-16 h-16 md:w-32 md:h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-5 md:bottom-20 md:left-10 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 md:w-16 md:h-16 bg-yellow-300/30 rounded-full blur-md"></div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Produits Populaires - Design premium compact */}
        {products.length > 0 && (
          <section className="relative overflow-hidden">
            {/* Fond décoratif premium */}
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
                  onClick={() => prevSlide('product')}
                >
                  <ChevronLeft className="h-4 w-4 text-red-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-red-200 hover:border-red-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => nextSlide('product')}
                >
                  <ChevronRight className="h-4 w-4 text-red-600" />
                </Button>
                <Button variant="danger" size="sm" className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full text-sm" asChild>
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
                              variant="danger"
                              onClick={(e) => {
                                e.preventDefault()
                                addToCart(product)
                              }}
                              disabled={product.stock <= 0}
                              className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                            >
                              <ShoppingCart className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                toggleFavorite(product.id)
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
                      {product.stock > 0 ? (
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
        )}

        {/* Services Populaires - Design premium compact */}
        {services.length > 0 && (
          <section className="relative overflow-hidden">
            {/* Fond décoratif bleu premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-25 to-cyan-50 rounded-2xl shadow-inner"></div>
            
            {/* Couche de texture mesh bleue */}
            <div className="absolute inset-0 opacity-25">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/12 via-transparent to-cyan-100/12"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-100/8 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 to-transparent"></div>
            </div>
            
            {/* Motifs géométriques décoratifs bleus */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tl from-cyan-200/50 to-sky-200/50 rounded-full blur-2xl opacity-40"></div>
            <div className="absolute top-1/3 right-12 w-16 h-16 bg-blue-100/30 rounded-full blur-xl opacity-25"></div>
            <div className="absolute bottom-1/3 left-1/4 w-12 h-12 bg-cyan-100/40 rounded-full blur-lg opacity-30"></div>
            <div className="absolute top-1/6 left-8 w-10 h-10 bg-sky-200/30 rounded-full blur-lg opacity-25 animate-pulse" style={{animationDelay: '2s'}}></div>
            
            {/* Motifs en vagues subtiles */}
            <div className="absolute top-1/4 left-0 w-32 h-1 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent opacity-40"></div>
            <div className="absolute bottom-1/4 right-0 w-24 h-1 bg-gradient-to-l from-transparent via-cyan-200/15 to-transparent opacity-30"></div>
            <div className="absolute top-3/4 left-1/3 w-16 h-1 bg-gradient-to-r from-sky-200/10 to-transparent opacity-25"></div>
            
            {/* Pattern de points décoratifs bleus */}
            <div className="absolute top-12 right-1/4 w-1 h-1 bg-blue-400/50 rounded-full"></div>
            <div className="absolute top-16 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full"></div>
            <div className="absolute top-20 right-1/4 w-1 h-1 bg-sky-400/45 rounded-full"></div>
            <div className="absolute bottom-12 left-1/5 w-1 h-1 bg-blue-400/50 rounded-full"></div>
            <div className="absolute bottom-16 left-1/5 w-1 h-1 bg-cyan-400/40 rounded-full"></div>
            
            {/* Lignes décoratives multiples bleues */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/20 to-transparent"></div>
            <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-200/15 to-transparent"></div>
            <div className="absolute top-0 left-3/5 w-px h-2/3 bg-gradient-to-b from-sky-200/12 to-transparent"></div>
            
            {/* Formes géométriques bleues enrichies */}
            <div className="absolute top-12 left-8 w-6 h-6 border border-blue-200/30 rotate-45 opacity-40"></div>
            <div className="absolute bottom-8 right-16 w-4 h-4 bg-cyan-200/25 rotate-45 opacity-50"></div>
            <div className="absolute top-1/2 right-8 w-3 h-8 bg-blue-100/20 rotate-12 opacity-30"></div>
            <div className="absolute top-2/3 left-12 w-6 h-3 bg-sky-200/18 rotate-45 opacity-35 rounded-full"></div>
            <div className="absolute bottom-1/5 right-1/5 w-2 h-10 bg-cyan-100/22 rotate-12 opacity-28 rounded-full"></div>
            
            {/* Effets de lumière bleue */}
            <div className="absolute top-1/5 right-1/3 w-24 h-24 bg-gradient-radial from-blue-200/18 to-transparent rounded-full blur-2xl opacity-35"></div>
            <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-gradient-radial from-cyan-200/15 to-transparent rounded-full blur-xl opacity-30"></div>
            <div className="absolute top-1/2 left-1/6 w-14 h-14 bg-gradient-radial from-sky-200/12 to-transparent rounded-full blur-lg opacity-25"></div>
            
            <div className="relative flex items-center justify-between mb-6 pt-6 px-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Services Populaires
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => prevSlide('service')}
                >
                  <ChevronLeft className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => nextSlide('service')}
                >
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                </Button>
                <Button variant="default" size="sm" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full text-white text-sm" asChild>
                  <Link href="/services">
                    Voir tout
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative px-4 pb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {services.slice(serviceSlide, serviceSlide + 5).map((service) => (
                <Card key={service.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
                  <CardHeader className="p-0 relative">
                    <Link href={`/services/${service.id}`}>
                      <div className="relative w-full aspect-square overflow-hidden">
                        <Image
                          src={service.images?.[0]?.url || '/placeholder-image.svg'}
                          alt={service.name}
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
                              <Link href={`/services/${service.id}`}>
                                <Eye className="h-3 w-3 text-gray-700" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.preventDefault()
                                addToCart(service)
                              }}
                              className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                            >
                              {service.pricingType === 'QUOTE_REQUIRED' ? (
                                <MessageSquare className="h-3 w-3" />
                              ) : (
                                <ShoppingCart className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                toggleFavorite(service.id)
                              }}
                              className={`h-8 w-8 p-0 shadow-lg border-0 rounded-full transition-all ${
                                favorites.includes(service.id) 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'bg-white/95 hover:bg-white text-gray-700'
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${favorites.includes(service.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-2 flex flex-col flex-grow">
                    {/* Badge de catégorie */}
                    <div className="mb-1">
                      <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800 border-cyan-200 font-medium">
                        {service.category.name}
                      </Badge>
                    </div>
                    
                    {/* Indicateur de service */}
                    <div className="mb-1">
                      <div className="flex items-center text-cyan-600 text-xs font-medium">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1"></div>
                        Disponible
                      </div>
                    </div>
                    
                    {/* Nom du service */}
                    <Link href={`/services/${service.id}`}>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight text-gray-900">
                        {service.name}
                      </h3>
                    </Link>
                    
                    {/* Prix */}
                    <div className="mt-auto">
                      {service.pricingType === 'QUOTE_REQUIRED' ? (
                        <span className="text-sm font-semibold text-orange-600">
                          Sur devis
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-cyan-600">
                          <PriceWithConversion price={Number(service.price)} />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Abonnements Populaires - Design premium compact */}
        {offers.length > 0 && (
          <section className="relative overflow-hidden">
            {/* Fond décoratif violet premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-violet-25 to-pink-50 rounded-2xl shadow-inner"></div>
            
            {/* Couche de texture mesh violette ultra sophistiquée */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/15 via-transparent to-pink-100/15"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-100/10 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/12 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-pink-50/8"></div>
            </div>
            
            {/* Motifs géométriques décoratifs violets */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-pink-200/50 to-violet-200/50 rounded-full blur-2xl opacity-40"></div>
            <div className="absolute top-1/4 left-12 w-16 h-16 bg-purple-100/30 rounded-full blur-xl opacity-25"></div>
            <div className="absolute bottom-1/2 right-1/5 w-12 h-12 bg-pink-100/40 rounded-full blur-lg opacity-30"></div>
            <div className="absolute top-3/4 right-12 w-8 h-8 bg-violet-100/35 rounded-full blur-md opacity-35"></div>
            <div className="absolute top-1/6 right-1/4 w-6 h-6 bg-purple-200/25 rounded-full blur-sm opacity-40 animate-pulse" style={{animationDelay: '3s'}}></div>
            
            {/* Motifs streaming inspirés */}
            <div className="absolute top-1/3 left-1/6 w-20 h-1 bg-gradient-to-r from-transparent via-purple-300/25 to-transparent opacity-50"></div>
            <div className="absolute bottom-1/3 right-1/6 w-16 h-1 bg-gradient-to-l from-transparent via-pink-300/20 to-transparent opacity-40"></div>
            <div className="absolute top-2/3 left-1/2 w-12 h-1 bg-gradient-to-r from-violet-300/15 to-transparent opacity-35"></div>
            <div className="absolute top-1/5 right-1/2 w-8 h-1 bg-gradient-to-l from-purple-300/18 to-transparent opacity-30"></div>
            
            {/* Pattern de points décoratifs violets complexe */}
            <div className="absolute top-10 left-1/3 w-1 h-1 bg-purple-500/60 rounded-full"></div>
            <div className="absolute top-14 left-1/3 w-1 h-1 bg-violet-500/50 rounded-full"></div>
            <div className="absolute top-18 left-1/3 w-1 h-1 bg-pink-500/55 rounded-full"></div>
            <div className="absolute bottom-10 right-1/4 w-1 h-1 bg-purple-500/60 rounded-full"></div>
            <div className="absolute bottom-14 right-1/4 w-1 h-1 bg-pink-500/50 rounded-full"></div>
            <div className="absolute bottom-18 right-1/4 w-1 h-1 bg-violet-500/55 rounded-full"></div>
            
            {/* Lignes décoratives multiples violettes */}
            <div className="absolute top-0 left-1/5 w-px h-full bg-gradient-to-b from-transparent via-purple-200/20 to-transparent"></div>
            <div className="absolute top-0 right-2/5 w-px h-full bg-gradient-to-b from-transparent via-pink-200/15 to-transparent"></div>
            <div className="absolute top-0 left-1/2 w-px h-3/4 bg-gradient-to-b from-violet-200/12 to-transparent"></div>
            <div className="absolute top-1/4 right-1/6 h-px w-1/3 bg-gradient-to-r from-transparent via-purple-200/18 to-transparent"></div>
            
            {/* Formes géométriques violettes ultra enrichies */}
            <div className="absolute top-8 left-16 w-6 h-6 border border-purple-200/30 rotate-45 opacity-40"></div>
            <div className="absolute bottom-16 right-8 w-4 h-4 bg-pink-200/25 rotate-45 opacity-50"></div>
            <div className="absolute top-1/3 left-8 w-2 h-10 bg-violet-100/20 rotate-12 opacity-30"></div>
            <div className="absolute bottom-1/4 left-1/3 w-5 h-2 bg-purple-100/25 rotate-45 opacity-40 rounded-full"></div>
            <div className="absolute top-1/2 right-1/3 w-3 h-8 bg-pink-200/22 rotate-45 opacity-35 rounded-full"></div>
            <div className="absolute bottom-1/6 left-1/2 w-4 h-4 border border-violet-200/28 rotate-12 opacity-30"></div>
            
            {/* Effets de lumière violette spectaculaires */}
            <div className="absolute top-1/6 left-1/4 w-28 h-28 bg-gradient-radial from-purple-200/20 to-transparent rounded-full blur-3xl opacity-40"></div>
            <div className="absolute bottom-1/3 right-1/5 w-20 h-20 bg-gradient-radial from-pink-200/18 to-transparent rounded-full blur-2xl opacity-35"></div>
            <div className="absolute top-1/2 right-1/2 w-16 h-16 bg-gradient-radial from-violet-200/15 to-transparent rounded-full blur-xl opacity-30"></div>
            <div className="absolute bottom-1/5 left-1/6 w-12 h-12 bg-gradient-radial from-purple-300/12 to-transparent rounded-full blur-lg opacity-25"></div>
            
            <div className="relative flex items-center justify-between mb-6 pt-6 px-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Abonnements Populaires
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => prevSlide('offer')}
                >
                  <ChevronLeft className="h-4 w-4 text-purple-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0 bg-white/80 backdrop-blur border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => nextSlide('offer')}
                >
                  <ChevronRight className="h-4 w-4 text-purple-600" />
                </Button>
                <Button variant="danger" size="sm" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full text-sm" asChild>
                  <Link href="/subscriptions">
                    Voir tout
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative px-4 pb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {offers.slice(offerSlide, offerSlide + 5).map((offer) => (
                  <Card key={offer.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white">
                    <CardHeader className="p-0 relative">
                      <Link href={`/subscriptions`}>
                        <div className="relative w-full aspect-square overflow-hidden">
                          <Image
                            src={offer.images?.[0]?.url || '/placeholder-image.svg'}
                            alt={offer.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Badge populaire - Plus compact */}
                          {offer.isPopular && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg text-xs px-2 py-1">
                                <Star className="h-2 w-2 mr-1 fill-current" />
                                Populaire
                              </Badge>
                            </div>
                          )}
                          
                          {/* Boutons overlay - Plus compacts */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
                                asChild
                              >
                                <Link href={`/subscriptions`}>
                                  <Eye className="h-3 w-3 text-gray-700" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={(e) => {
                                  e.preventDefault()
                                  addToCart(offer)
                                }}
                                className="h-8 w-8 p-0 shadow-lg border-0 rounded-full"
                              >
                                <ShoppingCart className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  toggleFavorite(offer.id)
                                }}
                                className={`h-8 w-8 p-0 shadow-lg border-0 rounded-full transition-all ${
                                  favorites.includes(offer.id) 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-white/95 hover:bg-white text-gray-700'
                                }`}
                              >
                                <Heart className={`h-3 w-3 ${favorites.includes(offer.id) ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-2 flex flex-col flex-grow">
                      {/* Badge abonnement */}
                      <div className="mb-1">
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200 font-medium">
                          Abonnement
                        </Badge>
                      </div>
                      
                      {/* Indicateur de disponibilité */}
                      <div className="mb-1">
                        <div className="flex items-center text-purple-600 text-xs font-medium">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                          Disponible
                        </div>
                      </div>
                      
                      {/* Nom de l'abonnement */}
                      <Link href={`/subscriptions`}>
                        <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight text-gray-900">
                          {offer.name}
                        </h3>
                      </Link>
                      
                      {/* Prix */}
                      <div className="mt-auto">
                        <div className="flex flex-col">
                          {offer.originalPrice && offer.originalPrice > offer.price && (
                            <span className="text-xs text-gray-500 line-through">
                              <PriceWithConversion price={Number(offer.originalPrice)} />
                            </span>
                          )}
                          <span className="text-sm font-semibold text-purple-600">
                            <PriceWithConversion price={Number(offer.price)} />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Slider des Fournisseurs Partenaires */}
        <section className="relative py-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-hidden">
          {/* Fond décoratif subtil */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/10 to-transparent"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-200/10 to-transparent"></div>
          
          <div className="container mx-auto px-4 text-center">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Nos Partenaires de Confiance
              </h2>
              <p className="text-base text-gray-600 max-w-xl mx-auto">
                Découvrez les grandes marques et plateformes avec lesquelles nous collaborons
              </p>
            </div>
            
            {/* Slider Container */}
            <div className="relative overflow-hidden">
              {/* Gradients de masquage */}
              <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-gray-50 via-blue-50/30 to-transparent z-10"></div>
              <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-gray-50 via-purple-50/20 to-transparent z-10"></div>
              
                             {/* Slider animé */}
               <div className="flex space-x-4 animate-scroll">
                 {/* Première série de logos - Avec logos officiels */}
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" 
                     alt="Amazon" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" 
                     alt="eBay" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Aliexpress_logo.svg/204px-Aliexpress_logo.svg.png" 
                     alt="AliExpress" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/alibaba-1.svg" 
                     alt="Alibaba Group" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" 
                     alt="Netflix" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://static.wikia.nocookie.net/lemondededisney/images/6/65/Disney%2BLogo.png/revision/latest?cb=20231028124416&path-prefix=fr" 
                     alt="Disney+" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/amazon-prime-video-1.svg" 
                     alt="Prime Video" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/2/20/YouTube_2024.svg" 
                     alt="YouTube" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                     alt="PayPal" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg" 
                     alt="Zara" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/shein-1.svg" 
                     alt="Shein" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/decathlon-2.svg" 
                     alt="Decathlon" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" 
                     alt="YouTube" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                     alt="Spotify" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 
                 {/* Duplication pour l'animation continue */}
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" 
                     alt="Amazon" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" 
                     alt="eBay" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Aliexpress_logo.svg/204px-Aliexpress_logo.svg.png" 
                     alt="AliExpress" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/alibaba-1.svg" 
                     alt="Alibaba Group" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" 
                     alt="Netflix" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://static.wikia.nocookie.net/lemondededisney/images/6/65/Disney%2BLogo.png/revision/latest?cb=20231028124416&path-prefix=fr" 
                     alt="Disney+" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/amazon-prime-video-1.svg" 
                     alt="Prime Video" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/2/20/YouTube_2024.svg" 
                     alt="YouTube" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                     alt="PayPal" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg" 
                     alt="Zara" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/shein-1.svg" 
                     alt="Shein" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://cdn.worldvectorlogo.com/logos/decathlon-2.svg" 
                     alt="Decathlon" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" 
                     alt="YouTube" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
                 <div className="flex items-center justify-center min-w-[120px] h-16 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 px-3">
                   <img 
                     src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                     alt="Spotify" 
                     className="h-8 w-auto object-contain max-w-[90px]"
                   />
                 </div>
               </div>
            </div>
            
            {/* Texte de confiance */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 max-w-2xl mx-auto">
                Et bien d'autres partenaires de confiance pour vous offrir les meilleurs produits et services
              </p>
            </div>
          </div>
        </section>

        {/* Modal de demande de devis */}
        {selectedService && (
          <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Demande de devis</DialogTitle>
              </DialogHeader>
              <QuoteRequestForm
                service={selectedService}
                onSuccess={handleQuoteSuccess}
                onCancel={() => {
                  setQuoteModalOpen(false)
                  setSelectedService(null)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
} 