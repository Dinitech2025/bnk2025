'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash, Search, Globe, Users, User, Filter, X, ChevronUp, ChevronDown, Loader2, Calendar, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  hasProfiles: boolean
}

interface Account {
  id: string
  username: string
  email: string | null
  password: string
  isActive: boolean
  platformId: string
  platform: Platform
  createdAt: Date
  updatedAt: Date
  accountProfiles: {
    id: string
    name: string
    profileSlot: number
    isAssigned: boolean
  }[]
}

type SortField = "username" | "platform" | "profileCount" | "createdAt";
type SortOrder = "asc" | "desc";

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  useEffect(() => {
    fetchAccounts()
    fetchPlatforms()
  }, [])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/streaming/accounts')
      if (!response.ok) throw new Error('Erreur lors du chargement des comptes')
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des comptes')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/admin/streaming/platforms')
      if (!response.ok) throw new Error('Erreur lors du chargement des plateformes')
      const data = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/streaming/accounts/${deleteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      toast.success('Compte supprimé avec succès')
      fetchAccounts()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression du compte')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedAccounts = useMemo(() => {
    return accounts
      .filter(account => {
        const matchesSearch = 
          account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === "all" ||
          (statusFilter === "active" && account.isActive) ||
          (statusFilter === "inactive" && !account.isActive);

        const matchesPlatform =
          platformFilter === "all" ||
          platformFilter === account.platformId;

        return matchesSearch && matchesStatus && matchesPlatform;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "username":
            comparison = a.username.localeCompare(b.username);
            break;
          case "platform":
            comparison = a.platform.name.localeCompare(b.platform.name);
            break;
          case "profileCount":
            comparison = a.accountProfiles.length - b.accountProfiles.length;
            break;
          case "createdAt":
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [accounts, searchTerm, statusFilter, platformFilter, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comptes de Streaming</h1>
          <p className="text-muted-foreground">
            Gérez les comptes de streaming disponibles sur votre site
          </p>
        </div>
        <Link href="/admin/streaming/accounts/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un compte
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher un compte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={platformFilter}
              onValueChange={(value) => setPlatformFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plateforme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les plateformes</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== "all" || platformFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPlatformFilter("all");
                }}
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("username")}
                >
                  <div className="flex items-center">
                    Compte {getSortIcon("username")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("platform")}
                >
                  <div className="flex items-center">
                    Plateforme {getSortIcon("platform")}
                  </div>
                </TableHead>
                <TableHead>Identifiants</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("profileCount")}
                >
                  <div className="flex items-center">
                    Profils {getSortIcon("profileCount")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Créé le {getSortIcon("createdAt")}
                  </div>
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAndSortedAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {searchTerm || statusFilter !== "all" || platformFilter !== "all" ? 
                      "Aucun compte ne correspond aux critères de recherche" : 
                      "Aucun compte trouvé. Ajoutez votre premier compte."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedAccounts.map((account) => (
                  <TableRow 
                    key={account.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/streaming/accounts/${account.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{account.username}</div>
                      {account.email && (
                        <div className="text-sm text-muted-foreground">{account.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
                          {account.platform.logo ? (
                            <Image
                              src={account.platform.logo}
                              alt={account.platform.name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">
                              {account.platform.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="font-medium">{account.platform.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-[150px]">{account.username}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Key className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-[150px]">••••••••</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-gray-400" />
                        <span>
                          {account.accountProfiles.length} / {account.platform.hasProfiles ? (account.platform.maxProfilesPerAccount || 1) : 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{formatDate(account.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/streaming/accounts/${account.id}`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            title="Détails"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/streaming/accounts/${account.id}/edit`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(account.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation de suppression */}
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce compte ? Cette action ne peut pas être annulée et supprimera également tous les profils associés à ce compte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 