'use client'

import { StagewiseToolbar } from '@stagewise/toolbar-next'
import { useEffect, useState } from 'react'

export function StagewiseToolbarClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Ne pas rendre côté serveur pour éviter les problèmes SSR
  if (!mounted) {
    return null
  }

  return (
    <StagewiseToolbar
      config={{
        plugins: [], // Add your custom plugins here
      }}
    />
  )
} 
 