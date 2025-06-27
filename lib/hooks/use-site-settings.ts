import { useState, useEffect, useCallback } from 'react'

interface SiteSettings {
  siteName: string
  siteDescription: string
  siteTagline: string
  logoUrl: string
  faviconUrl: string
  adminLogoUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  currency: string
  currencySymbol: string
  sloganMG: string
  sloganFR: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  useSiteLogo: string
  bannerUrl: string
  footerText: string
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  youtubeUrl: string
  [key: string]: string
}

// Fonction pour récupérer les paramètres
async function fetchSiteSettings(): Promise<SiteSettings> {
  const response = await fetch('/api/settings', {
    cache: 'no-store', // Éviter le cache
    headers: {
      'Cache-Control': 'no-cache',
    }
  })
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des paramètres')
  }
  return response.json()
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchSiteSettings()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Fonction pour recharger manuellement les paramètres
  const reloadSettings = useCallback(() => {
    loadSettings()
  }, [loadSettings])

  return { settings, isLoading, error, reloadSettings }
}

// Fonction utilitaire pour obtenir un paramètre avec une valeur par défaut
export function getSetting(settings: SiteSettings | null, key: string, defaultValue: string = ''): string {
  if (!settings) return defaultValue
  return settings[key] || defaultValue
} 