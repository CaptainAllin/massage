-- AlterTable: add locationId to therapists
ALTER TABLE "therapists" ADD COLUMN "locationId" TEXT;

-- AlterTable: add locationId to clients
ALTER TABLE "clients" ADD COLUMN "locationId" TEXT;

-- AlterTable: add locationId to appointments
ALTER TABLE "appointments" ADD COLUMN "locationId" TEXT;

-- AlterTable: add locationId to payments
ALTER TABLE "payments" ADD COLUMN "locationId" TEXT;

-- CreateTable: locations
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gift_cards
CREATE TABLE "gift_cards" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "purchasedById" TEXT,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gift_card_redemptions
CREATE TABLE "gift_card_redemptions" (
    "id" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: loyalty_settings
CREATE TABLE "loyalty_settings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "pointsPerDollar" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dollarPerPoint" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "bronzeMinPoints" INTEGER NOT NULL DEFAULT 0,
    "silverMinPoints" INTEGER NOT NULL DEFAULT 500,
    "goldMinPoints" INTEGER NOT NULL DEFAULT 1500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiryDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: loyalty_accounts
CREATE TABLE "loyalty_accounts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: loyalty_transactions
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "loyaltyAccountId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "category" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER DEFAULT 5,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: inventory_adjustments
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "notes" TEXT,
    "referenceId" TEXT,
    "adjustedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_businessId_idx" ON "locations"("businessId");
CREATE INDEX "locations_isActive_idx" ON "locations"("isActive");

CREATE UNIQUE INDEX "gift_cards_code_key" ON "gift_cards"("code");
CREATE INDEX "gift_cards_businessId_idx" ON "gift_cards"("businessId");
CREATE INDEX "gift_cards_code_idx" ON "gift_cards"("code");
CREATE INDEX "gift_cards_purchasedById_idx" ON "gift_cards"("purchasedById");
CREATE INDEX "gift_cards_isActive_idx" ON "gift_cards"("isActive");

CREATE INDEX "gift_card_redemptions_giftCardId_idx" ON "gift_card_redemptions"("giftCardId");
CREATE INDEX "gift_card_redemptions_businessId_idx" ON "gift_card_redemptions"("businessId");

CREATE UNIQUE INDEX "loyalty_settings_businessId_key" ON "loyalty_settings"("businessId");

CREATE UNIQUE INDEX "loyalty_accounts_businessId_clientId_key" ON "loyalty_accounts"("businessId", "clientId");
CREATE INDEX "loyalty_accounts_businessId_idx" ON "loyalty_accounts"("businessId");
CREATE INDEX "loyalty_accounts_clientId_idx" ON "loyalty_accounts"("clientId");

CREATE INDEX "loyalty_transactions_loyaltyAccountId_idx" ON "loyalty_transactions"("loyaltyAccountId");
CREATE INDEX "loyalty_transactions_businessId_idx" ON "loyalty_transactions"("businessId");
CREATE INDEX "loyalty_transactions_createdAt_idx" ON "loyalty_transactions"("createdAt");

CREATE UNIQUE INDEX "products_businessId_sku_key" ON "products"("businessId", "sku");
CREATE INDEX "products_businessId_idx" ON "products"("businessId");
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "products_category_idx" ON "products"("category");

CREATE INDEX "inventory_adjustments_productId_idx" ON "inventory_adjustments"("productId");
CREATE INDEX "inventory_adjustments_businessId_idx" ON "inventory_adjustments"("businessId");
CREATE INDEX "inventory_adjustments_createdAt_idx" ON "inventory_adjustments"("createdAt");

CREATE INDEX "therapists_locationId_idx" ON "therapists"("locationId");
CREATE INDEX "clients_locationId_idx" ON "clients"("locationId");
CREATE INDEX "appointments_locationId_idx" ON "appointments"("locationId");
CREATE INDEX "payments_locationId_idx" ON "payments"("locationId");

-- AddForeignKey
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "locations" ADD CONSTRAINT "locations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "gift_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_settings" ADD CONSTRAINT "loyalty_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
