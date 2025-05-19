'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
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
import { Key, Pencil, Loader2, Trash, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Platform {
  id: string
  name: string
  logo: string | null
  maxProfilesPerAccount: number | null
  hasProfiles: boolean
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
  subscription: Subscription | null
}

interface ProfilesManagerProps {
  accountId: string
  profiles: Profile[]
  maxProfiles: number
  onProfilesChange: () => void
}

export default function ProfilesManager({ 
  accountId, 
  profiles, 
  maxProfiles,
  onProfilesChange 
}: ProfilesManagerProps) {
  if (profiles.length > 0 && !profiles[0].account.platform.hasProfiles) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          Cette plateforme ne supporte pas la gestion des profils.
        </p>
      </div>
    );
  }

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    isAssigned: false
  })

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name || '',
      pin: profile.pin || '',
      isAssigned: profile.isAssigned
    })
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return

    try {
      const response = await fetch(`/api/admin/streaming/profiles/${editingProfile.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || null,
          pin: formData.pin || null,
          isAssigned: formData.isAssigned
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour du profil')
      }

      toast.success('Profil mis à jour avec succès')
      onProfilesChange()
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil')
    }
  }

  const handleDeleteProfile = async () => {
    if (!deleteProfileId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/streaming/profiles/${deleteProfileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression du profil')
      }

      toast.success('Profil supprimé avec succès')
      onProfilesChange()
      setDeleteProfileId(null)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression du profil')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Profils ({profiles.length}/{profiles.length > 0 && profiles[0].account.platform.hasProfiles ? maxProfiles : 0})
        </h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profil</TableHead>
            <TableHead>Compte</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Abonnement</TableHead>
            <TableHead>PIN</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => {
            const { account } = profile as { account: Account }
            return (
            <TableRow key={profile.id}>
              <TableCell>
                <div className="font-medium">Profil {profile.profileSlot}</div>
                {profile.name && (
                  <div className="text-sm text-muted-foreground">{profile.name}</div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Link 
                      href={`/admin/streaming/accounts/${account.id}`}
                    className="hover:underline"
                  >
                      {account.username || 'Sans nom'}
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground">
                    {account.platform.name}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditProfile(profile)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteProfileId(profile.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Modifier le profil {editingProfile?.profileSlot}
              {editingProfile?.name && ` (${editingProfile.name})`}
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations du profil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du profil</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Entrez un nom pour ce profil (optionnel)"
              />
              <p className="text-sm text-muted-foreground">
                Laissez vide pour utiliser le nom par défaut
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Code PIN</Label>
              <Input
                id="pin"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Entrez un code PIN (optionnel)"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <p className="text-sm text-muted-foreground">
                Laissez vide pour supprimer le code PIN
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAssigned"
                checked={formData.isAssigned}
                onCheckedChange={(checked) => setFormData({ ...formData, isAssigned: checked })}
              />
              <Label htmlFor="isAssigned">Profil assigné</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveProfile}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteProfileId} onOpenChange={(open) => !open && setDeleteProfileId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce profil ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProfileId(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 