import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AuthProvider } from '@/lib/auth-provider'
import { generateMetadata } from './metadata'
import { Toaster } from '@/components/ui/toaster'
import { SonnerToast } from '@/components/ui/toast'
import { CurrencyProviderWrapper } from '@/components/providers/currency-provider'
import '@/lib/currency-initializer' // Initialise la synchronisation automatique

const inter = Inter({ subsets: ['latin'] })

// Utiliser la fonction pour générer les métadonnées
export { generateMetadata }

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <CurrencyProviderWrapper>
            {children}
            <Toaster />
            <SonnerToast />
          </CurrencyProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  )
} 
 
 