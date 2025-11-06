const fs = require('fs');

console.log('🔧 Correction des fichiers .env...\n');

const NEW_URL = 'postgresql://admin:dinyoili%40PJB24@180.149.199.175:5432/dinitech-base?schema=public&connect_timeout=30';

// Fichiers à corriger
const files = ['.env', '.env.local'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        
        // Remplacer l'URL
        if (content.includes('DATABASE_URL=')) {
            content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${NEW_URL}"`);
            fs.writeFileSync(file, content);
            console.log(`✅ ${file} mis à jour`);
        } else {
            console.log(`⚠️  DATABASE_URL non trouvé dans ${file}`);
        }
    } else {
        console.log(`⚠️  ${file} n'existe pas`);
    }
});

console.log('\n📋 Nouvelle configuration:');
console.log('   Utilisateur: admin');
console.log('   Mot de passe: dinyoili@PJB24');
console.log('   Base: dinitech-base');
console.log('   Host: 180.149.199.175:5432');
console.log('\n✅ Configuration terminée !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');
console.log('   npx prisma generate');
console.log('   npm run dev');






