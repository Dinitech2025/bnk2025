import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding...');

  // Suppression des données existantes
  await prisma.user.deleteMany({});
  
  // Création des utilisateurs de test
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Utilisateur Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@boutiknaka.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Utilisateur admin créé:', admin.email);
  
  // Utilisateur Staff
  const staff = await prisma.user.create({
    data: {
      name: 'Staff',
      email: 'staff@boutiknaka.com',
      password: hashedPassword,
      role: 'STAFF',
    },
  });
  console.log('Utilisateur staff créé:', staff.email);
  
  // Utilisateur Client
  const client = await prisma.user.create({
    data: {
      name: 'Client',
      email: 'client@boutiknaka.com',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  console.log('Utilisateur client créé:', client.email);

  console.log('Seeding terminé!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 