const fs = require('fs');
const path = require('path');

console.log('🔧 Correction de la DATABASE_URL...\n');

// Nouvelle URL VPS
const VPS_IP = '180.149.199.175';
const PG_USER = 'postgres';
const PG_PASSWORD = 'dinyoili@PJB24';
const PG_PORT = '5432';
const DB_NAME = 'dinitech-base';

const NEW_DATABASE_URL = `postgresql://${PG_USER}:${encodeURIComponent(PG_PASSWORD)}@${VPS_IP}:${PG_PORT}/${DB_NAME}?schema=public&connect_timeout=30`;

// Chemins des fichiers
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

// Fonction pour remplacer DATABASE_URL dans un fichier
function replaceDatabaseUrl(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier ${path.basename(filePath)} n'existe pas`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remplacer DATABASE_URL
    if (content.includes('DATABASE_URL=')) {
      content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${NEW_DATABASE_URL}"`);
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.basename(filePath)} mis à jour`);
      return true;
    } else {
      console.log(`⚠️  DATABASE_URL non trouvé dans ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

// Remplacer dans les deux fichiers
console.log('📝 Mise à jour des fichiers d\'environnement:\n');
replaceDatabaseUrl(envPath);
replaceDatabaseUrl(envLocalPath);

console.log('\n✅ Configuration terminée!');
console.log('\n📋 Nouvelle URL de connexion:');
console.log(`   postgresql://${PG_USER}:****@${VPS_IP}:${PG_PORT}/${DB_NAME}\n`);
console.log('🚀 Prochaines étapes:');
console.log('   1. npx prisma generate');
console.log('   2. npx prisma db push');
console.log('   3. npm run dev\n');






