const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAllTestPasswords() {
  try {
    console.log('🔧 Correction des mots de passe pour tous les utilisateurs de test...');
    
    const testUsers = [
      'admin@test.com',
      'staff@test.com', 
      'client@test.com'
    ];

    const newHash = await bcrypt.hash('test123', 12);
    console.log('🔑 Nouveau hash généré pour test123');

    for (const email of testUsers) {
      try {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: { password: newHash },
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true
          }
        });
        
        console.log(`✅ ${email} (${updatedUser.role}) - Mot de passe mis à jour`);
        
        // Vérifier le mot de passe
        const user = await prisma.user.findUnique({
          where: { email },
          select: { password: true }
        });
        
        const isValid = await bcrypt.compare('test123', user.password);
        console.log(`   🔑 Vérification: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
        
      } catch (error) {
        console.log(`❌ Erreur pour ${email}:`, error.message);
      }
    }

    console.log('\n🎉 Correction terminée !');
    console.log('\n📋 Identifiants de test mis à jour:');
    console.log('👨‍💼 Admin: admin@test.com / test123');
    console.log('👥 Staff: staff@test.com / test123');
    console.log('👤 Client: client@test.com / test123');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllTestPasswords();


