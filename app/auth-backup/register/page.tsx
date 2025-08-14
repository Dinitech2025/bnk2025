'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, User, Mail, Phone, Lock, Eye, EyeOff, Store } from 'lucide-react'
import { useSiteSettings, getSetting } from '@/lib/hooks/use-site-settings'
import { toast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { settings } = useSiteSettings()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Récupération des paramètres du site
  const siteName = getSetting(settings, 'siteName', 'Boutik\'nakà')
  const logoUrl = getSetting(settings, 'logoUrl', '')
  const useSiteLogo = getSetting(settings, 'useSiteLogo', 'false') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    if (!email && !phone) {
      setError('Veuillez fournir au moins un email ou un téléphone')
      toast({
        title: "Erreur",
        description: "Veuillez fournir au moins un email ou un téléphone",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue')
      }

      toast({
        title: "Inscription réussie !",
        description: "Votre compte a été créé avec succès. Veuillez vous connecter.",
      })

      router.push('/auth/login?registered=true')
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setError('Une erreur est survenue')
        toast({
          title: "Erreur d'inscription",
          description: "Une erreur est survenue lors de l'inscription",
          variant: "destructive"
        })
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Carte d'inscription */}
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
              Créer un compte
            </CardTitle>
            <CardDescription className="text-center">
              Inscrivez-vous pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Erreur d'inscription</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    Prénom
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      required
                      className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Nom
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                      required
                      className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-gray-400 text-sm">(optionnel si téléphone fourni)</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Téléphone <span className="text-gray-400 text-sm">(optionnel si email fourni)</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+261 34 12 345 67"
                    className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
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
                <p className="text-xs text-gray-500">Minimum 8 caractères</p>
              </div>

              {/* Confirmer mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bouton d'inscription */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Inscription en cours...</span>
                  </div>
                ) : (
                  'S\'inscrire'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liens utiles */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              Se connecter
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