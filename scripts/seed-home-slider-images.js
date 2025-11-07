const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Script pour ajouter des images multiples aux HomeSliders existants
 */

async function seedHomeSliderImages() {
  try {
    console.log('🖼️ Ajout d\'images multiples pour les HomeSliders...\n')
    
    // Récupérer tous les sliders actifs
    const sliders = await prisma.homeSlider.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    if (sliders.length === 0) {
      console.log('ℹ️  Aucun HomeSlider trouvé dans la base de données')
      console.log('💡 Vous pouvez créer des sliders via l\'interface d\'administration')
      return
    }
    
    console.log(`📊 ${sliders.length} slider(s) trouvé(s)\n`)
    
    // Collections d'images variées par thématique
    const imageCollections = {
      business: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Commerce moderne',
          description: 'Boutique et commerce',
          alt: 'Environnement commercial'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Shopping moderne',
          description: 'Expérience shopping',
          alt: 'Shopping en ligne'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Produits premium',
          description: 'Collection premium',
          alt: 'Produits de qualité'
        }
      ],
      technology: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Technologies avancées',
          description: 'Innovation technologique',
          alt: 'Technologies modernes'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Solutions numériques',
          description: 'Transformation digitale',
          alt: 'Solutions technologiques'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Infrastructure IT',
          description: 'Systèmes performants',
          alt: 'Infrastructure technique'
        }
      ],
      services: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Services professionnels',
          description: 'Accompagnement personnalisé',
          alt: 'Services de qualité'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Consultation experte',
          description: 'Conseil stratégique',
          alt: 'Consultation professionnelle'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Solutions sur mesure',
          description: 'Approche personnalisée',
          alt: 'Solutions adaptées'
        }
      ],
      lifestyle: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Lifestyle moderne',
          description: 'Style et élégance',
          alt: 'Produits lifestyle'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Mode et tendances',
          description: 'Collections tendance',
          alt: 'Mode et style'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Accessoires premium',
          description: 'Qualité supérieure',
          alt: 'Accessoires de luxe'
        }
      ]
    }
    
    // Déterminer automatiquement la collection d'images à utiliser
    const getImageCollection = (slider) => {
      const title = slider.title?.toLowerCase() || ''
      const subtitle = slider.subtitle?.toLowerCase() || ''
      const description = slider.description?.toLowerCase() || ''
      const combined = `${title} ${subtitle} ${description}`
      
      if (combined.includes('technolog') || combined.includes('digital') || combined.includes('web') || combined.includes('tech')) {
        return imageCollections.technology
      } else if (combined.includes('service') || combined.includes('consultation') || combined.includes('accompagnement')) {
        return imageCollections.services
      } else if (combined.includes('mode') || combined.includes('fashion') || combined.includes('lifestyle') || combined.includes('style')) {
        return imageCollections.lifestyle
      } else {
        return imageCollections.business
      }
    }
    
    let totalImagesAdded = 0
    
    for (const slider of sliders) {
      console.log(`🎯 Traitement du slider: "${slider.title}"`)
      
      // Sélectionner la collection d'images appropriée
      const images = getImageCollection(slider)
      
      // Vérifier si des images existent déjà
      const existingImages = await prisma.homeSliderImage.findMany({
        where: { homeSliderId: slider.id }
      })
      
      if (existingImages.length > 0) {
        console.log(`   📋 ${existingImages.length} image(s) déjà présente(s) - Mise à jour...`)
        await prisma.homeSliderImage.deleteMany({
          where: { homeSliderId: slider.id }
        })
      }
      
      // Ajouter les nouvelles images
      for (let i = 0; i < images.length; i++) {
        await prisma.homeSliderImage.create({
          data: {
            homeSliderId: slider.id,
            ...images[i],
            order: i + 1,
            isActive: true
          }
        })
        totalImagesAdded++
      }
      
      // Activer le diaporama pour ce slider
      await prisma.homeSlider.update({
        where: { id: slider.id },
        data: {
          slideshowEnabled: true,
          slideshowDuration: 5000, // 5 secondes
          slideshowTransition: 'fade'
        }
      })
      
      console.log(`   ✅ ${images.length} image(s) ajoutée(s)`)
    }
    
    console.log(`\n${'='.repeat(50)}`)
    console.log(`🎉 Total: ${totalImagesAdded} images ajoutées avec succès !`)
    console.log(`🎬 Diaporama activé pour ${sliders.length} slider(s)`)
    console.log(`💡 Transition: "fade" (5 secondes entre les images)`)
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message)
    console.error(error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedHomeSliderImages()



