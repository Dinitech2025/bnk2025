import { db } from '@/lib/db'

const API_URL = 'https://api.fxratesapi.com/latest?api_key=fxr_live_870cf7ae2bcc27582b3379495e4e31fda2f1'
const CACHE_DURATION = 4.8 * 60 * 60 * 1000 // ~4.8 heures (pour 5 appels max par jour)

interface FxRatesResponse {
  success: boolean
  timestamp: number
  date: string
  base: string
  rates: Record<string, number>
}

export async function getLastUpdateTime(): Promise<Date | null> {
  try {
    const lastUpdate = await db.setting.findUnique({
      where: { key: 'exchange_rates_last_update' }
    })
    
    return lastUpdate?.value ? new Date(lastUpdate.value) : null
  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière mise à jour:', error)
    return null
  }
}

export async function shouldUpdateRates(): Promise<boolean> {
  const lastUpdate = await getLastUpdateTime()
  
  if (!lastUpdate) return true
  
  const now = new Date()
  const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime()
  
  return timeSinceLastUpdate > CACHE_DURATION
}

export async function fetchExchangeRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
    }
    
    const data: FxRatesResponse = await response.json()
    
    if (!data.success) {
      throw new Error('Réponse API non valide')
    }
    
    return data.rates
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error)
    return null
  }
}

export async function syncExchangeRates(forceUpdate = false): Promise<boolean> {
  try {
    // Vérifier si une mise à jour est nécessaire
    if (!forceUpdate && !(await shouldUpdateRates())) {
      console.log('Mise à jour des taux ignorée - dernière mise à jour trop récente')
      return false
    }
    
    // Récupérer les taux de change
    const rates = await fetchExchangeRates()
    
    if (!rates) {
      return false
    }
    
    // Récupérer la devise principale
    const currencySetting = await db.setting.findUnique({
      where: { key: 'currency' }
    })
    
    const baseCurrency = currencySetting?.value || 'EUR'
    const baseRate = rates[baseCurrency]
    
    if (!baseRate) {
      console.error(`Devise principale ${baseCurrency} non trouvée dans les taux de change`)
      return false
    }
    
    // Normaliser les taux pour la devise principale
    const normalizedRates: Record<string, number> = {}
    
    // L'API utilise USD comme base, nous devons convertir pour notre devise principale
    Object.entries(rates).forEach(([currency, rate]) => {
      normalizedRates[currency] = rate / baseRate
    })
    
    // Mettre à jour la base de données avec les nouveaux taux
    const now = new Date().toISOString()
    
    // Mise à jour des taux de change
    for (const [currency, rate] of Object.entries(normalizedRates)) {
      await db.setting.upsert({
        where: { key: `exchangeRate_${currency}` },
        update: { value: String(rate) },
        create: {
          key: `exchangeRate_${currency}`,
          value: String(rate),
          type: 'NUMBER'
        }
      })
    }
    
    // Mettre à jour la date de dernière mise à jour
    await db.setting.upsert({
      where: { key: 'exchange_rates_last_update' },
      update: { value: now },
      create: {
        key: 'exchange_rates_last_update',
        value: now,
        type: 'DATE'
      }
    })
    
    return true
  } catch (error) {
    console.error('Erreur lors de la synchronisation des taux de change:', error)
    return false
  }
} 
 
 
 
 
 
 