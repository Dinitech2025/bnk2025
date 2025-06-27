'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSettings } from '@/lib/contexts/settings-context'
import { getSetting } from '@/lib/hooks/use-site-settings'
import dynamic from 'next/dynamic'
import { CurrencySelector } from '@/components/ui/currency-selector'
import { RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

// Import dynamique du UserMenu avec ssr: false pour éviter les erreurs d'hydratation
const UserMenu = dynamic(() => import('@/components/user-menu'), { 
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-full bg-gray-200"></div>
})

export function SiteHeader() {
  const { settings, isLoading, reloadSettings } = useSettings()
  const [cartItemsCount, setCartItemsCount] = useState(0)
  
  const siteName = getSetting(settings, 'siteName', 'BoutikNaka')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  // Reduced logging during build to avoid spam
  if (process.env.NODE_ENV === 'development') {
    console.log('SiteHeader - Settings:', { siteName, logoUrl, useSiteLogo, settings })
  }

  // Simuler le nombre d'articles dans le panier (à remplacer par votre logique réelle)
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItemsCount(cart.length)
    }

    // Mettre à jour au chargement
    updateCartCount()

    // Écouter les changements du panier
    window.addEventListener('cartUpdated', updateCartCount)
    window.addEventListener('storage', updateCartCount)

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount)
      window.removeEventListener('storage', updateCartCount)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-20 items-center">
        <Link href="/" className="flex items-center space-x-2">
          {useSiteLogo && logoUrl ? (
            <div className="relative h-24 w-72 -ml-8">
              <Image
                src={logoUrl}
                alt={siteName}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <span className="text-xl font-bold">{siteName}</span>
          )}
        </Link>
        <nav className="ml-auto flex items-center space-x-4">
          <Link
            href="/devis"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Faire un devis
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Produits
          </Link>
          <Link
            href="/services"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Services
          </Link>
          <Link
            href="/subscriptions"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Abonnements
          </Link>
          <Link 
            href="/contact" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Contact
          </Link>
          <Link 
            href="/currency-converter" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Convertisseur
          </Link>
          
          {/* Panier */}
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          <div className="relative group">
            <CurrencySelector className="w-24" />
            <div className="absolute right-0 mt-1 w-48 p-2 bg-white shadow-lg rounded-md border hidden group-hover:block text-xs text-gray-500">
              Sélectionnez une devise pour voir les prix convertis
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={reloadSettings}
            title="Recharger les paramètres"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <UserMenu />
        </nav>
      </div>
    </header>
  )
} 
