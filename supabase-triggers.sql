-- ============================================================
-- SUPABASE DATABASE TRIGGERS
-- ============================================================
-- This script creates triggers to sync auth.users with public.users
-- Run this in Supabase SQL Editor after migrating your schema
--
-- How to use:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Click "New query"
-- 3. Copy and paste this entire file
-- 4. Click "Run" (or press Cmd/Ctrl + Enter)
-- ============================================================

-- ============================================================
-- FUNCTION 1: Handle New User Creation
-- ============================================================
-- This function runs when a new user signs up via Supabase Auth
-- It automatically creates a matching record in public.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================
-- TRIGGER 1: On User Created
-- ============================================================
-- Fires after a new user is inserted into auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION 2: Handle User Updates
-- ============================================================
-- This function runs when a user updates their profile
-- It syncs changes from auth.users to public.users

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

-- ============================================================
-- TRIGGER 2: On User Updated
-- ============================================================
-- Fires after a user record is updated in auth.users

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

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
-- This function runs when a user is deleted from Supabase Auth
-- It removes the corresponding record from public.users

CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE "authUserId" = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO service_role;

-- ============================================================
-- TRIGGER 3: On User Deleted
-- ============================================================
-- Fires after a user is deleted from auth.users

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify triggers were created successfully

-- Check triggers exist
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  CASE tgtype::integer & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END AS level,
  CASE tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE tgtype::integer & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    WHEN 20 THEN 'INSERT, UPDATE'
    WHEN 24 THEN 'DELETE, UPDATE'
    WHEN 28 THEN 'INSERT, DELETE, UPDATE'
  END AS events
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname IN ('on_auth_user_created', 'on_auth_user_updated', 'on_auth_user_deleted');

-- Check functions exist
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS definition_preview
FROM pg_proc
WHERE proname IN ('handle_new_user', 'handle_user_update', 'handle_user_delete')
  AND pronamespace = 'public'::regnamespace;

-- ============================================================
-- TEST THE TRIGGERS (Optional)
-- ============================================================
-- Uncomment and run this section to test if triggers work

/*
-- Test: Create a test user via Supabase Auth
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Or run this:

-- Check if user was created in public.users
SELECT
  u."authUserId",
  u.email,
  u."firstName",
  u."lastName",
  u.role,
  u."createdAt"
FROM public.users u
ORDER BY u."createdAt" DESC
LIMIT 5;

-- Should show the newly created user!
*/

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Supabase triggers created successfully!';
  RAISE NOTICE '   - handle_new_user() function';
  RAISE NOTICE '   - handle_user_update() function';
  RAISE NOTICE '   - handle_user_delete() function';
  RAISE NOTICE '   - on_auth_user_created trigger';
  RAISE NOTICE '   - on_auth_user_updated trigger';
  RAISE NOTICE '   - on_auth_user_deleted trigger';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Run the verification queries above';
  RAISE NOTICE '   2. Test by creating a user in Supabase Auth';
  RAISE NOTICE '   3. Continue with SETUP_INSTRUCTIONS.md';
END $$;
