-- Fix stale brand color defaults
-- Businesses seeded with the old sage-green placeholder (#A8C3A0 / #E7D8C9)
-- should use the Iris brand defaults instead so the booking page looks correct.

UPDATE "businesses"
SET "primaryColor" = '#5D4AA8'
WHERE "primaryColor" = '#A8C3A0';

UPDATE "businesses"
SET "secondaryColor" = '#EDE5F4'
WHERE "secondaryColor" = '#E7D8C9';

-- Update schema-level column defaults to match
ALTER TABLE "businesses" ALTER COLUMN "primaryColor" SET DEFAULT '#5D4AA8';
ALTER TABLE "businesses" ALTER COLUMN "secondaryColor" SET DEFAULT '#EDE5F4';
