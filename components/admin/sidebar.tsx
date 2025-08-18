'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Settings,
  Package,
  FileText,
  Play,
  Monitor,
  ChevronDown,
  ChevronRight,
  Tv,
  CreditCard,
  UserCircle,
  Ticket,
  Computer,
  Globe,
  Box,
  Download,
  FolderTree,
  Store,
  Tag,
  List,
  Menu,
  X,
  MessageSquare
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SubmenuItem {
  title: string;
  href: string;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  submenu?: boolean;
  submenuItems?: SubmenuItem[];
}

// Navigation items for admin sidebar - Updated with Quotes
const adminNavItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Gestion des clients',
    href: '/admin/clients',
    icon: Users,
  },
  {
    title: 'Gestion du Cyber',
    href: '/admin/cybercafe',
    icon: Computer,
  },
  {
    title: 'Gestion des produits',
    icon: ShoppingBag,
    submenu: true,
    submenuItems: [
      { title: 'Simulation Produit Importé', href: '/admin/products/imported/simulation' },
      { title: 'Produits importés', href: '/admin/products/imported' },
      { title: 'Produits simples', href: '/admin/products' },
      { title: 'Catégories', href: '/admin/products/categories' },
      { title: 'Inventaire', href: '/admin/products/inventory' },
    ]
  },
  {
    title: 'Gestion des services',
    icon: Package,
    submenu: true,
    submenuItems: [
      { title: 'Services', href: '/admin/services' },
      { title: 'Catégories', href: '/admin/services/categories' },
    ]
  },
  {
    title: 'Gestion des abonnements',
    icon: Play,
    submenu: true,
    submenuItems: [
      { title: 'Abonnements', href: '/admin/streaming/subscriptions' },
      { title: 'Plateformes', href: '/admin/streaming/platforms' },
      { title: 'Offres', href: '/admin/streaming/offers' },
      { title: 'Comptes', href: '/admin/streaming/accounts' },
      { title: 'Profiles', href: '/admin/streaming/profiles' },
      { title: 'Cartes Cadeaux', href: '/admin/streaming/gift-cards' }
    ]
  },
  {
    title: 'Commandes',
    href: '/admin/orders',
    icon: FileText,
  },
  {
    title: 'Paniers',
    href: '/admin/carts',
    icon: ShoppingCart,
  },
  {
    title: 'Devis',
    href: '/admin/quotes',
    icon: MessageSquare,
  },
  {
    title: 'Contenu du site',
    icon: Globe,
    submenu: true,
    submenuItems: [
      { title: 'Bannière Principale', href: '/admin/hero-banner' },
      { title: 'Slides d\'accueil', href: '/admin/hero-slides' },
    ]
  },
  {
    title: 'Paramètres',
    icon: Settings,
    submenu: true,
    submenuItems: [
      { title: 'Informations du site', href: '/admin/settings/site' },
      { title: 'Apparence', href: '/admin/settings/appearance' },
      { title: 'Contact', href: '/admin/settings/contact' },
      { title: 'SEO & Réseaux sociaux', href: '/admin/settings/seo' },
      { title: 'Gestion d\'employés', href: '/admin/settings/employees' },
      { title: 'Conversion de devises', href: '/admin/settings/currency' },
      { title: 'Calcul d\'Importation', href: '/admin/settings/import-calculation' },
    ]
  },
]

function AdminSidebar() {
  const pathname = usePathname() || '';
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    // Ouvrir automatiquement le sous-menu si un de ses éléments est actif
    pathname.startsWith('/admin/streaming') 
      ? 'Gestion des abonnements' 
      : pathname.startsWith('/admin/settings')
        ? 'Paramètres'
        : pathname.startsWith('/admin/products')
          ? 'Gestion des produits'
          : pathname.startsWith('/admin/services')
            ? 'Gestion des services'
            : pathname.startsWith('/admin/hero-slides') || pathname.startsWith('/admin/hero-banner')
              ? 'Contenu du site'
        : null
  )

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Bouton hamburger pour mobile/tablette */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay pour mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-72 bg-slate-900 text-white min-h-screen flex flex-col transition-transform duration-300 ease-in-out z-40",
        "lg:relative lg:translate-x-0", // Toujours visible sur desktop
        "fixed", // Fixe sur mobile/tablette
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" // Contrôle de l'affichage mobile
      )}>
        <div className="p-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center justify-center" onClick={closeMobileSidebar}>
            <span className="text-xl font-bold">Administration</span>
          </Link>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => (
              <li key={item.title}>
                {item.submenu ? (
                  <div className="mb-1">
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        'flex items-center justify-between w-full gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        (pathname.startsWith(`/admin/streaming`) && item.title === 'Gestion des abonnements') ||
                        (pathname.startsWith(`/admin/products`) && item.title === 'Gestion des produits') ||
                        (pathname.startsWith(`/admin/services`) && item.title === 'Gestion des services') ||
                        (pathname.startsWith(`/admin/settings`) && item.title === 'Paramètres')
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {openSubmenu === item.title ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openSubmenu === item.title && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                        {item.submenuItems?.map((subItem) => (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              onClick={closeMobileSidebar}
                              className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                pathname === subItem.href
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                              )}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href || '#'}
                    onClick={closeMobileSidebar}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      pathname === item.href
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>Retour au site</span>
          </Link>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
