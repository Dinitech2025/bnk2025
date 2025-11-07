const { Client } = require('pg');

console.log('🔍 Test de connexion PostgreSQL...\n');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'dinitech-base',
  user: 'admin',
  password: 'dinyoili@PJB24',
});

client.connect()
  .then(() => {
    console.log('✅ Connexion réussie !');
    return client.query('SELECT version();');
  })
  .then(result => {
    console.log('📋 Version PostgreSQL:', result.rows[0].version);
    return client.query('SELECT current_database();');
  })
  .then(result => {
    console.log('📋 Base de données:', result.rows[0].current_database);
    console.log('\n🎉 La connexion fonctionne parfaitement !');
    console.log('\n📝 Vous pouvez maintenant exécuter:');
    console.log('   npx prisma db push');
    console.log('   npx prisma generate');
    console.log('   npm run dev');
    client.end();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion:', err.message);
    console.log('\n📝 Vérifiez:');
    console.log('   1. Le tunnel SSH est-il actif ?');
    console.log('   2. Le mot de passe est-il correct ?');
    console.log('   3. La base de données existe-t-elle ?');
    client.end();
  });






