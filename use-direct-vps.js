const fs = require('fs');

// Connexion directe au VPS
const vpsIp = '180.149.199.175';
const password = 'Admin2024PJB';
const database = 'dinitech_base';
const newUrl = `postgresql://admin:${password}@${vpsIp}:5432/${database}?schema=public`;

console.log('🔧 Configuration de la connexion DIRECTE au VPS...\n');

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

console.log('\n📋 Connexion DIRECTE au VPS:');
console.log(`   IP: ${vpsIp}`);
console.log(`   Port: 5432`);
console.log(`   User: admin`);
console.log(`   Password: ${password}`);
console.log(`   Database: ${database}`);
console.log(`   URL: ${newUrl}`);
console.log('\n✅ Configuration terminée !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');






