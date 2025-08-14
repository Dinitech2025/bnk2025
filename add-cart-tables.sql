-- Migration manuelle pour ajouter les tables Cart et CartItem
-- À exécuter directement sur la base de données PostgreSQL

-- Vérifier si les tables existent déjà
DO $$ 
BEGIN
    -- Créer la table Cart si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Cart') THEN
        CREATE TABLE "Cart" (
            "id" TEXT NOT NULL,
            "userId" TEXT,
            "sessionId" TEXT,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
        );
        
        -- Créer les index pour la table Cart
        CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");
        CREATE INDEX "Cart_sessionId_idx" ON "Cart"("sessionId");
        CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");
        
        -- Ajouter la contrainte de clé étrangère pour userId
        ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Table Cart créée avec succès';
    ELSE
        RAISE NOTICE 'Table Cart existe déjà';
    END IF;
    
    -- Créer la table CartItem si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CartItem') THEN
        CREATE TABLE "CartItem" (
            "id" TEXT NOT NULL,
            "cartId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "itemId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "price" DECIMAL(65,30) NOT NULL,
            "quantity" INTEGER NOT NULL DEFAULT 1,
            "image" TEXT,
            "data" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
        );
        
        -- Créer les index pour la table CartItem
        CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
        CREATE INDEX "CartItem_type_idx" ON "CartItem"("type");
        CREATE INDEX "CartItem_itemId_idx" ON "CartItem"("itemId");
        
        -- Ajouter la contrainte de clé étrangère pour cartId
        ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" 
        FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Table CartItem créée avec succès';
    ELSE
        RAISE NOTICE 'Table CartItem existe déjà';
    END IF;
    
    -- Créer un trigger pour mettre à jour automatiquement updatedAt
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Appliquer le trigger aux tables Cart et CartItem si elles viennent d'être créées
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cart_updated_at') THEN
        CREATE TRIGGER update_cart_updated_at 
        BEFORE UPDATE ON "Cart" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger pour Cart.updatedAt créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cartitem_updated_at') THEN
        CREATE TRIGGER update_cartitem_updated_at 
        BEFORE UPDATE ON "CartItem" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger pour CartItem.updatedAt créé';
    END IF;
    
END $$; 