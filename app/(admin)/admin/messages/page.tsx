'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
  Pencil,
  Quote,
  ShoppingBag,
  Star,
  TrendingUp,
  FileText,
  Package
} from 'lucide-react'
import ProposalActions from '@/components/admin/proposal-actions'
import EnhancedMessageInput from '@/components/admin/enhanced-message-input'
import EnhancedQuoteMessageCard from '@/components/admin/enhanced-quote-message-card'
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

interface QuoteConversation {
  id: string
  status: string
  description: string
  createdAt: string
  updatedAt: string
  negotiationType: string
  user: {
    id: string
    name: string | null
    email: string
  }
  service?: {
    id: string
    name: string
  }
  product?: {
    id: string
    name: string
  }
  messages: Array<{
    id: string
    message: string
    createdAt: string
    senderId: string
    sender: {
      id: string
      name: string | null
      email: string
      role: string
    }
  }>
}

interface UnifiedConversation {
  id: string
  clientName: string
  clientEmail: string
  messages: any[]
  lastMessage: {
    content: string
    type: string
  } | null
  lastMessageAt: string
  unreadCount: number
  type: 'MESSAGE' | 'QUOTE' | 'MIXED' | 'INTERNAL'
  relatedQuoteId?: string | null
  relatedOrderId?: string | null
  quoteStatus?: string | null
  hasMoreMessages?: boolean
  totalMessages?: number
  quoteData?: {
    id: string
    status: string
    negotiationType: string
    proposedPrice?: number | null
    finalPrice?: number | null
    budget?: number | null
    description: string
    user: {
      id: string
      name?: string
      email: string
    }
    service?: {
      id: string
      name: string
      slug?: string
      price: number
      pricingType?: string
      description?: string
      images?: Array<{ path: string; alt?: string }>
    } | null
    product?: {
      id: string
      name: string
      slug?: string
      price: number
      pricingType?: string
      description?: string
      images?: Array<{ path: string; alt?: string }>
    } | null
  } | null
}

const MESSAGE_TYPES = {
  GENERAL: 'Général',
  SUPPORT: 'Support',
  ORDER: 'Commande',
  SUBSCRIPTION: 'Abonnement',
  PAYMENT: 'Paiement',
  QUOTE: 'Devis',
  CUSTOM: 'Personnalisé',
}

const MESSAGE_PRIORITIES = {
  LOW: { label: 'Basse', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
}

const QUOTE_STATUSES = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  NEGOTIATING: { label: 'En négociation', color: 'bg-blue-100 text-blue-700' },
  PRICE_PROPOSED: { label: 'Prix proposé', color: 'bg-purple-100 text-purple-700' },
  ACCEPTED: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
}

