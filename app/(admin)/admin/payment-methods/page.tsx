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

interface PaymentProviderWithMethod extends PaymentProvider {
  paymentMethod?: {
    id: string
    name: string
    code: string
  }
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
  const [activeTab, setActiveTab] = useState<string>('methods')
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

  const getAllProviders = (): PaymentProviderWithMethod[] => {
    return paymentMethods.reduce((acc: PaymentProviderWithMethod[], method) => {
      const providersWithMethod = method.providers.map(provider => ({
        ...provider,
        paymentMethod: { id: method.id, name: method.name, code: method.code }
      }))
      return [...acc, ...providersWithMethod]
    }, [])
  }

  const getStats = () => {
    const total = paymentMethods.length
    const active = paymentMethods.filter(m => m.isActive).length
    const totalProviders = paymentMethods.reduce((acc, m) => acc + m.providers.length, 0)
    const activeProviders = getAllProviders().filter(p => p.isActive).length
    const totalPayments = paymentMethods.reduce((acc, m) => acc + (m._count?.payments || 0), 0)
    
    return { total, active, totalProviders, activeProviders, totalPayments }
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
      {/* En-tête simple */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configuration des Paiements</h1>
          <p className="text-gray-600 mt-1">
            Gérez les méthodes de paiement et leurs fournisseurs
          </p>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Méthodes de Paiement
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fournisseurs
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {activeTab === 'methods' && (
              <Button 
                onClick={() => setShowMethodForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle méthode
              </Button>
            )}
            {activeTab === 'providers' && (
              <Button 
                onClick={() => setShowProviderForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouveau fournisseur
              </Button>
            )}
          </div>
        </div>

        {/* Onglet Méthodes de Paiement */}
        <TabsContent value="methods" className="space-y-4">
          {paymentMethods.map((method) => {
            const IconComponent = getIcon(method.icon)
            const isEssential = method.code === 'online_payment'
            
            return (
              <Card key={method.id} className={`transition-all hover:shadow-md ${isEssential ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        method.isActive 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {method.name}
                          {isEssential && (
                            <Badge className="bg-blue-600 text-white">
                              <Shield className="h-3 w-3 mr-1" />
                              Essentiel
                            </Badge>
                          )}
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                          {method._count?.payments && method._count.payments > 0 && (
                            <Badge variant="outline">
                              {method._count.payments} paiement(s)
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-gray-100 px-1 rounded text-xs">{method.code}</code>
                          <Badge variant="outline" className="text-xs">
                            {method.type === 'DIRECT' ? '🔗 API Directe' : 
                             method.type === 'PROVIDERS' ? '👥 Fournisseurs' : 
                             '✋ Manuel'}
                          </Badge>
                          {method.apiEnabled && (
                            <Badge variant="outline" className="text-xs bg-green-50">
                              ✅ API Configurée
                            </Badge>
                          )}
                        </div>
                        {method.description && (
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMethodStatus(method.id, method.isActive)}
                      >
                        {method.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMethod(method)
                          setShowMethodForm(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!isEssential && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ type: 'method', id: method.id })}
                          disabled={method._count?.payments && method._count.payments > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </TabsContent>

        {/* Onglet Fournisseurs */}
        <TabsContent value="providers" className="space-y-4">
          {getAllProviders().map((provider) => (
            <Card key={provider.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {provider.logo ? (
                      <img 
                        src={provider.logo} 
                        alt={provider.name}
                        className="h-10 w-10 object-contain rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        <Badge variant={provider.isActive ? "default" : "secondary"}>
                          {provider.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        {provider._count?.payments && provider._count.payments > 0 && (
                          <Badge variant="outline">
                            {provider._count.payments} paiement(s)
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <code className="bg-gray-100 px-1 rounded text-xs">{provider.code}</code>
                        <span>Méthode: {provider.paymentMethod?.name}</span>
                        <span>Frais: {formatFee(provider.feeType, provider.feeValue)}</span>
                        {provider.minAmount && <span>Min: {formatAmount(provider.minAmount)}</span>}
                        {provider.maxAmount && <span>Max: {formatAmount(provider.maxAmount)}</span>}
                      </div>
                      {provider.description && (
                        <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                    >
                      {provider.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider)
                        setSelectedMethodForProvider(provider.paymentMethod?.id || null)
                        setShowProviderForm(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm({ type: 'provider', id: provider.id })}
                      disabled={provider._count?.payments && provider._count.payments > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

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
