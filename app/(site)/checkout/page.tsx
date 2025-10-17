import { Suspense } from 'react'
import CheckoutContent from './checkout-content'
import { SecurityBadgeRow } from '@/components/ui/security-badge'

function CheckoutLoading() {
    return (
      <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement du checkout sécurisé...</p>
        <SecurityBadgeRow className="justify-center mt-4" />
        </div>
      </div>
    )
  }

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🛒 Finaliser votre commande
            </h1>
            <p className="text-gray-600 mb-4">
              Boutique e-commerce sécurisée • Paiement protégé
            </p>
            
            {/* Badges de sécurité pour rassurer Google Safe Browsing */}
            <SecurityBadgeRow className="justify-center mb-6" />
              </div>

          <Suspense fallback={<CheckoutLoading />}>
            <CheckoutContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 
