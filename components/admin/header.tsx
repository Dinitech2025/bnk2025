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

export default function AdminHeader() {
  const { data: session, update } = useSession()
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    image: '',
    role: ''
  })

  // Mettre à jour userData quand la session change
  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || '',
        role: session.user.role || ''
      })
    }
  }, [session])
  
  // Récupérer les données à jour de l'utilisateur (simplifié pour éviter les boucles)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!session?.user?.email) return
        
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setUserData(prev => ({
            ...prev,
            name: data.name || session.user.name || '',
            image: data.image || session.user.image || ''
          }))
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error)
      }
    }
    
    if (session?.user?.email) {
      fetchUserData()
    }
  }, [session?.user?.email]) // Dépendances minimales
  
  const initials = userData.name
    ? userData.name.split(' ').map((n) => n[0]).join('')
    : userData.email?.charAt(0).toUpperCase()

  return (
    <header className="h-12 sm:h-16 border-b bg-white flex items-center px-3 sm:px-6">
      <div className="w-full flex items-center justify-between">
        {/* Espace gauche pour équilibrer */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          {/* Vide pour équilibrer */}
        </div>
        
        {/* Logo/Titre centré */}
        <div className="flex items-center justify-center">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">
            DINITECH
          </h1>
        </div>
        
        {/* Actions droite */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-end">
          <Button variant="ghost" size="icon" className="relative h-7 w-7 sm:h-8 sm:w-8">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-primary text-[8px] sm:text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              2
            </span>
          </Button>
          <CurrencySelector className="w-16 sm:w-20 text-xs sm:text-sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarImage src={userData.image || ''} alt={userData.name || ''} />
                  <AvatarFallback className="text-xs sm:text-sm">{initials}</AvatarFallback>
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
