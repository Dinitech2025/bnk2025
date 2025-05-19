'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash, Search, Globe, ExternalLink, Eye, Users, Filter, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  type: string
  hasProfiles: boolean
  maxProfilesPerAccount: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type SortField = "name" | "type" | "hasProfiles" | "maxProfilesPerAccount";
type SortOrder = "asc" | "desc";

export default function PlatformsPage() {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "VIDEO" | "AUDIO" | "VPN" | "CLOUD" | "GAMING" | "OTHER">("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    fetchPlatforms()
  }, [])

  const fetchPlatforms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/streaming/platforms')
      if (!response.ok) throw new Error('Erreur lors du chargement des plateformes')
      const data = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des plateformes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/streaming/platforms/${deleteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      toast.success('Plateforme supprimée avec succès')
      fetchPlatforms()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression de la plateforme')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/streaming/platforms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      
      toast.success('Statut mis à jour avec succès')
      fetchPlatforms()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut')
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

  const filteredAndSortedPlatforms = useMemo(() => {
    return platforms
      .filter(platform => {
        const matchesSearch = 
          platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          platform.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          platform.slug.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === "all" ||
          (statusFilter === "active" && platform.isActive) ||
          (statusFilter === "inactive" && !platform.isActive);

        const matchesType =
          typeFilter === "all" ||
          typeFilter === platform.type;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "type":
            comparison = a.type.localeCompare(b.type);
            break;
          case "hasProfiles":
            comparison = Number(a.hasProfiles) - Number(b.hasProfiles);
            break;
          case "maxProfilesPerAccount":
            const aProfiles = a.maxProfilesPerAccount || 0;
            const bProfiles = b.maxProfilesPerAccount || 0;
            comparison = aProfiles - bProfiles;
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [platforms, searchTerm, statusFilter, typeFilter, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plateformes de Streaming</h1>
          <p className="text-muted-foreground">
            Gérez les plateformes de streaming disponibles sur votre site
          </p>
        </div>
        <Link href="/admin/streaming/platforms/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une plateforme
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
                  placeholder="Rechercher une plateforme..."
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
            <Select
              value={typeFilter}
              onValueChange={(value: "all" | "VIDEO" | "AUDIO" | "VPN" | "CLOUD" | "GAMING" | "OTHER") => setTypeFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="VIDEO">Vidéo</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
                <SelectItem value="VPN">VPN</SelectItem>
                <SelectItem value="CLOUD">Cloud</SelectItem>
                <SelectItem value="GAMING">Gaming</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
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
                <TableHead className="max-w-xs">Description</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center">
                    Type {getSortIcon("type")}
                  </div>
                </TableHead>
                <TableHead>Site Web</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("maxProfilesPerAccount")}
                >
                  <div className="flex items-center">
                    Profils Max. {getSortIcon("maxProfilesPerAccount")}
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
              ) : filteredAndSortedPlatforms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? 
                      "Aucune plateforme ne correspond aux critères de recherche" : 
                      "Aucune plateforme trouvée. Ajoutez votre première plateforme."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedPlatforms.map((platform) => (
                  <TableRow 
                    key={platform.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/streaming/platforms/${platform.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-16 h-8 rounded-lg overflow-hidden bg-gray-100">
                          {platform.logo ? (
                            <Image
                              src={platform.logo}
                              alt={platform.name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">
                              {platform.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-muted-foreground">{platform.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {platform.description || 'Aucune description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        platform.type === 'VIDEO' ? 'default' :
                        platform.type === 'AUDIO' ? 'secondary' :
                        platform.type === 'GAMING' ? 'destructive' :
                        'outline'
                      }>
                        {platform.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {platform.websiteUrl ? (
                        <a 
                          href={platform.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Visiter
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {platform.hasProfiles ? (
                        <span className="flex items-center">
                          {platform.maxProfilesPerAccount || 0}
                          <Users className="h-4 w-4 ml-1 text-gray-400" />
                        </span>
                      ) : (
                        'Non applicable'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={platform.isActive ? "default" : "secondary"}>
                        {platform.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/streaming/platforms/${platform.id}`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/streaming/platforms/edit/${platform.id}`}>
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
                            e.stopPropagation();
                            setDeleteId(platform.id);
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
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette plateforme ? Cette action ne peut pas être annulée et peut affecter les comptes et abonnements existants.
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