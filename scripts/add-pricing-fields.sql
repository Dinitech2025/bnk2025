-- Ajouter l'enum ServicePricingType
CREATE TYPE "ServicePricingType" AS ENUM ('FIXED', 'NEGOTIABLE', 'RANGE', 'QUOTE_REQUIRED');

-- Ajouter les colonnes de pricing au modèle Service
ALTER TABLE "Service" 
ADD COLUMN "pricingType" "ServicePricingType" DEFAULT 'FIXED',
ADD COLUMN "minPrice" DECIMAL,
ADD COLUMN "maxPrice" DECIMAL,
ADD COLUMN "requiresQuote" BOOLEAN DEFAULT false,
ADD COLUMN "autoAcceptNegotiation" BOOLEAN DEFAULT false;

-- Créer un index sur pricingType
CREATE INDEX "Service_pricingType_idx" ON "Service"("pricingType");

-- Mettre à jour les services existants avec une logique intelligente
UPDATE "Service" SET 
  "pricingType" = 'QUOTE_REQUIRED',
  "requiresQuote" = true
WHERE LOWER("name") LIKE '%sur mesure%' 
   OR LOWER("name") LIKE '%personnalis%' 
   OR LOWER("name") LIKE '%projet%';

UPDATE "Service" SET 
  "pricingType" = 'NEGOTIABLE',
  "autoAcceptNegotiation" = true,
  "minPrice" = "price" * 0.8,
  "maxPrice" = "price" * 1.2
WHERE "price" > 100000 AND "pricingType" = 'FIXED';

UPDATE "Service" SET 
  "pricingType" = 'RANGE',
  "minPrice" = "price" * 0.9,
  "maxPrice" = "price" * 1.1
WHERE "price" > 50000 AND "pricingType" = 'FIXED'; 