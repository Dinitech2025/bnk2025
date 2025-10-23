'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Search,
  Filter,
  Send,
  Eye,
  EyeOff,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Message {
  id: string
  subject: string
  content: string
  type: string
  priority: string
  status: string
  sentAt: string
  readAt: string | null
  fromUser: {
    id: string
    name: string | null
    email: string | null
    role: string
  }
  toUser: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
  }
  relatedOrder?: {
    id: string
    orderNumber: string
    status: string
  }
  relatedSubscription?: {
    id: string
    status: string
    offer: {
      name: string
    }
  }
  replies: {
    id: string
    subject: string
    content: string
    status: string
    createdAt: string
    fromUser: {
      id: string
      name: string | null
      role: string
    }
  }[]
}

const MESSAGE_TYPES = {
  GENERAL: 'Général',
  SUPPORT: 'Support',
  ORDER: 'Commande',
  SUBSCRIPTION: 'Abonnement',
  PAYMENT: 'Paiement',
  CUSTOM: 'Personnalisé',
}

const MESSAGE_PRIORITIES = {
  LOW: { label: 'Basse', color: 'bg-gray-500' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500' },
  HIGH: { label: 'Haute', color: 'bg-orange-500' },
  URGENT: { label: 'Urgente', color: 'bg-red-500' },
}

const MESSAGE_STATUSES = {
  UNREAD: { label: 'Non lu', color: 'bg-red-500' },
  READ: { label: 'Lu', color: 'bg-green-500' },
  REPLIED: { label: 'Répondu', color: 'bg-blue-500' },
  ARCHIVED: { label: 'Archivé', color: 'bg-gray-500' },
  DELETED: { label: 'Supprimé', color: 'bg-gray-500' },
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
  })

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.type && filters.type !== 'all') params.append('type', filters.type)
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority)

      const response = await fetch(`/api/admin/messages?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      } else {
        toast.error('Erreur lors du chargement des messages')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success('Message marqué comme lu')
        fetchMessages()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [filters.status, filters.type, filters.priority])

  const filteredMessages = messages.filter(message => {
    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase()
    return (
      message.subject.toLowerCase().includes(searchLower) ||
      message.content.toLowerCase().includes(searchLower) ||
      message.toUser.name?.toLowerCase().includes(searchLower) ||
      message.toUser.email?.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'UNREAD').length,
    replied: messages.filter(m => m.status === 'REPLIED').length,
    urgent: messages.filter(m => m.priority === 'URGENT').length,
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Messages Clients</h1>
          <p className="text-muted-foreground">
            Communiquez avec vos clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMessages}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => router.push('/admin/messages/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau message
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non lus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Répondus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des messages */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(MESSAGE_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(MESSAGE_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  {Object.entries(MESSAGE_PRIORITIES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Liste des messages */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Messages ({filteredMessages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun message trouvé
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?.id === message.id ? 'border-blue-500 bg-blue-50' : ''
                      } ${message.status === 'UNREAD' ? 'border-l-4 border-l-red-500' : ''}`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${message.status === 'UNREAD' ? 'font-bold' : ''}`}>
                              {message.subject}
                            </h3>
                            {message.status === 'UNREAD' && (
                              <Badge className="bg-red-500 text-white text-xs">NON LU</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            De: {message.fromUser.name || message.fromUser.email}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            À: {message.toUser.name || `${message.toUser.firstName} ${message.toUser.lastName}` || message.toUser.email}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].color}>
                              {MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].label}
                            </Badge>
                            <Badge variant="outline">
                              {MESSAGE_TYPES[message.type as keyof typeof MESSAGE_TYPES]}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(message.sentAt), 'dd/MM HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Détail du message */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription>
                      {MESSAGE_TYPES[selectedMessage.type as keyof typeof MESSAGE_TYPES]} •
                      {MESSAGE_PRIORITIES[selectedMessage.priority as keyof typeof MESSAGE_PRIORITIES].label}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedMessage.status === 'UNREAD' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(selectedMessage.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Marquer lu
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/messages/${selectedMessage.id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informations du message */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">De:</p>
                    <p className="text-muted-foreground">
                      {selectedMessage.fromUser.name || selectedMessage.fromUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">À:</p>
                    <p className="text-muted-foreground">
                      {selectedMessage.toUser.name || `${selectedMessage.toUser.firstName} ${selectedMessage.toUser.lastName}` || selectedMessage.toUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Envoyé le:</p>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedMessage.sentAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Statut:</p>
                    <Badge className={MESSAGE_STATUSES[selectedMessage.status as keyof typeof MESSAGE_STATUSES].color}>
                      {MESSAGE_STATUSES[selectedMessage.status as keyof typeof MESSAGE_STATUSES].label}
                    </Badge>
                  </div>
                </div>

                {/* Contenu du message */}
                <div>
                  <p className="font-medium mb-2">Message:</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>

                {/* Réponses */}
                {selectedMessage.replies.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Réponses ({selectedMessage.replies.length}):</p>
                    <div className="space-y-3">
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="border-l-4 border-l-blue-500 pl-4 bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">
                              {reply.fromUser.name || reply.fromUser.role}
                            </p>
                            <Badge className={MESSAGE_STATUSES[reply.status as keyof typeof MESSAGE_STATUSES].color}>
                              {MESSAGE_STATUSES[reply.status as keyof typeof MESSAGE_STATUSES].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(new Date(reply.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </p>
                          <p className="whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un message pour voir les détails</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

