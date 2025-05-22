'use client'

import { CurrencyProvider } from '@/lib/hooks/use-currency'

export function CurrencyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  )
} 
 
 
 
 
 
 