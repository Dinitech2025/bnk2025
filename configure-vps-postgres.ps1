# Script PowerShell pour configurer PostgreSQL sur le VPS

Write-Host "🚀 Configuration de PostgreSQL sur le VPS..." -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "180.149.199.175"
$VPS_USER = "root"
$VPS_PASSWORD = "X0D8i6O6b7u1m9m"
$DB_NAME = "dinitech-base"

Write-Host "📋 Informations:" -ForegroundColor Yellow
Write-Host "   - IP: $VPS_IP"
Write-Host "   - Database: $DB_NAME"
Write-Host ""

# Commandes à exécuter sur le VPS
$commands = @"
echo '1️⃣ Recherche du conteneur PostgreSQL...'
POSTGRES_CONTAINER=`$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)

if [ -z "`$POSTGRES_CONTAINER" ]; then
    echo '❌ Aucun conteneur PostgreSQL trouvé'
    docker ps -a | grep postgres
    exit 1
fi

echo '✅ Conteneur trouvé:' `$POSTGRES_CONTAINER
echo ''

echo '2️⃣ Création de la base de données si nécessaire...'
docker exec `$POSTGRES_CONTAINER psql -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME
if [ `$? -ne 0 ]; then
    docker exec `$POSTGRES_CONTAINER psql -U postgres -c 'CREATE DATABASE \"$DB_NAME\";'
    echo '✅ Base de données créée'
else
    echo '✅ Base de données existe déjà'
fi
echo ''

echo '3️⃣ Configuration de l'\''accès distant...'
docker exec `$POSTGRES_CONTAINER bash -c "grep -q \"listen_addresses = '\*'\" /var/lib/postgresql/data/postgresql.conf || echo \"listen_addresses = '*'\" >> /var/lib/postgresql/data/postgresql.conf"
docker exec `$POSTGRES_CONTAINER bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" /var/lib/postgresql/data/pg_hba.conf || echo \"host all all 0.0.0.0/0 md5\" >> /var/lib/postgresql/data/pg_hba.conf"
echo '✅ Configuration mise à jour'
echo ''

echo '4️⃣ Redémarrage de PostgreSQL...'
docker restart `$POSTGRES_CONTAINER
sleep 3
echo '✅ PostgreSQL redémarré'
echo ''

echo '5️⃣ Configuration du firewall...'
if command -v ufw &> /dev/null; then
    ufw allow 5432/tcp 2>/dev/null || echo 'ufw déjà configuré'
    echo '✅ Port 5432 ouvert avec ufw'
elif command -v iptables &> /dev/null; then
    iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>/dev/null || echo 'iptables déjà configuré'
    echo '✅ Port 5432 ouvert avec iptables'
fi
echo ''

echo '6️⃣ Vérification...'
netstat -tuln | grep 5432 || ss -tuln | grep 5432
echo ''
echo '✅ Configuration terminée!'
"@

Write-Host "🔧 Connexion au VPS et configuration..." -ForegroundColor Cyan
Write-Host ""

# Utiliser plink (PuTTY) si disponible, sinon ssh
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo y | plink -ssh -pw $VPS_PASSWORD $VPS_USER@$VPS_IP $commands
} elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
    $commands | ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP
} else {
    Write-Host "❌ Erreur: ni ssh ni plink (PuTTY) ne sont installés" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Installez OpenSSH ou PuTTY:" -ForegroundColor Yellow
    Write-Host "   - OpenSSH: Paramètres > Applications > Fonctionnalités facultatives > OpenSSH Client"
    Write-Host "   - PuTTY: https://www.putty.org/"
    exit 1
}

Write-Host ""
Write-Host "🎉 Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test de connexion..." -ForegroundColor Cyan
npx prisma db push --skip-generate

Write-Host ""
Write-Host "✅ Si la connexion fonctionne, exécutez:" -ForegroundColor Green
Write-Host "   npx prisma generate"
Write-Host "   npm run dev"
Write-Host ""






