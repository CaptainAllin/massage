-- ============================================================
-- FIX: Supabase User Creation Issue
-- ============================================================
-- This script will fix the "Database error creating new user" issue
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
--
-- The issue is likely:
-- 1. Triggers not installed or not working
-- 2. Column name mismatch (authProviderId vs authUserId)
-- ============================================================

-- Step 1: Check if authUserId column exists, if not rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'authProviderId'
  ) THEN
    -- Rename the column
    ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";

    -- Update the unique constraint
    ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_authProviderId_key";
    ALTER TABLE users ADD CONSTRAINT "users_authUserId_key" UNIQUE ("authUserId");

    -- Update the index
    DROP INDEX IF EXISTS "users_authProviderId_idx";
    CREATE INDEX IF NOT EXISTS "users_authUserId_idx" ON users("authUserId");

    RAISE NOTICE '✅ Renamed authProviderId to authUserId';
  ELSE
    RAISE NOTICE 'ℹ️  Column authUserId already exists';
  END IF;
END $$;

-- Step 2: Drop existing triggers (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Step 3: Drop existing functions (if any)
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();
DROP FUNCTION IF EXISTS public.handle_user_delete();

DO $$
BEGIN
  RAISE NOTICE '🗑️  Dropped old triggers and functions';
END $$;

-- ============================================================
-- FUNCTION 1: Handle New User Creation
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    "authUserId",
    email,
    "firstName",
    "lastName",
    role,
    "phoneNumber",
    "profileImageUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public."UserRole", 'CLIENT'),
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error details for debugging
    RAISE NOTICE 'Error in handle_new_user: %, %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============================================================
-- TRIGGER 1: On User Created
-- ============================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION 2: Handle User Updates
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    "phoneNumber" = NEW.phone,
    "firstName" = NEW.raw_user_meta_data->>'first_name',
    "lastName" = NEW.raw_user_meta_data->>'last_name',
    "profileImageUrl" = NEW.raw_user_meta_data->>'avatar_url',
    "updatedAt" = NOW()
  WHERE "authUserId" = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated;

-- ============================================================
-- TRIGGER 2: On User Updated
-- ============================================================
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================================
-- FUNCTION 3: Handle User Deletion
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE "authUserId" = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO authenticated;

-- ============================================================
-- TRIGGER 3: On User Deleted
-- ============================================================
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check that triggers were created
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'auth.users'::regclass
    AND tgname IN ('on_auth_user_created', 'on_auth_user_updated', 'on_auth_user_deleted');

  IF trigger_count = 3 THEN
    RAISE NOTICE '✅ All 3 triggers created successfully!';
  ELSE
    RAISE NOTICE '⚠️  Only % triggers found. Expected 3.', trigger_count;
  END IF;
END $$;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ Supabase User Creation Fix Applied Successfully!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '   1. Renamed authProviderId → authUserId (if needed)';
  RAISE NOTICE '   2. Created/Updated handle_new_user() function';
  RAISE NOTICE '   3. Created/Updated handle_user_update() function';
  RAISE NOTICE '   4. Created/Updated handle_user_delete() function';
  RAISE NOTICE '   5. Created/Updated all 3 triggers';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test it:';
  RAISE NOTICE '   1. Go to Authentication → Users in Supabase Dashboard';
  RAISE NOTICE '   2. Click "Add User"';
  RAISE NOTICE '   3. Fill in email, password, and user metadata';
  RAISE NOTICE '   4. User should be created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
