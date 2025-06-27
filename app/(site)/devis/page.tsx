'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plane, 
  Ship, 
  Package, 
  Calculator, 
  DollarSign, 
  Clock,
  MapPin,
  Weight,
  Ruler,
  AlertCircle,
  CheckCircle,
  Plus,
  ShoppingCart,
  RotateCcw,
  Eye
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice } from '@/lib/utils'
import { useCurrency } from '@/lib/hooks/use-currency'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FormData {
  mode: 'air' | 'sea'
  productName: string
  productUrl: string
  supplierPrice: string
  supplierCurrency: string
  weight: string
  warehouse: string
  volume: string
}

interface CalculationResult {
  productInfo: {
    name: string
    url?: string
    weight: number
    volume?: number
    mode: string
    warehouse: string
  }
  costs: {
    supplierPrice: {
      amount: number
      currency: string
      amountInMGA: number
    }
    transport: {
      amount: number
      currency: string
      amountInMGA: number
      details: string
    }
    commission: {
      amount: number
      currency: string
      amountInMGA: number
      rate: number
      details: string
    }
    fees: {
      processing: {
        amount: number
        currency: string
        amountInMGA: number
      }
      tax: {
        amount: number
        currency: string
        amountInMGA: number
        rate: number
      }
    }
    total: number
  }
  calculationMethod: string
  transitTime: string
}

