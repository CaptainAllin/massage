-- ============================================================
-- FIX: Row Level Security (RLS) Blocking User Creation
-- ============================================================
-- This disables RLS on the users table to allow triggers to work
-- OR creates proper policies if you want to keep RLS enabled
-- ============================================================

-- OPTION 1: Disable RLS completely (Recommended for development)
-- Uncomment this if you want to disable RLS:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Keep RLS enabled but allow trigger operations
-- Uncomment these if you want to keep RLS but fix the policies:
/*
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Allow trigger inserts" ON public.users;

-- Policy: Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "authUserId");

-- Policy: Allow authenticated users to update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "authUserId")
  WITH CHECK (auth.uid()::text = "authUserId");

-- Policy: Allow service role full access (for triggers and admin operations)
CREATE POLICY "Service role can do anything"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow inserts from triggers (uses SECURITY DEFINER)
CREATE POLICY "Allow trigger inserts"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
*/

-- Verify the fix
DO $$
DECLARE
  rls_status BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_status
  FROM pg_tables
  WHERE tablename = 'users' AND schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  IF rls_status = FALSE THEN
    RAISE NOTICE 'SUCCESS: RLS is now DISABLED';
    RAISE NOTICE 'User creation should work now!';
  ELSE
    RAISE NOTICE 'RLS is still ENABLED';
    RAISE NOTICE 'Check that policies allow trigger operations';
  END IF;
  RAISE NOTICE '==============================================';
END $$;
