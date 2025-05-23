'use client'

import { useState, useEffect } from 'react'
import { 
  PlusCircle, 
  Search, 
  Globe, 
  Users, 
  Calendar, 
  Key, 
  Eye, 
  Pencil, 
  Trash,
  Check,
  X as XIcon,
  RefreshCw,
  CreditCard,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  hasGiftCards: boolean
}

interface ProviderOffer {
  id: string
  name: string
  price: number
  currency: string
}

interface Account {
  id: string
  username: string
  email: string | null
  status: string
  availability: boolean
  platform: Platform
  providerOffer?: ProviderOffer | null
  createdAt: Date
  expiresAt: Date | null
  accountProfiles: {
    id: string
    isAssigned: boolean
  }[]
}

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
}

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [selectedGiftCards, setSelectedGiftCards] = useState<GiftCard[]>([])
  const [isRecharging, setIsRecharging] = useState(false)

  const calculateDaysRemaining = (expiresAt: Date | null): number | null => {
    if (!expiresAt) return null
    const today = new Date()
    const expiration = new Date(expiresAt)
    const diffTime = expiration.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatCurrency = (amount: number, currency: string): string => {
    switch (currency) {
      case 'TRY':
        return `${amount} ₺`
      case 'EUR':
        return `${amount} €`
      case 'USD':
        return `${amount} $`
      case 'MGA':
        return `${amount} Ar`
      default:
        return `${amount} ${currency}`
    }
  }

  const calculateNewExpirationDate = (): Date | null => {
    if (!selectedAccount || selectedGiftCards.length === 0) return null
    
    // Vérifier qu'une offre fournisseur est associée au compte
    if (!selectedAccount.providerOffer) {
      return null
    }
    
    // Calculer le montant total des cartes cadeaux
    const totalAmount = selectedGiftCards.reduce((sum, card) => sum + card.amount, 0)
    
    // Calculer les jours basés sur le prix mensuel de l'offre : (montant total / prix mensuel) * 30 jours
    const totalDays = Math.floor((totalAmount / selectedAccount.providerOffer.price) * 30)
    
    // Partir de la date d'expiration actuelle ou d'aujourd'hui si pas d'expiration
    const currentExpiration = selectedAccount.expiresAt 
      ? new Date(selectedAccount.expiresAt) 
      : new Date()
    
    // Si le compte est déjà expiré, partir d'aujourd'hui
    const startDate = new Date(Math.max(currentExpiration.getTime(), new Date().getTime()))
    
    // Ajouter les jours
    const newExpirationDate = new Date(startDate)
    newExpirationDate.setDate(newExpirationDate.getDate() + totalDays)
    
    return newExpirationDate
  }

  const handleGiftCardToggle = (card: GiftCard) => {
    setSelectedGiftCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      return isSelected
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
    })
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/admin/streaming/accounts', {
        cache: 'no-store'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du chargement des comptes')
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide')
      }
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      console.error('Erreur lors du chargement des comptes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGiftCards = async (platformId: string) => {
    try {
      const response = await fetch(`/api/admin/streaming/gift-cards?platformId=${platformId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des cartes cadeaux')
      const data = await response.json()
      setGiftCards(data)
    } catch (err) {
      console.error('Erreur lors du chargement des cartes cadeaux:', err)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les cartes cadeaux'
      })
    }
  }

  const handleRecharge = async (account: Account) => {
    setSelectedAccount(account)
    setSelectedGiftCards([])
    setRechargeDialogOpen(true)
    await fetchGiftCards(account.platform.id)
  }

  const handleConfirmRecharge = async () => {
    if (!selectedAccount || selectedGiftCards.length === 0) return

    try {
      setIsRecharging(true)
      const response = await fetch(`/api/admin/streaming/accounts/${selectedAccount.id}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftCardIds: selectedGiftCards.map(card => card.id) })
      })

      if (!response.ok) throw new Error('Erreur lors de la recharge')

      toast({
        title: 'Recharge effectuée',
        description: 'Le compte a été rechargé avec succès'
      })

      setRechargeDialogOpen(false)
      setSelectedAccount(null)
      setSelectedGiftCards([])
      await fetchAccounts()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message
      })
    } finally {
      setIsRecharging(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="max-w-md mx-auto bg-red-50 p-4 rounded-lg">
          <p className="text-red-600 font-medium">Une erreur est survenue lors du chargement des comptes</p>
          <p className="text-red-500 mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Comptes de streaming</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un compte..."
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link href="/admin/streaming/accounts/add">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau compte
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Compte</th>
                <th className="px-6 py-3">Plateforme</th>
                <th className="px-6 py-3">Profils</th>
                <th className="px-6 py-3">Disponibilité</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Jours restants</th>
                <th className="px-6 py-3">Date d'expiration</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(accounts) && accounts.length > 0 ? (
                accounts.map((account: Account) => {
                  const daysRemaining = calculateDaysRemaining(account.expiresAt)
                  
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      {/* Compte info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <Key className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{account.username}</div>
                            {account.email && (
                              <div className="text-sm text-gray-500">{account.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Plateforme */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {account.platform.logo ? (
                            <img 
                              src={account.platform.logo} 
                              alt={account.platform.name}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <Globe className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="ml-2 text-gray-900">{account.platform.name}</span>
                          <Badge className="ml-2" variant={
                            account.platform.type === 'VIDEO' ? 'default' :
                            account.platform.type === 'AUDIO' ? 'secondary' :
                            'outline'
                          }>
                            {account.platform.type}
                          </Badge>
                        </div>
                      </td>
                      
                      {/* Profils */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>
                            {account.accountProfiles.filter(p => p.isAssigned).length} / {account.accountProfiles.length}
                          </span>
                        </div>
                      </td>
                      
                      {/* Disponibilité */}
                      <td className="px-6 py-4">
                        <Badge variant={account.availability ? 'success' : 'secondary'}>
                          {account.availability ? (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 mr-1" />
                          )}
                          {account.availability ? 'Disponible' : 'Indisponible'}
                        </Badge>
                      </td>
                      
                      {/* Statut */}
                      <td className="px-6 py-4">
                        <Badge variant={
                          account.status === 'ACTIVE' ? 'success' :
                          account.status === 'INACTIVE' ? 'secondary' :
                          'destructive'
                        }>
                          {account.status === 'ACTIVE' ? (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          ) : account.status === 'INACTIVE' ? (
                            <XIcon className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                          )}
                          {account.status === 'ACTIVE' ? 'Actif' :
                           account.status === 'INACTIVE' ? 'Inactif' : 'Expiré'}
                        </Badge>
                      </td>

                      {/* Jours restants */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {daysRemaining !== null ? (
                            <Badge variant={
                              daysRemaining > 30 ? 'success' :
                              daysRemaining > 7 ? 'default' :
                              daysRemaining > 0 ? 'destructive' :
                              'secondary'
                            }>
                              {daysRemaining > 0 ? `${daysRemaining}j` : 'Expiré'}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">∞</span>
                          )}
                        </div>
                      </td>

                      {/* Date d'expiration */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>
                            {account.expiresAt ? formatDate(account.expiresAt) : 'Non définie'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-3">
                          {account.platform.hasGiftCards && (
                            <button
                              onClick={() => handleRecharge(account)}
                              className="p-1.5 bg-gray-50 rounded-full hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                              title="Recharger avec une carte cadeau"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          <Link 
                            href={`/admin/streaming/accounts/${account.id}`}
                            className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 text-primary hover:text-primary-dark transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/admin/streaming/accounts/${account.id}/edit`}
                            className="p-1.5 bg-gray-50 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            className="p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                            title="Supprimer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Aucun compte trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de recharge */}
      <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Recharger le compte
            </DialogTitle>
            <DialogDescription>
              Sélectionnez des cartes cadeaux pour recharger le compte "{selectedAccount?.username}" sur {selectedAccount?.platform.name}
            </DialogDescription>
          </DialogHeader>
          
          {/* Informations actuelles du compte */}
          {selectedAccount && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">État actuel du compte</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date d'expiration :</span>
                  <span className="font-medium">
                    {selectedAccount.expiresAt 
                      ? formatDate(selectedAccount.expiresAt)
                      : 'Non définie'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jours restants :</span>
                  <span className="font-medium">
                    {(() => {
                      const daysRemaining = calculateDaysRemaining(selectedAccount.expiresAt)
                      if (daysRemaining === null) return '∞'
                      return daysRemaining > 0 ? `${daysRemaining} jours` : 'Expiré'
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <Badge 
                    variant={selectedAccount.status === 'ACTIVE' ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {selectedAccount.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          <div className="py-4">
            <label className="text-sm font-medium text-gray-900 mb-3 block">
              Sélectionnez des cartes cadeaux
            </label>
            
            {giftCards.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucune carte cadeau disponible
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {giftCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleGiftCardToggle(card)}
                      className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedGiftCards.some(c => c.id === card.id) 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedGiftCards.some(c => c.id === card.id) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 border border-gray-300 rounded" />
                          )}
                          <span className="font-medium">{card.code}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(card.amount, card.currency)}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Résumé de la sélection */}
                {selectedGiftCards.length > 0 && selectedAccount?.providerOffer && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium text-blue-900">Résumé de la recharge</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Offre du compte :</span>
                        <span className="font-medium">{selectedAccount.providerOffer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Prix mensuel :</span>
                        <span className="font-medium">
                          {formatCurrency(selectedAccount.providerOffer.price, selectedAccount.providerOffer.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cartes sélectionnées :</span>
                        <span className="font-medium">{selectedGiftCards.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Montant total :</span>
                        <span className="font-medium">
                          {formatCurrency(
                            selectedGiftCards.reduce((sum, card) => sum + card.amount, 0),
                            selectedGiftCards[0].currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Jours ajoutés :</span>
                        <span className="font-medium">
                          +{Math.floor((selectedGiftCards.reduce((sum, card) => sum + card.amount, 0) / selectedAccount.providerOffer.price) * 30)} jours
                        </span>
                      </div>
                      {(() => {
                        const newExpiration = calculateNewExpirationDate()
                        return newExpiration ? (
                          <div className="flex justify-between">
                            <span className="text-blue-700">Nouvelle expiration :</span>
                            <span className="font-medium">
                              {formatDate(newExpiration)}
                            </span>
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                )}

                {/* Message d'erreur si pas d'offre fournisseur */}
                {selectedGiftCards.length > 0 && !selectedAccount?.providerOffer && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Aucune offre fournisseur associée à ce compte. Veuillez d'abord associer une offre pour pouvoir calculer la recharge.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmRecharge} 
              disabled={selectedGiftCards.length === 0 || isRecharging}
            >
              {isRecharging ? 'Recharge en cours...' : 'Confirmer la recharge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 