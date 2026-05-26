-- Phase 1.5: Online Booking Access Controls

-- BookingMode enum
CREATE TYPE "BookingMode" AS ENUM ('PUBLIC', 'EXISTING_CLIENTS_ONLY', 'INVITE_ONLY');

-- Add bookingMode to businesses
ALTER TABLE "businesses" ADD COLUMN "bookingMode" "BookingMode" NOT NULL DEFAULT 'PUBLIC';

-- BookingInvite table
CREATE TABLE "booking_invites" (
  "id"         TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "clientId"   TEXT NOT NULL,
  "token"      TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3),
  "usedAt"     TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "booking_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_invites_token_key" ON "booking_invites"("token");
CREATE INDEX "booking_invites_businessId_idx" ON "booking_invites"("businessId");
CREATE INDEX "booking_invites_clientId_idx" ON "booking_invites"("clientId");
CREATE INDEX "booking_invites_token_idx" ON "booking_invites"("token");

ALTER TABLE "booking_invites" ADD CONSTRAINT "booking_invites_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_invites" ADD CONSTRAINT "booking_invites_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
