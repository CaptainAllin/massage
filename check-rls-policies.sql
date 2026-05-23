-- ============================================================
-- CHECK: Row Level Security (RLS) Policies
-- ============================================================
-- RLS policies can block the trigger from inserting into public.users
-- ============================================================

-- Check if RLS is enabled on users table
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users'
  AND schemaname = 'public';

-- Check what RLS policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public';

-- If RLS is blocking the trigger, we need to either:
-- 1. Disable RLS on users table, OR
-- 2. Add a policy that allows the trigger to insert

-- Check current RLS status
DO $$
DECLARE
  rls_status BOOLEAN;
  policy_count INTEGER;
BEGIN
  SELECT rowsecurity INTO rls_status
  FROM pg_tables
  WHERE tablename = 'users' AND schemaname = 'public';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users' AND schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS Status for public.users table:';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS Enabled: %', rls_status;
  RAISE NOTICE 'Number of policies: %', policy_count;
  RAISE NOTICE '';

  IF rls_status = TRUE AND policy_count = 0 THEN
    RAISE NOTICE 'PROBLEM FOUND: RLS is enabled but no policies exist!';
    RAISE NOTICE 'This will block ALL inserts, including from triggers.';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUTION: Run the fix-rls.sql script';
  ELSIF rls_status = TRUE AND policy_count > 0 THEN
    RAISE NOTICE 'RLS is enabled with % policies', policy_count;
    RAISE NOTICE 'Check if policies allow trigger inserts';
  ELSE
    RAISE NOTICE 'RLS is disabled - not the issue';
  END IF;
  RAISE NOTICE '==============================================';
END $$;
