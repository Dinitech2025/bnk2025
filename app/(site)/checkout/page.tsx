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
  timestamp: string
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

export default function CheckoutPage() {
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
    password: '', // Pour création de compte seulement
    
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
    
    // Options de compte
    hasAccount: false, // Toggle connexion/création
    createAccount: true, // Par défaut, créer un compte
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

  // Gestion optimisée de la session utilisateur
  useEffect(() => {
    // Initialiser dès que le statut de session est connu
    if (status !== 'loading') {
      if (session?.user?.id) {
        // Utilisateur connecté : charger ses données
        setFormData(prev => ({
          ...prev,
          email: session.user.email || '',
          phone: session.user.phone || '',
          firstName: session.user.firstName || '',
          lastName: session.user.lastName || '',
          hasAccount: true // L'utilisateur est déjà connecté
        }))
        loadUserAddresses()
      }
      setSessionInitialized(true)
    }
  }, [session, status])

  const loadUserAddresses = async () => {
    try {
      console.log('🏠 Chargement des adresses utilisateur...')
      const response = await fetch('/api/profile/addresses')
      console.log('📡 Réponse API addresses:', response.status)
      
      if (response.ok) {
        const addresses = await response.json()
        console.log('📍 Adresses récupérées:', addresses)
        console.log('📊 Nombre d\'adresses:', addresses.length)
        console.log('🏷️ Types d\'adresses:', addresses.map((addr: UserAddress) => addr.type))
        
        setUserAddresses(addresses)
        
        // Pré-sélectionner les adresses par défaut
        const defaultBilling = addresses.find((addr: UserAddress) => addr.type === 'BILLING' && addr.isDefault)
        const defaultShipping = addresses.find((addr: UserAddress) => addr.type === 'SHIPPING' && addr.isDefault)
        
        console.log('🏠 Adresse facturation par défaut:', defaultBilling)
        console.log('🚚 Adresse livraison par défaut:', defaultShipping)
        
        if (defaultBilling) {
          setFormData(prev => ({
            ...prev,
            selectedBillingAddressId: defaultBilling.id,
            billingAddress: defaultBilling.street,
            billingCity: defaultBilling.city,
            billingZipCode: defaultBilling.zipCode,
            billingCountry: defaultBilling.country
          }))
        }
        
        if (defaultShipping) {
          setFormData(prev => ({
            ...prev,
            selectedShippingAddressId: defaultShipping.id,
            shippingAddress: defaultShipping.street,
            shippingCity: defaultShipping.city,
            shippingZipCode: defaultShipping.zipCode,
            shippingCountry: defaultShipping.country
          }))
        }
      } else {
        console.error('❌ Erreur réponse API addresses:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des adresses:', error)
    }
  }

  // Chargement optimisé des données de commande
  useEffect(() => {
    if (!isMounted || !sessionInitialized) return

    // Charger les données de commande depuis localStorage
    const savedOrder = localStorage.getItem('pendingOrder')
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder)
        console.log('Données de commande chargées:', parsedOrder)
        setOrderData(parsedOrder)
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur lors du parsing des données de commande:', error)
        router.push('/cart')
      }
    } else {
      // Rediriger vers le panier si pas de commande en attente
      router.push('/cart')
    }
  }, [router, isMounted, sessionInitialized])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBinding(checked)
    if (checked) {
      // Copier les données de facturation vers la livraison
      setFormData(prev => ({
        ...prev,
        shippingAddress: prev.billingAddress,
        shippingCity: prev.billingCity,
        shippingZipCode: prev.billingZipCode,
        shippingCountry: prev.billingCountry
      }))
    }
  }

  // Fonction pour sélectionner une adresse sauvegardée
  const handleSelectAddress = (address: UserAddress, type: 'billing' | 'shipping') => {
    const updates: any = {}
    
    if (type === 'billing') {
      updates.selectedBillingAddressId = address.id
      updates.billingAddress = address.street
      updates.billingCity = address.city
      updates.billingZipCode = address.zipCode
      updates.billingCountry = address.country
    } else {
      updates.selectedShippingAddressId = address.id
      updates.shippingAddress = address.street
      updates.shippingCity = address.city
      updates.shippingZipCode = address.zipCode
      updates.shippingCountry = address.country
    }
    
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // Fonction pour passer en mode saisie manuelle
  const handleManualAddress = (type: 'billing' | 'shipping') => {
    if (type === 'billing') {
      setFormData(prev => ({ ...prev, selectedBillingAddressId: '' }))
    } else {
      setFormData(prev => ({ ...prev, selectedShippingAddressId: '' }))
    }
  }

  // Synchroniser automatiquement les adresses si "même adresse" est cochée
  useEffect(() => {
    if (sameAsbilling) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: prev.billingAddress,
        shippingCity: prev.billingCity,
        shippingZipCode: prev.billingZipCode,
        shippingCountry: prev.billingCountry
      }))
    }
  }, [formData.billingAddress, formData.billingCity, formData.billingZipCode, formData.billingCountry, sameAsbilling])

  // Fonction pour se connecter avec NextAuth
  const handleLogin = async () => {
    if (!formData.email && !formData.phone) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez saisir votre email ou téléphone",
        variant: "destructive"
      })
      return
    }

    if (!formData.password) {
      toast({
        title: "Mot de passe manquant",
        description: "Veuillez saisir votre mot de passe",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🔐 Tentative de connexion avec:', {
        email: formData.email || 'non fourni',
        phone: formData.phone || 'non fourni',
        hasPassword: !!formData.password
      })

      const result = await signIn('credentials', {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
        redirect: false
      })

      console.log('🔐 Résultat de connexion:', result)

      if (result?.error) {
        console.error('❌ Erreur de connexion NextAuth:', result.error)
        toast({
          title: "Erreur de connexion",
          description: "Identifiants incorrects",
          variant: "destructive"
        })
      } else if (result?.ok) {
        console.log('✅ Connexion NextAuth réussie')
        toast({
          title: "Connexion réussie !",
          description: "Vous êtes maintenant connecté.",
        })
        // La session sera mise à jour automatiquement
      }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter. Vérifiez vos identifiants.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderData) return

    // Si l'utilisateur n'est pas connecté mais a un compte, demander de se connecter d'abord
    // (Cette vérification est ignorée si l'utilisateur est déjà connecté)
    if (formData.hasAccount && !session) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter avant de procéder au paiement",
        variant: "destructive"
      })
      return
    }

    // Validation basique : au moins email OU téléphone (seulement si pas connecté)
    if (!session && !formData.email && !formData.phone) {
      toast({
        title: "Contact requis",
        description: "Veuillez saisir au moins votre email ou votre téléphone",
        variant: "destructive"
      })
      return
    }

    // Validation des champs requis selon le mode (connexion vs création) - seulement si pas connecté
    if (!session && !formData.hasAccount) {
      // Mode création de compte : prénom, nom requis
      if (!formData.firstName || !formData.lastName) {
        toast({
          title: "Informations manquantes",
          description: "Veuillez remplir au moins votre prénom et nom pour créer votre compte",
          variant: "destructive"
        })
        return
      }

      if (!formData.password || formData.password.length < 6) {
        toast({
          title: "Mot de passe requis",
          description: "Le mot de passe doit contenir au moins 6 caractères",
          variant: "destructive"
        })
        return
      }
    }

    // Validation de méthode de paiement maintenant gérée par PaymentMethodSelector

    // Validation des adresses
    if (!formData.billingCity) {
      toast({
        title: "Adresse de facturation",
        description: "Veuillez indiquer au moins la ville de facturation",
        variant: "destructive"
      })
      return
    }

    if (!sameAsbilling && !formData.shippingCity) {
      toast({
        title: "Adresse de livraison",
        description: "Veuillez indiquer au moins la ville de livraison",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Préparer les données de la commande pour l'API
      const orderPayload = {
        customer: {
          email: session?.user?.email || formData.email,
          phone: session?.user?.phone || formData.phone,
          firstName: session?.user?.firstName || formData.firstName,
          lastName: session?.user?.lastName || formData.lastName,
          password: session ? undefined : formData.password, // Pas de mot de passe si déjà connecté
          hasAccount: formData.hasAccount || !!session, // True si connecté ou compte existant
          createAccount: !formData.hasAccount && !session, // Créer seulement si pas de compte et pas connecté
          newsletter: formData.newsletter
        },
        billingAddress: {
          street: formData.billingAddress,
          city: formData.billingCity,
          zipCode: formData.billingZipCode || '000',
          country: formData.billingCountry
        },
        shippingAddress: sameAsbilling ? {
          street: formData.billingAddress,
          city: formData.billingCity,
          zipCode: formData.billingZipCode || '000',
          country: formData.billingCountry
        } : {
          street: formData.shippingAddress,
          city: formData.shippingCity,
          zipCode: formData.shippingZipCode || '000',
          country: formData.shippingCountry
        },
        items: orderData.items.map(item => {
          const itemData: any = {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            type: item.type || 'product'
          }

          // Ajouter les champs spécifiques selon le type
          if (item.type === 'product') {
            itemData.productId = item.id
          } else if (item.type === 'service') {
            itemData.serviceId = item.id
          } else if (item.type === 'offer') {
            itemData.offerId = item.id
            if (item.platform) {
              itemData.platform = item.platform
            }
            if (item.reservation) {
              itemData.reservation = item.reservation
            }
          }

          return itemData
        }),
        total: orderData.total,
        currency: orderData.currency,
        paymentMethod: 'handled_by_payment_component', // Géré par PaymentMethodSelector
        notes: formData.notes,
        timestamp: new Date().toISOString()
      }

      console.log('Envoi de la commande:', orderPayload)

      const response = await fetch('/api/public/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      })

      const result = await response.json()
      
      console.log('🔍 Réponse de l\'API:', result)
      console.log('🔍 response.ok:', response.ok)

      if (response.ok) {
        // Nettoyer le localStorage
        localStorage.removeItem('pendingOrder')
        localStorage.removeItem('cart')

        // Rediriger vers la page de succès avec les informations
        const searchParams = new URLSearchParams({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          total: orderData.total.toString(),
          currency: orderData.currency,
          email: session?.user?.email || formData.email,
          accountCreated: result.accountCreated ? 'true' : 'false'
        })
        
        router.push(`/order-success?${searchParams.toString()}`)
      } else {
        throw new Error(result.message || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de votre commande",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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

  // Éviter l'erreur d'hydratation et optimiser le chargement
  if (!isMounted || status === 'loading' || !sessionInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Initialisation...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Aucune commande en attente</h1>
          <p className="text-gray-600">Retournez au panier pour passer une commande</p>
          <Link href="/cart">
            <Button>Retour au panier</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/cart" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au panier
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulaire de commande */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Informations de contact
                </div>
                {session && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connecté
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Afficher les champs seulement si l'utilisateur n'est PAS connecté */}
              {!session && (
                <>
                  {/* Toggle Connexion/Création de compte */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="newAccount"
                          name="accountType"
                          checked={!formData.hasAccount}
                          onChange={() => handleInputChange('hasAccount', false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Label htmlFor="newAccount" className="text-sm font-medium">
                          Créer un compte
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="existingAccount"
                          name="accountType"
                          checked={formData.hasAccount}
                          onChange={() => handleInputChange('hasAccount', true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Label htmlFor="existingAccount" className="text-sm font-medium">
                          J'ai déjà un compte
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Champs nom/prénom uniquement pour la création de compte */}
                  {!formData.hasAccount && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="email">
                      Email {formData.phone ? '' : '*'}
                      {formData.phone && <span className="text-gray-400 text-sm"> (optionnel si téléphone fourni)</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required={!formData.phone}
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      Téléphone {formData.email ? '' : '*'}
                      {formData.email && <span className="text-gray-400 text-sm"> (optionnel si email fourni)</span>}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required={!formData.email}
                      placeholder="+261 34 12 345 67"
                    />
                  </div>

                  {(!formData.email && !formData.phone) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Information :</strong> Veuillez fournir au moins votre email ou votre téléphone pour pouvoir vous contacter.
                      </p>
                    </div>
                  )}

                  {/* Champ mot de passe */}
                  <div>
                    <Label htmlFor="password">
                      {formData.hasAccount ? 'Mot de passe *' : 'Créer un mot de passe *'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={formData.hasAccount ? 'Votre mot de passe' : 'Choisissez un mot de passe sécurisé'}
                      required
                    />
                    {!formData.hasAccount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 6 caractères. Vous pourrez vous connecter avec ce mot de passe.
                      </p>
                    )}
                  </div>

                  {/* Bouton de connexion pour les comptes existants */}
                  {formData.hasAccount && (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={handleLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!formData.password || (!formData.email && !formData.phone)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Se connecter
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Connectez-vous pour récupérer vos adresses et informations
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Résumé des informations utilisateur connecté */}
              {session && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {session.user.firstName} {session.user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {session.user.email}
                          {session.user.phone && (
                            <>
                              <span className="mx-1">•</span>
                              {session.user.phone}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      ✨ Vos informations sont automatiquement remplies
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => signOut({ callbackUrl: '/cart' })}
                      className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                    >
                      Changer de compte
                    </Button>
                  </div>
                </div>
              )}

              <Separator />
              
              <div className="space-y-3">
                {!formData.hasAccount && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="createAccount" 
                      checked={formData.createAccount}
                      onCheckedChange={(checked) => handleInputChange('createAccount', checked as boolean)}
                    />
                    <Label htmlFor="createAccount" className="text-sm">
                      Créer un compte client (recommandé)
                    </Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="newsletter" 
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => handleInputChange('newsletter', checked as boolean)}
                  />
                  <Label htmlFor="newsletter" className="text-sm">
                    S'abonner à la newsletter pour les offres spéciales
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Adresse de facturation
                </div>
                {session && userAddresses.filter(addr => addr.type === 'BILLING' || addr.type === 'HOME' || addr.type === 'WORK').length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {userAddresses.filter(addr => addr.type === 'BILLING' || addr.type === 'HOME' || addr.type === 'WORK').length} adresse(s) disponible(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélecteur d'adresses pour utilisateurs connectés */}
              {session && userAddresses.filter(addr => addr.type === 'BILLING' || addr.type === 'HOME' || addr.type === 'WORK').length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Choisir une adresse sauvegardée</Label>
                  <div className="grid gap-3">
                    {userAddresses
                      .filter(addr => addr.type === 'BILLING' || addr.type === 'HOME' || addr.type === 'WORK')
                      .map((address) => (
                        <div
                          key={address.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.selectedBillingAddressId === address.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSelectAddress(address, 'billing')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{address.street}</p>
                                {address.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {address.type === 'HOME' ? 'Domicile' : address.type === 'WORK' ? 'Travail' : address.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                {address.city}, {address.zipCode} - {address.country}
                              </p>
                            </div>
                            {formData.selectedBillingAddressId === address.id && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* Options saisie manuelle et nouvelle adresse */}
                  <div className="pt-2 border-t space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManualAddress('billing')}
                      className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Saisir une nouvelle adresse
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/profile/addresses/new?type=billing&redirect=checkout', '_blank')}
                      className="w-full justify-start text-gray-600 hover:text-gray-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une adresse de facturation
                    </Button>
                  </div>
                </div>
              )}

              {/* Formulaire de saisie manuelle (affiché si pas d'adresse sélectionnée ou pas d'utilisateur connecté) */}
              {(!session || userAddresses.filter(addr => addr.type === 'BILLING' || addr.type === 'HOME' || addr.type === 'WORK').length === 0 || !formData.selectedBillingAddressId) && (
                <>
                  <div>
                    <Label htmlFor="billingAddress">Adresse</Label>
                    <Textarea
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      rows={3}
                      placeholder="Numéro, rue, quartier..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingCity">Ville *</Label>
                      <Input
                        id="billingCity"
                        value={formData.billingCity}
                        onChange={(e) => handleInputChange('billingCity', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingZipCode">Code postal</Label>
                      <Input
                        id="billingZipCode"
                        value={formData.billingZipCode}
                        onChange={(e) => handleInputChange('billingZipCode', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billingCountry">Pays</Label>
                    <Select 
                      value={formData.billingCountry} 
                      onValueChange={(value) => handleInputChange('billingCountry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Madagascar">Madagascar</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Maurice">Maurice</SelectItem>
                        <SelectItem value="Comores">Comores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Adresse de livraison
                </div>
                {session && userAddresses.filter(addr => addr.type === 'SHIPPING' || addr.type === 'HOME' || addr.type === 'WORK').length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {userAddresses.filter(addr => addr.type === 'SHIPPING' || addr.type === 'HOME' || addr.type === 'WORK').length} adresse(s) disponible(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sameAsBilling" 
                  checked={sameAsbilling}
                  onCheckedChange={handleSameAsBillingChange}
                />
                <Label htmlFor="sameAsBilling" className="text-sm">
                  Identique à l'adresse de facturation
                </Label>
              </div>
              
              {!sameAsbilling && (
                <>
                  {/* Sélecteur d'adresses de livraison pour utilisateurs connectés */}
                  {session && userAddresses.filter(addr => addr.type === 'SHIPPING' || addr.type === 'HOME' || addr.type === 'WORK').length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Choisir une adresse de livraison sauvegardée</Label>
                      <div className="grid gap-3">
                        {userAddresses
                          .filter(addr => addr.type === 'SHIPPING' || addr.type === 'HOME' || addr.type === 'WORK')
                          .map((address) => (
                            <div
                              key={address.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                formData.selectedShippingAddressId === address.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleSelectAddress(address, 'shipping')}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{address.street}</p>
                                    {address.isDefault && (
                                      <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {address.type === 'HOME' ? 'Domicile' : address.type === 'WORK' ? 'Travail' : address.type}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {address.city}, {address.zipCode} - {address.country}
                                  </p>
                                </div>
                                {formData.selectedShippingAddressId === address.id && (
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                      
                      {/* Options saisie manuelle et nouvelle adresse */}
                      <div className="pt-2 border-t space-y-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManualAddress('shipping')}
                          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Saisir une nouvelle adresse de livraison
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/profile/addresses/new?type=shipping&redirect=checkout', '_blank')}
                          className="w-full justify-start text-gray-600 hover:text-gray-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une adresse de livraison
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Formulaire de saisie manuelle (affiché si pas d'adresse sélectionnée ou pas d'utilisateur connecté) */}
                  {(!session || userAddresses.filter(addr => addr.type === 'SHIPPING' || addr.type === 'HOME' || addr.type === 'WORK').length === 0 || !formData.selectedShippingAddressId) && (
                    <>
                      <div>
                        <Label htmlFor="shippingAddress">Adresse</Label>
                        <Textarea
                          id="shippingAddress"
                          value={formData.shippingAddress}
                          onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                          rows={3}
                          placeholder="Numéro, rue, quartier..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shippingCity">Ville *</Label>
                          <Input
                            id="shippingCity"
                            value={formData.shippingCity}
                            onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                            required={!sameAsbilling}
                          />
                        </div>
                        <div>
                          <Label htmlFor="shippingZipCode">Code postal</Label>
                          <Input
                            id="shippingZipCode"
                            value={formData.shippingZipCode}
                            onChange={(e) => handleInputChange('shippingZipCode', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shippingCountry">Pays</Label>
                        <Select 
                          value={formData.shippingCountry} 
                          onValueChange={(value) => handleInputChange('shippingCountry', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Madagascar">Madagascar</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Maurice">Maurice</SelectItem>
                            <SelectItem value="Comores">Comores</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes optionnelles */}
          <Card>
            <CardHeader>
              <CardTitle>Notes et instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Instructions spéciales, préférences de livraison, informations de paiement..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Résumé de commande */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Résumé de votre commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderData.items.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
                  {item.type === 'subscription' && item.platform?.logo ? (
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <Image
                        src={item.platform.logo}
                        alt={item.platform.name}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded flex-shrink-0" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      {item.type === 'subscription' && (
                        <Badge variant="secondary" className="text-xs">
                          Abonnement
                        </Badge>
                      )}
                    </div>
                    
                    {item.type === 'subscription' && (
                      <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.duration}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {item.maxProfiles} profil{item.maxProfiles! > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Qté: {item.quantity}</span>
                      <span className="font-medium text-sm">
                        {(item.price * item.quantity).toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{orderData.total.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de service</span>
                  <span>Gratuit</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{orderData.total.toLocaleString()} Ar</span>
                </div>
              </div>

              {/* Note pour les abonnements */}
              {orderData.items.some(item => item.type === 'subscription') && (
                <div className="bg-amber-50 p-3 rounded text-xs text-amber-700">
                  <p className="font-medium mb-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Abonnements réservés
                  </p>
                  <p>Les détails de connexion seront envoyés par email après confirmation du paiement.</p>
                </div>
              )}

              {/* Note création de compte */}
              {formData.createAccount && (
                <div className="bg-green-50 p-3 rounded text-xs text-green-700">
                  <p className="font-medium mb-1">✨ Compte client</p>
                  <p>Un compte sera automatiquement créé avec votre email pour suivre vos commandes.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sélecteur de méthode de paiement intégré */}
          <PaymentMethodSelector
            total={orderData.total}
            currency="Ar"
            orderData={{
              ...orderData,
              billingDetails: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.billingAddress,
                city: formData.billingCity,
                zipCode: formData.billingZipCode,
                country: formData.billingCountry
              },
              shippingDetails: {
                address: sameAsbilling ? formData.billingAddress : formData.shippingAddress,
                city: sameAsbilling ? formData.billingCity : formData.shippingCity,
                zipCode: sameAsbilling ? formData.billingZipCode : formData.shippingZipCode,
                country: sameAsbilling ? formData.billingCountry : formData.shippingCountry
              },
              notes: formData.notes,
              orderId: `BNK-${Date.now()}`
            }}
            onPaymentSuccess={(paymentData) => {
              console.log('Paiement réussi:', paymentData)
              toast({
                title: "Paiement réussi !",
                description: paymentData.message || "Votre commande a été traitée avec succès.",
              })
              // Rediriger vers la page de succès
              router.push('/order-success')
            }}
            onPaymentError={(error) => {
              console.error('Erreur de paiement:', error)
              toast({
                title: "Erreur de paiement",
                description: error,
                variant: "destructive",
              })
            }}
          />
        </div>
      </div>
    </div>
  )
} 