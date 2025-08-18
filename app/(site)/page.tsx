'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  const [heroBanner, setHeroBanner] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const heroBannerRes = await fetch('/api/public/hero-banner')
        if (heroBannerRes.ok) {
          const heroBannerData = await heroBannerRes.json()
          setHeroBanner(heroBannerData)
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner Test */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        {/* Image de fond */}
        {heroBanner?.backgroundImage && (
          <div className="absolute inset-0">
            <Image 
              src={heroBanner.backgroundImage}
              alt="Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col lg:flex-row items-center justify-between">
          <div className="text-white max-w-lg z-10 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              {heroBanner?.title || 'Bienvenue chez'}
              <span className="block text-yellow-300">
                {heroBanner?.subtitle || "Boutik'nakà"}
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-8 opacity-95 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {heroBanner?.description || 'Découvrez nos produits et services de qualité exceptionnelle'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto shadow-lg hover:shadow-xl transition-all" 
                asChild
              >
                <Link href={heroBanner?.primaryButtonLink || '/products'}>
                  {heroBanner?.primaryButtonText || 'Explorer nos Produits'}
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-xs md:text-sm lg:text-base px-4 md:px-6 py-2 md:py-3 h-auto text-white border-white hover:bg-white hover:text-primary shadow-lg hover:shadow-xl transition-all" 
                asChild
              >
                <Link href={heroBanner?.secondaryButtonLink || '/services'}>
                  {heroBanner?.secondaryButtonText || 'Découvrir nos Services'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Formes décoratives */}
        <>
          <div className="absolute top-5 right-5 md:top-10 md:right-10 w-16 h-16 md:w-32 md:h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-5 md:bottom-20 md:left-10 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 md:w-16 md:h-16 bg-yellow-300/30 rounded-full blur-md"></div>
        </>
      </section>
      
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center">Test Page</h2>
        <p className="text-center mt-4">Ceci est une page de test pour la bannière configurable.</p>
      </div>
    </div>
  )
}
