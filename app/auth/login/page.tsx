'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        setIsLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('Une erreur est survenue')
      setIsLoading(false)
    }
  }

  const loginAsUser = async (type: 'admin' | 'staff' | 'client') => {
    setIsLoading(true)
    setError(null)
    
    let credentials = {
      email: '',
      password: 'password123',
    }
    
    switch (type) {
      case 'admin':
        credentials.email = 'admin@boutiknaka.com'
        break
      case 'staff':
        credentials.email = 'staff@boutiknaka.com'
        break
      case 'client':
        credentials.email = 'client@boutiknaka.com'
        break
    }
    
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        setError(`Échec de connexion en tant que ${type}`)
        setIsLoading(false)
        return
      }

      if (type === 'admin' || type === 'staff') {
        router.push('/admin')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch (error) {
      setError('Une erreur est survenue')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Connexion</h1>
          <p className="mt-2 text-gray-600">
            Connectez-vous à votre compte BoutikNaka
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mot de passe oublié?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Connexion rapide
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => loginAsUser('admin')}
                disabled={isLoading}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loginAsUser('staff')}
                disabled={isLoading}
              >
                Staff
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loginAsUser('client')}
                disabled={isLoading}
              >
                Client
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Vous n'avez pas de compte?</span>{' '}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline font-medium"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 