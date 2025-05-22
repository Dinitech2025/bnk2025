'use client'

import { signOut, useSession } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CurrencySelector } from '@/components/ui/currency-selector'

interface AdminHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const { data: session, update } = useSession()
  const [userData, setUserData] = useState(user)
  
  // Récupérer les données à jour de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setUserData({
            ...user,
            name: data.name || user.name,
            image: data.image || user.image
          })
          // Mettre à jour la session
          await update({
            ...session,
            user: {
              ...session?.user,
              name: data.name,
              image: data.image
            }
          })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error)
      }
    }
    
    fetchUserData()
  }, [user.email])
  
  const initials = userData.name
    ? userData.name.split(' ').map((n) => n[0]).join('')
    : userData.email?.charAt(0).toUpperCase()

  return (
    <header className="h-16 border-b bg-white flex items-center px-6">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-background pl-8 h-9 rounded-md border border-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              2
            </span>
          </Button>
          <CurrencySelector className="w-20" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar>
                  <AvatarImage src={userData.image || ''} alt={userData.name || ''} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-0.5 leading-none">
                  {userData.name && (
                    <p className="font-medium">{userData.name}</p>
                  )}
                  {userData.email && (
                    <p className="w-[200px] truncate text-sm text-gray-600">
                      {userData.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {userData.role === 'ADMIN' ? 'Administrateur' : 'Staff'}
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
      </div>
    </header>
  )
}
