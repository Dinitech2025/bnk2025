const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Configuration de la base de données VPS...\n');

// Informations VPS
const VPS_IP = '180.149.199.175';
const PG_USER = 'postgres';
const PG_PASSWORD = 'dinyoili@PJB24';
const PG_PORT = '5432';
const DB_NAME = 'dinitech-base';

// Construire l'URL de connexion
const DATABASE_URL = `postgresql://${PG_USER}:${encodeURIComponent(PG_PASSWORD)}@${VPS_IP}:${PG_PORT}/${DB_NAME}?schema=public&connect_timeout=30`;

// Générer un secret NextAuth aléatoire
const NEXTAUTH_SECRET = crypto.randomBytes(32).toString('base64');

// Contenu du fichier .env.local
const envContent = `# Base de données VPS PostgreSQL
DATABASE_URL="${DATABASE_URL}"

# NextAuth
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Variables d'environnement supplémentaires
NODE_ENV="development"
`;

// Chemin du fichier
const envPath = path.join(__dirname, '.env.local');

// Écrire le fichier
try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env.local créé avec succès!');
  console.log('\n📋 Configuration:');
  console.log(`   - IP VPS: ${VPS_IP}`);
  console.log(`   - Database: ${DB_NAME}`);
  console.log(`   - Port: ${PG_PORT}`);
  console.log(`   - User: ${PG_USER}`);
  console.log('\n⚠️  IMPORTANT: Le mot de passe contient des caractères spéciaux (@)');
  console.log('   Il a été correctement encodé dans l\'URL de connexion.\n');
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier:', error.message);
  process.exit(1);
}

console.log('📝 Prochaines étapes:\n');
console.log('   1. Vérifiez que PostgreSQL sur le VPS accepte les connexions distantes');
console.log('   2. Exécutez: npx prisma generate');
console.log('   3. Exécutez: npx prisma db push');
console.log('   4. Exécutez: npm run dev\n');






