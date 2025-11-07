#!/bin/bash

echo "🔧 Correction finale de PostgreSQL..."
echo ""

CONTAINER="postgres"

echo "1️⃣ Arrêt de PostgreSQL..."
docker stop $CONTAINER

echo ""
echo "2️⃣ Recherche des fichiers de configuration..."
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)

echo "✅ Config trouvé: $PG_CONF"

echo ""
echo "3️⃣ Configuration postgresql.conf..."
docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
docker exec $CONTAINER bash -c "echo \"port = 5432\" >> \"$PG_CONF\""

echo ""
echo "4️⃣ Configuration pg_hba.conf..."
docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
docker exec $CONTAINER bash -c "echo \"host all all ::/0 md5\" >> \"$PG_HBA\""

echo ""
echo "5️⃣ Démarrage de PostgreSQL..."
docker start $CONTAINER
sleep 5

echo ""
echo "6️⃣ Vérification..."
echo "📋 Ports:"
docker exec $CONTAINER netstat -tuln | grep 5432 || docker exec $CONTAINER ss -tuln | grep 5432

echo ""
echo "📋 Configuration:"
docker exec $CONTAINER grep "listen_addresses" "$PG_CONF"
docker exec $CONTAINER grep "0.0.0.0/0" "$PG_HBA"

echo ""
echo "📋 Bases de données:"
docker exec $CONTAINER psql -U postgres -c "\l" | grep dinitech-base

echo ""
echo "7️⃣ Test de connexion externe..."
docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -d dinitech-base -c "SELECT version();" 2>/dev/null && echo "✅ Connexion externe OK" || echo "❌ Connexion externe échoue"

echo ""
echo "8️⃣ Configuration du firewall..."
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
echo "✅ Port 5432 ouvert"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Testez maintenant depuis Windows:"
echo "   npx prisma db push"
echo "   npx prisma generate"
echo "   npm run dev"






