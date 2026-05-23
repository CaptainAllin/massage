-- ============================================================
-- Task 1.1: Fix User Metadata Setup
-- ============================================================
-- This script:
-- 1. Creates a Business for new BUSINESS_OWNER users
-- 2. Sets businessId in user_metadata
-- 3. Handles all role types appropriately
-- ============================================================

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- FUNCTION: Handle New User Creation with Business Setup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public."UserRole";
  new_user_id TEXT;
  new_business_id TEXT;
  business_name TEXT;
BEGIN
  -- Safely extract and cast the role
  BEGIN
    user_role := COALESCE(
      CAST(NEW.raw_user_meta_data->>'role' AS public."UserRole"),
      'BUSINESS_OWNER'::public."UserRole"  -- Default to BUSINESS_OWNER
    );
  EXCEPTION WHEN OTHERS THEN
    user_role := 'BUSINESS_OWNER'::public."UserRole";
  END;

  -- Generate IDs
  new_user_id := gen_random_uuid()::text;
  new_business_id := gen_random_uuid()::text;

  -- Insert into public.users
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
    new_user_id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    user_role,
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );

  -- If user is BUSINESS_OWNER, create a Business
  IF user_role = 'BUSINESS_OWNER' THEN
    -- Generate business name from user's name or email
    business_name := COALESCE(
      TRIM(CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )),
      SPLIT_PART(NEW.email, '@', 1)
    ) || '''s Practice';

    -- Create Business
    INSERT INTO public.businesses (
      id,
      name,
      email,
      "ownerId",
      "subscriptionTier",
      "subscriptionStatus",
      "primaryColor",
      "secondaryColor",
      country,
      "createdAt",
      "updatedAt"
    )
    VALUES (
      new_business_id,
      business_name,
      NEW.email,
      new_user_id,
      'FREE',
      'ACTIVE',
      '#A8C3A0',
      '#E7D8C9',
      'USA',
      NOW(),
      NOW()
    );

    -- Update auth.users metadata with businessId
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('businessId', new_business_id)
    WHERE id = NEW.id;

    RAISE NOTICE 'Created business % for user %', new_business_id, NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth user creation
  RAISE WARNING 'Error in handle_new_user trigger: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============================================================
-- TRIGGER: On User Created
-- ============================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- UPDATE EXISTING USERS: Fix missing metadata
-- ============================================================
-- This updates existing BUSINESS_OWNER users who don't have a business
DO $$
DECLARE
  user_record RECORD;
  new_business_id TEXT;
  business_name TEXT;
  auth_user_id TEXT;
BEGIN
  FOR user_record IN
    SELECT u.id, u."authUserId", u.email, u."firstName", u."lastName"
    FROM public.users u
    WHERE u.role = 'BUSINESS_OWNER'
    AND NOT EXISTS (
      SELECT 1 FROM public.businesses b WHERE b."ownerId" = u.id
    )
  LOOP
    -- Generate business ID
    new_business_id := gen_random_uuid()::text;

    -- Generate business name
    business_name := COALESCE(
      TRIM(CONCAT(
        COALESCE(user_record."firstName", ''),
        ' ',
        COALESCE(user_record."lastName", '')
      )),
      SPLIT_PART(user_record.email, '@', 1)
    ) || '''s Practice';

    -- Create Business
    INSERT INTO public.businesses (
      id,
      name,
      email,
      "ownerId",
      "subscriptionTier",
      "subscriptionStatus",
      "primaryColor",
      "secondaryColor",
      country,
      "createdAt",
      "updatedAt"
    )
    VALUES (
      new_business_id,
      business_name,
      user_record.email,
      user_record.id,
      'FREE',
      'ACTIVE',
      '#A8C3A0',
      '#E7D8C9',
      'USA',
      NOW(),
      NOW()
    );

    -- Update auth.users metadata with businessId
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'businessId', new_business_id,
        'role', 'BUSINESS_OWNER'
      )
    WHERE id = user_record."authUserId";

    RAISE NOTICE 'Fixed existing user: % - Created business: %', user_record.email, new_business_id;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
DECLARE
  trigger_count INTEGER;
  users_without_business INTEGER;
BEGIN
  -- Check trigger
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'auth.users'::regclass
    AND tgname = 'on_auth_user_created';

  -- Check for BUSINESS_OWNER users without businesses
  SELECT COUNT(*) INTO users_without_business
  FROM public.users u
  WHERE u.role = 'BUSINESS_OWNER'
  AND NOT EXISTS (
    SELECT 1 FROM public.businesses b WHERE b."ownerId" = u.id
  );

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ User Metadata and Business Setup Complete!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Status:';
  RAISE NOTICE '   • Trigger created: %', CASE WHEN trigger_count > 0 THEN 'Yes ✅' ELSE 'No ❌' END;
  RAISE NOTICE '   • BUSINESS_OWNER users without business: %', users_without_business;
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test it:';
  RAISE NOTICE '   1. Sign up a new user with BUSINESS_OWNER role';
  RAISE NOTICE '   2. Check that:';
  RAISE NOTICE '      - User is created in public.users';
  RAISE NOTICE '      - Business is created in public.businesses';
  RAISE NOTICE '      - auth.users.raw_user_meta_data contains businessId';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
