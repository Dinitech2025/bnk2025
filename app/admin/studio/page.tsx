'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth'

export default async function StudioPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Vérifier que l'utilisateur est admin
  await requireAdmin()

  const launchStudio = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/studio')
      if (!response.ok) {
        throw new Error('Erreur lors du lancement de Prisma Studio')
      }
      
      // Ouvrir Prisma Studio dans un nouvel onglet
      window.open('http://localhost:5555', '_blank')
    } catch (error) {
      setError('Impossible de lancer Prisma Studio')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Prisma Studio</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Prisma Studio est une interface graphique pour gérer votre base de données.
          Cliquez sur le bouton ci-dessous pour lancer Prisma Studio.
        </p>
        
        <Button
          onClick={launchStudio}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Lancement...' : 'Lancer Prisma Studio'}
        </Button>
      </div>
    </div>
  )
} 