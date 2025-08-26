'use client'

import { useState, useEffect } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Smartphone } from 'lucide-react'

interface DigitalWalletsPayPalProps {
  amount: number
  currency: string
  orderData: any
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

interface DigitalWalletsButtonsWrapperProps extends DigitalWalletsPayPalProps {}

function DigitalWalletsButtonsWrapper({ amount, currency, orderData, onSuccess, onError }: DigitalWalletsButtonsWrapperProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string>('')
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Vérifier que le SDK PayPal est chargé avec timeout
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 30 // 30 secondes maximum

    const checkSDK = () => {
      attempts++
      
      if (typeof window !== 'undefined' && window.paypal && window.paypal.Buttons) {
        setIsSDKReady(true)
        setLoadingTimeout(false)
      } else if (attempts >= maxAttempts) {
        // Timeout après 30 secondes
        setLoadingTimeout(true)
        setPaymentError('Impossible de charger les portefeuilles digitaux. Vérifiez votre connexion.')
        onError('Timeout de chargement des portefeuilles digitaux')
      } else {
        // Réessayer après un délai
        setTimeout(checkSDK, 1000)
      }
    }

    // Démarrer la vérification après un court délai
    const initialTimeout = setTimeout(checkSDK, 500)
    
    return () => clearTimeout(initialTimeout)
  }, [])

  // Convertir le montant selon la devise
  const getPayPalAmount = () => {
    if (currency === 'Ar' || currency === 'MGA') {
      // Conversion approximative MGA vers EUR (1 EUR ≈ 5000 MGA)
      return (amount / 5000).toFixed(2)
    }
    return (amount / 100).toFixed(2)
  }

  const getPayPalCurrency = () => {
    if (currency === 'Ar' || currency === 'MGA') {
      return 'EUR'
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
        throw new Error(data.error || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error('Erreur création commande portefeuille:', error)
      setPaymentError('Impossible de traiter le paiement via portefeuille digital')
      onError('Impossible de traiter le paiement via portefeuille digital')
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
          method: 'digital_wallet',
          status: 'completed',
          transactionId: result.id,
          paypalOrderId: data.orderID,
          message: 'Paiement via portefeuille digital effectué avec succès'
        })
      } else {
        throw new Error('Paiement via portefeuille digital non confirmé')
      }
    } catch (error) {
      console.error('Erreur capture paiement portefeuille:', error)
      setPaymentError('Erreur lors de la confirmation du paiement')
      onError('Erreur lors de la confirmation du paiement via portefeuille digital')
    } finally {
      setIsProcessing(false)
    }
  }

  const onErrorHandler = (err: any) => {
    console.error('Erreur PayPal portefeuille:', err)
    setPaymentError('Erreur de traitement du portefeuille digital')
    onError('Erreur de traitement du portefeuille digital')
    setIsProcessing(false)
  }

  const onCancel = () => {
    setPaymentError('Paiement via portefeuille digital annulé')
    setIsProcessing(false)
  }

  return (
    <div className="space-y-4 pt-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Smartphone className="h-4 w-4" />
              <span>Paiement via portefeuille digital</span>
            </div>

            {currency === 'Ar' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💱 Conversion automatique : {amount.toLocaleString()} Ar ≈ {getPayPalAmount()}€ EUR
                </p>
              </div>
            )}

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                📱 Utilisez Apple Pay, Google Pay ou votre portefeuille digital préféré. Paiement en un clic !
              </p>
            </div>

            {paymentError && (
              <Alert variant="destructive">
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Traitement portefeuille en cours...</span>
                </div>
              </div>
            )}

            <div className="min-h-[200px]">
              {loadingTimeout ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-red-600 mb-2">⚠️ Impossible de charger les portefeuilles digitaux</p>
                    <p className="text-xs text-gray-500">
                      Vérifiez votre connexion internet ou réessayez
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLoadingTimeout(false)
                      setPaymentError('')
                      window.location.reload()
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Réessayer
                  </button>
                </div>
              ) : isSDKReady ? (
                <div className="space-y-3">
                  {/* Apple Pay */}
                  <PayPalButtons
                    style={{
                      layout: 'horizontal',
                      color: 'black',
                      shape: 'rect',
                      label: 'pay',
                      height: 45
                    }}
                    fundingSource="applepay"
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onErrorHandler}
                    onCancel={onCancel}
                    disabled={isProcessing}
                  />
                  
                  {/* Google Pay */}
                  <PayPalButtons
                    style={{
                      layout: 'horizontal',
                      color: 'white',
                      shape: 'rect',
                      label: 'pay',
                      height: 45
                    }}
                    fundingSource="googlepay"
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onErrorHandler}
                    onCancel={onCancel}
                    disabled={isProcessing}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Chargement des portefeuilles digitaux...</span>
                  </div>
                  <p className="text-xs text-gray-400">Apple Pay, Google Pay...</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Touch ID • Face ID • Empreinte digitale • Traitement sécurisé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Portefeuilles supportés par</span>
          <div className="font-semibold text-blue-600">PayPal</div>
        </div>
      </div>
    </div>
  )
}

export function DigitalWalletsPayPal(props: DigitalWalletsPayPalProps) {
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          ⚠️ Portefeuilles digitaux non configurés. Veuillez configurer NEXT_PUBLIC_PAYPAL_CLIENT_ID.
        </p>
      </div>
    )
  }

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: props.currency === 'Ar' ? 'EUR' : props.currency.toUpperCase(),
    intent: 'capture' as const,
    components: 'buttons,applepay,googlepay', // Support portefeuilles digitaux
    'enable-funding': 'applepay,googlepay', // Forcer l'activation des portefeuilles
    'disable-funding': 'paypal,card,paylater,venmo', // Désactiver autres pour ce composant
    // Options pour portefeuilles digitaux
    'buyer-country': 'FR',
    locale: 'fr_FR',
    // Optimisations
    'data-sdk-integration-source': 'button-factory',
    'data-namespace': 'paypal_sdk_wallets'
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <DigitalWalletsButtonsWrapper {...props} />
    </PayPalScriptProvider>
  )
}
