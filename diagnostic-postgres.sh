#!/bin/bash

echo "🔍 Diagnostic complet de PostgreSQL..."
echo ""

CONTAINER="postgres"

echo "1️⃣ Vérification du conteneur..."
docker ps | grep $CONTAINER

echo ""
echo "2️⃣ Vérification des ports..."
docker exec $CONTAINER netstat -tuln | grep 5432 || docker exec $CONTAINER ss -tuln | grep 5432

echo ""
echo "3️⃣ Recherche des fichiers de configuration..."
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)

echo "📋 postgresql.conf: $PG_CONF"
echo "📋 pg_hba.conf: $PG_HBA"

echo ""
echo "4️⃣ Vérification de la configuration actuelle..."
if [ -n "$PG_CONF" ]; then
    echo "📋 listen_addresses:"
    docker exec $CONTAINER grep "listen_addresses" "$PG_CONF" 2>/dev/null || echo "❌ Non configuré"
fi

if [ -n "$PG_HBA" ]; then
    echo "📋 Accès distant:"
    docker exec $CONTAINER grep "0.0.0.0/0" "$PG_HBA" 2>/dev/null || echo "❌ Non configuré"
fi

echo ""
echo "5️⃣ Vérification des bases de données..."
docker exec $CONTAINER psql -U postgres -c "\l" | grep dinitech-base

echo ""
echo "6️⃣ Test de connexion local..."
docker exec $CONTAINER psql -U postgres -h localhost -p 5432 -c "SELECT version();" 2>/dev/null && echo "✅ Connexion locale OK" || echo "❌ Connexion locale échoue"

echo ""
echo "7️⃣ Test de connexion externe..."
docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT version();" 2>/dev/null && echo "✅ Connexion externe OK" || echo "❌ Connexion externe échoue"

echo ""
echo "8️⃣ Vérification du firewall..."
iptables -L | grep 5432 || echo "❌ Port 5432 non ouvert dans iptables"

echo ""
echo "📋 Recommandations:"
if ! docker exec $CONTAINER netstat -tuln | grep -q 5432; then
    echo "   - PostgreSQL n'écoute pas sur le port 5432"
    echo "   - Vérifiez listen_addresses dans postgresql.conf"
fi

if ! docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;" 2>/dev/null; then
    echo "   - Configuration réseau incorrecte"
    echo "   - Vérifiez pg_hba.conf et le firewall"
fi






