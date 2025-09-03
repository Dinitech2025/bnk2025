'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CreditCard, Phone, Mail, MapPin, Users, Clock, CheckCircle, Truck, User, Plus, Edit3 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  type?: string
  platform?: {
    id: string
    name: string
    logo: string | null
  }
  duration?: string
  maxProfiles?: number
  reservation?: any
}

interface OrderData {
  items: OrderItem[]
  total: number
  currency: string
}

interface UserAddress {
  id: string
  type: string
  street: string
  city: string
  zipCode: string
  country: string
  isDefault: boolean
}

export default function CheckoutContent() {
  const { data: session, status } = useSession()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sameAsbilling, setSameAsBinding] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [isProcessingPayPalReturn, setIsProcessingPayPalReturn] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Données du formulaire étendues
  const [formData, setFormData] = useState({
    // Informations personnelles
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    // SUPPRIMÉ: password (déclenchait alerte Google Safe Browsing)
    
    // Adresse de facturation
    billingAddress: '',
    billingCity: '',
    billingZipCode: '',
    billingCountry: 'Madagascar',
    selectedBillingAddressId: '', // Nouvelle: pour sélectionner une adresse existante
    
    // Adresse de livraison
    shippingAddress: '',
    shippingCity: '',
    shippingZipCode: '',
    shippingCountry: 'Madagascar',
    selectedShippingAddressId: '', // Nouvelle: pour sélectionner une adresse existante
    
    // Notes seulement - paiement géré par PaymentMethodSelector
    notes: '',
    
    // Options de compte - SÉCURISÉ
    hasAccount: false, // Toggle connexion/création
    newsletter: false
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Gérer les retours PayPal
  useEffect(() => {
    if (!isMounted) return

    const paypalReturn = searchParams.get('paypal_return')
    const paymentType = searchParams.get('payment_type')

    if (paypalReturn === 'success' && paymentType) {
      console.log('🎉 Retour PayPal détecté - Traitement du paiement...')
      handlePayPalReturn()
    } else if (paypalReturn === 'cancel') {
      console.log('❌ Paiement PayPal annulé')
      toast({
        title: "Paiement annulé",
        description: "Votre paiement PayPal a été annulé. Vous pouvez réessayer.",
        variant: "default"
      })
      // Nettoyer l'URL
      router.replace('/checkout')
    }
  }, [isMounted, searchParams])

  const handlePayPalReturn = async () => {
    setIsProcessingPayPalReturn(true)

    try {
      // Récupérer les données stockées
      const checkoutData = localStorage.getItem('paypal_checkout_data')
      const pendingOrderId = localStorage.getItem('paypal_pending_order_id')

      if (!checkoutData || !pendingOrderId) {
        throw new Error('Données de commande manquantes')
      }

      const orderData = JSON.parse(checkoutData)
      console.log('🔄 Traitement retour PayPal:', {
        orderId: pendingOrderId,
        paymentType: orderData.paymentType
      })

      // Capturer le paiement PayPal
      const captureResponse = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: pendingOrderId,
          orderData
        }),
      })

      const captureResult = await captureResponse.json()

      if (captureResult.status === 'COMPLETED') {
        console.log('✅ Paiement PayPal capturé avec succès')

        // Créer la commande en base de données
        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...orderData,
            paymentData: {
              method: orderData.paymentType,
              status: 'completed',
              transactionId: captureResult.id,
              paypalOrderId: pendingOrderId,
              amount: orderData.paypalAmount,
              currency: orderData.paypalCurrency
            }
          }),
        })

        if (!createOrderResponse.ok) {
          throw new Error('Erreur lors de la création de la commande')
        }

        const orderCreated = await createOrderResponse.json()
        console.log('✅ Commande créée:', orderCreated.order.orderNumber)

        // Vider le panier
        await fetch('/api/cart/clear', { method: 'POST' })
        localStorage.removeItem('cart')

        // Décrémenter l'inventaire
        for (const item of orderData.items) {
          try {
            await fetch('/api/inventory/decrement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: item.productId || item.id,
                quantity: item.quantity
              })
            })
          } catch (error) {
            console.warn('Erreur décrémentation inventaire:', error)
          }
        }

        // Nettoyer le localStorage
        localStorage.removeItem('paypal_checkout_data')
        localStorage.removeItem('paypal_pending_order_id')
        localStorage.removeItem('paypal_checkout_callbacks')
        localStorage.removeItem('pendingOrder')

        // Rediriger vers la page de succès
        const successParams = new URLSearchParams({
          orderId: orderCreated.order.id,
          orderNumber: orderCreated.order.orderNumber,
          total: orderCreated.order.total.toString(),
          currency: orderCreated.order.currency,
          email: session?.user?.email || orderData.email || '',
          paymentMethod: orderData.paymentType
        })

        toast({
          title: "Paiement réussi !",
          description: `Commande ${orderCreated.order.orderNumber} confirmée`,
          variant: "default"
        })

        router.push(`/order-success?${successParams.toString()}`)

      } else {
        throw new Error('Paiement non confirmé par PayPal')
      }

    } catch (error) {
      console.error('❌ Erreur traitement retour PayPal:', error)
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.",
        variant: "destructive"
      })
      
      // Nettoyer et revenir au checkout
      localStorage.removeItem('paypal_checkout_data')
      localStorage.removeItem('paypal_pending_order_id')
      router.replace('/checkout')
    } finally {
      setIsProcessingPayPalReturn(false)
    }
  }

  // Écran de traitement du retour PayPal
  if (isProcessingPayPalReturn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Finalisation de votre commande</h2>
          <p className="mt-2 text-gray-600">Traitement du paiement PayPal en cours...</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>✅ Vérification du paiement</p>
            <p>📦 Création de la commande</p>
            <p>🗑️ Vidage du panier</p>
            <p>📊 Mise à jour de l'inventaire</p>
          </div>
          <p className="mt-4 text-xs text-gray-400">Veuillez patienter, cela ne prend que quelques secondes...</p>
        </div>
      </div>
    )
  }

  // Simple loading for now - you can add the rest of your checkout logic here
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p>Checkout content will be loaded here...</p>
      </div>
    </div>
  )
}
