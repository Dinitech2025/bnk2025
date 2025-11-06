const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedHeroSlideImages() {
  try {
    console.log('🖼️ Ajout d\'images multiples pour les slides...')
    
    // Récupérer tous les slides actifs
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    if (slides.length === 0) {
      console.log('❌ Aucun slide trouvé. Veuillez d\'abord exécuter seed-hero-slides.js')
      return
    }
    
    console.log(`📊 ${slides.length} slide(s) trouvé(s)`)
    
    // Collections d'images par thématique
    const imageCollections = {
      consultation: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Consultation professionnelle',
          description: 'Services de conseil et consultation',
          alt: 'Équipe en consultation'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Stratégie business',
          description: 'Accompagnement stratégique',
          alt: 'Session de stratégie'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Innovation',
          description: 'Solutions innovantes et créatives',
          alt: 'Équipe collaborative'
        }
      ],
      development: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Développement web',
          description: 'Création de sites web modernes',
          alt: 'Code de développement web'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Programmation',
          description: 'Solutions techniques avancées',
          alt: 'Développeur au travail'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Technologies modernes',
          description: 'Stack technique à jour',
          alt: 'Technologies web'
        }
      ],
      formation: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Formation professionnelle',
          description: 'Apprentissage et développement',
          alt: 'Session de formation'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Travail d\'équipe',
          description: 'Collaboration et apprentissage',
          alt: 'Équipe en formation'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Éducation',
          description: 'Formation continue et excellence',
          alt: 'Environnement d\'apprentissage'
        }
      ],
      maintenance: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Support technique',
          description: 'Assistance et maintenance',
          alt: 'Support informatique'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Infrastructure',
          description: 'Gestion d\'infrastructure IT',
          alt: 'Infrastructure technique'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
          title: 'Monitoring',
          description: 'Surveillance et optimisation',
          alt: 'Monitoring système'
        }
      ]
    }
    
    // Ajouter des images pour chaque slide
    let totalImagesAdded = 0
    
    for (const slide of slides) {
      console.log(`\n🎯 Traitement du slide: "${slide.title}"`)
      
      // Déterminer la collection d'images en fonction du titre
      let images = []
      const titleLower = slide.title.toLowerCase()
      
      if (titleLower.includes('consultation')) {
        images = imageCollections.consultation
      } else if (titleLower.includes('développement') || titleLower.includes('web')) {
        images = imageCollections.development
      } else if (titleLower.includes('formation')) {
        images = imageCollections.formation
      } else if (titleLower.includes('maintenance')) {
        images = imageCollections.maintenance
      } else {
        // Images par défaut pour les autres cas
        images = imageCollections.consultation
      }
      
      // Vérifier si des images existent déjà
      const existingImages = await prisma.heroSlideImage.findMany({
        where: { heroSlideId: slide.id }
      })
      
      if (existingImages.length > 0) {
        console.log(`📋 ${existingImages.length} image(s) déjà présente(s) - Mise à jour...`)
        await prisma.heroSlideImage.deleteMany({
          where: { heroSlideId: slide.id }
        })
      }
      
      // Ajouter les nouvelles images
      for (let i = 0; i < images.length; i++) {
        await prisma.heroSlideImage.create({
          data: {
            heroSlideId: slide.id,
            ...images[i],
            order: i + 1,
            isActive: true
          }
        })
        totalImagesAdded++
      }
      
      // Activer le diaporama pour ce slide
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: {
          slideshowEnabled: true,
          slideshowDuration: 5000, // 5 secondes
          slideshowTransition: 'fade',
          overlayOpacity: 40
        }
      })
      
      console.log(`✅ ${images.length} image(s) ajoutée(s) pour "${slide.title}"`)
    }
    
    console.log(`\n🎉 Total: ${totalImagesAdded} images ajoutées avec succès !`)
    console.log('🎬 Diaporama activé pour tous les slides avec transition "fade" (5 secondes)')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedHeroSlideImages()



