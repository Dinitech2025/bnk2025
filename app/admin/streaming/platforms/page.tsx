'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash, Search, Globe, ExternalLink, Eye, Users } from 'lucide-react'
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

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const filteredPlatforms = platforms.filter(platform => 
    platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          type="search"
          placeholder="Rechercher une plateforme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Button type="submit" size="sm" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '50px' }}></TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Site Web</TableHead>
              <TableHead>Profils Max.</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredPlatforms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  {searchTerm ? 
                    "Aucune plateforme trouvée avec cette recherche" : 
                    "Aucune plateforme trouvée. Ajoutez votre première plateforme."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredPlatforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage 
                        src={platform.logo || ''} 
                        alt={platform.name} 
                      />
                      <AvatarFallback>
                        {platform.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/admin/streaming/platforms/${platform.id}`}
                      className="font-medium hover:underline cursor-pointer"
                    >
                      {platform.name}
                    </Link>
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
                    <Switch
                      checked={platform.isActive}
                      onCheckedChange={() => handleToggleStatus(platform.id, platform.isActive)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/streaming/platforms/${platform.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/streaming/platforms/edit/${platform.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(platform.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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