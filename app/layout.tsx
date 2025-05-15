import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { SonnerToast } from '@/components/ui/toast'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AuthProvider } from '@/lib/auth-provider'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { generateMetadata } from './metadata'

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
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
          <SonnerToast />
        </AuthProvider>
      </body>
    </html>
  )
} 