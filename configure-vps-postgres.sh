#!/bin/bash

# Script pour configurer PostgreSQL sur le VPS pour accepter les connexions distantes

echo "🚀 Configuration de PostgreSQL sur le VPS..."
echo ""

VPS_IP="180.149.199.175"
VPS_USER="root"
DB_NAME="dinitech-base"

echo "📋 Informations:"
echo "   - IP: $VPS_IP"
echo "   - Database: $DB_NAME"
echo ""

# Connexion SSH et configuration
echo "🔧 Configuration de PostgreSQL..."
echo ""

ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'ENDSSH'

echo "1️⃣ Recherche du conteneur PostgreSQL..."
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Aucun conteneur PostgreSQL trouvé en cours d'exécution"
    echo "📋 Conteneurs disponibles:"
    docker ps -a | grep postgres
    exit 1
fi

echo "✅ Conteneur trouvé: $POSTGRES_CONTAINER"
echo ""

echo "2️⃣ Vérification de la base de données..."
docker exec $POSTGRES_CONTAINER psql -U postgres -lqt | cut -d \| -f 1 | grep -qw dinitech-base
if [ $? -ne 0 ]; then
    echo "📝 Création de la base de données 'dinitech-base'..."
    docker exec $POSTGRES_CONTAINER psql -U postgres -c "CREATE DATABASE \"dinitech-base\";"
    echo "✅ Base de données créée"
else
    echo "✅ Base de données 'dinitech-base' existe déjà"
fi
echo ""

echo "3️⃣ Configuration de l'accès distant..."
# Configurer postgresql.conf pour écouter sur toutes les interfaces
docker exec $POSTGRES_CONTAINER bash -c "grep -q \"listen_addresses = '\*'\" /var/lib/postgresql/data/postgresql.conf || echo \"listen_addresses = '*'\" >> /var/lib/postgresql/data/postgresql.conf"

# Configurer pg_hba.conf pour autoriser les connexions MD5 depuis n'importe quelle IP
docker exec $POSTGRES_CONTAINER bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" /var/lib/postgresql/data/pg_hba.conf || echo \"host all all 0.0.0.0/0 md5\" >> /var/lib/postgresql/data/pg_hba.conf"

echo "✅ Configuration PostgreSQL mise à jour"
echo ""

echo "4️⃣ Redémarrage de PostgreSQL..."
docker restart $POSTGRES_CONTAINER
sleep 3
echo "✅ PostgreSQL redémarré"
echo ""

echo "5️⃣ Configuration du firewall..."
# Vérifier si ufw est installé
if command -v ufw &> /dev/null; then
    ufw allow 5432/tcp
    echo "✅ Port 5432 ouvert avec ufw"
elif command -v iptables &> /dev/null; then
    iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
    echo "✅ Port 5432 ouvert avec iptables"
else
    echo "⚠️  Firewall non détecté, assurez-vous que le port 5432 est ouvert"
fi
echo ""

echo "6️⃣ Vérification du port..."
netstat -tuln | grep 5432 || ss -tuln | grep 5432
echo ""

echo "✅ Configuration terminée!"
echo ""
echo "📋 Informations de connexion:"
echo "   - Host: $(curl -s ifconfig.me)"
echo "   - Port: 5432"
echo "   - Database: dinitech-base"
echo "   - User: postgres"
echo ""

ENDSSH

echo ""
echo "🎉 Configuration du VPS terminée!"
echo ""
echo "🧪 Test de connexion depuis votre machine..."
echo "   Commande: npx prisma db push"
echo ""






