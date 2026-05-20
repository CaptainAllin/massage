-- Rename authProviderId to authUserId for Supabase migration
ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";

-- Update index name
DROP INDEX IF EXISTS "users_authProviderId_idx";
CREATE INDEX IF NOT EXISTS "users_authUserId_idx" ON users("authUserId");
