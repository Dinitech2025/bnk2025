'use client'

import { useState, useEffect } from 'react'
import { convertCurrency, defaultExchangeRates } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'

// Liste des symboles de devise
const currencySymbols: Record<string, string> = {
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'MGA': 'Ar',
  'CAD': 'CA$',
  'CHF': 'CHF'
}

export default function CurrencyConverterPage() {
  const { settings } = useSiteSettings()
  const [amount, setAmount] = useState<string>('100')
  const [fromCurrency, setFromCurrency] = useState<string>('')
  const [toCurrency, setToCurrency] = useState<string>('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  
  // Initialiser les devises par défaut au chargement
  useEffect(() => {
    const defaultCurrency = getSetting(settings, 'currency', 'EUR')
    setFromCurrency(defaultCurrency)
    
    // Choisir une devise cible différente de la devise source
    const savedTargetCurrency = localStorage.getItem('selectedCurrency')
    if (savedTargetCurrency && savedTargetCurrency !== defaultCurrency) {
      setToCurrency(savedTargetCurrency)
    } else {
      // Sinon, choisir la première devise différente de la devise source
      const otherCurrency = Object.keys(defaultExchangeRates).find(c => c !== defaultCurrency) || 'USD'
      setToCurrency(otherCurrency)
    }
  }, [settings])
  
  // Effectuer la conversion
  const handleConvert = () => {
    if (!amount || !fromCurrency || !toCurrency) return
    
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return
    
    const result = convertCurrency(
      numAmount,
      fromCurrency,
      toCurrency,
      defaultExchangeRates
    )
    
    setConvertedAmount(result)
  }
  
  // Inverser les devises
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setConvertedAmount(null)
  }
  
  // Formater le montant avec le symbole de la devise
  const formatAmountWithSymbol = (amount: number, currencyCode: string) => {
    return `${amount.toLocaleString('fr-FR')} ${currencySymbols[currencyCode] || currencyCode}`
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Convertisseur de devises</h1>
      
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border">
        <div className="space-y-6">
          <div>
            <Label htmlFor="amount">Montant</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
            <div>
              <Label htmlFor="fromCurrency">De</Label>
              <Select
                value={fromCurrency}
                onValueChange={setFromCurrency}
              >
                <SelectTrigger id="fromCurrency" className="mt-1">
                  <SelectValue placeholder="Choisir une devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Devises</SelectLabel>
                    {Object.keys(defaultExchangeRates).map((currency) => (
                      <SelectItem key={`from-${currency}`} value={currency}>
                        {currency} ({currencySymbols[currency] || currency})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSwapCurrencies}
              className="mt-6"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <div>
              <Label htmlFor="toCurrency">Vers</Label>
              <Select
                value={toCurrency}
                onValueChange={setToCurrency}
              >
                <SelectTrigger id="toCurrency" className="mt-1">
                  <SelectValue placeholder="Choisir une devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Devises</SelectLabel>
                    {Object.keys(defaultExchangeRates).map((currency) => (
                      <SelectItem key={`to-${currency}`} value={currency}>
                        {currency} ({currencySymbols[currency] || currency})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={handleConvert}
            className="w-full"
            disabled={!amount || !fromCurrency || !toCurrency}
          >
            Convertir
          </Button>
          
          {convertedAmount !== null && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Résultat</p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-medium">
                  {formatAmountWithSymbol(parseFloat(amount), fromCurrency)}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 mx-2" />
                <div className="text-lg font-medium">
                  {formatAmountWithSymbol(convertedAmount, toCurrency)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Taux: 1 {fromCurrency} = {defaultExchangeRates[toCurrency] / defaultExchangeRates[fromCurrency]} {toCurrency}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Note: Ces taux sont approximatifs et peuvent ne pas refléter les taux actuels du marché.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
 
 
 
 
 
 