'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

const SiteHeader = dynamic(() => import('@/components/site-header').then(mod => mod.SiteHeader))
const SiteFooter = dynamic(() => import('@/components/site-footer').then(mod => mod.SiteFooter))

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
} 
 