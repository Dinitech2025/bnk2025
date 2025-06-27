'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/use-toast'
import { SubscriptionPopup } from '@/components/ui/subscription-popup'

interface OfferImage {
  url: string;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  durationUnit: string;
  durationText: string;
  maxProfiles: number;
  features: string | null;
  platform: Platform;
  platforms: Platform[];
  images: OfferImage[];
}

async function getOffers(): Promise<Offer[]> {
  const res = await fetch('/api/public/offers', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch offers')
  }
  return res.json()
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await getOffers()
        setOffers(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les offres.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchOffers()
  }, [])

  const handleOfferSelect = (offer: Offer) => {
    setSelectedOffer(offer)
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
    setSelectedOffer(null)
  }

  const handleAddToCart = (reservationData: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Créer un ID unique pour cette réservation
    const reservationId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const cartItem = {
      id: reservationId,
      type: 'subscription',
      name: reservationData.offerName,
      price: Number(reservationData.price),
      quantity: 1,
      currency: 'Ar',
      platform: reservationData.platform,
      duration: reservationData.duration,
      maxProfiles: reservationData.maxProfiles,
      reservation: {
        offerId: reservationData.offerId,
        account: reservationData.account,
        profiles: reservationData.profiles,
        reservedAt: reservationData.reservedAt
      }
    }
    
    cart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const parseFeatures = (featuresString: string | null): string[] => {
    if (!featuresString) return []
    try {
      return JSON.parse(featuresString)
    } catch {
      return []
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nos Abonnements Streaming</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Chargement des offres...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const features = parseFeatures(offer.features)
            return (
              <Card key={offer.id} className="overflow-hidden flex flex-col border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {offer.platform?.logo && (
                       <Image
                          src={offer.platform.logo}
                          alt={`Logo ${offer.platform.name}`}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                    )}
                    <div>
                      <CardTitle className="text-xl">{offer.name}</CardTitle>
                      <p className="text-sm text-gray-500">{offer.platform?.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <p className="text-gray-600 text-sm mb-4">{offer.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Durée:</span>
                      <span className="text-sm text-blue-600 font-semibold">{offer.durationText}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Profils:</span>
                      <span className="text-sm text-green-600 font-semibold">{offer.maxProfiles} profil{offer.maxProfiles > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {features.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Fonctionnalités:</h4>
                      <ul className="space-y-1 text-sm">
                        {features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-xs">{feature}</span>
                          </li>
                        ))}
                        {features.length > 3 && (
                          <li className="text-xs text-gray-500">+{features.length - 3} autres fonctionnalités</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-6 bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-2xl">{Number(offer.price).toLocaleString()} Ar</p>
                    <p className="text-xs text-gray-500">/{offer.durationText}</p>
                  </div>
                  <Button onClick={() => handleOfferSelect(offer)} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Choisir
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      
      {!isLoading && offers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Aucune offre d'abonnement disponible pour le moment.</p>
        </div>
      )}

      {/* Popup de sélection */}
      <SubscriptionPopup
        offer={selectedOffer}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
} 