const CURRENCIES = [
  { code: 'USD', name: 'Dollar US', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
  { code: 'CNY', name: 'Yuan Chinois', symbol: '¥' },
  { code: 'MGA', name: 'Ariary', symbol: 'Ar' }
]

const AIR_WAREHOUSES = [
  { value: 'usa', label: 'États-Unis', currency: 'USD' },
  { value: 'france', label: 'France', currency: 'EUR' },
  { value: 'uk', label: 'Royaume-Uni', currency: 'GBP' }
]

const SEA_WAREHOUSES = [
  { value: 'france', label: 'France', currency: 'EUR' },
  { value: 'china', label: 'Chine', currency: 'USD' }
]

export default function DevisPage() {
  const router = useRouter()
  const { formatWithTargetCurrency, targetCurrency } = useCurrency()
  
  const [formData, setFormData] = useState<FormData>({
    mode: 'air',
    productName: '',
    productUrl: '',
    supplierPrice: '',
    supplierCurrency: 'USD',
    weight: '0',
    warehouse: 'france',
    volume: ''
  })

  const [calculation, setCalculation] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculer automatiquement dès que les champs requis sont remplis
  useEffect(() => {
    if (shouldAutoCalculate(formData)) {
      const timeoutId = setTimeout(() => {
        handleAutoCalculate()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.supplierPrice, formData.supplierCurrency, formData.weight, formData.warehouse, formData.mode, formData.volume])

  const shouldAutoCalculate = (data: FormData): boolean => {
    const hasMinimalData = data.supplierPrice && 
                          parseFloat(data.supplierPrice) > 0 && 
                          data.weight && 
                          parseFloat(data.weight) >= 0 && 
                          data.warehouse
    
    const hasVolumeIfNeeded = data.mode === 'air' || (data.mode === 'sea' && data.volume && parseFloat(data.volume) > 0)
    
    return hasMinimalData && hasVolumeIfNeeded
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleModeChange = (mode: 'air' | 'sea') => {
    const warehouses = mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES
    const currentWarehouseExists = warehouses.some(w => w.value === formData.warehouse)
    
    setFormData(prev => ({
      ...prev,
      mode,
      warehouse: currentWarehouseExists ? prev.warehouse : warehouses[0].value,
      volume: mode === 'air' ? '' : prev.volume
    }))
  }

  const handleAutoCalculate = async () => {
    if (!validateForm(false)) return

    setIsCalculating(true)
    setError(null)

    try {
      const response = await fetch('/api/public/calculate-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: formData.mode,
          productName: formData.productName || 'Produit importé',
          productUrl: formData.productUrl || undefined,
          supplierPrice: parseFloat(formData.supplierPrice),
          supplierCurrency: formData.supplierCurrency,
          weight: parseFloat(formData.weight),
          warehouse: formData.warehouse,
          volume: formData.mode === 'sea' ? parseFloat(formData.volume) : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du calcul')
      }

      const result = await response.json()
      setCalculation(result)
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du calcul')
    } finally {
      setIsCalculating(false)
    }
  }

  const validateForm = (requireProductName: boolean = false): boolean => {
    if (requireProductName && !formData.productName.trim()) {
      setError('Le nom du produit est requis')
      return false
    }
    
    if (!formData.supplierPrice || parseFloat(formData.supplierPrice) <= 0) {
      setError('Le prix fournisseur doit être supérieur à 0')
      return false
    }
    
    if (formData.weight === '' || parseFloat(formData.weight) < 0) {
      setError('Le poids doit être un nombre positif ou zéro')
      return false
    }
    
    if (formData.mode === 'sea' && (!formData.volume || parseFloat(formData.volume) <= 0)) {
      setError('Le volume est requis pour le transport maritime')
      return false
    }
    
    return true
  }

  const handleAddToCart = async () => {
    if (!calculation) {
      toast.error('Veuillez d\'abord effectuer un calcul')
      return
    }

    if (!formData.productName.trim()) {
      setError('Le nom du produit est requis pour l\'ajouter au panier')
      return
    }

    setIsAddingToCart(true)

    try {
      // Étape 1: Créer le produit dans la base de données
      toast.info('Création du produit en cours...')
      
      const createProductResponse = await fetch('/api/public/create-product-from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: {
            name: formData.productName,
            url: formData.productUrl || undefined,
            weight: calculation.productInfo.weight,
            volume: calculation.productInfo.volume,
            mode: calculation.productInfo.mode,
            warehouse: calculation.productInfo.warehouse
          },
          costs: calculation.costs,
          calculationMethod: calculation.calculationMethod,
          transitTime: calculation.transitTime
        })
      })

      if (!createProductResponse.ok) {
        const errorData = await createProductResponse.json()
        throw new Error(errorData.error || 'Erreur lors de la création du produit')
      }

      const { product } = await createProductResponse.json()

      // Étape 2: Ajouter le produit créé au panier
      const cartProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: parseFloat(product.price),
        currency: 'Ar', // Utiliser Ar pour cohérence avec l'interface utilisateur
        image: null,
        description: product.description,
        category: product.category,
        weight: product.weight ? parseFloat(product.weight) : undefined,
        attributes: product.attributes,
        quantity: 1
      }

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      
      // Vérifier si le produit n'est pas déjà dans le panier
      const existingProductIndex = existingCart.findIndex((item: any) => item.id === product.id)
      
      if (existingProductIndex >= 0) {
        // Si le produit existe déjà, augmenter la quantité
        existingCart[existingProductIndex].quantity += 1
        toast.success(`Quantité de "${product.name}" mise à jour dans le panier`)
      } else {
        // Sinon, ajouter le nouveau produit
        existingCart.push(cartProduct)
        toast.success(`"${product.name}" a été créé et ajouté au panier`)
      }

      localStorage.setItem('cart', JSON.stringify(existingCart))
      window.dispatchEvent(new Event('cartUpdated'))

      // Réinitialiser le formulaire
      setFormData({
        mode: 'air',
        productName: '',
        productUrl: '',
        supplierPrice: '',
        supplierCurrency: 'USD',
        weight: '0',
        warehouse: 'france',
        volume: ''
      })
      setCalculation(null)

    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout au panier')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const resetForm = () => {
    setFormData({
      mode: 'air',
      productName: '',
      productUrl: '',
      supplierPrice: '',
      supplierCurrency: 'USD',
      weight: '0',
      warehouse: 'france',
      volume: ''
    })
    setCalculation(null)
    setError(null)
  }

  const formatDisplayPrice = (priceInMGA: number) => {
    const roundedPrice = Math.round(priceInMGA / 100) * 100
    if (targetCurrency && targetCurrency !== 'MGA') {
      return formatWithTargetCurrency(roundedPrice, targetCurrency)
    }
    return formatPrice(roundedPrice, 'MGA', 'Ar')
  }

  const availableWarehouses = formData.mode === 'air' ? AIR_WAREHOUSES : SEA_WAREHOUSES

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Faire un devis d'importation</h1>
          <p className="text-gray-600 mt-2">
            Calculez le coût d'importation de vos produits et ajoutez-les directement à votre panier
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulation d'importation
              </CardTitle>
              <CardDescription>
                Remplissez les informations du produit à importer pour obtenir un devis instantané
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Mode de transport */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Mode de transport</Label>
                <Tabs value={formData.mode} onValueChange={(value) => handleModeChange(value as 'air' | 'sea')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="air" className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Aérien
                    </TabsTrigger>
                    <TabsTrigger value="sea" className="flex items-center gap-2">
                      <Ship className="h-4 w-4" />
                      Maritime
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Informations produit */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Informations du produit</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="productName">Nom du produit *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productUrl">URL du produit (optionnel)</Label>
                  <Input
                    id="productUrl"
                    value={formData.productUrl}
                    onChange={(e) => handleInputChange('productUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Prix et devise */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Prix fournisseur</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierPrice">Prix</Label>
                    <Input
                      id="supplierPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.supplierPrice}
                      onChange={(e) => handleInputChange('supplierPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplierCurrency">Devise</Label>
                    <Select 
                      value={formData.supplierCurrency} 
                      onValueChange={(value) => handleInputChange('supplierCurrency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Entrepôt */}
              <div className="space-y-2">
                <Label htmlFor="warehouse" className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Entrepôt de départ
                </Label>
                <Select 
                  value={formData.warehouse} 
                  onValueChange={(value) => handleInputChange('warehouse', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWarehouses.map((warehouse) => (
                      <SelectItem key={warehouse.value} value={warehouse.value}>
                        {warehouse.label} ({warehouse.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dimensions */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Dimensions et poids</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Poids (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                  
                  {formData.mode === 'sea' && (
                    <div className="space-y-2">
                      <Label htmlFor="volume" className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Volume (m³) *
                      </Label>
                      <Input
                        id="volume"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.volume}
                        onChange={(e) => handleInputChange('volume', e.target.value)}
                        placeholder="0.000"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </Button>
                
                {calculation && (
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !formData.productName.trim()}
                    className="flex items-center gap-2 ml-auto"
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Ajout...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Ajouter au panier
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Résultat du calcul
              </CardTitle>
              <CardDescription>
                Détail des coûts d'importation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCalculating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Calcul en cours...</span>
                </div>
              ) : calculation ? (
                <div className="space-y-6">
                  {/* Informations produit */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {calculation.productInfo.name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {calculation.productInfo.url && (
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          <a 
                            href={calculation.productInfo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Voir le produit
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {calculation.productInfo.mode === 'air' ? 
                          <Plane className="h-3 w-3" /> : 
                          <Ship className="h-3 w-3" />
                        }
                        Transport par {calculation.productInfo.mode === 'air' ? 'avion' : 'bateau'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Depuis {calculation.productInfo.warehouse}
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-3 w-3" />
                        {calculation.productInfo.weight} kg
                        {calculation.productInfo.volume && ` • ${calculation.productInfo.volume} m³`}
                      </div>
                    </div>
                  </div>

                  {/* Détail des coûts */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Détail des coûts</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Prix fournisseur</span>
                        <span className="font-medium">
                          {formatDisplayPrice(calculation.costs.supplierPrice.amountInMGA)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Transport</span>
                        <span className="font-medium">
                          {formatDisplayPrice(calculation.costs.transport.amountInMGA)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Commission ({calculation.costs.commission.rate}%)
                        </span>
                        <span className="font-medium">
                          {formatDisplayPrice(calculation.costs.commission.amountInMGA)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Frais de traitement</span>
                        <span className="font-medium">
                          {formatDisplayPrice(calculation.costs.fees.processing.amountInMGA)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Taxes ({calculation.costs.fees.tax.rate}%)
                        </span>
                        <span className="font-medium">
                          {formatDisplayPrice(calculation.costs.fees.tax.amountInMGA)}
                        </span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Prix total</span>
                      <span className="text-primary">
                        {formatDisplayPrice(calculation.costs.total)}
                      </span>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Délai de livraison</span>
                    </div>
                    <p className="text-sm text-blue-700">{calculation.transitTime}</p>
                  </div>

                  {/* Action pour ajouter au panier */}
                  {formData.productName.trim() && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Produit prêt à être ajouté au panier !
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Remplissez le formulaire pour voir le calcul</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 