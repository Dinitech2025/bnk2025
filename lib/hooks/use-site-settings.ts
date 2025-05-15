'use client'

import { useState, useEffect } from 'react'

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
  [key: string]: string
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings')
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des paramètres')
        }
        
        const data = await response.json()
        setSettings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, isLoading, error }
}

// Fonction utilitaire pour obtenir un paramètre avec une valeur par défaut
export function getSetting(settings: SiteSettings | null, key: string, defaultValue: string = ''): string {
  if (!settings) return defaultValue
  return settings[key] || defaultValue
} 