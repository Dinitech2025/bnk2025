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
  Key, 
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
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
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

interface Platform {
  id: string
  name: string
  logo: string | null
  maxProfilesPerAccount: number | null
}

interface Account {
  id: string
  username: string | null
  platform: Platform
}

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
}

interface Profile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  account: Account
  accountId: string
  subscription: Subscription | null
  subscriptionId: string | null
}

type SortField = "name" | "profileSlot" | "platform" | "account" | "status" | "subscription"
type SortOrder = "asc" | "desc"

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>("profileSlot")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "unassigned">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showDebug, setShowDebug] = useState(false)

  const fetchProfiles = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // Ajout d'un timestamp pour éviter la mise en cache par le navigateur
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/streaming/profiles?t=${timestamp}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) throw new Error('Erreur lors du chargement des profils')
      
      const data = await response.json()
      console.log('Profils récupérés:', data)
      
      // Vérifier si les données sont valides
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setError('Format de données incorrect')
        setProfiles([])
        return
      }
      
      setProfiles(data)
      setFilteredProfiles(data) // Définir directement sans filtrer
      setError(null)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des profils')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Chargement initial des profils uniquement au montage du composant
  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // Filtrage et tri des profils
  useEffect(() => {
    applyFiltersAndSort()
  }, [searchTerm, sortField, sortOrder, statusFilter, profiles])

  const applyFiltersAndSort = () => {
    if (!profiles || profiles.length === 0) {
      setFilteredProfiles([])
      return
    }

    let filtered = [...profiles]
    
    try {
      // Appliquer les filtres ici si nécessaire
      // Pour l'instant, on renvoie simplement tous les profils
      setFilteredProfiles(filtered)
    } catch (error) {
      console.error("Erreur lors du filtrage:", error)
      setFilteredProfiles([]) // En cas d'erreur, afficher une liste vide
    }
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

  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = async () => {
    await fetchProfiles()
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <div className="mt-4 flex space-x-4">
            <Button 
              onClick={fetchProfiles}
              variant="outline"
            >
              Réessayer
            </Button>
            <Link href="/admin/streaming/profiles/debug">
              <Button variant="secondary">
                <AlertCircle className="h-4 w-4 mr-2" />
                Page de débogage
              </Button>
            </Link>
          </div>
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Profils ({filteredProfiles.length})</h1>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-muted-foreground">
            Données synchronisées en temps réel
          </div>
          <Link href="/admin/streaming/profiles/debug">
            <Button variant="secondary" size="sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              Débogage
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/admin/streaming/profiles/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau profil
            </Button>
          </Link>
        </div>
      </div>

      {showDebug && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <div className="flex justify-between">
            <p className="font-bold">Informations de débogage:</p>
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <p>Profils bruts: {profiles.length}</p>
          <p>Profils filtrés: {filteredProfiles.length}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              console.log("Profils bruts:", profiles);
              console.log("Profils filtrés:", filteredProfiles);
              alert(`Profils: ${profiles.length}, Filtrés: ${filteredProfiles.length}`);
            }}
          >
            Logs console
          </Button>
        </div>
      )}

      {profiles.length > 0 && filteredProfiles.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          <p className="font-medium">Informations de débogage:</p>
          <p>Il y a {profiles.length} profils mais aucun n'est affiché après filtrage.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowDebug(true)}>
            Afficher plus d'informations
          </Button>
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, compte, plateforme..."
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
          onValueChange={(value: "all" | "assigned" | "unassigned") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="assigned">Assignés</SelectItem>
            <SelectItem value="unassigned">Non assignés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                <div className="flex items-center">
                  Profil {renderSortIcon("name")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("account")} className="cursor-pointer">
                <div className="flex items-center">
                  Compte {renderSortIcon("account")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("platform")} className="cursor-pointer">
                <div className="flex items-center">
                  Plateforme {renderSortIcon("platform")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                <div className="flex items-center">
                  Statut {renderSortIcon("status")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("subscription")} className="cursor-pointer">
                <div className="flex items-center">
                  Abonnement {renderSortIcon("subscription")}
                </div>
              </TableHead>
              <TableHead>PIN</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Skeleton className="h-8 w-32" />
                      <div className="text-sm">Chargement des profils...</div>
                    </div>
                  ) : profiles.length > 0 && (searchTerm || statusFilter !== "all") ? (
                    <>
                      Aucun profil ne correspond à vos critères
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
                  ) : profiles.length > 0 ? (
                    <>
                      Les profils existent mais aucun n'est filtré correctement
                      <div className="text-xs mt-2">
                        {profiles.length} profils trouvés au total
                      </div>
                    </>
                  ) : (
                    <>
                      Aucun profil disponible
                      <div className="text-xs mt-2">
                        Vérifiez que vous avez créé des profils de compte
                      </div>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="font-medium">
                      {profile.name || `Profil ${profile.profileSlot}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      P{profile.profileSlot}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <Link 
                        href={`/admin/streaming/accounts/${profile.account.id}`}
                        className="hover:underline"
                      >
                        {profile.account.username || 'Sans nom'}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{profile.account.platform.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Max {profile.account.platform.maxProfilesPerAccount} profils
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.isAssigned ? "default" : "secondary"}>
                      {profile.isAssigned ? "Assigné" : "Non assigné"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.subscription ? (
                      <div>
                        <Badge variant={profile.subscription.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {profile.subscription.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Expire le {formatDate(profile.subscription.endDate)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="secondary">Non abonné</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-gray-400" />
                      <span>{profile.pin || "••••"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/admin/streaming/profiles/${profile.id}`}>
                        <Button variant="ghost" size="icon" title="Voir les détails">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/streaming/profiles/${profile.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
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
            Affichage de {filteredProfiles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} sur {filteredProfiles.length} profils
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
  )
} 