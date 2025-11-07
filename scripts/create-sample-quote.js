const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleQuote() {
  try {
    console.log('🎯 Création d\'un devis exemple : 2499€ - 6kg\n');

    // 1. Trouver ou créer un client
    let client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!client) {
      console.log('📝 Création d\'un client de test...');
      client = await prisma.user.create({
        data: {
          name: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          role: 'CLIENT',
          phone: '+33612345678',
          customerType: 'INDIVIDUAL'
        }
      });
      console.log('✅ Client créé:', client.email);
    } else {
      console.log('✅ Client trouvé:', client.email);
    }

    // 2. Trouver ou créer un service nécessitant un devis
    let service = await prisma.service.findFirst({
      where: { 
        requiresQuote: true,
        published: true
      }
    });

    if (!service) {
      console.log('📝 Création d\'un service nécessitant un devis...');
      
      // Trouver ou créer une catégorie
      let category = await prisma.serviceCategory.findFirst();
      if (!category) {
        category = await prisma.serviceCategory.create({
          data: {
            name: 'Services Personnalisés',
            slug: 'services-personnalises',
            description: 'Services nécessitant un devis personnalisé'
          }
        });
      }

      service = await prisma.service.create({
        data: {
          name: 'Transport International de Matériel Informatique',
          slug: 'transport-international-materiel-informatique',
          description: 'Service de transport sécurisé pour matériel informatique à l\'international. Prix selon destination et poids.',
          price: 0, // Prix indicatif, nécessite un devis
          duration: 5, // 5 jours ouvrés
          categoryId: category.id,
          published: true,
          pricingType: 'QUOTE_REQUIRED',
          requiresQuote: true,
          minPrice: 500,
          maxPrice: 5000
        }
      });
      console.log('✅ Service créé:', service.name);
    } else {
      console.log('✅ Service trouvé:', service.name);
    }

    // 3. Créer le devis
    console.log('\n📋 Création du devis...');
    const quote = await prisma.quote.create({
      data: {
        userId: client.id,
        serviceId: service.id,
        description: `Demande de transport international pour matériel informatique :
        
📦 Détails de la demande :
- Poids total : 6 kg
- Type de matériel : Ordinateurs portables et accessoires
- Destination : France → Madagascar
- Emballage : Carton renforcé avec protection anti-choc
- Assurance : Valeur déclarée 2499€
- Délai souhaité : Standard (5-7 jours ouvrés)

📍 Informations complémentaires :
- Besoin de suivi en temps réel
- Livraison en main propre souhaitée
- Matériel fragile nécessitant une attention particulière`,
        budget: 2499.00,
        status: 'PENDING',
        attachments: []
      },
      include: {
        user: true,
        service: true
      }
    });

    console.log('✅ Devis créé avec succès !');
    console.log('\n📊 Détails du devis :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID du devis      : ${quote.id}`);
    console.log(`Client           : ${quote.user.name} (${quote.user.email})`);
    console.log(`Service          : ${quote.service.name}`);
    console.log(`Budget client    : ${quote.budget}€`);
    console.log(`Poids            : 6 kg`);
    console.log(`Statut           : ${quote.status}`);
    console.log(`Date de création : ${quote.createdAt.toLocaleString('fr-FR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 4. Ajouter un message initial du client
    console.log('\n💬 Ajout d\'un message initial...');
    const message = await prisma.quoteMessage.create({
      data: {
        quoteId: quote.id,
        senderId: client.id,
        message: `Bonjour,

Je souhaite obtenir un devis pour le transport de matériel informatique d'une valeur de 2499€ et pesant 6kg.

Il s'agit de :
- 2 ordinateurs portables professionnels
- Accessoires (souris, claviers, câbles)
- Matériel sensible nécessitant un emballage sécurisé

Destination : Antananarivo, Madagascar
Départ : Paris, France

Pourriez-vous me proposer un tarif avec assurance complète ?

Merci d'avance,
Cordialement`,
        attachments: []
      }
    });

    console.log('✅ Message initial ajouté');

    // 5. Créer une conversation unifiée pour ce devis
    console.log('\n💬 Création de la conversation unifiée...');
    const conversation = await prisma.conversation.create({
      data: {
        title: `Devis: ${service.name}`,
        participants: [client.id], // L'admin sera ajouté lors de la première réponse
        isActive: true,
        lastMessageAt: new Date()
      }
    });

    // Créer le message unifié
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        fromUserId: client.id,
        toUserId: null, // Vers l'équipe admin
        subject: `Demande de devis - ${service.name}`,
        content: message.message,
        type: 'QUOTE_DISCUSSION',
        status: 'UNREAD',
        priority: 'NORMAL',
        relatedQuoteId: quote.id,
        metadata: {
          originalQuoteMessageId: message.id,
          budget: 2499,
          weight: '6kg',
          serviceId: service.id
        }
      }
    });

    console.log('✅ Conversation unifiée créée');

    console.log('\n🎉 Devis exemple créé avec succès !');
    console.log('\n📱 Vous pouvez maintenant :');
    console.log('1. Consulter le devis dans l\'admin : /admin/quotes');
    console.log('2. Répondre au client avec une proposition de prix');
    console.log('3. Voir la conversation dans : /admin/messages');
    console.log(`\n🔗 Lien direct : /admin/quotes/${quote.id}`);

    return quote;

  } catch (error) {
    console.error('❌ Erreur lors de la création du devis:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSampleQuote()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });





