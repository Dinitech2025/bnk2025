const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cancelQuoteAndVerifyDB() {
  try {
    console.log('🔍 Vérification de la connexion à la base de données...\n');

    // 1. Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie\n');

    // 2. Récupérer tous les devis
    console.log('📋 Récupération des devis...');
    const quotes = await prisma.quote.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        },
        messages: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${quotes.length} devis trouvé(s)\n`);

    if (quotes.length === 0) {
      console.log('ℹ️  Aucun devis à annuler\n');
    } else {
      // Afficher les devis
      console.log('📊 Liste des devis :');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      quotes.forEach((quote, index) => {
        console.log(`${index + 1}. ID: ${quote.id}`);
        console.log(`   Client: ${quote.user.name} (${quote.user.email})`);
        console.log(`   Service: ${quote.service.name}`);
        console.log(`   Statut: ${quote.status}`);
        console.log(`   Budget: ${quote.budget ? quote.budget + '€' : 'Non spécifié'}`);
        console.log(`   Messages: ${quote.messages.length}`);
        console.log(`   Créé le: ${quote.createdAt.toLocaleDateString('fr-FR')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });

      // Annuler tous les devis PENDING
      console.log('\n🚫 Annulation des devis PENDING...');
      const pendingQuotes = quotes.filter(q => q.status === 'PENDING');
      
      if (pendingQuotes.length > 0) {
        for (const quote of pendingQuotes) {
          await prisma.quote.update({
            where: { id: quote.id },
            data: { status: 'REJECTED' }
          });
          console.log(`✅ Devis ${quote.id} annulé`);
        }
        console.log(`\n✅ ${pendingQuotes.length} devis annulé(s)`);
      } else {
        console.log('ℹ️  Aucun devis PENDING à annuler');
      }
    }

    // 3. Vérifier les messages
    console.log('\n💬 Vérification du système de messages...');
    
    const conversations = await prisma.conversation.count();
    const messages = await prisma.message.count();
    const quoteMessages = await prisma.quoteMessage.count();
    
    console.log(`✅ Conversations: ${conversations}`);
    console.log(`✅ Messages (nouveau système): ${messages}`);
    console.log(`✅ QuoteMessages (ancien système): ${quoteMessages}`);

    // 4. Vérifier les utilisateurs
    console.log('\n👥 Vérification des utilisateurs...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s)`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    // 5. Statistiques générales
    console.log('\n📊 Statistiques de la base de données :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const stats = {
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      services: await prisma.service.count(),
      orders: await prisma.order.count(),
      quotes: await prisma.quote.count(),
      conversations: conversations,
      messages: messages,
      quoteMessages: quoteMessages
    };

    Object.entries(stats).forEach(([key, value]) => {
      console.log(`${key.padEnd(20)}: ${value}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🎉 Vérification terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cancelQuoteAndVerifyDB();



