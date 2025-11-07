const fs = require('fs');

// Nouvelle configuration
const password = 'Admin2024PJB';
const database = 'dinitech_base'; // Underscore au lieu de tiret
const newUrl = `postgresql://admin:${password}@localhost:5433/${database}?schema=public`;

console.log('🔧 Mise à jour pour le nouveau container PostgreSQL...\n');

// Mettre à jour .env
if (fs.existsSync('.env')) {
  let envContent = fs.readFileSync('.env', 'utf8');
  envContent = envContent.replace(
    /DATABASE_URL="postgresql:\/\/[^"]+"/g,
    `DATABASE_URL="${newUrl}"`
  );
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env mis à jour');
}

// Mettre à jour .env.local
if (fs.existsSync('.env.local')) {
  let envLocalContent = fs.readFileSync('.env.local', 'utf8');
  envLocalContent = envLocalContent.replace(
    /DATABASE_URL="postgresql:\/\/[^"]+"/g,
    `DATABASE_URL="${newUrl}"`
  );
  fs.writeFileSync('.env.local', envLocalContent);
  console.log('✅ .env.local mis à jour');
}

console.log('\n📋 Nouvelle configuration:');
console.log(`   User: admin`);
console.log(`   Password: ${password}`);
console.log(`   Database: ${database}`);
console.log(`   URL: ${newUrl}`);
console.log('\n✅ Configuration terminée !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');
console.log('   npx prisma generate');
console.log('   npm run dev');






