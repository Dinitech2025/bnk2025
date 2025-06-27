'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, User, Lock, UserCircle2, Users, UserCheck, Phone } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('') // Email ou téléphone
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fonction pour détecter si c'est un email ou un téléphone
  const isEmail = (value: string) => {
    return value.includes('@')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Debug: Afficher ce qui va être envoyé
      const credentials = {
        email: isEmail(identifier) ? identifier : undefined,
        phone: !isEmail(identifier) ? identifier : undefined,
        password,
        redirect: false,
      }
      
      console.log('🔐 Tentative de connexion avec:', {
        email: credentials.email || 'non fourni',
        phone: credentials.phone || 'non fourni',
        hasPassword: !!credentials.password
      })

      const result = await signIn('credentials', credentials)
      
      console.log('🔐 Résultat de connexion:', result)

      if (result?.error) {
        console.log('❌ Erreur de connexion NextAuth:', result.error)
        setError('Identifiants incorrects')
        setIsLoading(false)
      } else {
        console.log('✅ Connexion réussie !')
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('❌ Exception lors de la connexion:', error)
      setError('Une erreur est survenue')
      setIsLoading(false)
    }
  }

  const loginAsUser = async (type: 'admin' | 'staff' | 'client') => {
    setIsLoading(true)
    setError(null)
    
    let credentials = {
      email: '',
      password: '',
    }
    
    switch (type) {
      case 'admin':
        credentials.email = 'admin@boutiknaka.com'
        credentials.password = 'password123'
        break
      case 'staff':
        credentials.email = 'staff@boutiknaka.com'
        credentials.password = 'staff123'
        break
      case 'client':
        credentials.email = 'client@example.com'
        credentials.password = 'client123'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Bienvenue
          </h1>
          <p className="text-lg text-gray-600">
            Connectez-vous à votre compte BoutikNaka
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-600 animate-shake">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-gray-700 font-medium">
                Email ou Téléphone
              </Label>
              <div className="relative">
                {isEmail(identifier) ? (
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                ) : (
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                )}
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="votre@email.com ou +261 34 12 345 67"
                  required
                  className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Vous pouvez utiliser votre email ou votre numéro de téléphone
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mot de passe
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Mot de passe oublié?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Connexion rapide
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => loginAsUser('admin')}
                disabled={isLoading}
                className="flex flex-col items-center space-y-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserCircle2 className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Admin</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loginAsUser('staff')}
                disabled={isLoading}
                className="flex flex-col items-center space-y-2 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="h-6 w-6 text-green-600" />
                <span className="font-medium">Staff</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loginAsUser('client')}
                disabled={isLoading}
                className="flex flex-col items-center space-y-2 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserCheck className="h-6 w-6 text-purple-600" />
                <span className="font-medium">Client</span>
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-600">Vous n'avez pas de compte?</span>{' '}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 