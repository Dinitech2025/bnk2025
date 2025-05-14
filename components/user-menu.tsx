'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { data: session } = useSession()
  
  if (!session) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">
            Connexion
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="default" size="sm">
            S'inscrire
          </Button>
        </Link>
      </div>
    )
  }
  
  const initials = session.user.name
    ? session.user.name.split(' ').map((n) => n[0]).join('')
    : session.user.email?.charAt(0).toUpperCase()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5 leading-none">
            {session.user.name && (
              <p className="font-medium">{session.user.name}</p>
            )}
            {session.user.email && (
              <p className="w-[200px] truncate text-sm text-gray-600">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Mon profil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders">Mes commandes</Link>
        </DropdownMenuItem>
        {(session.user.role === 'ADMIN' || session.user.role === 'STAFF') && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Administration</Link>
          </DropdownMenuItem>
        )}
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
  )
}

export default UserMenu