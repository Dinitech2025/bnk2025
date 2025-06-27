'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSettings } from '@/lib/contexts/settings-context'
import { getSetting } from '@/lib/hooks/use-site-settings'
import { CurrencySelector } from '@/components/ui/currency-selector'
import { RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { UserMenu } from '@/components/user-menu'
import { DropdownMenuNav } from '@/components/ui/dropdown-menu-nav'

export function SiteHeader() {
  const { settings, isLoading, reloadSettings } = useSettings()
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  
  const siteName = getSetting(settings, 'siteName', 'BoutikNaka')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  // Marquer le composant comme monté
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reduced logging during build to avoid spam
  if (process.env.NODE_ENV === 'development') {
    console.log('SiteHeader - Settings:', { siteName, logoUrl, useSiteLogo, settings })
  }

  // Simuler le nombre d'articles dans le panier (à remplacer par votre logique réelle)
  useEffect(() => {
    if (!isMounted) return

    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartItemsCount(cart.length)
      } catch (error) {
        console.error('Erreur lors de la lecture du panier:', error)
        setCartItemsCount(0)
      }
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
  }, [isMounted])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-20 items-center justify-between">
        {/* Logo à gauche */}
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

        {/* Menu centré */}
        <nav className="flex items-center space-x-6">
          <Link
            href="/devis"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Faire un devis
          </Link>
          <DropdownMenuNav
            title="Produits"
            href="/products"
            type="products"
          />
          <DropdownMenuNav
            title="Services"
            href="/services"
            type="services"
          />
          <DropdownMenuNav
            title="Abonnements"
            href="/subscriptions"
            type="platforms"
          />
        </nav>

        {/* Actions à droite */}
        <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  )
} 
