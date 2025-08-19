const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugHeroComponents() {
  try {
    console.log('🔍 Debug des composants héro...')
    
    // 1. Vérifier les slides dans la DB
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    console.log(`📊 Slides actifs en DB: ${slides.length}`)
    
    if (slides.length > 0) {
      console.log('📋 Premier slide:')
      console.log(`   - ID: ${slides[0].id}`)
      console.log(`   - Titre: ${slides[0].title}`)
      console.log(`   - Active: ${slides[0].isActive}`)
      console.log(`   - Ordre: ${slides[0].order}`)
    }
    
    // 2. Simuler l'API publique
    console.log('\n🌐 Test de l\'API publique simulée...')
    const apiSlides = slides.map(slide => ({
      id: slide.id,
      title: slide.title,
      description: slide.description,
      image: slide.image,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      isActive: slide.isActive,
      order: slide.order
    }))
    
    console.log(`📤 API retournerait: ${apiSlides.length} slides`)
    
    // 3. Vérifier la bannière
    const banner = await prisma.heroBanner.findFirst({
      where: { isActive: true }
    })
    
    console.log(`\n🎨 Bannière active: ${banner ? 'OUI' : 'NON'}`)
    if (banner) {
      console.log(`   - ID: ${banner.id}`)
      console.log(`   - Titre: ${banner.title}`)
    }
    
    // 4. Debug du rendu conditionnel
    console.log('\n🎯 Analyse du rendu:')
    console.log(`   - heroSlides.length: ${apiSlides.length}`)
    console.log(`   - heroSlides.length > 0: ${apiSlides.length > 0}`)
    console.log(`   - Condition pour afficher: ${apiSlides.length > 0 ? 'VRAI ✅' : 'FAUX ❌'}`)
    
    // 5. Créer un slide de test très simple si nécessaire
    if (slides.length === 0) {
      console.log('\n🔧 Création d\'un slide de test...')
      await prisma.heroSlide.create({
        data: {
          title: 'Test Slide',
          description: 'Slide de test pour debug',
          image: 'https://images.unsplash.com/photo-1560472354-b33ff37d1306?w=800&h=400&fit=crop',
          buttonText: 'Test',
          buttonLink: '/test',
          isActive: true,
          order: 1
        }
      })
      console.log('✅ Slide de test créé')
    }
    
  } catch (error) {
    console.error('❌ Erreur debug:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugHeroComponents()
