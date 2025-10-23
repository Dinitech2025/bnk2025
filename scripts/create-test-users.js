const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUsers() {
  console.log('🔧 Création des utilisateurs de test...\n')

  try {
    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await prisma.user.count()
    console.log(`📊 Nombre d'utilisateurs existants: ${existingUsers}`)

    // Créer un admin si aucun n'existe
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    let admin
    if (!adminExists) {
      console.log('\n👤 Création d\'un utilisateur ADMIN...')
      const hashedPassword = await bcrypt.hash('Admin@2024', 10)
      
      admin = await prisma.user.create({
        data: {
          email: 'admin@boutiknaka.com',
          password: hashedPassword,
          name: 'Administrateur',
          firstName: 'Admin',
          lastName: 'BoutikNaka',
          role: 'ADMIN',
          emailVerified: new Date(),
        }
      })
      console.log(`✅ Admin créé: ${admin.email} (ID: ${admin.id})`)
      console.log(`   Mot de passe: Admin@2024`)
    } else {
      admin = adminExists
      console.log(`\n✅ Admin existant: ${admin.email} (ID: ${admin.id})`)
    }

    // Créer un client si aucun n'existe
    const clientExists = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    })

    let client
    if (!clientExists) {
      console.log('\n👤 Création d\'un utilisateur CLIENT...')
      const hashedPassword = await bcrypt.hash('Client@2024', 10)
      
      client = await prisma.user.create({
        data: {
          email: 'client@test.com',
          password: hashedPassword,
          name: 'Client Test',
          firstName: 'Client',
          lastName: 'Test',
          role: 'CLIENT',
          emailVerified: new Date(),
        }
      })
      console.log(`✅ Client créé: ${client.email} (ID: ${client.id})`)
      console.log(`   Mot de passe: Client@2024`)
    } else {
      client = clientExists
      console.log(`\n✅ Client existant: ${client.email} (ID: ${client.id})`)
    }

    console.log('\n✨ Utilisateurs de test prêts!')
    console.log('\n📋 Résumé:')
    console.log(`   Admin: ${admin.email} (ID: ${admin.id})`)
    console.log(`   Client: ${client.email} (ID: ${client.id})`)

    return { admin, client }

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()