export default function UnifiedMessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<UnifiedConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'message', // Par défaut sur "Messages" au lieu de "all"
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

  const fetchConversations = async (isManualRefresh = false) => {
    try {
      // Pour le chargement initial, on utilise isLoading
      // Pour les actualisations, on utilise isRefreshing
      if (conversations.length === 0) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      console.log('🔍 Récupération des conversations unifiées...')
      
      // Utiliser la nouvelle API unifiée avec cache-busting
      const response = await fetch(`/api/admin/messages/unified?limit=100&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Données reçues:', data)

      const unifiedConversations = data.conversations || []
      setConversations(unifiedConversations)

      // TOUJOURS vérifier localStorage en premier pour restaurer la conversation sélectionnée
      // Cela garantit que même après un refresh, la bonne conversation est restaurée
      const savedConversationId = localStorage.getItem('adminSelectedConversationId')
      console.log('🔄 Recherche de conversation sauvegardée dans localStorage:', savedConversationId)
      
      if (savedConversationId) {
        const savedConversation = unifiedConversations.find(
          (c: UnifiedConversation) => c.id === savedConversationId
        )
        
        if (savedConversation) {
          // Conversation sauvegardée trouvée, la restaurer
          console.log('✅ Conversation restaurée depuis localStorage:', savedConversationId)
          setSelectedConversation(savedConversation)
          setHasMoreMessages(savedConversation.hasMoreMessages || false)
        } else {
          // La conversation sauvegardée n'existe plus dans la liste
          console.log('⚠️ Conversation sauvegardée introuvable dans la liste, recherche de la conversation actuelle...')
          
          // Si une conversation est déjà sélectionnée et qu'elle existe encore, la garder
          if (selectedConversation) {
            const currentConversation = unifiedConversations.find(
              (c: UnifiedConversation) => c.id === selectedConversation.id
            )
            if (currentConversation) {
              console.log('✅ Conversation actuelle trouvée, mise à jour:', selectedConversation.id)
              setSelectedConversation(currentConversation)
              setHasMoreMessages(currentConversation.hasMoreMessages || false)
              // Mettre à jour localStorage avec la conversation actuelle
              localStorage.setItem('adminSelectedConversationId', currentConversation.id)
            } else {
              // La conversation actuelle n'existe plus non plus, sélectionner la première
              console.log('⚠️ Conversation actuelle introuvable, sélection de la première')
              if (unifiedConversations.length > 0) {
                setSelectedConversation(unifiedConversations[0])
                setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
                localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
              } else {
                setSelectedConversation(null)
                localStorage.removeItem('adminSelectedConversationId')
              }
            }
          } else {
            // Aucune conversation sauvegardée ni sélectionnée, sélectionner la première
            console.log('⚠️ Aucune conversation valide, sélection de la première')
            if (unifiedConversations.length > 0) {
              setSelectedConversation(unifiedConversations[0])
              setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
              localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
            } else {
              setSelectedConversation(null)
              localStorage.removeItem('adminSelectedConversationId')
            }
          }
        }
      } else {
        // Pas de conversation sauvegardée dans localStorage
        console.log('🔄 Aucune conversation sauvegardée dans localStorage')
        
        // Si une conversation est déjà sélectionnée et qu'elle existe encore, la garder
        if (selectedConversation) {
          const currentConversation = unifiedConversations.find(
            (c: UnifiedConversation) => c.id === selectedConversation.id
          )
          if (currentConversation) {
            console.log('✅ Conversation actuelle trouvée, mise à jour:', selectedConversation.id)
            setSelectedConversation(currentConversation)
            setHasMoreMessages(currentConversation.hasMoreMessages || false)
            // Sauvegarder dans localStorage
            localStorage.setItem('adminSelectedConversationId', currentConversation.id)
          } else {
            // La conversation actuelle n'existe plus, sélectionner la première
            console.log('⚠️ Conversation actuelle introuvable, sélection de la première')
            if (unifiedConversations.length > 0) {
              setSelectedConversation(unifiedConversations[0])
              setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
              localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
            } else {
              setSelectedConversation(null)
            }
          }
        } else {
          // Première visite, sélectionner la première conversation
          console.log('🆕 Première visite, sélection de la première conversation')
          if (unifiedConversations.length > 0) {
            setSelectedConversation(unifiedConversations[0])
            setHasMoreMessages(unifiedConversations[0].hasMoreMessages || false)
            localStorage.setItem('adminSelectedConversationId', unifiedConversations[0].id)
          }
        }
      }

      console.log(`✅ ${unifiedConversations.length} conversations chargées`)

      // Afficher un message de succès seulement pour les actualisations manuelles
      if (isManualRefresh) {
        toast.success('Conversations actualisées')
      }

    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    
    // Actualiser toutes les 30 secondes (en arrière-plan)
    const interval = setInterval(() => fetchConversations(false), 30000)
    return () => clearInterval(interval)
  }, [])

  // Sauvegarder la conversation sélectionnée dans localStorage
  useEffect(() => {
    if (selectedConversation) {
      localStorage.setItem('adminSelectedConversationId', selectedConversation.id)
    }
  }, [selectedConversation])

  // Restaurer la conversation sélectionnée uniquement au premier chargement
  // Cette logique est maintenant principalement gérée dans fetchConversations
  // Ce useEffect sert de fallback uniquement si fetchConversations n'a pas déjà sélectionné une conversation
  useEffect(() => {
    // Ne s'exécuter que si les conversations sont chargées mais aucune n'est sélectionnée
    // ET que ce n'est pas un refresh en cours (pour éviter les conflits)
    if (conversations.length > 0 && !selectedConversation && !isLoading && !isRefreshing) {
      const savedConversationId = localStorage.getItem('adminSelectedConversationId')
      if (savedConversationId) {
        const savedConversation = conversations.find(conv => conv.id === savedConversationId)
        if (savedConversation) {
          console.log('🔄 Restauration de la conversation sauvegardée:', savedConversationId)
          setSelectedConversation(savedConversation)
          setHasMoreMessages(savedConversation.hasMoreMessages || false)
          return
        }
      }
      // Si aucune conversation sauvegardée ou si la sauvegardée n'existe plus, sélectionner la première
      console.log('🔄 Sélection de la première conversation (fallback)')
      setSelectedConversation(conversations[0])
      setHasMoreMessages(conversations[0].hasMoreMessages || false)
    }
  }, [conversations.length, isLoading, isRefreshing]) // Retirer selectedConversation des dépendances pour éviter les boucles

  // Charger plus de messages (scroll infini)
  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMoreMessages || !hasMoreMessages) return

    const oldestMessage = selectedConversation.messages[0]
    if (!oldestMessage) return

    setLoadingMoreMessages(true)
    try {
      const response = await fetch(
        `/api/admin/messages/conversations/${selectedConversation.id}/messages?before=${oldestMessage.sentAt}&limit=25`
      )

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.messages && data.messages.length > 0) {
        // Insérer les nouveaux messages en haut de la liste
        setSelectedConversation({
          ...selectedConversation,
          messages: [...data.messages, ...selectedConversation.messages],
          hasMoreMessages: data.hasMore
        })
        setHasMoreMessages(data.hasMore)
      } else {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de plus de messages:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setLoadingMoreMessages(false)
    }
  }

  // Observer pour détecter le scroll en haut et charger plus de messages
  useEffect(() => {
    if (!hasMoreMessages || !messagesTopRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreMessages) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(messagesTopRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMoreMessages, loadingMoreMessages, selectedConversation])

  const sendReply = async (message: string, files?: any[]) => {
    if (!selectedConversation || (!message.trim() && (!files || files.length === 0))) return

    setIsSending(true)
    try {
      let response

      if (selectedConversation.type === 'QUOTE' && selectedConversation.relatedQuoteId) {
        // Envoyer via l'API des messages de devis
        response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            attachments: files ? files.map(f => f.file.name) : []
          }),
        })
      } else if (selectedConversation.type === 'INTERNAL' && selectedConversation.otherParticipantId) {
        // Envoyer un message interne entre employés
        response = await fetch('/api/admin/messages/internal/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: selectedConversation.otherParticipantId,
            subject: 'Message interne',
            content: message.trim(),
            type: 'INTERNAL',
            priority: 'NORMAL'
          }),
        })
      } else {
        // Envoyer via l'API des messages classiques
        console.log('Envoi de message classique:', message)
        response = { ok: true }
      }

      if (response.ok) {
        await fetchConversations(false) // Actualisation silencieuse après envoi
        toast.success('Message envoyé')
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsSending(false)
    }
  }

  const handleProposalAction = async (action: string, data?: any) => {
    if (!selectedConversation?.relatedQuoteId) return

    try {
      console.log('🎯 Action de proposition:', action, data)
      
      const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })

      if (response.ok) {
        console.log('✅ Action réussie, actualisation des conversations...')
        
        // Petit délai pour s'assurer que la base de données est mise à jour
        setTimeout(async () => {
          await fetchConversations(false)
          console.log('🔄 Conversations actualisées')
        }, 500)
        
        // Toast de succès selon l'action
        switch (action) {
          case 'accept':
            toast.success('Proposition acceptée')
            break
          case 'reject':
            toast.success('Proposition refusée')
            break
          case 'counter':
            toast.success('Contre-proposition envoyée')
            break
          default:
            toast.success('Action effectuée')
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Erreur API:', errorData)
        toast.error('Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      toast.error('Erreur de connexion')
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      if (conversationId.startsWith('quote-')) {
        // Marquer les messages de devis comme lus
        const quoteId = conversationId.replace('quote-', '')
        await fetch(`/api/admin/quotes/${quoteId}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read' }),
        })
      } else if (conversationId.startsWith('message-')) {
        // Marquer les messages généraux comme lus
        await fetch('/api/admin/messages/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        })
        // Actualiser les conversations pour mettre à jour les compteurs
        await fetchConversations(false)
      }
    } catch (error) {
      console.error('Erreur marquage lecture:', error)
    }
  }

  const getConversationIcon = (conversation: UnifiedConversation) => {
    switch (conversation.type) {
      case 'QUOTE':
        return <Quote className="h-4 w-4 text-purple-500" />
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'MIXED':
        return <FileText className="h-4 w-4 text-indigo-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getMessageIcon = (message: any) => {
    if (message.source === 'QUOTE_INITIAL') {
      return <FileText className="h-3 w-3 text-green-500" />
    }
    if (message.type === 'QUOTE' || message.source === 'QUOTE' || message.source === 'QUOTE_MESSAGE') {
      return <Quote className="h-3 w-3 text-purple-500" />
    }
    return <MessageSquare className="h-3 w-3 text-blue-500" />
  }

  const getMessageLabel = (message: any) => {
    if (message.source === 'QUOTE_INITIAL') {
      return 'Demande initiale'
    }
    if (message.source === 'QUOTE_MESSAGE') {
      return 'Conversation'
    }
    if (message.source === 'QUOTE') {
      return 'Devis'
    }
    return 'Message'
  }

  const filteredConversations = conversations.filter(conversation => {
    // Filtrer par type
    if (filters.type !== 'all') {
      const filterType = filters.type.toLowerCase()
      
      // Mapper les filtres vers les types réels
      if (filterType === 'message') {
        // Messages généraux (pas de commande, pas de devis, pas de messages internes)
        // Exclure les conversations internes et les commandes
        if (conversation.type === 'INTERNAL') {
          return false
        }
        if (conversation.type !== 'MESSAGE') {
          return false
        }
        // Exclure les messages liés à des commandes
        const hasOrderMessage = conversation.messages.some((msg: any) => 
          msg.type === 'ORDER' || msg.relatedOrderId
        )
        if (hasOrderMessage) {
          return false
        }
      } else if (filterType === 'quote') {
        if (conversation.type !== 'QUOTE') return false
      } else if (filterType === 'order') {
        // Les conversations de commande sont dans les messages avec type ORDER ou relatedOrderId
        if (conversation.type === 'MESSAGE') {
          const hasOrderMessage = conversation.messages.some((msg: any) => 
            msg.type === 'ORDER' || msg.relatedOrderId
          )
          if (!hasOrderMessage) return false
        } else {
          return false
        }
      } else if (filterType === 'internal') {
        // Conversations internes entre employés
        if (conversation.type !== 'INTERNAL') return false
      } else {
        if (conversation.type !== filterType.toUpperCase()) return false
      }
    }
    
    // Filtrer par recherche
    if (filters.search && !conversation.clientName.toLowerCase().includes(filters.search.toLowerCase()) && 
        !conversation.clientEmail.toLowerCase().includes(filters.search.toLowerCase())) return false
    
    return true
  })

  const stats = {
    totalConversations: conversations.length,
    messageConversations: conversations.filter(c => {
      if (c.type === 'INTERNAL') return false
      if (c.type !== 'MESSAGE') return false
      // Exclure seulement les messages liés à des commandes
      const hasOrderMessage = c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
      return !hasOrderMessage
    }).length,
    quoteConversations: conversations.filter(c => c.type === 'QUOTE').length,
    orderConversations: conversations.filter(c => {
      if (c.type !== 'MESSAGE') return false
      return c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
    }).length,
    unreadCount: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    unreadMessages: conversations.filter(c => {
      if (c.type === 'INTERNAL') return false
      if (c.type !== 'MESSAGE') return false
      // Exclure seulement les messages liés à des commandes
      const hasOrderMessage = c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
      return !hasOrderMessage && c.unreadCount > 0
    }).reduce((sum, c) => sum + c.unreadCount, 0),
    unreadQuotes: conversations.filter(c => c.type === 'QUOTE').reduce((sum, c) => sum + c.unreadCount, 0),
    unreadOrders: conversations.filter(c => {
      if (c.type !== 'MESSAGE') return false
      const hasOrderMessage = c.messages.some((msg: any) => msg.type === 'ORDER' || msg.relatedOrderId)
      return hasOrderMessage && c.unreadCount > 0
    }).reduce((sum, c) => sum + c.unreadCount, 0),
    internalConversations: conversations.filter(c => c.type === 'INTERNAL').length,
    unreadInternal: conversations.filter(c => c.type === 'INTERNAL' && c.unreadCount > 0).reduce((sum, c) => sum + c.unreadCount, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header avec statistiques */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Messages & Conversations</h1>
              <p className="text-sm text-slate-500">
                Gestion unifiée des messages et conversations de devis
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fetchConversations(true)}
                variant="outline"
                size="sm"
                disabled={isLoading || isRefreshing}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
              
              <Button
                onClick={() => router.push('/admin/messages/new')}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
            {/* Indicateur d'actualisation global */}
            {isRefreshing && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalConversations}</p>
                  <p className="text-xs text-blue-600">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{stats.messageConversations}</p>
                  <p className="text-xs text-green-600">Messages</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <Quote className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{stats.quoteConversations}</p>
                  <p className="text-xs text-purple-600">Devis</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.orderConversations}</p>
                  <p className="text-xs text-orange-600">Commandes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{stats.unreadCount}</p>
                  <p className="text-xs text-red-600">Non lus</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des conversations */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-slate-600" />
                  Conversations ({filteredConversations.length})
                </CardTitle>
                
                {/* Filtres */}
                <div className="space-y-3 mt-4">
                  <Input
                    placeholder="Rechercher un client..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  
                  {/* Onglets pour les types de conversations */}
                  <Tabs 
                    value={filters.type} 
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 h-auto bg-slate-100 rounded-xl p-1">
                      <TabsTrigger 
                        value="message" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all flex items-center gap-1.5 justify-center py-2"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Messages
                        {stats.unreadMessages > 0 && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center">
                            {stats.unreadMessages}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="quote" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all flex items-center gap-1.5 justify-center py-2"
                      >
                        <Quote className="h-3 w-3" />
                        Devis
                        {stats.unreadQuotes > 0 && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center">
                            {stats.unreadQuotes}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="order" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all flex items-center gap-1.5 justify-center py-2"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        Commandes
                        {stats.unreadOrders > 0 && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center">
                            {stats.unreadOrders}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="internal" 
                        className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all flex items-center gap-1.5 justify-center py-2"
                      >
                        <User className="h-3 w-3" />
                        Interne
                        {stats.unreadInternal > 0 && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center">
                            {stats.unreadInternal}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-y-auto h-[500px] relative">
                  {/* Indicateur d'actualisation en arrière-plan */}
                  {isRefreshing && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Actualisation...
                      </div>
                    </div>
                  )}
                  
                  {isLoading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-500">Chargement des conversations...</span>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500">
                      <MessageSquare className="h-8 w-8 mr-2" />
                      Aucune conversation
                    </div>
                  ) : (
                    filteredConversations.map((conversation, index) => (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          console.log('🖱️ Sélection de conversation:', conversation.id)
                          setSelectedConversation(conversation)
                          setHasMoreMessages(conversation.hasMoreMessages || false)
                          // Sauvegarder immédiatement dans localStorage
                          localStorage.setItem('adminSelectedConversationId', conversation.id)
                          markAsRead(conversation.id)
                        }}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-all duration-200 ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        } ${isRefreshing ? 'opacity-90' : 'opacity-100'}`}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-slate-200 text-slate-600 font-medium">
                              {conversation.clientName[0]?.toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900 truncate">
                                  {conversation.clientName}
                                </p>
                                {getConversationIcon(conversation)}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-400">
                                  {format(new Date(conversation.lastMessageAt), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                            
                            <p className={`text-sm truncate mb-2 ${
                              conversation.unreadCount > 0 
                                ? 'text-slate-900 font-semibold' 
                                : 'text-slate-600'
                            }`}>
                              {conversation.lastMessage?.content || 'Aucun message'}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {conversation.lastMessage?.type ? 
                                  (MESSAGE_TYPES[conversation.lastMessage.type as keyof typeof MESSAGE_TYPES] || conversation.lastMessage.type) : 
                                  'Message'
                                }
                              </Badge>
                              
                              {conversation.quoteStatus && (
                                <Badge className={`text-xs ${QUOTE_STATUSES[conversation.quoteStatus as keyof typeof QUOTE_STATUSES]?.color || 'bg-gray-100 text-gray-700'}`}>
                                  {QUOTE_STATUSES[conversation.quoteStatus as keyof typeof QUOTE_STATUSES]?.label || conversation.quoteStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone de conversation */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
                <CardHeader className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200 p-3">
                  {/* Informations client uniquement */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar className="w-9 h-9 border-2 border-white shadow-sm flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                          {selectedConversation.clientName[0]?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">
                          {selectedConversation.clientName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{selectedConversation.clientEmail}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {getConversationIcon(selectedConversation)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 flex flex-row overflow-hidden" style={{ height: 'calc(700px - 80px)' }}>
                  {/* Sidebar gauche avec informations du devis/commande */}
                  {(selectedConversation.type === 'QUOTE' && selectedConversation.quoteData) || 
                   (selectedConversation.type === 'MESSAGE' && selectedConversation.messages.some((msg: any) => msg.relatedOrderId)) ? (
                    <div className="w-64 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto flex-shrink-0">
                      {/* Informations du devis */}
                      {selectedConversation.type === 'QUOTE' && selectedConversation.quoteData && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Quote className="h-4 w-4 text-purple-500" />
                              <h4 className="font-semibold text-xs text-slate-900">Informations du devis</h4>
                            </div>
                            <Badge className={`px-1.5 py-0.5 text-[10px] font-medium ${
                              selectedConversation.quoteStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                              selectedConversation.quoteStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              selectedConversation.quoteStatus === 'PRICE_PROPOSED' ? 'bg-orange-100 text-orange-700' :
                              selectedConversation.quoteStatus === 'NEGOTIATING' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {selectedConversation.quoteStatus === 'ACCEPTED' ? '✓ Accepté' :
                               selectedConversation.quoteStatus === 'REJECTED' ? '✗ Rejeté' :
                               selectedConversation.quoteStatus === 'PRICE_PROPOSED' ? '💰 Prix proposé' :
                               selectedConversation.quoteStatus === 'NEGOTIATING' ? 'En négociation' :
                               'En attente'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-slate-500 mb-0.5 block">Budget client</label>
                              <div className="px-2 py-1 bg-white rounded text-xs font-medium text-slate-700 border border-slate-200">
                                {selectedConversation.quoteData.budget 
                                  ? `${selectedConversation.quoteData.budget.toLocaleString()} Ar`
                                  : '-'}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 mb-0.5 block">Prix proposé</label>
                              <input
                                type="number"
                                defaultValue={selectedConversation.quoteData.proposedPrice || ''}
                                placeholder="Prix"
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                onBlur={async (e) => {
                                  const value = parseFloat(e.target.value)
                                  if (!isNaN(value) && value !== selectedConversation.quoteData?.proposedPrice) {
                                    try {
                                      const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ proposedPrice: value })
                                      })
                                      if (response.ok) {
                                        toast.success('Prix proposé mis à jour')
                                        fetchConversations(false)
                                      }
                                    } catch (error) {
                                      toast.error('Erreur lors de la mise à jour')
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 mb-0.5 block">Prix final</label>
                              <input
                                type="number"
                                defaultValue={selectedConversation.quoteData.finalPrice || ''}
                                placeholder="Prix"
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                onBlur={async (e) => {
                                  const value = parseFloat(e.target.value)
                                  if (!isNaN(value) && value !== selectedConversation.quoteData?.finalPrice) {
                                    try {
                                      const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ finalPrice: value })
                                      })
                                      if (response.ok) {
                                        toast.success('Prix final mis à jour')
                                        fetchConversations(false)
                                      }
                                    } catch (error) {
                                      toast.error('Erreur lors de la mise à jour')
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 mb-0.5 block">Statut</label>
                              <Select
                                defaultValue={selectedConversation.quoteStatus || 'PENDING'}
                                onValueChange={async (value) => {
                                  try {
                                    const response = await fetch(`/api/admin/quotes/${selectedConversation.relatedQuoteId}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: value })
                                    })
                                    if (response.ok) {
                                      toast.success('Statut mis à jour')
                                      fetchConversations(false)
                                    }
                                  } catch (error) {
                                    toast.error('Erreur lors de la mise à jour')
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full h-7 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">En attente</SelectItem>
                                  <SelectItem value="NEGOTIATING">En négociation</SelectItem>
                                  <SelectItem value="PRICE_PROPOSED">Prix proposé</SelectItem>
                                  <SelectItem value="ACCEPTED">Accepté</SelectItem>
                                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {(selectedConversation.quoteData.service || selectedConversation.quoteData.product) && (
                            <div className="pt-2 border-t border-slate-200">
                              <div className="flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-slate-400" />
                                <p className="text-xs text-slate-600">
                                  <span className="font-medium text-slate-900">
                                    {selectedConversation.quoteData.service?.name || selectedConversation.quoteData.product?.name}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Informations de commande */}
                      {selectedConversation.type === 'MESSAGE' && selectedConversation.messages.some((msg: any) => msg.relatedOrderId) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="h-4 w-4 text-orange-500" />
                            <h4 className="font-semibold text-xs text-slate-900">Commande</h4>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const orderId = selectedConversation.messages.find((msg: any) => msg.relatedOrderId)?.relatedOrderId
                              if (orderId) {
                                router.push(`/admin/orders/${orderId}`)
                              }
                            }}
                            className="w-full text-xs h-7"
                          >
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Voir la commande
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Zone de messages - Prend le reste de l'espace */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                    {/* Indicateur de chargement en haut */}
                    {loadingMoreMessages && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    )}
                    
                    {/* Ref pour observer le scroll en haut */}
                    {hasMoreMessages && <div ref={messagesTopRef} className="h-1" />}
                    
                    {selectedConversation.messages.map((message, index) => {
                      const isFromAdmin = message.isAdminReply || (message.sender && (message.sender.role === 'ADMIN' || message.sender.role === 'STAFF'))
                      const isSystemMessage = message.isSystemMessage || false
                      const isCounterProposal = message.content?.includes('💰 Nouvelle proposition de prix:') || false
                      
                      return (
                        <div key={message.id}>
                          {/* Message normal */}
                          <div className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className={`max-w-[70%] ${isFromAdmin ? 'order-2' : 'order-1'}`}>
                              <div className={`flex items-start gap-3 ${isFromAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                                  <AvatarFallback className={`text-xs font-medium ${
                                    isFromAdmin 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isFromAdmin ? 'AD' : (selectedConversation.clientName[0] || 'C')}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* Message bubble */}
                                <div className={`space-y-1 ${isFromAdmin ? 'text-right' : 'text-left'}`}>
                                  <div className={`inline-block p-3 rounded-2xl shadow-sm ${
                                    isCounterProposal
                                      ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 text-orange-800'
                                      : isSystemMessage
                                      ? 'bg-green-50 border border-green-200 text-green-800'
                                      : isFromAdmin
                                      ? 'bg-blue-500 text-white rounded-br-md'
                                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                                  }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {getMessageIcon(message)}
                                    <span className="text-xs opacity-75">
                                      {getMessageLabel(message)}
                                    </span>
                                    {message.source === 'QUOTE_INITIAL' && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        Nouvelle demande
                                      </span>
                                    )}
                                    {isCounterProposal && (
                                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                        💰 Proposition
                                      </span>
                                    )}
                                    {isSystemMessage && !isCounterProposal && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        Système
                                      </span>
                                    )}
                                  </div>
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                  </div>
                                  
                                  <div className={`flex items-center gap-2 text-xs text-slate-400 ${
                                    isFromAdmin ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <span>
                                      {format(new Date(message.sentAt), 'dd/MM à HH:mm')}
                                    </span>
                                    {message.readAt && (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Carte enrichie pour les devis de produits */}
                          {message.source === 'QUOTE_INITIAL' && 
                           selectedConversation.quoteData && 
                           (selectedConversation.quoteData.negotiationType === 'PRODUCT_PRICE' || selectedConversation.quoteData.negotiationType === 'PRODUCT_QUOTE') &&
                           (selectedConversation.quoteData.status === 'PENDING' || selectedConversation.quoteData.status === 'NEGOTIATING') && (
                            <div className="mb-4">
                              <EnhancedQuoteMessageCard
                                quote={selectedConversation.quoteData}
                                onAction={handleProposalAction}
                                compact={true}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Zone de saisie avancée */}
                  <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                    <EnhancedMessageInput
                      value={replyMessage}
                      onChange={setReplyMessage}
                      onSend={sendReply}
                      disabled={isSending}
                      placeholder="Tapez votre réponse... (Shift+Entrée pour nouvelle ligne)"
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm border-slate-200 rounded-2xl overflow-hidden h-[700px]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <MessageSquare className="h-16 w-16 mx-auto text-slate-300" />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-600">
                        Sélectionnez une conversation
                      </h3>
                      <p className="text-sm text-slate-400">
                        Choisissez une conversation dans la liste pour commencer à discuter
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}