-- ============================================================
-- FIX: Supabase User Creation Issue (v2 - Clean)
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Check and rename column if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'authProviderId'
  ) THEN
    ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";
    ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_authProviderId_key";
    ALTER TABLE users ADD CONSTRAINT "users_authUserId_key" UNIQUE ("authUserId");
    DROP INDEX IF EXISTS "users_authProviderId_idx";
    CREATE INDEX IF NOT EXISTS "users_authUserId_idx" ON users("authUserId");
    RAISE NOTICE 'Column renamed to authUserId';
  ELSE
    RAISE NOTICE 'Column authUserId already exists';
  END IF;
END $$;

-- Step 2: Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Step 3: Drop old functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();
DROP FUNCTION IF EXISTS public.handle_user_delete();

-- Step 4: Create handle_new_user function
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
    RAISE NOTICE 'Error in handle_new_user: %, %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Step 5: Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create handle_user_update function
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated;

-- Step 7: Create trigger for user updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION public.handle_user_update();

-- Step 8: Create handle_user_delete function
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE "authUserId" = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO authenticated;

-- Step 9: Create trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- Step 10: Verify triggers
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'auth.users'::regclass
    AND tgname IN ('on_auth_user_created', 'on_auth_user_updated', 'on_auth_user_deleted');

  IF trigger_count = 3 THEN
    RAISE NOTICE 'SUCCESS: All 3 triggers created!';
  ELSE
    RAISE NOTICE 'WARNING: Only % triggers found', trigger_count;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Fix Applied Successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Next: Test by creating a user in Authentication > Users';
END $$;
