'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  subject: string
  content: string
  sentAt: string
  fromUser: {
    name: string | null
    role: string
  }
  isFromClient: boolean
}

export function ChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Ne pas afficher le widget sur les pages admin
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Récupérer les messages de la conversation
  const fetchMessages = async () => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/public/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    }
  }

  // Envoyer un message
  const sendMessage = async (autoSend = false) => {
    if (!newMessage.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/public/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Message du chat',
          content: newMessage,
          clientEmail: 'guest@boutiknaka.com', // Email temporaire pour les invités
          clientName: 'Client invité',
          type: 'SUPPORT',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewMessage('')
        setConversationId(data.conversationId)
        fetchMessages()

        if (!autoSend) {
          toast.success('Message envoyé !')
        }
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsLoading(false)
    }
  }

  // Gestionnaire pour l'envoi automatique
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Envoi automatique après 3 secondes d'inactivité (seulement si le message n'est pas vide et qu'il y a eu une interaction)
  useEffect(() => {
    // Ne pas envoyer automatiquement si le message est vide ou en cours de chargement
    if (!newMessage.trim() || isLoading) return

    // Ne pas envoyer automatiquement au premier rendu
    if (newMessage.trim().length === 0) return

    const timer = setTimeout(() => {
      sendMessage(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [newMessage, isLoading])

  // Fermer le chat
  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
    setMessages([])
    setConversationId(null)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
          💬
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'h-14' : 'h-96'
    }`}>
      <Card className="w-80 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Support BoutikNaka
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-3 pt-0 overflow-hidden">
              {/* Messages */}
              <div className="h-64 overflow-y-auto mb-3 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun message dans cette conversation</p>
                    <p className="text-xs">Envoyez un message pour commencer</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg text-sm ${
                        message.isFromClient
                          ? 'bg-blue-100 ml-8'
                          : 'bg-gray-100 mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">
                          {message.isFromClient ? 'Vous' : (message.fromUser.name || 'Support')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.sentAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Formulaire d'envoi */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message... (Enter pour envoyer, auto-envoi dans 3s)"
                    className="min-h-[60px] resize-none text-sm pr-12"
                    disabled={isLoading}
                  />
                  {newMessage.trim() && !isLoading && (
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      Auto-envoi dans 3s
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Appuyez sur Enter ou attendez 3 secondes pour envoyer
                  </p>
                  <Button
                    size="sm"
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim() || isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Envoyer
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
