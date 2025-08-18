'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, ChevronLeft, ChevronRight, Eye, ShoppingCart, Heart, Star, Package, Wrench, Clock, TrendingUp, MessageSquare } from 'lucide-react'
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

interface HeroSlide {
  id: string;
  title: string;
  description: string | null;
  image: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
}

interface HeroBanner {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
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

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  published: boolean;
  pricingType: 'FIXED' | 'RANGE' | 'NEGOTIABLE' | 'QUOTE_REQUIRED';
  minPrice?: number;
  maxPrice?: number;
  requiresQuote: boolean;
  autoAcceptNegotiation: boolean;
  images: ProductImage[];
  category?: {
    id: string;
    name: string;
  };
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  originalPrice: number;
  discountedPrice: number;
  images: ProductImage[];
}

export default function HomePage() {
  const { toast } = useToast()
  const { addToCart: addToDbCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null)
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
        const [productsRes, servicesRes, offersRes, categoriesRes, heroSlidesRes, heroBannerRes] = await Promise.all([
          fetch('/api/public/products'),
          fetch('/api/public/services'),
          fetch('/api/public/offers'),
          fetch('/api/public/categories'),
          fetch('/api/public/hero-slides'),
          fetch('/api/public/hero-banner')
        ])

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData.slice(0, 12))
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.slice(0, 8))
        }

        if (offersRes.ok) {
          const offersData = await offersRes.json()
          setOffers(offersData.slice(0, 6))
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          const allCategories = [...(categoriesData.products || []), ...(categoriesData.services || [])]
          setCategories(allCategories.slice(0, 6))
        }

        if (heroSlidesRes.ok) {
          const heroSlidesData = await heroSlidesRes.json()
          setHeroSlides(heroSlidesData)
        }

        if (heroBannerRes.ok) {
          const heroBannerData = await heroBannerRes.json()
          setHeroBanner(heroBannerData)
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
    if ('pricingType' in item && item.pricingType === 'QUOTE_REQUIRED') {
      setSelectedService(item as Service)
      setQuoteModalOpen(true)
      return
    }

    try {
      let itemType: 'product' | 'service' | 'offer' = 'product'
      if ('duration' in item) {
        itemType = 'service'
      } else if ('originalPrice' in item) {
        itemType = 'offer'
      }

      let data: Record<string, any> = {}
      if (itemType === 'service' && 'duration' in item) {
        data.duration = item.duration
      } else if (itemType === 'offer' && 'originalPrice' in item) {
        data.originalPrice = item.originalPrice
        data.discountedPrice = item.discountedPrice
      }

      await addToDbCart(item.id, itemType, 1, data)
      
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
      description: "Votre demande de devis a été transmise.",
    })
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(1, heroSlides.length))
    }, 5000)
    return () => clearInterval(interval)
  }, [heroSlides.length])

  const nextSlide = (type: 'main' | 'product' | 'service' | 'offer') => {
    switch (type) {
      case 'main':
        setCurrentSlide(prev => (prev + 1) % Math.max(1, heroSlides.length))
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
        setCurrentSlide(prev => (prev - 1 + Math.max(1, heroSlides.length)) % Math.max(1, heroSlides.length))
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
        <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
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
      {/* Hero Banner Configurable */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        {heroBanner?.backgroundImage && (
          <div className="absolute inset-0">
            <Image 
              src={heroBanner.backgroundImage}
              alt="Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        
        {!heroBanner?.backgroundImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        )}
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col lg:flex-row items-center justify-between">
          <div className="text-white max-w-lg z-10 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              {heroBanner?.title || 'Bienvenue chez'}
              <span className="block text-yellow-300">
                {heroBanner?.subtitle || "Boutik'nakà"}
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-8 opacity-95 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {heroBanner?.description || 'Découvrez nos produits et services de qualité exceptionnelle'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto shadow-lg hover:shadow-xl transition-all" 
                asChild
              >
                <Link href={heroBanner?.primaryButtonLink || '/products'}>
                  <Package className="mr-2 h-4 w-4" />
                  {heroBanner?.primaryButtonText || 'Explorer nos Produits'}
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto text-white border-white hover:bg-white hover:text-primary shadow-lg hover:shadow-xl transition-all" 
                asChild
              >
                <Link href={heroBanner?.secondaryButtonLink || '/services'}>
                  <Wrench className="mr-2 h-4 w-4" />
                  {heroBanner?.secondaryButtonText || 'Découvrir nos Services'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Formes décoratives */}
        <>
          <div className="absolute top-5 right-5 md:top-10 md:right-10 w-16 h-16 md:w-32 md:h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-5 md:bottom-20 md:left-10 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 md:w-16 md:h-16 bg-yellow-300/30 rounded-full blur-md"></div>
        </>
      </section>
      
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Produits Populaires */}
        {products.length > 0 && (
          <section className="relative overflow-hidden">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                <Package className="inline-block mr-3 h-8 w-8 text-primary" />
                Produits Populaires
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Découvrez notre sélection de produits les plus appréciés
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.slice(productSlide, productSlide + 10).map((product) => (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={product.images[0]?.url || '/placeholder-image.svg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0 bg-white/90 hover:bg-white"
                        onClick={() => toggleFavorite(product.id)}
                      >
                        <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                      </Button>
                    </div>
                    {product.featured && (
                      <Badge className="absolute top-3 left-3 bg-primary text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <PriceWithConversion price={product.price} className="font-bold text-lg text-primary" />
                        {product.compareAtPrice && (
                          <PriceWithConversion 
                            price={product.compareAtPrice} 
                            className="text-sm text-gray-500 line-through" 
                          />
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Stock: {product.inventory}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <Link href={`/products/${product.id}`}>
                          <Eye className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {products.length > 10 && (
              <div className="flex justify-center mt-8 gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prevSlide('product')}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nextSlide('product')}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/products">
                  Voir tous les produits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        <Separator className="my-12" />

        {/* Services Recommandés */}
        {services.length > 0 && (
          <section className="relative overflow-hidden">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                <Wrench className="inline-block mr-3 h-8 w-8 text-blue-600" />
                Services Recommandés
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Des services professionnels pour répondre à tous vos besoins
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.slice(serviceSlide, serviceSlide + 4).map((service) => (
                <Card key={service.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.images[0]?.url || '/placeholder-image.svg'}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-600 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        {service.duration}j
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        {service.pricingType === 'QUOTE_REQUIRED' ? (
                          <span className="font-bold text-lg text-blue-600">Sur devis</span>
                        ) : service.pricingType === 'RANGE' ? (
                          <div>
                            <PriceWithConversion price={service.minPrice || 0} className="font-bold text-lg text-blue-600" />
                            <span className="text-sm text-gray-500"> - </span>
                            <PriceWithConversion price={service.maxPrice || 0} className="font-bold text-lg text-blue-600" />
                          </div>
                        ) : (
                          <PriceWithConversion price={service.price} className="font-bold text-lg text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={() => addToCart(service)}
                      >
                        {service.pricingType === 'QUOTE_REQUIRED' ? (
                          <>
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Devis
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Ajouter
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <Link href={`/services/${service.id}`}>
                          <Eye className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {services.length > 4 && (
              <div className="flex justify-center mt-8 gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prevSlide('service')}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nextSlide('service')}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/services">
                  Voir tous les services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        <Separator className="my-12" />

        {/* Statistiques */}
        <section className="relative py-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
          
          <div className="relative z-10 text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              <TrendingUp className="inline-block mr-3 h-8 w-8 text-green-600" />
              Boutik'nakà en Chiffres
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              La confiance de milliers de clients à Madagascar
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
              <div className="text-4xl font-bold text-primary mb-2">{products.length}+</div>
              <div className="text-gray-600 font-medium">Produits</div>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">{services.length}+</div>
              <div className="text-gray-600 font-medium">Services</div>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600 font-medium">Clients Satisfaits</div>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Support</div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de devis */}
      {selectedService && (
        <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Demande de devis - {selectedService.name}</DialogTitle>
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
  )
}
