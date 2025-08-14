'use client'

import { useState, useEffect } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'

interface PayPalCheckoutProps {
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

interface PayPalButtonsWrapperProps extends PayPalCheckoutProps {}

function PayPalButtonsWrapper({ amount, currency, orderData, onSuccess, onError }: PayPalButtonsWrapperProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [isSDKReady, setIsSDKReady] = useState(false)

  // Vérifier que le SDK PayPal est chargé
  useEffect(() => {
    const checkSDK = () => {
      if (typeof window !== 'undefined' && window.paypal && window.paypal.Buttons) {
        setIsSDKReady(true)
      } else {
        // Réessayer après un délai
        setTimeout(checkSDK, 1000)
      }
    }
    checkSDK()
  }, [])

  // Convertir le montant selon la devise
  const getPayPalAmount = () => {
    // PayPal supporte différentes devises
    // Pour Madagascar, nous pourrions convertir en USD ou EUR
    if (currency === 'Ar' || currency === 'MGA') {
      // Conversion approximative MGA vers USD (1 USD ≈ 4500 MGA)
      return (amount / 4500).toFixed(2)
    }
    return (amount / 100).toFixed(2) // Pour les autres devises déjà en centimes
  }

  const getPayPalCurrency = () => {
    // PayPal ne supporte pas MGA directement
    if (currency === 'Ar' || currency === 'MGA') {
      return 'USD'
    }
    return currency.toUpperCase()
  }

  const createOrder = async () => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getPayPalAmount(),
          currency: getPayPalCurrency(),
          orderData
        }),
      })

      const data = await response.json()

      if (data.id) {
        return data.id
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la commande PayPal')
      }
    } catch (error) {
      console.error('Erreur création commande PayPal:', error)
      setPaymentError('Impossible de créer la commande PayPal')
      onError('Impossible de créer la commande PayPal')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const onApprove = async (data: any) => {
    setIsProcessing(true)
    setPaymentError('')

    try {
      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: data.orderID,
          orderData
        }),
      })

      const result = await response.json()

      if (result.status === 'COMPLETED') {
        onSuccess({
          method: 'paypal',
          status: 'completed',
          transactionId: result.id,
          paypalOrderId: data.orderID,
          message: 'Paiement PayPal effectué avec succès'
        })
      } else {
        throw new Error('Paiement non confirmé')
      }
    } catch (error) {
      console.error('Erreur capture paiement PayPal:', error)
      setPaymentError('Erreur lors de la confirmation du paiement')
      onError('Erreur lors de la confirmation du paiement PayPal')
    } finally {
      setIsProcessing(false)
    }
  }

  const onErrorHandler = (err: any) => {
    console.error('Erreur PayPal:', err)
    setPaymentError('Erreur PayPal inattendue')
    onError('Erreur PayPal inattendue')
    setIsProcessing(false)
  }

  const onCancel = () => {
    setPaymentError('Paiement annulé par l\'utilisateur')
    setIsProcessing(false)
  }

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4" />
              <span>Paiement PayPal sécurisé</span>
            </div>

            {currency === 'Ar' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ ${getPayPalAmount()} USD
                </p>
              </div>
            )}

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Traitement PayPal en cours...</span>
                </div>
              </div>
            )}

            <div className="min-h-[200px]">
              {isSDKReady ? (
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal',
                    height: 45
                  }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onErrorHandler}
                  onCancel={onCancel}
                  disabled={isProcessing}
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Chargement de PayPal...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Protection des acheteurs PayPal incluse</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Powered by</span>
          <div className="font-semibold text-blue-600">PayPal</div>
        </div>
      </div>
    </div>
  )
}

export function PayPalCheckout(props: PayPalCheckoutProps) {
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          ⚠️ PayPal non configuré. Veuillez configurer NEXT_PUBLIC_PAYPAL_CLIENT_ID dans les variables d'environnement.
        </p>
      </div>
    )
  }

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: props.currency === 'Ar' ? 'USD' : props.currency.toUpperCase(),
    intent: 'capture' as const,
    components: 'buttons',
    'enable-funding': 'venmo,paylater',
    'disable-funding': 'credit,card',
    // Ajout d'options pour une meilleure stabilité
    'buyer-country': 'US',
    locale: 'fr_FR'
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <PayPalButtonsWrapper {...props} />
    </PayPalScriptProvider>
  )
} 