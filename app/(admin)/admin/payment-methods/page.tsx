'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Settings, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2,
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  DollarSign,
  Users,
  Activity,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MoreVertical,
  Download,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { PaymentMethodForm } from '@/components/admin/payment-methods/payment-method-form'
import { PaymentProviderForm } from '@/components/admin/payment-methods/payment-provider-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PaymentMethod {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  type: string
  isActive: boolean
  order: number
  minAmount: number | null
  maxAmount: number | null
  feeType: string | null
  feeValue: number | null
  processingTime: string | null
  requiresReference: boolean
  requiresTransactionId: boolean
  allowPartialPayments: boolean
  apiEnabled: boolean
  apiEndpoint: string | null
  publicKey: string | null
  providers: PaymentProvider[]
  _count?: { payments: number }
}

interface PaymentProvider {
  id: string
  code: string
  name: string
  description: string | null
  logo: string | null
  isActive: boolean
  order: number
  feeType: string | null
  feeValue: number | null
  minAmount: number | null
  maxAmount: number | null
  dailyLimit: number | null
  apiEndpoint: string | null
  publicKey: string | null
  merchantId: string | null
  _count?: { payments: number }
}

const iconMap: Record<string, any> = {
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  DollarSign,
  Users
}

export default function PaymentMethodsPageOptimized() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [selectedMethodForProvider, setSelectedMethodForProvider] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'method' | 'provider', id: string } | null>(null)

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setPaymentMethods(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des méthodes de paiement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const toggleMethodStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      
      await fetchPaymentMethods()
      toast.success(`Méthode ${!isActive ? 'activée' : 'désactivée'} avec succès`)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const toggleProviderStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      
      await fetchPaymentMethods()
      toast.success(`Fournisseur ${!isActive ? 'activé' : 'désactivé'} avec succès`)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      // Vérifier si c'est la méthode PayPal "Paiement en ligne"
      if (deleteConfirm.type === 'method') {
        const method = paymentMethods.find(m => m.id === deleteConfirm.id)
        if (method?.code === 'online_payment') {
          toast.error('La méthode "Paiement en ligne" ne peut pas être supprimée car elle est essentielle au système')
          setDeleteConfirm(null)
          return
        }
      }

      const url = deleteConfirm.type === 'method' 
        ? `/api/admin/payment-methods/${deleteConfirm.id}`
        : `/api/admin/payment-providers/${deleteConfirm.id}`

      const response = await fetch(url, { method: 'DELETE' })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      await fetchPaymentMethods()
      toast.success(`${deleteConfirm.type === 'method' ? 'Méthode' : 'Fournisseur'} supprimé(e) avec succès`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filteredMethods = paymentMethods.filter(method => {
    const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.providers.some(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'active' && method.isActive) ||
      (filterType === 'inactive' && !method.isActive) ||
      (filterType === method.type.toLowerCase())
    
    return matchesSearch && matchesFilter
  })

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('mg-MG').format(amount) + ' Ar'
  }

  const formatFee = (feeType: string | null, feeValue: number | null) => {
    if (!feeType || !feeValue || feeType === 'NONE') return 'Gratuit'
    if (feeType === 'PERCENTAGE') return `${feeValue}%`
    if (feeType === 'FIXED') return formatAmount(feeValue)
    return '-'
  }

  const getIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return CreditCard
    return iconMap[iconName]
  }

  const getStats = () => {
    const total = paymentMethods.length
    const active = paymentMethods.filter(m => m.isActive).length
    const totalProviders = paymentMethods.reduce((acc, m) => acc + m.providers.length, 0)
    const totalPayments = paymentMethods.reduce((acc, m) => acc + (m._count?.payments || 0), 0)
    
    return { total, active, totalProviders, totalPayments }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des méthodes de paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* En-tête avec statistiques */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configuration des Paiements
            </h1>
            <p className="text-gray-600 text-lg">
              Gérez vos méthodes de paiement et optimisez vos conversions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button 
              onClick={() => setShowMethodForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4" />
              Nouvelle méthode
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Méthodes</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Méthodes Actives</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fournisseurs</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalProviders}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements Traités</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalPayments}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une méthode, fournisseur ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les méthodes</option>
                <option value="active">Actives uniquement</option>
                <option value="inactive">Inactives uniquement</option>
                <option value="direct">API Directe</option>
                <option value="providers">Avec Fournisseurs</option>
                <option value="manual">Manuelles</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des méthodes */}
      <div className="space-y-6">
        {filteredMethods.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Aucune méthode trouvée</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre première méthode de paiement'}
                  </p>
                </div>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowMethodForm(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une méthode
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMethods.map((method) => {
            const IconComponent = getIcon(method.icon)
            const isEssential = method.code === 'online_payment'
            
            return (
              <Card key={method.id} className={`transition-all hover:shadow-lg ${isEssential ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        method.isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{method.name}</CardTitle>
                          {isEssential && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              <Shield className="h-3 w-3 mr-1" />
                              Essentiel
                            </Badge>
                          )}
                          <Badge variant={method.isActive ? "default" : "secondary"} className="font-medium">
                            {method.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Actif
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactif
                              </>
                            )}
                          </Badge>
                          {method._count?.payments && method._count.payments > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Activity className="h-3 w-3 mr-1" />
                              {method._count.payments} transaction{method._count.payments > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{method.code}</code>
                          </div>
                          <div className="flex items-center gap-1">
                            {method.type === 'DIRECT' && <Zap className="h-3 w-3 text-blue-500" />}
                            {method.type === 'PROVIDERS' && <Users className="h-3 w-3 text-purple-500" />}
                            {method.type === 'MANUAL' && <Clock className="h-3 w-3 text-orange-500" />}
                            <span className="font-medium">
                              {method.type === 'DIRECT' ? 'API Directe' : 
                               method.type === 'PROVIDERS' ? 'Multi-fournisseurs' : 
                               'Traitement Manuel'}
                            </span>
                          </div>
                          {method.apiEnabled && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs font-medium">API Configurée</span>
                            </div>
                          )}
                          {method.processingTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{method.processingTime}</span>
                            </div>
                          )}
                        </div>
                        
                        {method.description && (
                          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">{method.description}</p>
                        )}

                        {/* Informations sur les frais et limites */}
                        {(method.feeType !== 'NONE' || method.minAmount || method.maxAmount) && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                            {method.feeType !== 'NONE' && (
                              <span>Frais: {formatFee(method.feeType, method.feeValue)}</span>
                            )}
                            {method.minAmount && <span>Min: {formatAmount(method.minAmount)}</span>}
                            {method.maxAmount && <span>Max: {formatAmount(method.maxAmount)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMethodStatus(method.id, method.isActive)}
                        className="hover:bg-gray-50"
                      >
                        {method.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedMethod(method)
                            setShowMethodForm(true)
                          }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {method.type === 'PROVIDERS' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedMethodForProvider(method.id)
                              setShowProviderForm(true)
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter un fournisseur
                            </DropdownMenuItem>
                          )}
                          {!isEssential && (
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm({ type: 'method', id: method.id })}
                              disabled={method._count?.payments && method._count.payments > 0}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                {method.providers.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Fournisseurs ({method.providers.length})
                        </h4>
                      </div>
                      
                      <div className="grid gap-3">
                        {method.providers.map((provider) => (
                          <div key={provider.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4">
                              {provider.logo ? (
                                <img 
                                  src={provider.logo} 
                                  alt={provider.name}
                                  className="h-8 w-8 object-contain rounded"
                                />
                              ) : (
                                <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                  <Building className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-900">{provider.name}</span>
                                  <Badge variant={provider.isActive ? "default" : "secondary"} className="text-xs">
                                    {provider.isActive ? 'Actif' : 'Inactif'}
                                  </Badge>
                                  {provider._count?.payments && provider._count.payments > 0 && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                      <Activity className="h-3 w-3 mr-1" />
                                      {provider._count.payments}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{provider.code}</span>
                                  <span>Frais: {formatFee(provider.feeType, provider.feeValue)}</span>
                                  {provider.minAmount && <span>Min: {formatAmount(provider.minAmount)}</span>}
                                  {provider.maxAmount && <span>Max: {formatAmount(provider.maxAmount)}</span>}
                                  {provider.dailyLimit && <span>Limite/jour: {formatAmount(provider.dailyLimit)}</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                              >
                                {provider.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProvider(provider)
                                  setSelectedMethodForProvider(method.id)
                                  setShowProviderForm(true)
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type: 'provider', id: provider.id })}
                                disabled={provider._count?.payments && provider._count.payments > 0}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Formulaires modaux */}
      <PaymentMethodForm
        isOpen={showMethodForm}
        onClose={() => {
          setShowMethodForm(false)
          setSelectedMethod(null)
        }}
        method={selectedMethod}
        onSuccess={fetchPaymentMethods}
      />

      <PaymentProviderForm
        isOpen={showProviderForm}
        onClose={() => {
          setShowProviderForm(false)
          setSelectedProvider(null)
          setSelectedMethodForProvider(null)
        }}
        provider={selectedProvider}
        methodId={selectedMethodForProvider}
        onSuccess={fetchPaymentMethods}
      />

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Supprimer ${deleteConfirm?.type === 'method' ? 'la méthode' : 'le fournisseur'}`}
        description={`Êtes-vous sûr de vouloir supprimer ${deleteConfirm?.type === 'method' ? 'cette méthode de paiement' : 'ce fournisseur'} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  )
}
