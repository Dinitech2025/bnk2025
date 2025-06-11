'use client'

import { useEffect } from 'react'
import { h } from 'preact'
import type { VNode } from 'preact'

export function StagewiseInit() {
  useEffect(() => {
    // Approche framework-agnostic recommandée par stagewise
    async function setupStagewise() {
      // Vérifier si nous sommes en mode développement et côté client
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        try {
          // Import dynamique pour éviter les erreurs SSR
          const { initToolbar } = await import('@stagewise/toolbar')
          
          const iconSvg: VNode = h('svg', { viewBox: '0 0 24 24' },
            h('path', { d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' })
          )

          const stagewiseConfig = {
            plugins: [
              {
                name: 'boutiknaka-plugin',
                displayName: 'BoutikNaka',
                pluginName: 'boutiknaka-plugin',
                iconSvg,
                description: 'Plugin personnalisé pour BoutikNaka',
                shortInfoForPrompt: () => {
                  return "Contexte de l'application BoutikNaka - e-commerce"
                },
                mcp: null,
                actions: [
                  {
                    name: 'Analyser Component',
                    description: 'Analyse le composant sélectionné',
                    execute: () => {
                      console.log('Analyse du composant en cours...')
                    },
                  },
                ],
              },
            ],
          }

          initToolbar(stagewiseConfig)
          console.log('✅ Stagewise toolbar initialisée avec succès')
        } catch (error) {
          console.warn('⚠️ Erreur lors de l\'initialisation de stagewise:', error)
        }
      }
    }

    setupStagewise()
  }, [])

  return null // Ce composant ne rend rien visuellement
} 
 