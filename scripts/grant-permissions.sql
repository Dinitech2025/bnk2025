-- =====================================================
-- SCRIPT POUR DONNER ACCÈS AU SCHÉMA PUBLIC
-- =====================================================
-- À exécuter avec un compte administrateur PostgreSQL
-- =====================================================

-- ÉTAPE 1: Identifier votre utilisateur actuel
SELECT current_user, session_user;

-- ÉTAPE 2: Lister tous les utilisateurs de la base
SELECT usename FROM pg_user;

-- ÉTAPE 3: Donner les permissions (remplacez 'votre_utilisateur' par le bon nom)
-- Exemples de noms d'utilisateurs Prisma typiques:
-- - prisma
-- - postgres
-- - un nom lié à votre tenant ID: ac78fe8ab630de3a9b8e8f2043d04694609d148f782d19367237830d5d5275d1

GRANT ALL ON SCHEMA public TO votre_utilisateur;
GRANT CREATE ON SCHEMA public TO votre_utilisateur;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO votre_utilisateur;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO votre_utilisateur;

-- ÉTAPE 4: Permissions par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON TABLES TO votre_utilisateur;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON SEQUENCES TO votre_utilisateur;

-- ÉTAPE 5: Vérification des permissions
SELECT 
    schemaname,
    schemaowner
FROM information_schema.schemata 
WHERE schemaname = 'public'; 