const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données des services par catégorie (prix en Ariary - MGA, durée en minutes)
const servicesByCategory = {
  'reparation': [
    {
      name: 'Réparation smartphone',
      description: 'Réparation complète de smartphones : écran cassé, batterie, boutons, etc.',
      price: 50000,
      duration: 120, // 2 heures
      imageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500&h=500&fit=crop'
    },
    {
      name: 'Réparation ordinateur portable',
      description: 'Diagnostic et réparation d\'ordinateurs portables, installation de logiciels.',
      price: 80000,
      duration: 180, // 3 heures
      imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&h=500&fit=crop'
    },
    {
      name: 'Réparation électroménager',
      description: 'Réparation et maintenance d\'appareils électroménagers.',
      price: 60000,
      duration: 150, // 2h30
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'
    }
  ],
  'installation': [
    {
      name: 'Installation système d\'exploitation',
      description: 'Installation complète de Windows, Linux ou macOS avec pilotes.',
      price: 35000,
      duration: 90,
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop'
    },
    {
      name: 'Installation logiciels',
      description: 'Installation et configuration de logiciels professionnels.',
      price: 25000,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop'
    },
    {
      name: 'Installation réseau domestique',
      description: 'Configuration de réseau WiFi, routeur et connexion internet.',
      price: 45000,
      duration: 120,
      imageUrl: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=500&h=500&fit=crop'
    }
  ],
  'maintenance': [
    {
      name: 'Nettoyage ordinateur',
      description: 'Nettoyage complet de l\'ordinateur, suppression virus et optimisation.',
      price: 30000,
      duration: 90,
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&h=500&fit=crop'
    },
    {
      name: 'Maintenance préventive',
      description: 'Maintenance préventive complète des équipements informatiques.',
      price: 40000,
      duration: 120,
      imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&h=500&fit=crop'
    }
  ],
  'consultation': [
    {
      name: 'Consultation technique',
      description: 'Conseil et diagnostic technique pour problèmes informatiques.',
      price: 20000,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop'
    },
    {
      name: 'Formation informatique',
      description: 'Formation personnalisée sur logiciels et outils informatiques.',
      price: 35000,
      duration: 120,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=500&fit=crop'
    }
  ],
  'livraison': [
    {
      name: 'Livraison express Antananarivo',
      description: 'Livraison rapide dans Antananarivo en moins de 2 heures.',
      price: 5000,
      duration: 120,
      imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=500&fit=crop'
    },
    {
      name: 'Livraison standard Madagascar',
      description: 'Livraison dans toute l\'île de Madagascar sous 3-5 jours.',
      price: 15000,
      duration: 30, // temps de traitement
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=500&fit=crop'
    }
  ],
  'formation': [
    {
      name: 'Formation bureautique',
      description: 'Formation complète sur Word, Excel, PowerPoint et outils de bureau.',
      price: 80000,
      duration: 240, // 4 heures
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=500&fit=crop'
    },
    {
      name: 'Formation développement web',
      description: 'Initiation au développement web : HTML, CSS, JavaScript.',
      price: 150000,
      duration: 360, // 6 heures
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=500&fit=crop'
    }
  ],
  'design': [
    {
      name: 'Création logo professionnel',
      description: 'Conception de logo personnalisé pour entreprise ou marque.',
      price: 100000,
      duration: 180,
      imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&h=500&fit=crop'
    },
    {
      name: 'Design carte de visite',
      description: 'Design professionnel de cartes de visite avec impression.',
      price: 45000,
      duration: 90,
      imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop'
    }
  ],
  'nettoyage': [
    {
      name: 'Nettoyage domicile',
      description: 'Service de nettoyage complet à domicile.',
      price: 40000,
      duration: 180,
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=500&fit=crop'
    },
    {
      name: 'Nettoyage bureau',
      description: 'Nettoyage professionnel d\'espaces de bureau.',
      price: 60000,
      duration: 240,
      imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&h=500&fit=crop'
    }
  ],
  'transport': [
    {
      name: 'Transport personnel',
      description: 'Service de transport personnel dans Antananarivo.',
      price: 25000,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=500&h=500&fit=crop'
    },
    {
      name: 'Transport marchandises',
      description: 'Transport de marchandises et déménagement.',
      price: 50000,
      duration: 180,
      imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=500&fit=crop'
    }
  ]
};

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function createServices() {
  try {
    console.log('🔍 Vérification des catégories de services...');
    
    // Récupérer les catégories de services existantes
    const categories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    console.log('\n=== CATÉGORIES DE SERVICES DISPONIBLES ===');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id} | Nom: ${cat.name} | Slug: ${cat.slug} | Services existants: ${cat._count.services}`);
    });
    
    if (categories.length === 0) {
      console.log('❌ Aucune catégorie de service trouvée. Veuillez d\'abord créer des catégories de services.');
      return;
    }
    
    console.log('\n🚀 Création des services (prix en Ariary - MGA)...');
    
    let totalCreated = 0;
    
    for (const category of categories) {
      // Nettoyer le slug pour correspondre aux clés de notre objet
      const cleanSlug = category.slug.replace(/-\d+$/, ''); // Enlever les suffixes numériques
      const categoryServices = servicesByCategory[cleanSlug] || [];
      
      if (categoryServices.length === 0) {
        console.log(`⚠️  Pas de services définis pour la catégorie: ${category.name} (slug: ${cleanSlug})`);
        continue;
      }
      
      console.log(`\n🛠️  Création de ${categoryServices.length} services pour "${category.name}":`);
      
      for (const serviceData of categoryServices) {
        try {
          // Vérifier si le service existe déjà
          const existingService = await prisma.service.findFirst({
            where: {
              name: serviceData.name,
              categoryId: category.id
            }
          });
          
          if (existingService) {
            console.log(`   ⏭️  "${serviceData.name}" existe déjà`);
            continue;
          }
          
          const service = await prisma.service.create({
            data: {
              name: serviceData.name,
              slug: generateSlug(serviceData.name),
              description: serviceData.description,
              price: serviceData.price,
              duration: serviceData.duration,
              published: true,
              categoryId: category.id
            },
            include: {
              images: true
            }
          });
          
          // Ajouter l'image si elle n'existe pas déjà
          if (serviceData.imageUrl) {
            await prisma.media.create({
              data: {
                url: serviceData.imageUrl,
                type: 'IMAGE',
                name: `${service.name} - Image`,
                serviceId: service.id
              }
            });
          }
          
          const durationHours = Math.floor(serviceData.duration / 60);
          const durationMinutes = serviceData.duration % 60;
          const durationText = durationHours > 0 ? 
            `${durationHours}h${durationMinutes > 0 ? durationMinutes : ''}` : 
            `${durationMinutes}min`;
          
          console.log(`   ✅ Créé: "${service.name}" - ${service.price.toLocaleString()} Ar (${durationText})`);
          totalCreated++;
          
        } catch (error) {
          console.error(`   ❌ Erreur lors de la création de "${serviceData.name}":`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Création terminée! ${totalCreated} services créés au total.`);
    
    // Afficher le résumé final
    console.log('\n=== RÉSUMÉ FINAL ===');
    const finalCategories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    finalCategories.forEach(cat => {
      console.log(`${cat.name}: ${cat._count.services} services`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createServices(); 