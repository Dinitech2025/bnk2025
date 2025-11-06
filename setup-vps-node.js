const { execSync } = require('child_process');

console.log('🚀 Configuration du VPS PostgreSQL...\n');

const VPS_IP = '180.149.199.175';
const VPS_USER = 'root';
const VPS_PASS = 'X0D8i6O6b7u1m9m';

const plinkPath = '"C:\\Program Files\\PuTTY\\plink.exe"';

console.log('📋 Informations:');
console.log(`   IP: ${VPS_IP}`);
console.log(`   User: ${VPS_USER}`);
console.log('   Database: dinitech-base\n');

// Commandes à exécuter
const commands = [
    'echo "🚀 Configuration PostgreSQL..."',
    'docker ps | grep postgres',
    'PG_CONF=$(docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1)',
    'PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2>/dev/null | head -1)',
    'echo "✅ Config trouvé: $PG_CONF"',
    'docker exec postgres bash -c "echo \\"listen_addresses = \'*\'\\" >> \\"$PG_CONF\\""',
    'docker exec postgres bash -c "echo \\"host all all 0.0.0.0/0 md5\\" >> \\"$PG_HBA\\""',
    'docker restart postgres',
    'sleep 3',
    'iptables -A INPUT -p tcp --dport 5432 -j ACCEPT',
    'echo "✅ Configuration terminée!"',
    'docker exec postgres netstat -tuln | grep 5432 || docker exec postgres ss -tuln | grep 5432'
];

let fullCommand = '';
commands.forEach(cmd => {
    fullCommand += cmd + ' && ';
});
fullCommand = fullCommand.slice(0, -4); // Retirer le dernier " && "

try {
    console.log('🔧 Exécution des commandes...\n');

    execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "${fullCommand}"`, {
        stdio: 'inherit',
        timeout: 60000
    });

    console.log('\n✅ Configuration VPS terminée !');
    console.log('\n🧪 Test de connexion à la base de données...');

    execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        timeout: 30000
    });

    console.log('\n✅ Connexion réussie !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. npx prisma generate');
    console.log('   2. npm run dev');
    console.log('\n🎉 Votre application va maintenant fonctionner !');

} catch (error) {
    console.log('\n❌ Erreur lors de la configuration:');
    console.log(error.message);
    console.log('\n📝 Vous pouvez exécuter les commandes manuellement:');
    console.log(`   ssh ${VPS_USER}@${VPS_IP}`);
    console.log('   Puis copiez-collez les commandes depuis COMMANDES-VPS-FINALES.md\n');
}






