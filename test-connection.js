const net = require('net');

console.log('🔍 Test de connexion au VPS PostgreSQL...\n');

const host = '180.149.199.175';
const port = 5432;

console.log(`📋 Test: ${host}:${port}\n`);

const client = new net.Socket();

client.connect(port, host, () => {
    console.log('✅ Connexion réussie ! Le port 5432 est ouvert et accessible');
    console.log('✅ PostgreSQL devrait être accessible');
    client.end();
});

client.on('error', (error) => {
    console.log('❌ Erreur de connexion:', error.message);
    console.log('');
    console.log('📝 Problèmes possibles:');
    console.log('   - PostgreSQL n\'écoute pas sur 0.0.0.0');
    console.log('   - Le firewall bloque le port 5432');
    console.log('   - Docker n\'expose pas le port correctement');
    console.log('');
    console.log('🔧 Solutions:');
    console.log('   1. Vérifiez que PostgreSQL écoute sur 0.0.0.0:5432');
    console.log('   2. Vérifiez le firewall sur le VPS');
    console.log('   3. Redémarrez le conteneur PostgreSQL');
});

client.on('timeout', () => {
    console.log('⏱️ Timeout: Le serveur ne répond pas');
    client.end();
});






