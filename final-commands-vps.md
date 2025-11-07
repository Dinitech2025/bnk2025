# 🚀 Commandes Finales VPS - Configuration Complète

**Puisque SSH demande le mot de passe, exécutez ces commandes manuellement sur votre VPS :**

## 📋 Commandes à exécuter (copiez-collez)

**1️⃣ Connectez-vous :**
```bash
ssh root@180.149.199.175
# Mot de passe: X0D8i6O6b7u1m9m
```

**2️⃣ Exécutez ces commandes une par une :**

```bash
# 1. Vérifier le conteneur
docker ps | grep postgres

# 2. Variables
DB_USER="admin"
DB_NAME="dinitech-base"

# 3. Créer la base de données
docker exec postgres psql -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null || echo "DB existe déjà"

# 4. Test de connexion locale
docker exec postgres psql -U $DB_USER -h localhost -p 5432 -d $DB_NAME -c "SELECT 1;" && echo "✅ Local OK"

# 5. Test de connexion externe
docker exec postgres psql -U $DB_USER -h 0.0.0.0 -p 5432 -d $DB_NAME -c "SELECT 1;" && echo "✅ Externe OK" || echo "❌ Externe échoue"

# 6. Si externe échoue, configuration finale
if ! docker exec postgres psql -U $DB_USER -h 0.0.0.0 -p 5432 -d $DB_NAME -c "SELECT 1;" 2>/dev/null; then
    echo "📋 Configuration réseau..."
    PG_CONF=$(docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1)
    PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2>/dev/null | head -1)
    docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
    docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
    docker restart postgres
    sleep 3
    docker exec postgres psql -U $DB_USER -h 0.0.0.0 -p 5432 -d $DB_NAME -c "SELECT 1;" && echo "✅ Final OK"
fi
```

**3️⃣ Quitter :**
```bash
exit
```

**4️⃣ Sur Windows :**
```bash
npx prisma db push
npx prisma generate
npm run dev
```

---

## 🎯 Ce que ça fait :

1. **Vérifie** que PostgreSQL fonctionne
2. **Crée** la base de données `dinitech-base`
3. **Teste** la connexion locale et externe
4. **Configure** si nécessaire les fichiers PostgreSQL
5. **Redémarre** PostgreSQL

## ✅ Résultat attendu :

- `docker exec postgres psql -U admin -h 0.0.0.0 -p 5432 -d dinitech-base -c "SELECT 1;"` → ✅
- `npx prisma db push` → ✅

## 📝 Informations de connexion :

- **Host**: 180.149.199.175:5432
- **Utilisateur**: admin
- **Mot de passe**: dinyoili@PJB24
- **Base de données**: dinitech-base

**🎯 Exécutez ces commandes maintenant et dites-moi le résultat !**

**Si vous avez une erreur, copiez-la moi !** 🔧






