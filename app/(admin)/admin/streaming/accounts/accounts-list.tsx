'use client'

import { useState, useEffect } from 'react'
import { 
  PlusCircle, 
  Search, 
  Globe, 
  Users, 
  Calendar, 
  Key, 
  Eye, 
  Pencil, 
  Trash,
  Check,
  X as XIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  logo: string | null
  type: string
}

interface Account {
  id: string
  username: string
  email: string | null
  status: string
  platform: Platform
  createdAt: Date
  accountProfiles: {
    id: string
    isAssigned: boolean
  }[]
}

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/admin/streaming/accounts', {
          cache: 'no-store'
        })
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des comptes')
        }
        const data = await response.json()
        setAccounts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        <p>Une erreur est survenue lors du chargement des comptes :</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Comptes de streaming</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un compte..."
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link href="/admin/streaming/accounts/add">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau compte
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Compte</th>
                <th className="px-6 py-3">Plateforme</th>
                <th className="px-6 py-3">Profils</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date de création</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.map((account: Account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  {/* Compte info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <Key className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{account.username}</div>
                        {account.email && (
                          <div className="text-sm text-gray-500">{account.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Plateforme */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {account.platform.logo ? (
                        <img 
                          src={account.platform.logo} 
                          alt={account.platform.name}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Globe className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="ml-2 text-gray-900">{account.platform.name}</span>
                      <Badge className="ml-2" variant={
                        account.platform.type === 'VIDEO' ? 'default' :
                        account.platform.type === 'AUDIO' ? 'secondary' :
                        'outline'
                      }>
                        {account.platform.type}
                      </Badge>
                    </div>
                  </td>
                  
                  {/* Profils */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {account.accountProfiles.filter(p => p.isAssigned).length} / {account.accountProfiles.length}
                      </span>
                    </div>
                  </td>
                  
                  {/* Statut */}
                  <td className="px-6 py-4">
                    <Badge variant={account.status === 'AVAILABLE' ? 'success' : 'secondary'}>
                      {account.status === 'AVAILABLE' ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 mr-1" />
                      )}
                      {account.status === 'AVAILABLE' ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{formatDate(account.createdAt)}</span>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-3">
                      <Link 
                        href={`/admin/streaming/accounts/${account.id}`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 text-primary hover:text-primary-dark transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/admin/streaming/accounts/${account.id}/edit`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {accounts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun compte trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 