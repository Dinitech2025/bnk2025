'use client'

import { useCurrency } from '@/lib/contexts/currency-context'
import { getCurrencySymbol } from '@/lib/utils/currency-symbols'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentExchangeRate?: number | null
  paymentBaseCurrency?: string | null
  paymentDisplayCurrency?: string | null
  originalAmount?: number | null
}

interface PaymentSummaryProps {
  payments: Payment[]
  orderTotal: number
  orderCurrency: string
  orderExchangeRates?: string | null // JSON string des taux enregistrés
  orderDisplayCurrency?: string | null
  orderExchangeRate?: number | null
}

export function PaymentSummary({ 
  payments, 
  orderTotal, 
  orderCurrency, 
  orderExchangeRates, 
  orderDisplayCurrency, 
  orderExchangeRate 
}: PaymentSummaryProps) {
  const { currency, targetCurrency, exchangeRates } = useCurrency()

  // Déterminer le meilleur taux à utiliser (priorité aux paiements)
  const getBestExchangeRate = (targetCurrency: string) => {
    // PRIORITÉ 1: Taux de paiement si disponible
    const completedPayment = payments.find(p => 
      p.status === 'COMPLETED' && 
      p.paymentExchangeRate && 
      p.paymentDisplayCurrency === targetCurrency
    )
    
    if (completedPayment && completedPayment.paymentExchangeRate) {
      return {
        rate: completedPayment.paymentExchangeRate,
        source: 'payment',
        isStored: true
      }
    }
    
    // PRIORITÉ 2: Taux de commande
    if (orderExchangeRate && orderDisplayCurrency === targetCurrency) {
      return {
        rate: orderExchangeRate,
        source: 'order',
        isStored: true
      }
    }
    
    // PRIORITÉ 3: Taux actuels
    const currentRate = exchangeRates[targetCurrency]
    if (currentRate) {
      return {
        rate: currentRate,
        source: 'current',
        isStored: false
      }
    }
    
    return null
  }
  
  // Helper pour convertir les prix
  const convertPrice = (price: number, fromCurrency: string, targetCurrency?: string) => {
    if (!targetCurrency || targetCurrency === fromCurrency) return price
    
    const rateInfo = getBestExchangeRate(targetCurrency)
    if (rateInfo) {
      return price * rateInfo.rate
    }
    
    return price
  }

  // Helper pour formater les prix avec conversion
  const formatPrice = (price: number, fromCurrency: string = orderCurrency) => {
    const displayCurrency = targetCurrency || currency
    
    if (displayCurrency === fromCurrency) {
      return `${price.toLocaleString()} ${getCurrencySymbol(displayCurrency)}`
    }
    
    const rateInfo = getBestExchangeRate(displayCurrency)
    if (rateInfo) {
      const convertedPrice = price * rateInfo.rate
      const lockIcon = rateInfo.isStored ? ' 🔒' : ''
      return `${convertedPrice.toLocaleString()} ${getCurrencySymbol(displayCurrency)}${lockIcon}`
    }
    
    return `${price.toLocaleString()} ${getCurrencySymbol(fromCurrency)}`
  }

  // Calculer les totaux
  const totalPaid = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const remaining = Math.max(0, orderTotal - totalPaid)

  return (
    <div className="pt-2 border-t">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total payé:</span>
          <span className="font-medium">{formatPrice(totalPaid, orderCurrency)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Restant:</span>
            <span className="font-medium text-orange-600">{formatPrice(remaining, orderCurrency)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t">
          <span className="text-muted-foreground">Total commande:</span>
          <span className="font-semibold">{formatPrice(orderTotal, orderCurrency)}</span>
        </div>
        
        {(() => {
          const displayCurrency = targetCurrency || currency
          const rateInfo = getBestExchangeRate(displayCurrency)
          
          if (rateInfo && rateInfo.isStored) {
            return (
              <div className="mt-2 text-xs text-muted-foreground">
                🔒 Taux figé ({rateInfo.source === 'payment' ? 'paiement' : 'commande'})
              </div>
            )
          }
          return null
        })()}
      </div>
    </div>
  )
}
