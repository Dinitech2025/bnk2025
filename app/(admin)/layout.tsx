import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { SonnerToast } from '@/components/ui/toast'
import { requireStaff } from '@/lib/auth'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Import dynamique des composants admin uniquement
const AdminSidebar = dynamic(() => import('@/components/admin/sidebar'), { 
  ssr: false 
})

const AdminHeader = dynamic(
  () => import('@/components/admin/header'),
  { 
    ssr: false
  }
)

// Configuration pour le groupe admin
export const metadata = {
  title: 'Administration - BoutikNaka',
  description: 'Interface d\'administration BoutikNaka'
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vérifie que l'utilisateur est admin ou staff
  const user = await requireStaff()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        {/* @ts-ignore - Nous savons que les props sont correctes */}
        <AdminHeader user={user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Toaster />
      <SonnerToast />
    </div>
  )
} 