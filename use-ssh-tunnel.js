const fs = require('fs');

console.log('🔧 Configuration pour utiliser le tunnel SSH...\n');

const TUNNEL_URL = 'postgresql://admin:dinyoili%40PJB24@localhost:5433/dinitech-base?schema=public&connect_timeout=30';

// Fichiers à modifier
const files = ['.env', '.env.local'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        
        if (content.includes('DATABASE_URL=')) {
            content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${TUNNEL_URL}"`);
            fs.writeFileSync(file, content);
            console.log(`✅ ${file} mis à jour pour utiliser le tunnel SSH`);
        }
    }
});

console.log('\n📋 Configuration tunnel SSH:');
console.log('   Port local: 5433');
console.log('   Port distant: 5432');
console.log('   Via: SSH tunnel');
console.log('\n✅ Configuration terminée !');
console.log('\n📝 Prochaines étapes:');
console.log('   1. Ouvrez une nouvelle fenêtre de terminal');
console.log('   2. Exécutez: start-ssh-tunnel.bat');
console.log('   3. Laissez le tunnel ouvert');
console.log('   4. Dans ce terminal, exécutez:');
console.log('      npx prisma db push');
console.log('      npx prisma generate');
console.log('      npm run dev');






