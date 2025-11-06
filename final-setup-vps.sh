#!/bin/bash

echo "🚀 Configuration finale PostgreSQL..."
echo ""

# Variables
CONTAINER="postgres"
DB_NAME="dinitech-base"
DB_USER="admin"
DB_PASS="dinyoili@PJB24"

echo "📋 Configuration:"
echo "   Conteneur: $CONTAINER"
echo "   Base: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo ""

echo "1️⃣ Vérification du conteneur..."
docker ps | grep $CONTAINER

echo ""
echo "2️⃣ Création de la base de données..."
if docker exec $CONTAINER psql -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null; then
    echo "✅ Base de données existe déjà"
else
    echo "📝 Création de la base de données..."
    docker exec $CONTAINER psql -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null && echo "✅ Base de données créée" || echo "❌ Erreur création DB"
fi

echo ""
echo "3️⃣ Test de connexion locale..."
if docker exec $CONTAINER psql -U $DB_USER -h localhost -p 5432 -d $DB_NAME -c "SELECT 1;" 2>/dev/null; then
    echo "✅ Connexion locale OK"
else
    echo "❌ Connexion locale échoue"
fi

echo ""
echo "4️⃣ Test de connexion externe..."
if docker exec $CONTAINER psql -U $DB_USER -h 0.0.0.0 -p 5432 -d $DB_NAME -c "SELECT 1;" 2>/dev/null; then
    echo "✅ Connexion externe OK"
else
    echo "❌ Connexion externe échoue"
    echo "📋 Configuration réseau..."

    # Configuration finale si nécessaire
    PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
    PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)

    if [ -n "$PG_CONF" ]; then
        docker exec $CONTAINER bash -c "grep -q \"listen_addresses = '\\*'\" \"$PG_CONF\" || echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
    fi

    if [ -n "$PG_HBA" ]; then
        docker exec $CONTAINER bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" \"$PG_HBA\" || echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
    fi

    echo "📋 Redémarrage PostgreSQL..."
    docker restart $CONTAINER
    sleep 3

    echo "📋 Test après redémarrage..."
    docker exec $CONTAINER psql -U $DB_USER -h 0.0.0.0 -p 5432 -d $DB_NAME -c "SELECT 1;" 2>/dev/null && echo "✅ Connexion externe OK" || echo "❌ Connexion externe échoue"
fi

echo ""
echo "5️⃣ Vérification finale..."
echo "📋 Ports:"
docker exec $CONTAINER netstat -tuln | grep 5432 || docker exec $CONTAINER ss -tuln | grep 5432

echo ""
echo "📋 Bases de données:"
docker exec $CONTAINER psql -U $DB_USER -c "\l" | grep $DB_NAME

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Testez maintenant depuis Windows:"
echo "   npx prisma db push"






