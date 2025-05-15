import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Initialisation de la base de données Netlify...')

  try {
    // Supprimer les utilisateurs existants
    await prisma.user.deleteMany()
    console.log('✅ Base de données nettoyée')

    // Créer l'administrateur
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@boutiknaka.com',
        name: 'Admin',
        firstName: 'Admin',
        lastName: 'System',
        password: adminPassword,
        role: 'ADMIN',
        preferredLanguage: 'fr',
        customerType: 'INDIVIDUAL',
      },
    })
    console.log('✅ Administrateur créé:', admin.email)

    // Créer le staff
    const staffPassword = await bcrypt.hash('staff123', 12)
    const staff = await prisma.user.create({
      data: {
        email: 'staff@boutiknaka.com',
        name: 'Staff',
        firstName: 'Staff',
        lastName: 'Member',
        password: staffPassword,
        role: 'STAFF',
        preferredLanguage: 'fr',
        customerType: 'INDIVIDUAL',
      },
    })
    console.log('✅ Staff créé:', staff.email)

    // Créer le client test
    const clientPassword = await bcrypt.hash('client123', 12)
    const client = await prisma.user.create({
      data: {
        email: 'client@example.com',
        name: 'Client',
        firstName: 'John',
        lastName: 'Doe',
        password: clientPassword,
        role: 'CLIENT',
        preferredLanguage: 'fr',
        customerType: 'INDIVIDUAL',
      },
    })
    console.log('✅ Client créé:', client.email)

    console.log('✨ Initialisation terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 