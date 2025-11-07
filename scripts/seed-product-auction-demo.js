const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProductAuctionDemo() {
  console.log('🔨 Création d\'un produit en ENCHÈRE pour démonstration...\n')

  try {
    // Vérifier/créer catégorie démo
    let demoCategory = await prisma.productCategory.findFirst({
      where: { slug: 'demo-tarification' }
    })

    if (!demoCategory) {
      demoCategory = await prisma.productCategory.create({
        data: {
          name: 'Démo Tarification',
          slug: 'demo-tarification',
          description: 'Produits de démonstration',
          isVisible: true
        }
      })
    }

    // Calculer la date de fin de l'enchère (dans 3 jours)
    const auctionEndDate = new Date()
    auctionEndDate.setDate(auctionEndDate.getDate() + 3)

    // Créer le produit en enchère
    const auctionProduct = await prisma.product.upsert({
      where: { slug: 'console-gaming-rare-demo' },
      update: {},
      create: {
        name: 'Console Gaming Rare [ENCHÈRE]',
        slug: 'console-gaming-rare-demo',
        description: `🔨 Produit en ENCHÈRE - Système d'offres en temps réel

**Enchère en cours !**

Console de jeu rare en édition limitée. Placez votre offre et remportez cette pièce de collection !

### Caractéristiques :
- Édition limitée collector
- État neuf, scellé d'origine
- Accessoires inclus
- Certificat d'authenticité
- Garantie constructeur

### Comment enchérir ?
1. Consultez l'offre actuelle
2. Placez une offre supérieure
3. Soyez notifié si surenchéri
4. Le plus offrant remporte !

### Règles de l'enchère :
- Incréments minimum : 1000 Ar
- Offres fermes et irrévocables
- Fin de l'enchère : ${auctionEndDate.toLocaleString('fr-FR')}
- Paiement sous 48h après attribution`,
        price: 500000, // Prix de base (pas utilisé pour les enchères)
        sku: 'DEMO-AUCTION-001',
        inventory: 1, // Unique
        categoryId: demoCategory.id,
        published: true,
        featured: true,
        pricingType: 'AUCTION',
        minimumBid: 450000, // Mise de départ
        currentHighestBid: 500000, // Première offre simulée
        auctionEndDate: auctionEndDate,
        requiresQuote: false,
        autoAcceptNegotiation: false
      }
    })

    console.log('✅ Produit en ENCHÈRE créé avec succès !')
    console.log('\n📦 Détails du produit :')
    console.log(`   Nom : ${auctionProduct.name}`)
    console.log(`   Type : ENCHÈRE`)
    console.log(`   Mise minimum : ${auctionProduct.minimumBid?.toString()} Ar`)
    console.log(`   Offre actuelle : ${auctionProduct.currentHighestBid?.toString()} Ar`)
    console.log(`   Fin de l'enchère : ${auctionProduct.auctionEndDate?.toLocaleString('fr-FR')}`)
    console.log(`   Temps restant : ~${Math.ceil((new Date(auctionProduct.auctionEndDate) - new Date()) / (1000 * 60 * 60))} heures`)

    // Créer quelques offres simulées (optionnel)
    console.log('\n💰 Création d\'offres simulées...')
    
    // Chercher ou créer des utilisateurs de test
    const testUsers = []
    for (let i = 1; i <= 3; i++) {
      let user = await prisma.user.findFirst({
        where: { email: `encheretest${i}@demo.com` }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: `encheretest${i}@demo.com`,
            name: `Enchérisseur Test ${i}`,
            role: 'CLIENT'
          }
        })
      }
      testUsers.push(user)
    }

    // Créer des offres de test
    const bids = [
      { amount: 460000, message: 'Première offre !', userId: testUsers[0].id },
      { amount: 480000, message: 'Je surenchéris', userId: testUsers[1].id },
      { amount: 500000, message: 'Offre sérieuse', userId: testUsers[2].id, isWinning: true }
    ]

    for (const bidData of bids) {
      await prisma.bid.create({
        data: {
          productId: auctionProduct.id,
          userId: bidData.userId,
          amount: bidData.amount,
          message: bidData.message,
          status: bidData.isWinning ? 'PENDING' : 'OUTBID',
          isWinning: bidData.isWinning || false
        }
      })
    }

    console.log(`   ✅ ${bids.length} offres créées`)

    console.log('\n' + '='.repeat(60))
    console.log('✨ PRODUIT EN ENCHÈRE CRÉÉ AVEC SUCCÈS !')
    console.log('='.repeat(60))
    console.log('\n🎯 ACCÈS :')
    console.log(`   Admin : http://localhost:3000/admin/products`)
    console.log(`   Site  : http://localhost:3000/products/${auctionProduct.id}`)
    console.log('\n💡 FONCTIONNALITÉS :')
    console.log('   ✅ Timer en temps réel')
    console.log('   ✅ Système d\'offres')
    console.log('   ✅ Notifications de surenchère')
    console.log('   ✅ Badge "Enchère" sur les cartes')
    console.log('   ✅ Interface dédiée')
    console.log('\n🔥 TESTEZ :')
    console.log('   1. Consultez le produit sur le site')
    console.log('   2. Placez une offre supérieure à 500 000 Ar')
    console.log('   3. Observez le timer décompter')
    console.log('   4. Vérifiez les offres dans l\'admin')

  } catch (error) {
    console.error('❌ Erreur :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedProductAuctionDemo()
  .then(() => {
    console.log('\n🎉 Script terminé !\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error)
    process.exit(1)
  })



