'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, 
  Eye, 
  Pencil, 
  Search,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  Filter,
  Plus,
  AlertCircle,
  RefreshCw,
  Calendar,
  CreditCard,
  MoreHorizontal,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Platform {
  id: string
  name: string
  logo: string | null
  hasProfiles?: boolean
  maxProfilesPerAccount?: number
}

interface Account {
  id: string
  username: string | null
  email: string | null
}

interface AccountWithPlatform extends Account {
  platform: Platform
}

interface AccountProfile {
  id: string
  name: string | null
  profileSlot: number
  accountId: string
}

interface Subscription {
  id: string
  startDate: string
  endDate: string
  status: string
  autoRenew: boolean
  contactNeeded: boolean
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  offer: {
    id: string
    name: string
    price: number
    duration: number
    durationUnit?: string
  }
  platformOffer?: {
    platform: Platform
  }
  subscriptionAccounts: {
    account: AccountWithPlatform
  }[]
  accountProfiles: AccountProfile[]
}

type SortField = "client" | "offer" | "platform" | "status" | "startDate" | "endDate"
type SortOrder = "asc" | "desc"

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("startDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // Ajout d'un timestamp pour éviter la mise en cache par le navigateur
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/subscriptions?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Erreur lors du chargement des abonnements')
      
      const data = await response.json()
      console.log('Abonnements récupérés:', data)
      
      // Vérifier si les données sont valides
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setSubscriptions([])
        return
      }
      
      setSubscriptions(data)
      setFilteredSubscriptions(data) // Définir directement sans filtrer
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des abonnements')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Chargement initial des abonnements uniquement au montage du composant
  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Filtrage et tri des abonnements
  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, subscriptions])

  const applyFiltersAndSort = () => {
    if (!subscriptions || subscriptions.length === 0) {
      setFilteredSubscriptions([])
      return
    }

    let filtered = [...subscriptions]

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(sub => 
        sub.user.email.toLowerCase().includes(search) ||
        (sub.user.firstName && sub.user.firstName.toLowerCase().includes(search)) ||
        (sub.user.lastName && sub.user.lastName.toLowerCase().includes(search)) ||
        sub.offer.name.toLowerCase().includes(search) ||
        (sub.platformOffer?.platform.name.toLowerCase().includes(search)) ||
        sub.subscriptionAccounts.some(sa => 
          sa.account.email?.toLowerCase().includes(search) || 
          sa.account.username?.toLowerCase().includes(search)
        )
      )
    }
    
    // Filtre par statut
    if (statusFilter === 'incomplete') {
      filtered = filtered.filter(sub => 
        sub.subscriptionAccounts.length === 0 || 
        (sub.platformOffer?.platform && sub.subscriptionAccounts.some(
          sa => sa.account.platform.id !== sub.platformOffer!.platform.id
        ))
      )
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'client':
          comparison = (a.user.lastName || '').localeCompare(b.user.lastName || '')
          break
        case 'offer':
          comparison = a.offer.name.localeCompare(b.offer.name)
          break
        case 'platform':
          comparison = (a.platformOffer?.platform.name || '').localeCompare(b.platformOffer?.platform.name || '')
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          break
        case 'endDate':
          comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredSubscriptions(filtered)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />
  }

  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = async () => {
    await fetchSubscriptions()
  }

  const handleStatusChange = async (subscriptionId: string, newStatus: string, contactNeeded: boolean = false) => {
    try {
      setIsActionLoading(subscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          contactNeeded
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Mettre à jour la liste des abonnements sans recharger toute la page
      const updatedSubscriptions = subscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return { ...sub, status: newStatus, contactNeeded }
        }
        return sub
      })
      
      setSubscriptions(updatedSubscriptions)
      setFilteredSubscriptions(prevFiltered => {
        return prevFiltered.map(sub => {
          if (sub.id === subscriptionId) {
            return { ...sub, status: newStatus, contactNeeded }
          }
          return sub
        })
      })

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'abonnement a été mis à jour.',
        duration: 3000,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleClientContacted = async (subscriptionId: string) => {
    try {
      setIsActionLoading(subscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactNeeded: false,
          status: 'ACTIVE'
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Mettre à jour la liste des abonnements sans recharger toute la page
      const updatedSubscriptions = subscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return { ...sub, status: 'ACTIVE', contactNeeded: false }
        }
        return sub
      })
      
      setSubscriptions(updatedSubscriptions)
      setFilteredSubscriptions(prevFiltered => {
        return prevFiltered.map(sub => {
          if (sub.id === subscriptionId) {
            return { ...sub, status: 'ACTIVE', contactNeeded: false }
          }
          return sub
        })
      })

      toast({
        title: 'Client contacté',
        description: 'Le client a été marqué comme contacté.',
        duration: 3000,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleRenewSubscription = async (subscriptionId: string) => {
    try {
      setIsActionLoading(subscriptionId)
      const response = await fetch(`/api/admin/streaming/subscriptions/${subscriptionId}/renew`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors du renouvellement')
      }

      toast({
        title: 'Abonnement renouvelé',
        description: 'L\'abonnement a été renouvelé avec succès.',
        duration: 3000,
      })

      await fetchSubscriptions()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors du renouvellement.',
        duration: 3000,
      })
    } finally {
      setIsActionLoading(null)
      setRenewDialogOpen(false)
      setSelectedSubscriptionId(null)
    }
  }

  const openRenewDialog = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId)
    setRenewDialogOpen(true)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchSubscriptions}
            variant="outline"
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="rounded-lg border">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full mb-4" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Abonnements ({filteredSubscriptions.length})</h1>
          <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/admin/streaming/subscriptions/add">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel abonnement
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client, offre, plateforme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={clearSearch}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select
          value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actifs</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="EXPIRED">Expirés</SelectItem>
            <SelectItem value="CANCELLED">Annulés</SelectItem>
              <SelectItem value="incomplete">⚠️ Incomplets</SelectItem>
              <SelectItem value="platform_mismatch">⚠️ Plateforme incohérente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead onClick={() => handleSort("client")} className="cursor-pointer">
                  <div className="flex items-center">
                    Client {renderSortIcon("client")}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("offer")} className="cursor-pointer" colSpan={2}>
                <div className="flex items-center">
                    Offre & Plateforme {renderSortIcon("offer")}
                </div>
              </TableHead>
                <TableHead>Compte & Profils</TableHead>
                <TableHead onClick={() => handleSort("startDate")} className="cursor-pointer">
                <div className="flex items-center">
                    Période {renderSortIcon("startDate")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                <div className="flex items-center">
                  Statut {renderSortIcon("status")}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {paginatedSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <div className="text-sm">Chargement des abonnements...</div>
                      </div>
                    ) : searchTerm || statusFilter !== "all" ? (
                    <>
                      Aucun abonnement ne correspond à vos critères
                      <Button
                        variant="link"
                        onClick={() => {
                          clearSearch()
                          setStatusFilter("all")
                        }}
                        className="ml-2"
                      >
                        Réinitialiser les filtres
                      </Button>
                    </>
                  ) : (
                      <>
                        Aucun abonnement disponible
                        <div className="text-xs mt-2">
                          Créez un nouvel abonnement pour commencer
                        </div>
                      </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
                paginatedSubscriptions.map((subscription) => (
                  <TableRow 
                    key={subscription.id}
                    className={
                      (subscription.subscriptionAccounts.length === 0 || 
                       (subscription.platformOffer?.platform && 
                        subscription.subscriptionAccounts.some(sa => 
                          sa.account.platform.id !== subscription.platformOffer!.platform.id
                        ))
                      ) ? "bg-amber-50" : undefined
                    }
                  >
                  <TableCell>
                      <div className="font-medium">
                        {subscription.user.firstName} {subscription.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.user.email}
                    </div>
                  </TableCell>
                    <TableCell colSpan={2}>
                      <div className="flex items-start">
                        <div className="flex-1">
                        <div className="font-medium">{subscription.offer.name}</div>
                        <div className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {Number(subscription.offer.price).toFixed(2)}€ / {
                                subscription.offer.durationUnit === 'MONTH' ? 'mois' :
                                subscription.offer.durationUnit === 'YEAR' ? 'an' : 
                                subscription.offer.durationUnit === 'WEEK' ? 'semaine' : 'jour'
                              }
                            </span>
                          </div>
                        </div>
                        {subscription.platformOffer?.platform ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center space-x-2">
                              {subscription.platformOffer.platform.logo && (
                                <img 
                                  src={subscription.platformOffer.platform.logo}
                                  alt={subscription.platformOffer.platform.name}
                                  className="w-6 h-6 rounded"
                                />
                              )}
                              <span className="font-medium">{subscription.platformOffer.platform.name}</span>
                            </div>
                            {subscription.platformOffer.platform.hasProfiles && (
                              <div className="text-xs text-muted-foreground">
                                {subscription.platformOffer.platform.maxProfilesPerAccount} profils max
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-shrink-0">
                            {/* Plateforme non spécifiée, mais n'affichons rien */}
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                      {subscription.subscriptionAccounts.length > 0 ? (
                        <div className="space-y-3">
                          {subscription.subscriptionAccounts.map((sa, index) => {
                            // Vérifier si la plateforme du compte correspond à celle de l'offre
                            const isPlatformMismatch = subscription.platformOffer?.platform &&
                              sa.account.platform.id !== subscription.platformOffer.platform.id;
                            
                            return (
                              <div 
                                key={index} 
                                className={`border-l-2 pl-2 py-1 ${isPlatformMismatch ? 'border-red-400' : 'border-blue-400'}`}
                              >
                                <div className="flex items-center space-x-1">
                                  <User className={`h-4 w-4 ${isPlatformMismatch ? 'text-red-500' : 'text-blue-500'}`} />
                                  <Link 
                                    href={`/admin/streaming/accounts/${sa.account.id}`}
                                    className="hover:underline font-medium"
                                  >
                                    {sa.account.username || sa.account.email || 'Compte sans nom'}
                                  </Link>
                                  <span className={`text-xs rounded-full px-2 py-0.5 ml-2 ${
                                    isPlatformMismatch 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {sa.account.platform.name}
                                  </span>
                                  
                                  {isPlatformMismatch && (
                                    <span className="text-xs bg-red-100 text-red-800 rounded px-1 ml-1 flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Plateforme incorrecte
                                    </span>
                                  )}
                                </div>
                                
                                {/* Profils associés à ce compte spécifique */}
                                {subscription.accountProfiles.length > 0 && 
                                 subscription.accountProfiles.filter(p => p.accountId === sa.account.id).length > 0 ? (
                                  <div className="ml-4 mt-1">
                                    <div className="text-xs text-muted-foreground mb-1">Profils:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {subscription.accountProfiles
                                        .filter(p => p.accountId === sa.account.id)
                                        .map((profile, idx) => (
                                          <div 
                                            key={idx} 
                                            className={`flex items-center text-xs rounded-full px-2 py-1 ${
                                              isPlatformMismatch 
                                                ? 'bg-red-50' 
                                                : 'bg-gray-100'
                                            }`}
                                            title={`Slot ${profile.profileSlot}`}
                                          >
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 text-[10px] ${
                                              isPlatformMismatch 
                                                ? 'bg-red-200' 
                                                : 'bg-gray-300'
                                            }`}>
                                              {profile.profileSlot}
                                            </span>
                                            <span>{profile.name || `Profil ${profile.profileSlot}`}</span>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  </div>
                                ) : (
                                  sa.account.platform.hasProfiles && (
                                    <div className="ml-4 mt-1 text-xs text-muted-foreground italic">
                                      Aucun profil assigné
                                    </div>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span>Aucun compte associé</span>
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 rounded px-1">Obligatoire</span>
                    </div>
                      )}
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col text-sm space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                          <span>Début: <span className="font-medium">{formatDate(subscription.startDate)}</span></span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-red-500" />
                          <span>Fin: <span className="font-medium">{formatDate(subscription.endDate)}</span></span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const durationUnit = subscription.offer.durationUnit || 'DAY';
                            const duration = subscription.offer.duration;
                            
                            return `${formatDuration(duration, durationUnit)} d'abonnement`;
                          })()}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="relative group">
                        <div className="flex items-center">
                          <Badge
                            variant={
                              subscription.status === 'ACTIVE' ? 'success' :
                              subscription.status === 'PENDING' ? 'warning' :
                              subscription.status === 'CONTACT_NEEDED' ? 'outline' :
                              subscription.status === 'EXPIRED' ? 'destructive' :
                              'secondary'
                            }
                            className="cursor-pointer"
                            onClick={() => {
                              // Ouvrir le menu de statut lors du clic sur le badge
                              document.getElementById(`status-dropdown-${subscription.id}`)?.click();
                            }}
                          >
                            <div className="flex items-center">
                              {subscription.status === 'ACTIVE' ? 'Actif' :
                               subscription.status === 'PENDING' ? 'En attente' :
                               subscription.status === 'CONTACT_NEEDED' ? 'Client à contacter' :
                               subscription.status === 'EXPIRED' ? 'Expiré' :
                               subscription.status === 'CANCELLED' ? 'Annulé' :
                               subscription.status}
                              <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                            </div>
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 ml-1 invisible group-hover:visible"
                                id={`status-dropdown-${subscription.id}`}
                                disabled={isActionLoading === subscription.id}
                              >
                                {isActionLoading === subscription.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : null}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem 
                                disabled={subscription.status === 'ACTIVE' || isActionLoading === subscription.id}
                                onClick={() => handleStatusChange(subscription.id, 'ACTIVE')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                Activer
                              </DropdownMenuItem>
                              {subscription.status === 'CONTACT_NEEDED' && (
                                <DropdownMenuItem 
                                  disabled={isActionLoading === subscription.id}
                                  onClick={() => handleClientContacted(subscription.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                                  Marquer comme contacté
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                disabled={subscription.status === 'PENDING' || isActionLoading === subscription.id}
                                onClick={() => handleStatusChange(subscription.id, 'PENDING')}
                              >
                                <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                                Mettre en attente
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                disabled={subscription.status === 'EXPIRED' || isActionLoading === subscription.id}
                                onClick={() => handleStatusChange(subscription.id, 'EXPIRED')}
                              >
                                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                Marquer comme expiré
                              </DropdownMenuItem>
                              {subscription.status !== 'CONTACT_NEEDED' && (
                                <DropdownMenuItem 
                                  disabled={isActionLoading === subscription.id}
                                  onClick={() => handleStatusChange(subscription.id, 'CONTACT_NEEDED', true)}
                                >
                                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                                  Marquer "client à contacter"
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {subscription.status === 'EXPIRED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 ml-1"
                              title="Renouveler l'abonnement"
                              onClick={() => openRenewDialog(subscription.id)}
                              disabled={isActionLoading === subscription.id}
                            >
                              <RefreshCw className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                        
                        {subscription.contactNeeded && (
                          <div className="mt-1 text-xs">
                            <Badge variant="outline" className="text-xs bg-yellow-50">Client à rappeler</Badge>
                          </div>
                        )}
                        {subscription.autoRenew && (
                          <div className="mt-1 text-xs">
                            <Badge variant="outline" className="text-xs">Renouvellement auto</Badge>
                          </div>
                        )}
                    </div>
                  </TableCell>
                    <TableCell className="text-right relative">
                    <div className="flex justify-end space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isActionLoading === subscription.id}>
                              {isActionLoading === subscription.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                      <Link href={`/admin/streaming/subscriptions/${subscription.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/streaming/subscriptions/${subscription.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/add?subscriptionId=${subscription.id}`}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Créer une commande
                      </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {(subscription.subscriptionAccounts.length === 0 || 
                        (subscription.platformOffer?.platform && 
                         subscription.subscriptionAccounts.some(sa => 
                           sa.account.platform.id !== subscription.platformOffer!.platform.id
                         ))
                      ) && (
                        <div className="absolute right-1 top-1 text-amber-500" title="Abonnement incomplet ou incohérent">
                          <AlertCircle className="h-4 w-4" />
                    </div>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Éléments par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Affichage de {filteredSubscriptions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} sur {filteredSubscriptions.length} abonnements
            </p>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
    </div>

      <AlertDialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renouveler cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va créer un nouvel abonnement en utilisant les mêmes paramètres 
              (offre, comptes, profils) que l'abonnement actuel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading !== null}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSubscriptionId && handleRenewSubscription(selectedSubscriptionId)}
              disabled={isActionLoading !== null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isActionLoading === selectedSubscriptionId ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Renouveler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 
 
 
 