'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'

// Import dynamique du UserMenu avec ssr: false pour éviter les erreurs d'hydratation
const UserMenu = dynamic(() => import('@/components/user-menu'), { 
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-full bg-gray-200"></div>
})

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Vérifier si l'utilisateur est admin ou staff et si le chemin commence par /admin
  const isAdminRoute = pathname?.startsWith('/admin')
  const isAdminOrStaff = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF'

  // Si c'est une route admin et l'utilisateur est admin ou staff, afficher uniquement le contenu sans le layout
  if (isAdminRoute && isAdminOrStaff) {
    return <>{children}</>
  }

  // Sinon, afficher le layout complet
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
} 