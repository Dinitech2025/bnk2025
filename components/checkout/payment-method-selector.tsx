'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone, DollarSign, Truck } from 'lucide-react'
import { PayPalUnified } from './paypal-unified'
import { PayPalPopup } from './paypal-popup'
import { PayPalNewTab } from './paypal-new-tab'
import { PayPalWindow } from './paypal-window'
import { PayPalRedirect } from './paypal-redirect'

interface PaymentMethodSelectorProps {
  total: number
  currency: string
  orderData: any
  onPaymentSuccess: (paymentData: any) => void
  onPaymentError: (error: string) => void
}

export function PaymentMethodSelector({
  total,
  currency,
  orderData,
  onPaymentSuccess,
  onPaymentError
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [usePopupMode, setUsePopupMode] = useState(false)
  const [useNewTabMode, setUseNewTabMode] = useState(false)
  const [useWindowMode, setUseWindowMode] = useState(false)
  const [useRedirectMode, setUseRedirectMode] = useState(false)

  const paymentMethods = [
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Paiement via votre compte PayPal',
      icon: <DollarSign className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'credit_card',
      name: 'Carte bancaire',
      description: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'digital_wallet',
      name: 'Portefeuille digital',
      description: 'Apple Pay, Google Pay',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'MVola, Orange Money',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: false // Pas encore implémenté
    },
    {
      id: 'cash_on_delivery',
      name: 'Paiement à la livraison',
      description: 'Payez en espèces ou carte lors de la livraison',
      icon: <Truck className="h-5 w-5" />,
      enabled: true
    }
  ]

  const renderPaymentForm = () => {
    if (!selectedMethod) return null

    switch (selectedMethod) {
      case 'paypal':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💳 Payez avec votre compte PayPal ou toute carte bancaire via PayPal sécurisé.
              </p>
            </div>
            
            {useRedirectMode ? (
              <div className="space-y-3">
                <PayPalRedirect
                  paymentType="paypal"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
                <Button 
                  onClick={() => {
                    setUseRedirectMode(false)
                    setUseWindowMode(false)
                    setUseNewTabMode(false)
                    setUsePopupMode(false)
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🔄 Retour au mode normal
                </Button>
              </div>
            ) : useWindowMode ? (
              <div className="space-y-3">
                <PayPalWindow
                  paymentType="paypal"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
                <Button 
                  onClick={() => {
                    setUseWindowMode(false)
                    setUseNewTabMode(false)
                    setUsePopupMode(false)
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🔄 Retour au mode normal
                </Button>
              </div>
            ) : useNewTabMode ? (
              <div className="space-y-3">
                <PayPalNewTab
                  paymentType="paypal"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => {
                      setUseNewTabMode(false)
                      setUseWindowMode(true)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    🪟 Fenêtre
                  </Button>
                  <Button 
                    onClick={() => {
                      setUseNewTabMode(false)
                      setUsePopupMode(false)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Mode normal
                  </Button>
                </div>
              </div>
            ) : usePopupMode ? (
              <div className="space-y-3">
                <PayPalPopup
                  paymentType="paypal"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => {
                      setUsePopupMode(false)
                      setUseNewTabMode(true)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    🗂️ Nouvel onglet
                  </Button>
                  <Button 
                    onClick={() => setUsePopupMode(false)}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Mode normal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <PayPalUnified
                  paymentType="paypal"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={(error) => {
                    console.log('🔄 PayPal SDK échoué, proposition du mode redirection')
                    // En cas d'erreur, proposer directement le mode redirection
                    setUseRedirectMode(true)
                  }}
                />
                <div className="grid grid-cols-4 gap-1">
                  <Button 
                    onClick={() => setUseRedirectMode(true)}
                    variant="outline"
                    size="sm"
                  >
                    🌐 Redirection
                  </Button>
                  <Button 
                    onClick={() => setUseWindowMode(true)}
                    variant="outline"
                    size="sm"
                  >
                    🪟 Fenêtre
                  </Button>
                  <Button 
                    onClick={() => setUseNewTabMode(true)}
                    variant="outline"
                    size="sm"
                  >
                    🗂️ Onglet
                  </Button>
                  <Button 
                    onClick={() => setUsePopupMode(true)}
                    variant="outline"
                    size="sm"
                  >
                    📋 Popup
                  </Button>
                </div>
              </div>
            )}
          </div>
        )

      case 'credit_card':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💳 Payez directement avec votre carte bancaire. Traitement sécurisé via PayPal (pas besoin de compte).
              </p>
            </div>
            
            {useRedirectMode ? (
              <div className="space-y-3">
                <PayPalRedirect
                  paymentType="credit_card"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
                <Button 
                  onClick={() => setUseRedirectMode(false)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🔄 Retour au mode normal
                </Button>
              </div>
            ) : useWindowMode ? (
              <div className="space-y-3">
                <PayPalWindow
                  paymentType="credit_card"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={onPaymentError}
                />
                <Button 
                  onClick={() => setUseWindowMode(false)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🔄 Retour au mode normal
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <PayPalUnified
                  paymentType="credit_card"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={(error) => {
                    console.log('🔄 Cartes SDK échoué, proposition du mode redirection')
                    setUseRedirectMode(true)
                  }}
                />
                <Button 
                  onClick={() => setUseRedirectMode(true)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🌐 Problème de chargement ? Essayez la redirection
                </Button>
              </div>
            )}
          </div>
        )

      case 'digital_wallet':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                📱 Payez rapidement avec Apple Pay, Google Pay. Authentification biométrique sécurisée.
              </p>
            </div>
            
                        {useWindowMode ? (
              <div className="space-y-3">
                <PayPalWindow
                  paymentType="digital_wallet"
            amount={total}
            currency={currency}
            orderData={orderData}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
                <Button 
                  onClick={() => setUseWindowMode(false)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🔄 Retour au mode normal
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <PayPalUnified
                  paymentType="digital_wallet"
                  amount={total}
                  currency={currency}
                  orderData={orderData}
                  onSuccess={onPaymentSuccess}
                  onError={(error) => {
                    console.log('🔄 Portefeuilles SDK échoué, proposition du mode fenêtre')
                    setUseWindowMode(true)
                  }}
                />
                <Button 
                  onClick={() => setUseWindowMode(true)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  🪟 Problème de chargement ? Essayez la fenêtre
                </Button>
              </div>
            )}
          </div>
        )
      
      case 'mobile_money':
      case 'cash_on_delivery':
        return (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedMethod === 'mobile_money' 
                  ? '📱 Paiement via Mobile Money. Fonctionnalité bientôt disponible.'
                  : '🚚 Vous payerez en espèces ou par carte lors de la livraison.'
                }
              </p>
            </div>
            
            {selectedMethod === 'cash_on_delivery' && (
            <Button 
                onClick={() => {
                  onPaymentSuccess({
                    method: 'cash_on_delivery',
                    status: 'pending',
                    message: 'Commande confirmée - Paiement à la livraison'
                  })
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              disabled={isProcessing}
            >
                <Truck className="h-4 w-4 mr-2" />
                Confirmer la commande
            </Button>
            )}

            {selectedMethod === 'mobile_money' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  🚧 Fonctionnalité en développement
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  MVola et Orange Money seront bientôt disponibles
                </p>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Méthode de paiement</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={(value) => {
            setSelectedMethod(value)
            setIsProcessing(false)
            setUsePopupMode(false) // Reset popup mode when changing payment method
            setUseNewTabMode(false) // Reset new tab mode when changing payment method
            setUseWindowMode(false) // Reset window mode when changing payment method
            setUseRedirectMode(false) // Reset redirect mode when changing payment method
          }}
        >
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Label
                  htmlFor={method.id}
                  className={`flex items-center space-x-3 cursor-pointer ${
                    !method.enabled ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.enabled}
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center space-x-2">
                        <span>{method.name}</span>
                        {!method.enabled && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Bientôt
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.description}
                    </div>
                  </div>
                </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Affichage du formulaire de paiement */}
        {renderPaymentForm()}

        {/* Total récapitulatif */}
        {selectedMethod && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center font-semibold">
              <span>Total à payer :</span>
              <span className="text-lg">
                {total.toLocaleString()} {currency}
                {currency === 'Ar' && (
                  <span className="text-sm text-gray-600 ml-2">
                    (≈ {(total / 5000).toFixed(2)}€)
                  </span>
                )}
              </span>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
} 
