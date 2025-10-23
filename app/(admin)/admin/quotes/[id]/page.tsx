'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { UnifiedQuoteMessages } from '@/components/admin/quotes/unified-quote-messages'
import { toast } from 'sonner'

interface Quote {
  id: string
  status: string
  description: string
  budget: number | null
  finalPrice: number | null
  proposedPrice: number | null
  attachments?: string[]
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  service: {
    id: string
    name: string
    slug: string
    price: number | null
    pricingType: string
    description: string | null
  }
  messages: Array<{
    id: string
    message: string
    attachments?: string[]
    proposedPrice?: number | null
    createdAt: string
    isAdminReply: boolean
    sender: {
      id: string
      name: string | null
      email: string
      role: string
    }
  }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  NEGOTIATING: { label: 'En négociation', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
  PRICE_PROPOSED: { label: 'Prix proposé', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: DollarSign },
  ACCEPTED: { label: 'Accepté', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  REJECTED: { label: 'Refusé', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
}

export default function AdminQuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du devis')
      }
      const result = await response.json()
      setQuote(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      toast.error('Erreur lors du chargement du devis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchQuote()
    }

    // Récupérer l'ID de l'utilisateur courant
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.id) {
          setCurrentUserId(session.user.id)
        }
      })
  }, [params.id])

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut')
      }

      toast.success('Statut mis à jour avec succès')
      fetchQuote()

    } catch (err) {
      console.error('Erreur:', err)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Erreur</h2>
          <p className="text-gray-600">{error || 'Devis non trouvé'}</p>
          <Button asChild className="mt-4">
            <Link href="/admin/quotes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux devis
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/quotes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Détail du Devis</h1>
            <p className="text-gray-600">
              Créé le {format(new Date(quote.createdAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
        <Badge className={`${statusConfig.color} flex items-center gap-1 px-3 py-1`}>
          <StatusIcon className="h-4 w-4" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations du service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service demandé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">{quote.service.name}</h3>
                {quote.service.description && (
                  <p className="text-gray-600 mt-2">{quote.service.description}</p>
                )}
              </div>
              {quote.service.price && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Prix de base:</span>
                  <span className="font-bold">
                    <PriceWithConversion price={quote.service.price} />
                  </span>
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Description de la demande:</p>
                <p className="text-gray-600 whitespace-pre-wrap">{quote.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                Échangez avec le client pour affiner le devis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedQuoteMessages
                messages={quote.messages}
                quoteId={quote.id}
                currentUserId={currentUserId}
                onMessageSent={fetchQuote}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium">{quote.user.name || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{quote.user.email}</p>
              </div>
              {quote.user.phone && (
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{quote.user.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prix et budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.budget && (
                <div>
                  <p className="text-sm text-gray-600">Budget client</p>
                  <p className="font-bold text-lg">
                    <PriceWithConversion price={quote.budget} />
                  </p>
                </div>
              )}
              {quote.proposedPrice && (
                <div>
                  <p className="text-sm text-gray-600">Prix proposé</p>
                  <p className="font-bold text-lg text-blue-600">
                    <PriceWithConversion price={quote.proposedPrice} />
                  </p>
                </div>
              )}
              {quote.finalPrice && (
                <div>
                  <p className="text-sm text-gray-600">Prix final</p>
                  <p className="font-bold text-lg text-green-600">
                    <PriceWithConversion price={quote.finalPrice} />
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quote.status === 'PENDING' && (
                <Button
                  onClick={() => handleUpdateStatus('NEGOTIATING')}
                  className="w-full"
                  variant="outline"
                >
                  Démarrer la négociation
                </Button>
              )}
              {quote.status === 'PRICE_PROPOSED' && (
                <>
                  <Button
                    onClick={() => handleUpdateStatus('ACCEPTED')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accepter le devis
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="w-full"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser le devis
                  </Button>
                </>
              )}
              {quote.status === 'ACCEPTED' && (
                <Button
                  onClick={() => router.push(`/admin/orders/new?quoteId=${quote.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Créer une commande
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

