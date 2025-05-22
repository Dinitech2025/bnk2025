'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import dynamic from 'next/dynamic'
import { CurrencySelector } from '@/components/ui/currency-selector'

// Import dynamique du UserMenu avec ssr: false pour éviter les erreurs d'hydratation
const UserMenu = dynamic(() => import('@/components/user-menu'), { 
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-full bg-gray-200"></div>
})

export function SiteHeader() {
  const { settings, isLoading } = useSiteSettings()
  
  const siteName = getSetting(settings, 'siteName', 'BoutikNaka')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          {useSiteLogo && logoUrl ? (
            <div className="relative h-10 w-40">
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
          <div className="relative group">
            <CurrencySelector className="w-24" />
            <div className="absolute right-0 mt-1 w-48 p-2 bg-white shadow-lg rounded-md border hidden group-hover:block text-xs text-gray-500">
              Sélectionnez une devise pour voir les prix convertis
            </div>
          </div>
          <UserMenu />
        </nav>
      </div>
    </header>
  )
} 
