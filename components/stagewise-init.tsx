'use client'

import { useEffect } from 'react'

const SimpleIcon = () => (
  <svg>
    <circle cx={12} cy={12} r={10} />
  </svg>
)

export function StagewiseInit() {
  useEffect(() => {
    // Approche framework-agnostic recommandée par stagewise
    async function setupStagewise() {
      // Vérifier si nous sommes en mode développement et côté client
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        try {
          // Import dynamique pour éviter les erreurs SSR
          const { initToolbar } = await import('@stagewise/toolbar')
          
          const stagewiseConfig = {
            plugins: [
              {
                name: 'boutiknaka-plugin',
                displayName: 'BoutikNaka',
                pluginName: 'boutiknaka-plugin',
                iconSvg: SimpleIcon,
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

          // TODO: Supprimer @ts-ignore une fois que nous aurons une solution du support Stagewise
          // @ts-ignore - Le type de l'icône SVG n'est pas compatible avec ce qui est attendu par Stagewise
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
 