import { requireStaff } from '@/lib/auth'
import dynamic from 'next/dynamic'

// Import dynamique des composants avec ssr: false pour éviter les erreurs d'hydratation
const AdminSidebar = dynamic(() => import('@/components/admin/sidebar'), { 
  ssr: false 
})

const AdminHeader = dynamic(
  () => import('@/components/admin/header'),
  { 
    ssr: false,
    // Définir un type pour les props
    loading: () => (
      <div className="h-16 border-b bg-white flex items-center px-6">
        <div className="w-full flex justify-end">
          <div className="h-8 w-8 rounded-full bg-gray-200"></div>
        </div>
      </div>
    )
  }
)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vérifie que l'utilisateur est admin ou staff
  const user = await requireStaff()

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        {/* @ts-ignore - Nous savons que les props sont correctes */}
        <AdminHeader user={user} />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
} 