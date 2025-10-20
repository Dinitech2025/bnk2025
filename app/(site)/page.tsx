'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useCart } from '@/lib/hooks/use-cart'
import { QuoteRequestForm } from '@/components/quotes/quote-request-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Composants modulaires
import HeroBanner from '@/components/homepage/HeroBanner'
import ProductsSection from '@/components/homepage/ProductsSection'
import ServicesSection from '@/components/homepage/ServicesSection'
import OffersSection from '@/components/homepage/OffersSection'
import PartnersSlider from '@/components/homepage/PartnersSlider'
import { SecurityBadgeRow } from '@/components/ui/security-badge'

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

interface HeroBannerImage {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  order: number;
  isActive: boolean;
}

interface HeroBanner {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  
  // Couleurs de texte
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  
  // Boutons
  primaryButtonText: string;
  primaryButtonLink: string;
  primaryButtonColor: string;
  primaryButtonBg: string;
  
  secondaryButtonText: string;
  secondaryButtonLink: string;
  secondaryButtonColor: string;
  secondaryButtonBg: string;
  secondaryButtonBorder: string;
  
  // Effets
  backgroundBlur: number;
  backgroundOpacity: number;
  backgroundOverlayColor: string;
  
  // Diaporama
  backgroundSlideshowEnabled: boolean;
  backgroundSlideshowDuration: number;
  backgroundSlideshowTransition: string;
  backgroundImages: HeroBannerImage[];
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
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
          setOffers(offersData.slice(0, 8))
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
                  <div key={j} className="overflow-hidden bg-white rounded-lg shadow-md">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
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
      {/* Hero Banner avec Carrousel */}
      <HeroBanner 
        heroBanner={heroBanner}
        heroSlides={heroSlides}
        categories={categories}
      />
      
      {/* Section de présentation et SEO */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              🛍️ Boutik Naka - Votre E-commerce de Confiance à Madagascar
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Découvrez la première plateforme e-commerce malgache proposant des <strong>produits high-tech</strong>, 
              <strong> services numériques</strong> et <strong>abonnements streaming</strong>. 
              Livraison rapide à Antananarivo, paiement sécurisé PayPal et Mobile Money.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">🚚</div>
                <h3 className="font-semibold text-gray-900 mb-2">Livraison Rapide</h3>
                <p className="text-sm text-gray-600">
                  Livraison express à Antananarivo et dans toute l'île de Madagascar
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">💳</div>
                <h3 className="font-semibold text-gray-900 mb-2">Paiement Sécurisé</h3>
                <p className="text-sm text-gray-600">
                  PayPal, Mobile Money (Orange, MVola, Airtel), virement bancaire
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">Produits Authentiques</h3>
                <p className="text-sm text-gray-600">
                  Smartphones, ordinateurs, accessoires et services 100% authentiques
                </p>
              </div>
            </div>
            
            {/* Badges de sécurité */}
            <div className="flex flex-wrap justify-center gap-4">
              <SecurityBadgeRow className="justify-center" />
            </div>
            
            {/* Mots-clés SEO */}
            <div className="mt-8 text-xs text-gray-500 max-w-3xl mx-auto">
              <p>
                <strong>Mots-clés:</strong> e-commerce Madagascar, boutique en ligne Antananarivo, 
                smartphone Madagascar, ordinateur portable Tananarive, Netflix Madagascar, 
                Disney+ Malgache, paiement mobile money, livraison express Madagascar
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Section Produits Populaires */}
        <ProductsSection 
          products={products}
          favorites={favorites}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
        />

        {/* Section Services Populaires */}
        <ServicesSection 
          services={services}
          favorites={favorites}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
        />

        {/* Section Abonnements Populaires */}
        <OffersSection 
          offers={offers}
          favorites={favorites}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
        />

        {/* Slider des Partenaires */}
        <PartnersSlider />

        {/* Modal de devis */}
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
