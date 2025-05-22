'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSiteSettings } from '@/lib/hooks/use-site-settings'
import { formatPrice, convertCurrency, defaultExchangeRates } from '@/lib/utils'

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  targetCurrency: string | null;
  setTargetCurrency: (currency: string | null) => void;
  formatCurrency: (price: number) => string;
  formatWithTargetCurrency: (price: number, targetCurrency: string) => string;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSiteSettings()
  const [currency, setCurrency] = useState('MGA')
  const [currencySymbol, setCurrencySymbol] = useState('Ar')
  const [targetCurrency, setTargetCurrency] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(defaultExchangeRates)
  
  // Récupérer les paramètres de devise principale
  const currencySymbolFromSettings = settings?.currencySymbol || '€'
  
  // Récupérer les taux de change depuis l'API et la devise sélectionnée depuis localStorage
  useEffect(() => {
    // Charger la devise sélectionnée depuis localStorage
    const savedCurrency = localStorage.getItem('selectedCurrency')
    if (savedCurrency) {
      setTargetCurrency(savedCurrency)
    }
    
    // Vérifier le cache des taux de change
    const cachedRates = localStorage.getItem('exchangeRates')
    const cachedTimestamp = localStorage.getItem('exchangeRatesTimestamp')
    const ONE_HOUR = 60 * 60 * 1000 // 1 heure en millisecondes
    
    if (cachedRates && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp)
      if (Date.now() - timestamp < ONE_HOUR) {
        setExchangeRates(JSON.parse(cachedRates))
        return
      }
    }
    
    // Charger les taux de change depuis l'API si pas de cache valide
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('/api/admin/settings/currency')
        if (response.ok) {
          const data = await response.json()
          if (Object.keys(data).length > 0) {
            setExchangeRates(data)
            // Mettre à jour le cache
            localStorage.setItem('exchangeRates', JSON.stringify(data))
            localStorage.setItem('exchangeRatesTimestamp', Date.now().toString())
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des taux de change:', error)
      }
    }
    
    fetchExchangeRates()
  }, [])
  
  // Fonction pour formater un prix avec les paramètres de devise principale
  const formatCurrency = useCallback((price: number) => {
    return formatPrice(price, currency, currencySymbol)
  }, [currency, currencySymbol])
  
  // Obtenir le symbole pour une devise spécifique
  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    const symbols: Record<string, string> = {
      'MGA': 'Ar',
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CAD': 'CA$',
      'CHF': 'CHF'
    }
    return symbols[currencyCode] || currencyCode
  }, [])
  
  // Fonction pour convertir un prix vers une autre devise
  const convertToTargetCurrency = useCallback((price: number, targetCurrency: string) => {
    const convertedPrice = convertCurrency(
      price, 
      currency, 
      targetCurrency, 
      exchangeRates
    )
    return convertedPrice
  }, [currency, exchangeRates])
  
  // Fonction pour formater un prix dans une devise cible spécifique
  const formatWithTargetCurrency = useCallback((price: number, targetCurrency: string) => {
    const convertedPrice = convertToTargetCurrency(price, targetCurrency)
    const targetSymbol = getCurrencySymbol(targetCurrency)
    return `${convertedPrice.toLocaleString('fr-FR')} ${targetSymbol}`
  }, [convertToTargetCurrency, getCurrencySymbol])
  
  const value = {
    currency,
    currencySymbol,
    targetCurrency,
    setTargetCurrency,
    formatCurrency,
    formatWithTargetCurrency,
    exchangeRates,
    isLoading
  }
  
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
} 
 
 
 
 
 
 