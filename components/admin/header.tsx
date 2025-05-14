'use client'

import { signOut } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface AdminHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
}

function AdminHeader({ user }: AdminHeaderProps) {
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('')
    : user.email?.charAt(0).toUpperCase()

  return (
    <header className="h-16 border-b bg-white flex items-center px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar>
                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-0.5 leading-none">
                {user.name && (
                  <p className="font-medium">{user.name}</p>
                )}
                {user.email && (
                  <p className="w-[200px] truncate text-sm text-gray-600">
                    {user.email}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {user.role === 'ADMIN' ? 'Administrateur' : 'Staff'}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault()
                signOut({ callbackUrl: '/' })
              }}
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AdminHeader 