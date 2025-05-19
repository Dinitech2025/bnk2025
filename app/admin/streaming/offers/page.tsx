'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Trash, X, ChevronUp, ChevronDown, Loader2, Tag, Clock } from 'lucide-react'
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
import { formatPrice, formatDuration } from '@/lib/utils'
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
import { Offer, Platform, PlatformConfig } from "@/types/offer"
import Image from 'next/image'

type SortField = "name" | "price" | "duration" | "platformCount";
type SortOrder = "asc" | "desc";

export default function OffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/streaming/offers')
      if (!response.ok) throw new Error('Erreur lors du chargement des offres')
      const data = await response.json()
      setOffers(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des offres')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/streaming/offers/${deleteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      toast.success('Offre supprimée avec succès')
      fetchOffers()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression de l\'offre')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const filteredAndSortedOffers = useMemo(() => {
    return offers
      .filter(offer => {
        const matchesSearch = 
          offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = 
          statusFilter === "all" ||
          (statusFilter === "active" && offer.isActive) ||
          (statusFilter === "inactive" && !offer.isActive)

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let comparison = 0
        switch (sortField) {
          case "name":
            comparison = a.name.localeCompare(b.name)
            break
          case "price":
            comparison = a.price - b.price
            break
          case "duration":
            const aValue = a.duration * getDurationMultiplier(a.durationUnit)
            const bValue = b.duration * getDurationMultiplier(b.durationUnit)
            comparison = aValue - bValue
            break
          case "platformCount":
            comparison = a.platformConfigs.length - b.platformConfigs.length
            break
        }
        return sortOrder === "asc" ? comparison : -comparison
      })
  }, [offers, searchTerm, statusFilter, sortField, sortOrder])

  function getDurationMultiplier(unit: string): number {
    switch (unit) {
      case 'DAY': return 1
      case 'WEEK': return 7
      case 'MONTH': return 30
      case 'YEAR': return 365
      default: return 1
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offres de Streaming</h1>
          <p className="text-muted-foreground">
            Gérez les offres d'abonnement disponibles sur votre plateforme
          </p>
        </div>
        <Link href="/admin/streaming/offers/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une offre
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
                  placeholder="Rechercher une offre..."
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
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="inactive">Inactives</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
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
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Nom {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center">
                    Prix {getSortIcon("price")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("duration")}
                >
                  <div className="flex items-center">
                    Durée {getSortIcon("duration")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("platformCount")}
                >
                  <div className="flex items-center">
                    Plateformes {getSortIcon("platformCount")}
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
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAndSortedOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    {searchTerm || statusFilter !== "all" ? 
                      "Aucune offre ne correspond aux critères de recherche" : 
                      "Aucune offre trouvée. Ajoutez votre première offre."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOffers.map((offer) => (
                  <TableRow 
                    key={offer.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/streaming/offers/${offer.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-16 h-8 rounded-lg overflow-hidden bg-gray-100">
                          {offer.images && offer.images.length > 0 ? (
                            <Image
                              src={offer.images[0]}
                              alt={offer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">
                              {offer.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{offer.name}</div>
                          {offer.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                              {offer.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-green-600" />
                        {formatPrice(offer.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        {formatDuration(offer.duration, offer.durationUnit)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {offer.platformConfigs.map(config => (
                          <Badge
                            key={config.platformId}
                            variant={config.isDefault ? "default" : "secondary"}
                            className="whitespace-nowrap"
                          >
                            {config.platform?.name} ({config.profileCount})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={offer.isActive ? "default" : "secondary"}>
                        {offer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/streaming/offers/${offer.id}`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/streaming/offers/${offer.id}/edit`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(offer.id)
                          }}
                          className="text-red-500 hover:text-red-700"
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
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette offre ? Cette action ne peut pas être annulée et peut affecter les abonnements existants.
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