'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface GiftCard {
  id: string
  code: string
  amount: number
  currency: string
  status: string
  platform: {
    name: string
    logo: string | null
  }
  usedBy: {
    email: string
  } | null
  usedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    try {
      const response = await fetch('/api/admin/streaming/gift-cards')
      if (!response.ok) throw new Error('Erreur lors du chargement des cartes cadeaux')
      const data = await response.json()
      setGiftCards(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredGiftCards = giftCards.filter(card => 
    card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge>Actif</Badge>
      case 'USED':
        return <Badge variant="secondary">Utilisé</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expiré</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Cartes Cadeaux</h1>
          <Badge variant="outline" className="ml-2">
            {giftCards.length}
          </Badge>
        </div>
        <Link href="/admin/streaming/gift-cards/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle carte
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par code ou plateforme..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Plateforme</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Utilisé par</TableHead>
              <TableHead>Date d'expiration</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGiftCards.map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-medium">{card.code}</TableCell>
                <TableCell>{card.platform.name}</TableCell>
                <TableCell>{formatPrice(card.amount, 'TRY')}</TableCell>
                <TableCell>{getStatusBadge(card.status)}</TableCell>
                <TableCell>{card.usedBy?.email || '-'}</TableCell>
                <TableCell>
                  {card.expiresAt ? formatDate(card.expiresAt) : 'Non définie'}
                </TableCell>
                <TableCell>{formatDate(card.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/streaming/gift-cards/${card.id}`}>
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredGiftCards.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  Aucune carte cadeau trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 