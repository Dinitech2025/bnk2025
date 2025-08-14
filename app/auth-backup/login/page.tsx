'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, User, Lock, UserCircle2, Users, UserCheck, Phone, Mail, Eye, EyeOff, Store } from 'lucide-react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import { toast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { settings } = useSiteSettings()
  const [identifier, setIdentifier] = useState('') // Email ou téléphone
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Récupération des paramètres du site
  const siteName = getSetting(settings, 'siteName', 'Boutik\'nakà')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  // Fonction pour détecter si c'est un email ou un téléphone
  const isEmail = (value: string) => {
    return value.includes('@')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Timeout pour éviter un blocage infini
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout de connexion atteint')
      setError('Connexion trop longue - veuillez réessayer')
      toast({
        title: "Timeout de connexion",
        description: "La connexion prend trop de temps. Veuillez réessayer.",
        variant: "destructive"
      })
      setIsLoading(false)
    }, 10000) // 10 secondes

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
      
      // Annuler le timeout si la réponse arrive
      clearTimeout(timeoutId)
      
      console.log('🔐 Résultat de connexion:', result)

      if (result?.error) {
        console.log('❌ Erreur de connexion NextAuth:', result.error)
        setError('Identifiants incorrects')
        toast({
          title: "Erreur de connexion",
          description: "Identifiants incorrects",
          variant: "destructive"
        })
        setIsLoading(false)
      } else if (result?.ok === true) {
        console.log('✅ Connexion réussie ! Redirection immédiate...')
        toast({
          title: "Connexion réussie !",
          description: "Redirection en cours...",
        })
        
        // Redirection immédiate avec rechargement complet
        window.location.href = '/'
      } else {
        console.log('🔄 Résultat inattendu:', result)
        setError('Résultat de connexion inattendu')
        setIsLoading(false)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ Exception lors de la connexion:', error)
      setError('Une erreur est survenue')
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  const loginAsUser = async (type: 'admin' | 'staff' | 'client') => {
    setIsLoading(true)
    setError(null)
    
    // Timeout pour éviter un blocage infini
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Timeout de connexion ${type} atteint`)
      setError(`Connexion ${type} trop longue - veuillez réessayer`)
      toast({
        title: "Timeout de connexion",
        description: `La connexion ${type} prend trop de temps. Veuillez réessayer.`,
        variant: "destructive"
      })
      setIsLoading(false)
    }, 10000) // 10 secondes
    
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
      console.log(`🔐 Connexion rapide en tant que ${type}...`)
      
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      // Annuler le timeout si la réponse arrive
      clearTimeout(timeoutId)
      
      console.log(`🔐 Résultat connexion ${type}:`, result)

      if (result?.error) {
        console.log(`❌ Erreur connexion ${type}:`, result.error)
        setError(`Échec de connexion en tant que ${type}`)
        toast({
          title: "Erreur de connexion",
          description: `Échec de connexion en tant que ${type}`,
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      if (result?.ok === true) {
        console.log(`✅ Connexion ${type} réussie ! Redirection immédiate...`)
        toast({
          title: "Connexion réussie !",
          description: `Connecté en tant que ${type}. Redirection...`,
        })
        
        // Redirection immédiate selon le type avec rechargement complet
        if (type === 'admin' || type === 'staff') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/'
        }
      } else {
        console.log(`🔄 Résultat inattendu pour ${type}:`, result)
        setError(`Résultat inattendu pour la connexion ${type}`)
        setIsLoading(false)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`❌ Exception connexion ${type}:`, error)
      setError('Une erreur est survenue')
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Carte de connexion */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-4 pt-4">
            {/* Logo/Nom du site dans la carte */}
            <div className="text-center">
              <Link href="/" className="flex items-center justify-center space-x-2">
                {useSiteLogo && logoUrl ? (
                  <div className="relative h-12 w-48 lg:h-16 lg:w-64">
                    <Image
                      src={logoUrl}
                      alt={siteName}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <span className="text-xl lg:text-2xl font-bold text-gray-900">{siteName}</span>
                )}
              </Link>
            </div>
            
            <CardTitle className="text-2xl font-semibold text-center">
              Connexion
            </CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour vous connecter
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Erreur de connexion</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Champ identifiant */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                  Email ou Téléphone
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {isEmail(identifier) ? (
                      <Mail className="h-5 w-5" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="votre@email.com ou +261 34 12 345 67"
                    required
                    className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Vous pouvez utiliser votre adresse email ou votre numéro de téléphone
                </p>
              </div>

              {/* Champ mot de passe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe"
                    required
                    className="pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bouton de connexion */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connexion en cours...</span>
                    </div>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
                
                {/* Bouton d'annulation si bloqué */}
                {isLoading && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsLoading(false)
                      setError(null)
                      toast({
                        title: "Connexion annulée",
                        description: "Vous pouvez maintenant réessayer.",
                      })
                    }}
                    className="w-full h-10 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>

            {/* Boutons de test - uniquement en mode développement */}
            {process.env.NODE_ENV === 'development' && (
              <>
                {/* Séparateur */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                      Connexion rapide (Développement)
                    </span>
                  </div>
                </div>

                {/* Boutons de test */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loginAsUser('admin')}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto space-y-2 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  >
                    <UserCircle2 className="h-6 w-6 text-blue-600" />
                    <span className="text-xs font-medium">Admin</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loginAsUser('staff')}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto space-y-2 border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                  >
                    <Users className="h-6 w-6 text-green-600" />
                    <span className="text-xs font-medium">Staff</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loginAsUser('client')}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto space-y-2 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                  >
                    <UserCheck className="h-6 w-6 text-purple-600" />
                    <span className="text-xs font-medium">Client</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Liens utiles */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Vous n'avez pas de compte ?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              Créer un compte
            </Link>
          </p>
          
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <Link href="/contact" className="hover:text-blue-600 hover:underline">
              Contactez-nous
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-blue-600 hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 