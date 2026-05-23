-- ============================================================
-- DEBUG: Find the actual error in the trigger
-- ============================================================
-- Run this in Supabase SQL Editor to see the real error
-- ============================================================

-- Step 1: Check if triggers exist
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname LIKE 'on_auth%';

-- Step 2: Check users table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check if UserRole enum exists and its values
SELECT
  e.enumlabel AS role_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'UserRole'
ORDER BY e.enumsortorder;

-- Step 4: Test the trigger function directly
-- This will show us the ACTUAL error
DO $$
DECLARE
  test_user_id TEXT := gen_random_uuid()::TEXT;
  test_email TEXT := 'test-debug@example.com';
BEGIN
  -- Try to insert directly into public.users (simulating what the trigger does)
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
      test_user_id,
      test_email,
      'Test',
      'User',
      'CLIENT',
      NULL,
      NULL,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'SUCCESS: Direct insert works! The issue must be something else.';

    -- Clean up test data
    DELETE FROM public.users WHERE "authUserId" = test_user_id;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERROR during insert: %', SQLERRM;
      RAISE NOTICE 'ERROR CODE: %', SQLSTATE;
      RAISE NOTICE 'This is the actual problem preventing user creation!';
  END;
END $$;

-- Step 5: Check for any constraints that might be failing
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    WHEN 'x' THEN 'EXCLUSION'
  END AS constraint_type_desc
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users';
