'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, User, Clock, Users, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import { toast } from 'sonner'
import Link from 'next/link'

interface CartItem {
  id: string
  type: string
  itemId: string
  name: string
  price: number
  quantity: number
  image?: string
  data?: any
}

interface Cart {
  id: string
  userId?: string
  sessionId?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name?: string
    email?: string
    image?: string
  }
  items: CartItem[]
  total: number
  itemCount: number
}

export default function CartsPage() {
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCarts()
  }, [])

  const fetchCarts = async () => {
    try {
      const response = await fetch('/api/admin/carts')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paniers')
      }
      const data = await response.json()
      setCarts(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la récupération des paniers')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paniers</h1>
          <p className="text-gray-600 mt-2">
            Gérez les paniers des clients et des sessions invités
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {carts.length} panier{carts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {carts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun panier trouvé
            </h3>
            <p className="text-gray-500 text-center">
              Il n'y a actuellement aucun panier en cours.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carts.map((cart) => (
            <Card key={cart.id} className={`${isExpired(cart.expiresAt) ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {cart.user ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{cart.user.name || cart.user.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Session invité</span>
                      </div>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    {isExpired(cart.expiresAt) && (
                      <Badge variant="destructive">Expiré</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {cart.itemCount} article{cart.itemCount > 1 ? 's' : ''} • <PriceWithConversion price={cart.total} />
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Créé le {formatDate(cart.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Expire le {formatDate(cart.expiresAt)}</span>
                  </div>
                </div>

                {cart.items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Articles:</h4>
                    <div className="space-y-1">
                      {cart.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="truncate">{item.name}</span>
                          <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                      ))}
                      {cart.items.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{cart.items.length - 3} autre{cart.items.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href={`/admin/carts/${cart.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Link>
                  </Button>
                  
                  {isExpired(cart.expiresAt) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        // TODO: Implémenter la suppression
                        toast.info('Fonction de suppression à implémenter')
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 