'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Loader2,
  RefreshCw,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock
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
  createdAt: string
  fromUserId: string
  toUserId: string
  clientEmail?: string | null
  clientName?: string | null
  conversationId?: string | null
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
  LOW: { label: 'Basse', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
}

const MESSAGE_STATUSES = {
  UNREAD: { label: 'Non lu', color: 'bg-red-100 text-red-700', icon: Mail },
  READ: { label: 'Lu', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REPLIED: { label: 'Répondu', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  ARCHIVED: { label: 'Archivé', color: 'bg-gray-100 text-gray-700', icon: Clock },
  DELETED: { label: 'Supprimé', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
  })

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/messages?limit=50')
      if (response.ok) {
        const data = await response.json()
        const messages = data.messages || []

        // Grouper par client
        const conversationsMap = new Map()
        messages.forEach((message: Message) => {
          const clientKey = message.clientEmail || message.fromUserId || message.id
          if (!conversationsMap.has(clientKey)) {
            conversationsMap.set(clientKey, {
              id: clientKey,
              title: message.subject,
              clientName: message.clientName || 'Client',
              clientEmail: message.clientEmail || '',
              lastMessage: message,
              lastMessageAt: message.sentAt,
              unreadCount: message.status === 'UNREAD' ? 1 : 0,
              messages: [message],
              isActive: true,
            })
          } else {
            const conv = conversationsMap.get(clientKey)
            conv.messages.push(message)
            if (new Date(message.sentAt) > new Date(conv.lastMessageAt)) {
              conv.lastMessage = message
              conv.lastMessageAt = message.sentAt
            }
            if (message.status === 'UNREAD') conv.unreadCount++
          }
        })

        setConversations(Array.from(conversationsMap.values()))
        setMessages(messages)
      } else {
        toast.error('Erreur lors du chargement des conversations')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = fetchConversations

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
    // Filtrer par statut
    if (filters.status !== 'all' && message.status !== filters.status) return false
    
    // Filtrer par type
    if (filters.type !== 'all' && message.type !== filters.type) return false
    
    // Filtrer par priorité
    if (filters.priority !== 'all' && message.priority !== filters.priority) return false
    
    // Filtrer par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        message.subject.toLowerCase().includes(searchLower) ||
        message.content.toLowerCase().includes(searchLower) ||
        message.clientName?.toLowerCase().includes(searchLower) ||
        message.clientEmail?.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  const stats = {
    total: conversations.length,
    unread: conversations.filter(c => c.unreadCount > 0).length,
    replied: messages.filter(m => m.status === 'REPLIED').length,
    urgent: conversations.filter(c => c.lastMessage?.priority === 'URGENT').length,
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header compact */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages Clients</h1>
            <p className="text-sm text-gray-500">Communiquez avec vos clients</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchMessages}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button size="sm" onClick={() => router.push('/admin/messages/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau message
            </Button>
          </div>
        </div>

        {/* Statistiques compactes */}
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600">Non lus</p>
                <p className="text-2xl font-bold text-red-700">{stats.unread}</p>
              </div>
              <Mail className="h-8 w-8 text-red-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Répondus</p>
                <p className="text-2xl font-bold text-green-700">{stats.replied}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600">Urgents</p>
                <p className="text-2xl font-bold text-orange-700">{stats.urgent}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          {/* Sidebar filtres et liste - 4 colonnes */}
          <div className="col-span-4 flex flex-col gap-3 h-full overflow-hidden">
            {/* Filtres compacts */}
            <Card className="flex-shrink-0">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-8 h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {Object.entries(MESSAGE_STATUSES).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {Object.entries(MESSAGE_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.priority}
                    onValueChange={(value) => setFilters({ ...filters, priority: value })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {Object.entries(MESSAGE_PRIORITIES).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des messages */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
                <CardTitle className="text-sm">
                  Messages ({filteredMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-2 pb-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">Aucun message trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredMessages.map((message) => {
                      const StatusIcon = MESSAGE_STATUSES[message.status as keyof typeof MESSAGE_STATUSES]?.icon || Mail
                      return (
                        <div
                          key={message.id}
                          className={`rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                            selectedMessage?.id === message.id
                              ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                              : message.status === 'UNREAD'
                              ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <div className="flex items-start gap-2">
                            <StatusIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              message.status === 'UNREAD' ? 'text-red-500' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-sm font-medium truncate ${
                                  message.status === 'UNREAD' ? 'font-bold text-gray-900' : 'text-gray-700'
                                }`}>
                                  {message.subject}
                                </h3>
                                {message.status === 'UNREAD' && (
                                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">
                                    NON LU
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-1.5">
                                De: {message.clientName || message.clientEmail || 'Client'}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${
                                  MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].color
                                }`}>
                                  {MESSAGE_PRIORITIES[message.priority as keyof typeof MESSAGE_PRIORITIES].label}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                  {MESSAGE_TYPES[message.type as keyof typeof MESSAGE_TYPES]}
                                </Badge>
                                <span className="text-[10px] text-gray-400 ml-auto">
                                  {format(new Date(message.sentAt), 'dd/MM HH:mm', { locale: fr })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Détail du message - 8 colonnes */}
          <div className="col-span-8 h-full">
            {selectedMessage ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 pt-4 px-6 flex-shrink-0 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{selectedMessage.subject}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className={MESSAGE_PRIORITIES[selectedMessage.priority as keyof typeof MESSAGE_PRIORITIES].color}>
                          {MESSAGE_PRIORITIES[selectedMessage.priority as keyof typeof MESSAGE_PRIORITIES].label}
                        </Badge>
                        <span>•</span>
                        <span>{MESSAGE_TYPES[selectedMessage.type as keyof typeof MESSAGE_TYPES]}</span>
                        <span>•</span>
                        <Badge className={MESSAGE_STATUSES[selectedMessage.status as keyof typeof MESSAGE_STATUSES].color}>
                          {MESSAGE_STATUSES[selectedMessage.status as keyof typeof MESSAGE_STATUSES].label}
                        </Badge>
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
                        onClick={() => router.push(`/admin/messages/${selectedMessage.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Répondre
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Informations du message */}
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">De:</p>
                      <p className="text-gray-600">
                        {selectedMessage.clientName || selectedMessage.clientEmail || 'Client'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Email:</p>
                      <p className="text-gray-600">
                        {selectedMessage.clientEmail || 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Envoyé le:</p>
                      <p className="text-gray-600">
                        {format(new Date(selectedMessage.sentAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Type:</p>
                      <p className="text-gray-600">
                        {MESSAGE_TYPES[selectedMessage.type as keyof typeof MESSAGE_TYPES]}
                      </p>
                    </div>
                  </div>

                  {/* Contenu du message */}
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Message:</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="border-t pt-4">
                    <p className="font-medium text-gray-700 mb-3">Actions rapides:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => router.push(`/admin/messages/${selectedMessage.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Répondre au message
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast.info('Fonctionnalité à venir')
                        }}
                      >
                        Archiver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg font-medium">
                    Sélectionnez un message pour voir les détails
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Cliquez sur un message dans la liste pour afficher son contenu
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
