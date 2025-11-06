#!/bin/bash

echo "🚀 Configuration complète de PostgreSQL..."

# Variables
CONTAINER="postgres"
DB_NAME="dinitech-base"

echo "📋 Conteneur: $CONTAINER"
echo "📋 Base de données: $DB_NAME"
echo ""

echo "1️⃣ Exploration du conteneur PostgreSQL..."
docker exec $CONTAINER ls -la /
echo ""

echo "2️⃣ Recherche des fichiers de configuration..."
docker exec $CONTAINER find / -name "*.conf" 2>/dev/null | grep -i postgres
echo ""

echo "3️⃣ Configuration PostgreSQL..."
# Trouver et configurer postgresql.conf
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
if [ -n "$PG_CONF" ]; then
    echo "✅ postgresql.conf trouvé: $PG_CONF"
    docker exec $CONTAINER bash -c "grep -q \"listen_addresses = '\*'\" \"$PG_CONF\" || echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
    echo "✅ listen_addresses configuré"
else
    echo "❌ postgresql.conf non trouvé"
fi

echo ""

echo "4️⃣ Configuration pg_hba.conf..."
# Trouver et configurer pg_hba.conf
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
    echo "✅ pg_hba.conf trouvé: $PG_HBA"
    docker exec $CONTAINER bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" \"$PG_HBA\" || echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
    echo "✅ Accès distant configuré"
else
    echo "❌ pg_hba.conf non trouvé"
fi

echo ""

echo "5️⃣ Redémarrage de PostgreSQL..."
docker restart $CONTAINER
sleep 3
echo "✅ PostgreSQL redémarré"

echo ""

echo "6️⃣ Configuration du firewall..."
ufw allow 5432/tcp 2>&1 || echo "ufw non disponible"
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>&1 || echo "iptables déjà configuré"
echo "✅ Port 5432 ouvert"

echo ""

echo "7️⃣ Vérification..."
echo "📋 Ports ouverts:"
netstat -tuln | grep 5432 || ss -tuln | grep 5432

echo ""
echo "📋 Bases de données:"
docker exec $CONTAINER psql -U postgres -c "\l" | grep dinitech-base

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Testez maintenant depuis votre machine Windows:"
echo "   npx prisma db push"
echo "   npx prisma generate"
echo "   npm run dev"






