'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
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
  Globe
} from 'lucide-react'
import { useState } from 'react'

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

const adminNavItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Clients',
    href: '/admin/clients',
    icon: Users,
  },
  {
    title: 'Produits',
    href: '/admin/products',
    icon: ShoppingBag,
  },
  {
    title: 'Services',
    href: '/admin/services',
    icon: Package,
  },
  {
    title: 'Streaming',
    icon: Play,
    submenu: true,
    submenuItems: [
      { title: 'Plateformes', href: '/admin/streaming/platforms' },
      { title: 'Offres', href: '/admin/streaming/offers' },
      { title: 'Comptes', href: '/admin/streaming/accounts' },
      { title: 'Profiles', href: '/admin/streaming/profiles' },
      { title: 'Abonnements', href: '/admin/streaming/subscriptions' },
    ]
  },
  {
    title: 'Commandes',
    href: '/admin/orders',
    icon: FileText,
  },
  {
    title: 'CyberCafé',
    href: '/admin/cybercafe',
    icon: Computer,
  },
  {
    title: 'Paramètres',
    icon: Settings,
    submenu: true,
    submenuItems: [
      { title: 'Paramètres généraux', href: '/admin/settings/general' },
      { title: 'Gestion d\'employés', href: '/admin/settings/employees' },
    ]
  },
]

function AdminSidebar() {
  const pathname = usePathname() || '';
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(
    // Ouvrir automatiquement le sous-menu si un de ses éléments est actif
    pathname.startsWith('/admin/streaming') 
      ? 'Streaming' 
      : pathname.startsWith('/admin/settings')
        ? 'Paramètres'
        : null
  )

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <Link href="/admin" className="flex items-center">
          <span className="text-xl font-bold">BoutikNaka</span>
          <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-md">Admin</span>
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
                      pathname.startsWith(`/admin/${item.title.toLowerCase()}`)
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
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span>Retour au site</span>
        </Link>
      </div>
    </aside>
  )
}

export default AdminSidebar 