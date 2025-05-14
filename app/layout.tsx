'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-provider'
import { LayoutWrapper } from '@/components/layout-wrapper'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  )
} 