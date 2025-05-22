// @ts-nocheck
import { db } from '@/lib/db'
import Link from 'next/link'
import { PlusCircle, Search, Phone, MapPin, ShoppingBag, Calendar, User, Briefcase, Eye, Pencil, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/lib/auth'

export default async function ClientsPage() {
  // Vérifier que l'utilisateur est admin ou staff
  await requireStaff()

  // Récupérer tous les clients (utilisateurs avec rôle CLIENT)
  const clients = await db.user.findMany({
    where: {
      role: 'CLIENT'
    },
    include: {
      addresses: true,
      orders: {
        select: {
          id: true,
          total: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calculer le montant total dépensé par client
  const clientsWithTotalSpent = clients.map(client => {
    const totalSpent = client.orders
      .filter(order => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + Number(order.total || 0), 0)
    
    return {
      ...client,
      totalSpent
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              className="pl-10 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link href="/admin/clients/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Statistiques</th>
                <th className="px-6 py-3">Date d'inscription</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientsWithTotalSpent.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  {/* Client info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {client.image ? (
                        <img
                          src={client.image}
                          alt={(client.firstName && client.lastName) ? `${client.firstName} ${client.lastName}` : client.email}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                          {client.firstName?.charAt(0) || client.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.firstName && client.lastName 
                            ? `${client.firstName} ${client.lastName}`
                            : client.name || 'Sans nom'}
                        </div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Contact info */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {client.phone ? (
                        <div className="flex items-center text-gray-600 mb-1">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          <span>{client.phone}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{client.addresses.length} {client.addresses.length > 1 ? 'adresses' : 'adresse'}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Client type */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.customerType === 'BUSINESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {client.customerType === 'BUSINESS' ? 'Entreprise' : 'Particulier'}
                    </span>
                    {client.customerType === 'BUSINESS' && client.companyName && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {client.companyName}
                      </div>
                    )}
                  </td>
                  
                  {/* Stats */}
                  <td className="px-6 py-4">
                    <div className="flex space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center text-gray-600 text-sm">
                          <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                          <span>{client.orders.length}</span>
                        </div>
                        <div className="text-xs text-gray-500">Commandes</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-800">{client.totalSpent.toFixed(2)} €</div>
                        <div className="text-xs text-gray-500">Total dépensé</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-3">
                      <Link 
                        href={`/admin/clients/${client.id}`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 text-primary hover:text-primary-dark transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/admin/clients/${client.id}/edit`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/admin/clients/${client.id}/delete`}
                        className="p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun client trouvé
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