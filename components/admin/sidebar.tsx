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
  BarChart,
  Layers,
} from 'lucide-react'

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
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
    title: 'Commandes',
    href: '/admin/orders',
    icon: FileText,
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Rapports',
    href: '/admin/reports',
    icon: BarChart,
  },
  {
    title: 'Plateformes',
    href: '/admin/platforms',
    icon: Layers,
  },
  {
    title: 'Paramètres',
    href: '/admin/settings',
    icon: Settings,
  },
]

function AdminSidebar() {
  const pathname = usePathname()

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
            <li key={item.href}>
              <Link
                href={item.href}
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