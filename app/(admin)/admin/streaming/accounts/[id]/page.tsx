'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Pencil, 
  User, 
  Users, 
  Key, 
  Calendar, 
  Globe, 
  Check,
  X as XIcon,
  Loader2,
  Trash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
  maxProfilesPerAccount: number | null
  websiteUrl: string | null
  hasProfiles: boolean
}

interface AccountProfile {
  id: string
  name: string | null
  profileSlot: number
  pin: string | null
  isAssigned: boolean
  accountId: string
}

interface Account {
  id: string
  username: string
  email: string | null
  password: string
  status: string
  platformId: string
  platform: Platform
  createdAt: Date
  updatedAt: Date
  accountProfiles: AccountProfile[]
}

export default function AccountDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [account, setAccount] = useState<Account | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)

  useEffect(() => {
    fetchAccountDetails()
  }, [id])

  const fetchAccountDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/streaming/accounts/${id}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails du compte')
      const data = await response.json()
      setAccount(data)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue lors du chargement des détails du compte')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!account) return
    
    setIsUpdating(true)
    try {
      const newStatus = account.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
      const response = await fetch(`/api/admin/streaming/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      
      toast.success('Statut mis à jour avec succès')
      setAccount({
        ...account,
        status: newStatus
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleProfileStatus = async (profileId: string, currentStatus: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${profileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAssigned: !currentStatus }),
      })
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      
      toast.success('Statut du profil mis à jour avec succès')
      
      // Mettre à jour l'état local
      if (account) {
        const updatedProfiles = account.accountProfiles.map(profile => 
          profile.id === profileId 
            ? { ...profile, isAssigned: !currentStatus } 
            : profile
        )
        setAccount({
          ...account,
          accountProfiles: updatedProfiles
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut du profil')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!deleteProfileId) return
    
    setIsDeletingProfile(true)
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${deleteProfileId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      toast.success('Profil supprimé avec succès')
      
      // Mettre à jour l'état local
      if (account) {
        const updatedProfiles = account.accountProfiles.filter(profile => profile.id !== deleteProfileId)
        setAccount({
          ...account,
          accountProfiles: updatedProfiles
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression du profil')
    } finally {
      setIsDeletingProfile(false)
      setDeleteProfileId(null)
    }
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            onClick={fetchAccountDetails}
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              {account.username}
              <Badge 
                variant={account.status === 'AVAILABLE' ? "default" : "secondary"}
                className="ml-3"
              >
                {account.status === 'AVAILABLE' ? "Disponible" : "Indisponible"}
              </Badge>
            </h1>
            {account.email && (
              <p className="text-muted-foreground">{account.email}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : account.status === 'AVAILABLE' ? (
              <XIcon className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {account.status === 'AVAILABLE' ? "Rendre indisponible" : "Rendre disponible"}
          </Button>
          <Link href={`/admin/streaming/accounts/${id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 mr-4">
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
              <div>
                <div className="font-medium">{account.platform.name}</div>
                <Badge variant="outline">{account.platform.type}</Badge>
              </div>
            </div>
            
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Nom d'utilisateur:</span>
              <span className="ml-2">{account.username}</span>
            </div>
            
            <div className="flex items-center">
              <Key className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Mot de passe:</span>
              <span className="ml-2">••••••••</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(account.password);
                  toast.success('Mot de passe copié dans le presse-papier');
                }}
                className="ml-2 h-6"
              >
                Copier
              </Button>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Créé le:</span>
              <span className="ml-2">{formatDate(account.createdAt)}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <span className="font-medium">Dernière mise à jour:</span>
              <span className="ml-2">{formatDate(account.updatedAt)}</span>
            </div>
            
            {account.platform.websiteUrl && (
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4 text-gray-400" />
                <span className="font-medium">Site web:</span>
                <a 
                  href={account.platform.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  Visiter le site
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profils ({account.accountProfiles.length}/{account.platform.hasProfiles ? (account.platform.maxProfilesPerAccount || 1) : 0})</CardTitle>
            <CardDescription>
              Les profils associés à ce compte sur {account.platform.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {account.accountProfiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun profil associé à ce compte
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profil</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.accountProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="font-medium">Profil {profile.profileSlot}</div>
                            <Badge variant={profile.isAssigned ? "default" : "secondary"}>
                              {profile.isAssigned ? "Assigné" : "Non assigné"}
                            </Badge>
                          </div>
                          {profile.name && (
                            <div className="text-sm text-muted-foreground">{profile.name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Key className="mr-2 h-4 w-4 text-gray-400" />
                            <span>{profile.pin || "••••"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={profile.isAssigned}
                            onCheckedChange={() => handleToggleProfileStatus(profile.id, profile.isAssigned)}
                            disabled={isUpdating}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteProfileId(profile.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation de suppression de profil */}
      <Dialog open={!!deleteProfileId} onOpenChange={(open: boolean) => !open && setDeleteProfileId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce profil ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProfileId(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProfile} 
              disabled={isDeletingProfile}
            >
              {isDeletingProfile ? "Suppression..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 