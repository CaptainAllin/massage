-- Phase 1.6: Fine-grained Availability Rules

-- Room table
CREATE TABLE "rooms" (
  "id"         TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "color"      TEXT DEFAULT '#8B5CF6',
  "capacity"   INTEGER DEFAULT 1,
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rooms_businessId_idx" ON "rooms"("businessId");
CREATE INDEX "rooms_isActive_idx"   ON "rooms"("isActive");

ALTER TABLE "rooms" ADD CONSTRAINT "rooms_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AvailabilityRule table
CREATE TABLE "availability_rules" (
  "id"          TEXT NOT NULL,
  "businessId"  TEXT NOT NULL,
  "therapistId" TEXT,
  "roomId"      TEXT,
  "serviceType" TEXT,
  "daysOfWeek"  JSONB NOT NULL,
  "startTime"   TEXT NOT NULL,
  "endTime"     TEXT NOT NULL,
  "priority"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "availability_rules_businessId_idx"  ON "availability_rules"("businessId");
CREATE INDEX "availability_rules_therapistId_idx" ON "availability_rules"("therapistId");
CREATE INDEX "availability_rules_roomId_idx"      ON "availability_rules"("roomId");

ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_therapistId_fkey"
  FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add roomId to appointments
ALTER TABLE "appointments" ADD COLUMN "roomId" TEXT;

CREATE INDEX "appointments_roomId_idx" ON "appointments"("roomId");

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
