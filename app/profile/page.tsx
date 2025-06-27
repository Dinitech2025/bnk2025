'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, MapPin, ShoppingBag, Calendar, User, Mail, Phone, CreditCard, Briefcase } from 'lucide-react'

interface Address {
  id: string
  type: string
  street: string
  city: string
  state?: string
  zipCode: string
  country: string
  phoneNumber?: string
  isDefault: boolean
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

interface UserProfile {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  birthDate: string | null
  gender: string | null
  preferredLanguage: string
  newsletter: boolean
  customerType: string
  companyName: string | null
  vatNumber: string | null
  image: string | null
  createdAt: string
  addresses: Address[]
  orders: Order[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    // Gérer le paramètre tab dans l'URL
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['info', 'addresses', 'orders'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [])

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile')
    }

    // Charger les données du profil utilisateur
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserProfile()
    }
  }, [status, session])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile`)
      
      if (!response.ok) {
        throw new Error('Impossible de charger les données du profil')
      }
      
      const data = await response.json()
      setUserProfile(data)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  // Formater les dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non renseigné'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Déterminer le type de client
  const getCustomerTypeLabel = (type: string | null) => {
    if (!type) return 'Non défini'
    return type === 'INDIVIDUAL' ? 'Particulier' : 'Entreprise'
  }

  // Déterminer le genre
  const getGenderLabel = (gender: string | null) => {
    if (!gender) return 'Non renseigné'
    switch (gender) {
      case 'MALE': return 'Homme'
      case 'FEMALE': return 'Femme'
      case 'OTHER': return 'Autre'
      default: return 'Non renseigné'
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mon profil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar avec informations principales */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center">
                {userProfile.image ? (
                  <div className="relative h-32 w-32 mb-4">
                    <Image 
                      src={userProfile.image} 
                      alt="Photo de profil"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl mb-4">
                    {userProfile.firstName?.charAt(0) || userProfile.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <CardTitle>
                  {userProfile.firstName && userProfile.lastName 
                    ? `${userProfile.firstName} ${userProfile.lastName}`
                    : userProfile.name || 'Mon compte'}
                </CardTitle>
                <CardDescription className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userProfile.customerType === 'BUSINESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {getCustomerTypeLabel(userProfile.customerType)}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{userProfile.email}</span>
                </div>
                {userProfile.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{userProfile.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">Client depuis {formatDate(userProfile.createdAt)}</span>
                </div>
                <div className="pt-4">
                  <Link href="/profile/edit">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier mon profil
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal avec onglets */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="info" value={activeTab} onValueChange={(value) => {
            setActiveTab(value)
            // Mettre à jour l'URL sans recharger la page
            const newUrl = value === 'info' ? '/profile' : `/profile?tab=${value}`
            window.history.replaceState({}, '', newUrl)
          }}>
            <TabsList className="mb-6">
              <TabsTrigger value="info">Informations personnelles</TabsTrigger>
              <TabsTrigger value="addresses">Mes adresses</TabsTrigger>
              <TabsTrigger value="orders">Mes commandes</TabsTrigger>
            </TabsList>
            
            {/* Onglet Informations personnelles */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Vos informations personnelles et préférences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500">Identité</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">Nom complet:</span>
                          <span className="text-sm ml-2">
                            {userProfile.firstName && userProfile.lastName 
                              ? `${userProfile.firstName} ${userProfile.lastName}`
                              : 'Non renseigné'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">Date de naissance:</span>
                          <span className="text-sm ml-2">{formatDate(userProfile.birthDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">Genre:</span>
                          <span className="text-sm ml-2">{getGenderLabel(userProfile.gender)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500">Préférences</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Langue préférée:</span>
                          <span className="text-sm ml-2">
                            {userProfile.preferredLanguage === 'fr' ? 'Français' : 'Anglais'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Newsletter:</span>
                          <span className="text-sm ml-2">
                            {userProfile.newsletter ? 'Inscrit' : 'Non inscrit'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {userProfile.customerType === 'BUSINESS' && (
                      <div className="space-y-4 md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Informations professionnelles</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium">Entreprise:</span>
                            <span className="text-sm ml-2">{userProfile.companyName || 'Non renseigné'}</span>
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium">N° TVA:</span>
                            <span className="text-sm ml-2">{userProfile.vatNumber || 'Non renseigné'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Adresses */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mes adresses</CardTitle>
                    <CardDescription>
                      Gérez vos adresses de livraison et de facturation
                    </CardDescription>
                  </div>
                  <Link href="/profile/addresses/new">
                    <Button size="sm">
                      Ajouter une adresse
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {userProfile.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userProfile.addresses.map((address) => (
                        <div key={address.id} className="border rounded-md p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="font-medium">{address.type}</p>
                                <p className="text-sm text-gray-600">{address.street}</p>
                                <p className="text-sm text-gray-600">
                                  {address.zipCode} {address.city}, {address.country}
                                </p>
                                {address.phoneNumber && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Tél: {address.phoneNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Link href={`/profile/addresses/${address.id}`}>
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                          {address.isDefault && (
                            <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Par défaut
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Vous n'avez pas encore d'adresse enregistrée</p>
                      <Link href="/profile/addresses/new">
                        <Button>
                          Ajouter ma première adresse
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Onglet Commandes */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Mes commandes</CardTitle>
                  <CardDescription>
                    Historique et suivi de vos commandes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile.orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Numéro</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Statut</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {userProfile.orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{order.orderNumber}</td>
                              <td className="px-4 py-3 text-sm">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'COMPLETED'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.status === 'CANCELLED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{Number(order.total).toFixed(0)} Ar</td>
                              <td className="px-4 py-3 text-sm">
                                <Link href={`/profile/orders/${order.id}`} className="text-primary hover:underline">
                                  Détails
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Vous n'avez pas encore passé de commande</p>
                      <Link href="/products">
                        <Button>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Découvrir nos produits
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 