import { BarChart3, Users, ShoppingBag, Package, FileText } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Utilisateurs" 
          value="245" 
          change="+12%" 
          icon={<Users className="h-8 w-8" />} 
        />
        <StatCard 
          title="Produits" 
          value="124" 
          change="+5%" 
          icon={<ShoppingBag className="h-8 w-8" />} 
        />
        <StatCard 
          title="Services" 
          value="56" 
          change="+8%" 
          icon={<Package className="h-8 w-8" />} 
        />
        <StatCard 
          title="Commandes" 
          value="89" 
          change="+24%" 
          icon={<FileText className="h-8 w-8" />} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Ventes récentes</h2>
          <div className="h-80 flex items-center justify-center bg-gray-50">
            <BarChart3 className="h-16 w-16 text-gray-300" />
            <span className="ml-2 text-gray-400">Graphique des ventes</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Dernières commandes</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="pb-3">Commande</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3, 4, 5].map((order) => (
                <tr key={order} className="text-sm">
                  <td className="py-3">#ORD-{1000 + order}</td>
                  <td className="py-3">Client {order}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Complété
                    </span>
                  </td>
                  <td className="py-3">€{(Math.random() * 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change.startsWith('+')
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className={`text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change} depuis le mois dernier
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  )
} 