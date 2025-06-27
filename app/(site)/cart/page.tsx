'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, ShoppingBag, User, Users, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { PriceWithConversion } from '@/components/ui/currency-selector'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  currency: string
  type?: string
  platform?: {
    id: string
    name: string
    logo: string | null
  }
  duration?: string
  maxProfiles?: number
  reservation?: {
    offerId: string
    account: {
      id: string
      available: boolean
    }
    profiles: Array<{
      id: string
      reserved: boolean
    }>
    reservedAt: string
    autoSelected?: boolean
  }
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger le panier depuis localStorage
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
    setIsLoading(false)
  }, [])

  const updateCart = (newCart: CartItem[]) => {
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    
    // Déclencher un événement pour mettre à jour le compteur dans le header
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const removeItem = (itemId: string) => {
    const newCart = cartItems.filter(item => item.id !== itemId)
    updateCart(newCart)
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }
    
    // Pour les abonnements, ne pas permettre de changer la quantité
    const item = cartItems.find(item => item.id === itemId)
    if (item?.type === 'subscription') {
      return
    }
    
    const newCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
    updateCart(newCart)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const clearCart = () => {
    updateCart([])
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return
    }

    // Préparer les données de commande
    const orderData = {
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        type: item.type,
        platform: item.platform,
        duration: item.duration,
        maxProfiles: item.maxProfiles,
        reservation: item.reservation
      })),
      total: getTotalPrice(),
      currency: 'Ar',
      timestamp: new Date().toISOString()
    }

    // Sauvegarder la commande dans localStorage pour la page de checkout
    localStorage.setItem('pendingOrder', JSON.stringify(orderData))
    
    // Rediriger vers la page de checkout
    window.location.href = '/checkout'
  }

  const formatReservationTime = (reservedAt: string) => {
    const date = new Date(reservedAt)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement du panier...</div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400" />
          <h1 className="text-2xl font-bold">Votre panier est vide</h1>
          <p className="text-gray-600">Ajoutez des produits pour commencer vos achats</p>
          <div className="flex justify-center space-x-4">
            <Link href="/products">
              <Button>Voir nos produits</Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline">Voir les abonnements</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Liste des articles */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Mon panier ({cartItems.length} articles)</h1>
            <Button variant="outline" onClick={clearCart} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le panier
            </Button>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className={item.type === 'subscription' ? 'border-blue-200 bg-blue-50/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Logo de la plateforme pour les abonnements */}
                    {item.type === 'subscription' && item.platform?.logo ? (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={item.platform.logo}
                          alt={item.platform.name}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : item.image ? (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : null}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.type === 'subscription' && (
                          <Badge variant="secondary" className="text-xs">
                            Abonnement
                          </Badge>
                        )}
                      </div>

                      {/* Détails spécifiques aux abonnements */}
                      {item.type === 'subscription' && (
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.duration}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {item.maxProfiles} profil{item.maxProfiles! > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {item.reservation && (
                            <div className="bg-white p-3 rounded border space-y-2">
                              <div className="font-medium text-xs text-blue-700 uppercase tracking-wide">
                                Réservation temporaire
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>Abonnement disponible et réservé</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Users className="h-3 w-3 text-blue-500" />
                                  <span>{item.maxProfiles} profil{item.maxProfiles! > 1 ? 's' : ''} prêt{item.maxProfiles! > 1 ? 's' : ''} à configurer</span>
                                </div>
                                <div className="text-gray-500">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Réservé le {formatReservationTime(item.reservation.reservedAt)}
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                                  🔒 Les détails du compte seront fournis après paiement
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-gray-600">
                        <PriceWithConversion price={item.price} />
                        {item.type === 'subscription' && item.duration && ` / ${item.duration}`}
                      </p>
                    </div>

                    {/* Contrôles de quantité (seulement pour les produits normaux) */}
                    {item.type !== 'subscription' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="font-medium">
                        <PriceWithConversion price={item.price * item.quantity} />
                      </p>
                      {item.type === 'subscription' && (
                        <p className="text-xs text-gray-500">Quantité: 1</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Résumé de la commande */}
        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span><PriceWithConversion price={getTotalPrice()} /></span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>Gratuite</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span><PriceWithConversion price={getTotalPrice()} /></span>
              </div>
              
              {/* Note pour les abonnements */}
              {cartItems.some(item => item.type === 'subscription') && (
                <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                  <p className="font-medium mb-1">ℹ️ Note importante</p>
                  <p>Les profils sélectionnés sont réservés temporairement. Ils seront attribués définitivement après le paiement.</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Passer la commande
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/products" className="block">
                    <Button variant="outline" className="w-full text-xs">
                      Produits
                    </Button>
                  </Link>
                  <Link href="/subscriptions" className="block">
                    <Button variant="outline" className="w-full text-xs">
                      Abonnements
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 