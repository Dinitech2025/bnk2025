'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            BoutikNaka
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-primary transition">
              Accueil
            </Link>
            <Link href="/products" className="hover:text-primary transition">
              Produits
            </Link>
            <Link href="/services" className="hover:text-primary transition">
              Services
            </Link>
            <Link href="/contact" className="hover:text-primary transition">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-bold mb-4">BoutikNaka</h3>
              <p className="text-gray-600">Plateforme e-commerce et services</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-600 hover:text-primary transition">Accueil</Link></li>
                <li><Link href="/products" className="text-gray-600 hover:text-primary transition">Produits</Link></li>
                <li><Link href="/services" className="text-gray-600 hover:text-primary transition">Services</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-primary transition">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm text-center">
              © {new Date().getFullYear()} BoutikNaka. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 