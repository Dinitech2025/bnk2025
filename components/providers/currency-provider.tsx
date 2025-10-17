'use client'

import { CurrencyProvider } from '@/lib/contexts/currency-context'

export function CurrencyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  )
} 
 
 
 
 
 
 