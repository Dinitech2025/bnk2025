#!/bin/bash

echo "🔧 Correction de la configuration PostgreSQL..."
echo ""

CONTAINER="postgres"

echo "1️⃣ Recherche des fichiers de configuration..."
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)

echo "✅ postgresql.conf: $PG_CONF"
echo "✅ pg_hba.conf: $PG_HBA"
echo ""

echo "2️⃣ Configuration postgresql.conf..."
if [ -n "$PG_CONF" ]; then
    docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
    echo "✅ listen_addresses configuré"
else
    echo "❌ postgresql.conf non trouvé"
    exit 1
fi

echo ""

echo "3️⃣ Configuration pg_hba.conf..."
if [ -n "$PG_HBA" ]; then
    docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
    echo "✅ Accès distant configuré"
else
    echo "❌ pg_hba.conf non trouvé"
    exit 1
fi

echo ""

echo "4️⃣ Redémarrage de PostgreSQL..."
docker restart $CONTAINER
sleep 3
echo "✅ PostgreSQL redémarré"

echo ""

echo "5️⃣ Configuration du firewall avec iptables..."
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>/dev/null || echo "iptables déjà configuré"
echo "✅ Port 5432 ouvert"

echo ""

echo "6️⃣ Vérification..."
echo "📋 Ports ouverts:"
netstat -tuln | grep 5432 || ss -tuln | grep 5432

echo ""
echo "📋 Configuration des fichiers:"
docker exec $CONTAINER grep "listen_addresses" "$PG_CONF"
docker exec $CONTAINER grep "0.0.0.0/0" "$PG_HBA"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Testez maintenant depuis Windows:"
echo "   npx prisma db push"






