'use client'

import Link from 'next/link'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export function SiteFooter() {
  const { settings } = useSiteSettings()
  
  const siteName = getSetting(settings, 'siteName', 'BoutikNaka')
  const footerText = getSetting(settings, 'footerText', `© ${new Date().getFullYear()} ${siteName}. Tous droits réservés.`)
  const facebookUrl = getSetting(settings, 'facebookUrl', '')
  const instagramUrl = getSetting(settings, 'instagramUrl', '')
  const twitterUrl = getSetting(settings, 'twitterUrl', '')
  const youtubeUrl = getSetting(settings, 'youtubeUrl', '')

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold">{siteName}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {getSetting(settings, 'siteDescription', '')}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Liens rapides</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-foreground">
                  Produits
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-foreground">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="text-muted-foreground">
                {getSetting(settings, 'address', '')}
              </li>
              <li className="text-muted-foreground">
                {getSetting(settings, 'contactEmail', '')}
              </li>
              <li className="text-muted-foreground">
                {getSetting(settings, 'contactPhone', '')}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">{footerText}</p>
          <div className="mt-4 flex space-x-4 md:mt-0">
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            )}
            {twitterUrl && (
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            )}
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
} 