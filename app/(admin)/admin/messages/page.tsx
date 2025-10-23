'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Loader2,
  RefreshCw,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Check,
  CheckCheck,
  Pencil
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
  readAt?: string | null
}

interface Conversation {
  id: string
  clientName: string
  clientEmail: string
  messages: Message[]
  lastMessage: Message
  lastMessageAt: string
  unreadCount: number
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

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
  })

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom()
    }
  }, [selectedConversation?.messages])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/messages?limit=100')
      if (response.ok) {
        const data = await response.json()
        const messages = data.messages || []

        // Grouper par client et créer des conversations
        const conversationsMap = new Map<string, Conversation>()
        messages.forEach((message: Message) => {
          const clientKey = message.clientEmail || message.fromUserId || message.id
          if (!conversationsMap.has(clientKey)) {
            conversationsMap.set(clientKey, {
              id: clientKey,
              clientName: message.clientName || 'Client',
              clientEmail: message.clientEmail || '',
              messages: [message],
              lastMessage: message,
              lastMessageAt: message.sentAt,
              unreadCount: message.status === 'UNREAD' ? 1 : 0,
            })
          } else {
            const conv = conversationsMap.get(clientKey)!
            conv.messages.push(message)
            if (new Date(message.sentAt) > new Date(conv.lastMessageAt)) {
              conv.lastMessage = message
              conv.lastMessageAt = message.sentAt
            }
            if (message.status === 'UNREAD') conv.unreadCount++
          }
        })

        // Trier les messages de chaque conversation par date (plus ancien en premier)
        conversationsMap.forEach(conv => {
          conv.messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
        })

        // Trier les conversations par dernier message (plus récent en premier)
        const sortedConversations = Array.from(conversationsMap.values()).sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        )

        setConversations(sortedConversations)

        // Si une conversation est sélectionnée, la mettre à jour SANS changer la sélection
        if (selectedConversation) {
          const updated = sortedConversations.find(c => c.id === selectedConversation.id)
          if (updated) {
            // Mettre à jour uniquement les données, pas la sélection
            setSelectedConversation(updated)
          }
        }
        // NE PAS sélectionner automatiquement la première conversation
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

  // Marquer tous les messages d'une conversation comme lus
  const markConversationAsRead = async (conversation: Conversation) => {
    const unreadMessages = conversation.messages.filter(m => m.status === 'UNREAD')
    
    for (const message of unreadMessages) {
      try {
        await fetch(`/api/admin/messages/${message.id}/read`, {
          method: 'PATCH',
        })
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error)
      }
    }
    
    // Rafraîchir les conversations
    fetchConversations()
  }

  // Sélectionner une conversation
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setReplyMessage('')
    
    // Marquer comme lu après un court délai
    setTimeout(() => {
      markConversationAsRead(conversation)
    }, 1000)
  }

  // Envoyer une réponse
  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    setIsTyping(false)

    // Trouver le premier message du client pour avoir son vrai userId
    const clientMessage = selectedConversation.messages.find(m => m.fromUserId !== 'admin')
    
    if (!clientMessage) {
      toast.error('Impossible de trouver le destinataire')
      setIsSending(false)
      return
    }

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `RE: ${selectedConversation.lastMessage.subject}`,
          content: replyMessage,
          toUserId: clientMessage.fromUserId,
          type: selectedConversation.lastMessage.type || 'SUPPORT',
          priority: 'NORMAL',
          parentMessageId: selectedConversation.lastMessage.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Réponse instantanée - ajouter le message localement avec les vraies données
        const newMessage: Message = {
          id: data.id || `temp-${Date.now()}`,
          subject: `RE: ${selectedConversation.lastMessage.subject}`,
          content: replyMessage,
          type: selectedConversation.lastMessage.type || 'SUPPORT',
          priority: 'NORMAL',
          status: 'READ',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          fromUserId: 'admin',
          toUserId: clientMessage.fromUserId,
          clientEmail: selectedConversation.clientEmail,
          clientName: selectedConversation.clientName,
        }

        // Mettre à jour la conversation localement
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, newMessage],
          lastMessage: newMessage,
          lastMessageAt: newMessage.sentAt,
        }

        setSelectedConversation(updatedConversation)
        setReplyMessage('')
        
        toast.success('Message envoyé !')

        // Rafraîchir en arrière-plan après un court délai
        setTimeout(() => {
          fetchConversations()
        }, 1000)
      } else {
        const errorData = await response.json()
        console.error('Erreur API:', errorData)
        toast.error(errorData.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsSending(false)
    }
  }

  // Gérer l'indicateur "en train d'écrire"
  const handleTyping = (value: string) => {
    setReplyMessage(value)
    
    if (!isTyping && value.trim()) {
      setIsTyping(true)
    }

    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  // Envoyer avec Enter (Shift+Enter pour nouvelle ligne)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

  useEffect(() => {
    fetchConversations()
    
    // Auto-refresh toutes les 10 secondes SEULEMENT si l'utilisateur n'est pas en train d'écrire
    const interval = setInterval(() => {
      if (!isTyping && !isSending) {
        fetchConversations()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [isTyping, isSending])

  const filteredConversations = conversations.filter(conv => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        conv.clientName.toLowerCase().includes(searchLower) ||
        conv.clientEmail.toLowerCase().includes(searchLower) ||
        conv.lastMessage.subject.toLowerCase().includes(searchLower) ||
        conv.lastMessage.content.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const stats = {
    total: conversations.length,
    unread: conversations.filter(c => c.unreadCount > 0).length,
    replied: conversations.filter(c => c.messages.some(m => m.status === 'REPLIED')).length,
    urgent: conversations.filter(c => c.lastMessage?.priority === 'URGENT').length,
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header compact */}
      <div className="bg-white border-b px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages Clients</h1>
            <p className="text-sm text-gray-500">Conversations en temps réel</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchConversations}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
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

      {/* Contenu principal - Style Facebook Messenger */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Liste des conversations - Style Messenger */}
          <div className="w-80 bg-white border-r flex flex-col">
            {/* Recherche */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une conversation..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9 h-9 text-sm bg-gray-100 border-0"
                />
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm text-center">Aucune conversation</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 cursor-pointer transition-colors border-b hover:bg-gray-50 ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {conv.clientName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-semibold truncate ${
                            conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {conv.clientName}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {format(new Date(conv.lastMessageAt), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <p className={`text-xs truncate flex-1 ${
                            conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                          }`}>
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center rounded-full">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Zone de conversation - Style Messenger */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Header de la conversation */}
                <div className="px-6 py-4 border-b bg-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {selectedConversation.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{selectedConversation.clientName}</h2>
                    <p className="text-xs text-gray-500">{selectedConversation.clientEmail}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={MESSAGE_PRIORITIES[selectedConversation.lastMessage.priority as keyof typeof MESSAGE_PRIORITIES].color}>
                      {MESSAGE_PRIORITIES[selectedConversation.lastMessage.priority as keyof typeof MESSAGE_PRIORITIES].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {MESSAGE_TYPES[selectedConversation.lastMessage.type as keyof typeof MESSAGE_TYPES]}
                    </Badge>
                  </div>
                </div>

                {/* Messages - Style Messenger */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message, index) => {
                      const isFromClient = message.fromUserId !== 'admin' && message.clientEmail
                      const isLastMessage = index === selectedConversation.messages.length - 1
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromClient ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[70%] ${isFromClient ? 'order-2' : 'order-1'}`}>
                            {/* Bulle de message */}
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isFromClient
                                  ? 'bg-gray-200 text-gray-900'
                                  : 'bg-blue-500 text-white'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            
                            {/* Métadonnées */}
                            <div className={`flex items-center gap-1 mt-1 px-2 ${
                              isFromClient ? 'justify-start' : 'justify-end'
                            }`}>
                              <span className="text-xs text-gray-500">
                                {format(new Date(message.sentAt), 'HH:mm', { locale: fr })}
                              </span>
                              {!isFromClient && (
                                <>
                                  {message.readAt ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <Check className="h-3 w-3 text-gray-400" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Indicateur "en train d'écrire" */}
                  {isTyping && (
                    <div className="flex items-center gap-2 mt-4 text-gray-500 text-sm">
                      <Pencil className="h-4 w-4 animate-pulse" />
                      <span>Vous êtes en train d'écrire...</span>
                    </div>
                  )}
                </div>

                {/* Zone de saisie - Style Messenger */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Écrivez votre message..."
                        className="bg-transparent border-0 resize-none focus:ring-0 focus:outline-none text-sm min-h-[40px] max-h-[120px] p-0"
                        rows={1}
                        disabled={isSending}
                      />
                    </div>
                    <Button
                      onClick={sendReply}
                      disabled={!replyMessage.trim() || isSending}
                      size="icon"
                      className="rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600"
                    >
                      {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 px-4">
                    Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-gray-500">
                    Choisissez une conversation dans la liste pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
