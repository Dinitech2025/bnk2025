'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface PaymentProvider {
  id: string
  code: string
  name: string
  description: string | null
  logo: string | null
  isActive: boolean
  order: number
  apiEndpoint: string | null
  publicKey: string | null
  merchantId: string | null
  feeType: string | null
  feeValue: number | null
  minAmount: number | null
  maxAmount: number | null
  dailyLimit: number | null
  paymentMethod?: {
    id: string
    name: string
  }
}

interface PaymentProviderFormProps {
  isOpen: boolean
  onClose: () => void
  provider?: PaymentProvider | null
  methodId?: string | null
  onSuccess: () => void
}

const feeTypeOptions = [
  { value: 'NONE', label: 'Aucun frais' },
  { value: 'PERCENTAGE', label: 'Pourcentage' },
  { value: 'FIXED', label: 'Montant fixe' }
]

export function PaymentProviderForm({ isOpen, onClose, provider, methodId, onSuccess }: PaymentProviderFormProps) {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [formData, setFormData] = useState({
    paymentMethodId: '',
    code: '',
    name: '',
    description: '',
    logo: '',
    isActive: true,
    order: 0,
    apiEndpoint: '',
    publicKey: '',
    merchantId: '',
    feeType: 'NONE',
    feeValue: '',
    minAmount: '',
    maxAmount: '',
    dailyLimit: ''
  })
  
  const [loading, setLoading] = useState(false)
  const isEditing = !!provider

  // Charger les méthodes de paiement disponibles
  useEffect(() => {
    if (isOpen && !isEditing) {
      fetchPaymentMethods()
    }
  }, [isOpen, isEditing])

  useEffect(() => {
    if (provider) {
      setFormData({
        paymentMethodId: provider.paymentMethod?.id || '',
        code: provider.code,
        name: provider.name,
        description: provider.description || '',
        logo: provider.logo || '',
        isActive: provider.isActive,
        order: provider.order,
        apiEndpoint: provider.apiEndpoint || '',
        publicKey: provider.publicKey || '',
        merchantId: provider.merchantId || '',
        feeType: provider.feeType || 'NONE',
        feeValue: provider.feeValue ? provider.feeValue.toString() : '',
        minAmount: provider.minAmount ? provider.minAmount.toString() : '',
        maxAmount: provider.maxAmount ? provider.maxAmount.toString() : '',
        dailyLimit: provider.dailyLimit ? provider.dailyLimit.toString() : ''
      })
    } else {
      setFormData({
        paymentMethodId: methodId || '',
        code: '',
        name: '',
        description: '',
        logo: '',
        isActive: true,
        order: 0,
        apiEndpoint: '',
        publicKey: '',
        merchantId: '',
        feeType: 'NONE',
        feeValue: '',
        minAmount: '',
        maxAmount: '',
        dailyLimit: ''
      })
    }
  }, [provider, methodId, isOpen])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (response.ok) {
        const methods = await response.json()
        setPaymentMethods(methods)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des méthodes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing 
        ? `/api/admin/payment-providers/${provider.id}`
        : '/api/admin/payment-providers'
      
      const method = isEditing ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        feeValue: formData.feeValue && formData.feeType !== 'NONE' 
          ? parseFloat(formData.feeValue) 
          : null,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        dailyLimit: formData.dailyLimit ? parseFloat(formData.dailyLimit) : null,
        order: parseInt(formData.order.toString()) || 0
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(`Fournisseur ${isEditing ? 'modifié' : 'créé'} avec succès`)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le fournisseur de paiement' : 'Nouveau fournisseur de paiement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Méthode de paiement */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Méthode de paiement *</Label>
              <Select value={formData.paymentMethodId} onValueChange={(value) => handleInputChange('paymentMethodId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name} ({method.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Ex: orange_money, paypal"
                required
                disabled={isEditing} // Le code ne peut pas être modifié
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Orange Money"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description du fournisseur"
              rows={2}
            />
          </div>

          {/* Configuration d'affichage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo (URL)</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => handleInputChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Ordre d'affichage</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Configuration API */}
          <div className="space-y-4">
            <Label>Configuration API (optionnel)</Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">Endpoint API</Label>
                <Input
                  id="apiEndpoint"
                  value={formData.apiEndpoint}
                  onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Clé publique</Label>
                  <Input
                    id="publicKey"
                    value={formData.publicKey}
                    onChange={(e) => handleInputChange('publicKey', e.target.value)}
                    placeholder="Clé publique API"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merchantId">ID Marchand</Label>
                  <Input
                    id="merchantId"
                    value={formData.merchantId}
                    onChange={(e) => handleInputChange('merchantId', e.target.value)}
                    placeholder="ID marchand"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration des frais */}
          <div className="space-y-4">
            <Label>Configuration des frais spécifiques</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feeType">Type de frais</Label>
                <Select value={formData.feeType} onValueChange={(value) => handleInputChange('feeType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.feeType !== 'NONE' && (
                <div className="space-y-2">
                  <Label htmlFor="feeValue">
                    Valeur des frais {formData.feeType === 'PERCENTAGE' ? '(%)' : '(Ar)'}
                  </Label>
                  <Input
                    id="feeValue"
                    type="number"
                    min="0"
                    step={formData.feeType === 'PERCENTAGE' ? '0.01' : '1'}
                    value={formData.feeValue}
                    onChange={(e) => handleInputChange('feeValue', e.target.value)}
                    placeholder={formData.feeType === 'PERCENTAGE' ? 'Ex: 1.5' : 'Ex: 500'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Limites */}
          <div className="space-y-4">
            <Label>Limites de montant</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Montant minimum (Ar)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => handleInputChange('minAmount', e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Montant maximum (Ar)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Limite quotidienne (Ar)</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dailyLimit}
                  onChange={(e) => handleInputChange('dailyLimit', e.target.value)}
                  placeholder="2000000"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Fournisseur actif</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
