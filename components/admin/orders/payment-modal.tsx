'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CreditCard, Smartphone, Building, Banknote, Loader2 } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderTotal: number
  currency: string
  orderNumber?: string
  onPaymentSuccess: () => void
}

interface PaymentFormData {
  amount: number
  method: string
  provider: string
  transactionId: string
  reference: string
  notes: string
}

const paymentMethods = [
  {
    value: 'paypal',
    label: 'PayPal',
    icon: CreditCard,
    providers: ['paypal']
  },
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    icon: Smartphone,
    providers: ['orange_money', 'mvola', 'airtel_money']
  },
  {
    value: 'bank_transfer',
    label: 'Virement bancaire',
    icon: Building,
    providers: ['bni', 'boa', 'bmoi', 'autre_banque']
  },
  {
    value: 'cash',
    label: 'Paiement espèce',
    icon: Banknote,
    providers: ['espece']
  }
]

const providerLabels: Record<string, string> = {
  paypal: 'PayPal',
  orange_money: 'Orange Money',
  mvola: 'MVola',
  airtel_money: 'Airtel Money',
  bni: 'BNI Madagascar',
  boa: 'Bank of Africa',
  bmoi: 'BMOI',
  autre_banque: 'Autre banque',
  espece: 'Espèce'
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  currency,
  orderNumber,
  onPaymentSuccess
}: PaymentModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: orderTotal,
    method: '',
    provider: '',
    transactionId: '',
    reference: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedMethod = paymentMethods.find(m => m.value === formData.method)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.method) {
      toast.error('Veuillez sélectionner une méthode de paiement')
      return
    }

    if (!formData.provider) {
      toast.error('Veuillez sélectionner un fournisseur')
      return
    }

    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }

    if (formData.amount > orderTotal) {
      toast.error(`Le montant ne peut pas dépasser ${orderTotal} ${currency}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: formData.amount,
          method: formData.method,
          provider: formData.provider,
          transactionId: formData.transactionId || undefined,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'enregistrement du paiement')
      }

      const result = await response.json()
      
      toast.success(`Paiement de ${formData.amount} ${currency} enregistré avec succès`)
      
      // Réinitialiser le formulaire
      setFormData({
        amount: orderTotal,
        method: '',
        provider: '',
        transactionId: '',
        reference: '',
        notes: ''
      })
      
      onPaymentSuccess()
      onClose()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du paiement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMethodChange = (method: string) => {
    setFormData(prev => ({
      ...prev,
      method,
      provider: '' // Reset provider when method changes
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Enregistrer un paiement
          </DialogTitle>
          {orderNumber && (
            <p className="text-sm text-muted-foreground">
              Commande: {orderNumber} • Montant restant: {orderTotal} {currency}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={orderTotal}
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <Label>Devise</Label>
              <Input value={currency} disabled />
            </div>
          </div>

          <div>
            <Label htmlFor="method">Méthode de paiement *</Label>
            <Select value={formData.method} onValueChange={handleMethodChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedMethod && (
            <div>
              <Label htmlFor="provider">Fournisseur *</Label>
              <Select value={formData.provider} onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMethod.providers.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {providerLabels[provider] || provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="transactionId">ID de transaction</Label>
            <Input
              id="transactionId"
              value={formData.transactionId}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
              placeholder="ID ou numéro de transaction"
            />
          </div>

          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Référence du paiement"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes ou commentaires sur le paiement"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le paiement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
