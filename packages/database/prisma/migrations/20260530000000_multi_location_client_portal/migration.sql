-- Phase 3.3 & 3.4: Multi-location scalability + Client portal

-- Add timezone to locations
ALTER TABLE "locations" ADD COLUMN "timezone" TEXT;

-- Add locationId to rooms
ALTER TABLE "rooms" ADD COLUMN "locationId" TEXT;
CREATE INDEX "rooms_locationId_idx" ON "rooms"("locationId");
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: therapist_locations (many-to-many)
CREATE TABLE "therapist_locations" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "therapist_locations_therapistId_locationId_key" ON "therapist_locations"("therapistId", "locationId");
CREATE INDEX "therapist_locations_therapistId_idx" ON "therapist_locations"("therapistId");
CREATE INDEX "therapist_locations_locationId_idx" ON "therapist_locations"("locationId");

ALTER TABLE "therapist_locations" ADD CONSTRAINT "therapist_locations_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "therapist_locations" ADD CONSTRAINT "therapist_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add LOCATION_MANAGER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'LOCATION_MANAGER';

-- Add client portal fields to businesses
ALTER TABLE "businesses" ADD COLUMN "clientPortalEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN "clientPortalSettings" JSONB;
