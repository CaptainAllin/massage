-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Phase 0.5 — Run in Supabase SQL Editor
-- ============================================================
-- All API routes use the service_role key which bypasses RLS.
-- These policies add defense-in-depth for any direct DB access
-- using a user's JWT token.
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's internal cuid (public.users.id)
CREATE OR REPLACE FUNCTION public.get_my_id()
RETURNS TEXT AS $$
  SELECT id FROM public.users WHERE "authUserId" = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.users WHERE "authUserId" = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the business ID the current user owns
CREATE OR REPLACE FUNCTION public.get_my_owned_business_id()
RETURNS TEXT AS $$
  SELECT b.id FROM public.businesses b
  WHERE b."ownerId" = public.get_my_id()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the business ID the current user works at (as therapist)
CREATE OR REPLACE FUNCTION public.get_my_therapist_business_id()
RETURNS TEXT AS $$
  SELECT t."businessId" FROM public.therapists t
  WHERE t."userId" = public.get_my_id()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the business ID accessible to the current user (owner OR therapist)
CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    public.get_my_owned_business_id(),
    public.get_my_therapist_business_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is in a given business (owner or therapist)
CREATE OR REPLACE FUNCTION public.is_in_business(business_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT public.get_my_business_id() = business_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_my_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_owned_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_therapist_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_business(TEXT) TO authenticated;

-- ============================================================
-- USERS TABLE
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_select_business_staff" ON public.users;

-- Users can read their own record
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid()::text = "authUserId");

-- Users can update their own record
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = "authUserId")
  WITH CHECK (auth.uid()::text = "authUserId");

-- Business owners can see users who work for them (therapists)
CREATE POLICY "users_select_business_staff"
  ON public.users FOR SELECT
  USING (
    id IN (
      SELECT t."userId" FROM public.therapists t
      WHERE t."businessId" = public.get_my_owned_business_id()
    )
  );

-- ============================================================
-- BUSINESSES TABLE
-- ============================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "businesses_select_owner" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_staff" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_owner" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_owner" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_owner" ON public.businesses;

-- Business owner can read their own business
CREATE POLICY "businesses_select_owner"
  ON public.businesses FOR SELECT
  USING ("ownerId" = public.get_my_id());

-- Therapists can read the business they work for
CREATE POLICY "businesses_select_staff"
  ON public.businesses FOR SELECT
  USING (id = public.get_my_therapist_business_id());

-- Authenticated users can create a business (once — enforced at app layer)
CREATE POLICY "businesses_insert_owner"
  ON public.businesses FOR INSERT
  WITH CHECK ("ownerId" = public.get_my_id());

-- Only the owner can update their business
CREATE POLICY "businesses_update_owner"
  ON public.businesses FOR UPDATE
  USING ("ownerId" = public.get_my_id())
  WITH CHECK ("ownerId" = public.get_my_id());

-- Only the owner can delete their business
CREATE POLICY "businesses_delete_owner"
  ON public.businesses FOR DELETE
  USING ("ownerId" = public.get_my_id());

-- ============================================================
-- CLIENTS TABLE
-- ============================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_business" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_business" ON public.clients;
DROP POLICY IF EXISTS "clients_update_business" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_owner" ON public.clients;

CREATE POLICY "clients_select_business"
  ON public.clients FOR SELECT
  USING (public.is_in_business("businessId"));

CREATE POLICY "clients_insert_business"
  ON public.clients FOR INSERT
  WITH CHECK (public.is_in_business("businessId"));

CREATE POLICY "clients_update_business"
  ON public.clients FOR UPDATE
  USING (public.is_in_business("businessId"))
  WITH CHECK (public.is_in_business("businessId"));

CREATE POLICY "clients_delete_owner"
  ON public.clients FOR DELETE
  USING ("businessId" = public.get_my_owned_business_id());

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select_business" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_business" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_business" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_owner" ON public.appointments;

CREATE POLICY "appointments_select_business"
  ON public.appointments FOR SELECT
  USING (public.is_in_business("businessId"));

CREATE POLICY "appointments_insert_business"
  ON public.appointments FOR INSERT
  WITH CHECK (public.is_in_business("businessId"));

CREATE POLICY "appointments_update_business"
  ON public.appointments FOR UPDATE
  USING (public.is_in_business("businessId"))
  WITH CHECK (public.is_in_business("businessId"));

CREATE POLICY "appointments_delete_owner"
  ON public.appointments FOR DELETE
  USING ("businessId" = public.get_my_owned_business_id());

-- ============================================================
-- TREATMENT NOTES TABLE
-- ============================================================

ALTER TABLE public.treatment_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_notes_select" ON public.treatment_notes;
DROP POLICY IF EXISTS "treatment_notes_insert" ON public.treatment_notes;
DROP POLICY IF EXISTS "treatment_notes_update" ON public.treatment_notes;
DROP POLICY IF EXISTS "treatment_notes_delete" ON public.treatment_notes;

-- Therapist who wrote the note + business owner can read
CREATE POLICY "treatment_notes_select"
  ON public.treatment_notes FOR SELECT
  USING (
    "businessId" = public.get_my_owned_business_id()
    OR "therapistId" = (
      SELECT t.id FROM public.therapists t WHERE t."userId" = public.get_my_id()
    )
  );

CREATE POLICY "treatment_notes_insert"
  ON public.treatment_notes FOR INSERT
  WITH CHECK (public.is_in_business("businessId"));

-- Only the therapist who wrote it or the owner can update
CREATE POLICY "treatment_notes_update"
  ON public.treatment_notes FOR UPDATE
  USING (
    "businessId" = public.get_my_owned_business_id()
    OR "therapistId" = (
      SELECT t.id FROM public.therapists t WHERE t."userId" = public.get_my_id()
    )
  );

CREATE POLICY "treatment_notes_delete"
  ON public.treatment_notes FOR DELETE
  USING ("businessId" = public.get_my_owned_business_id());

-- ============================================================
-- THERAPIST NOTES TABLE (private to therapist)
-- ============================================================

ALTER TABLE public.therapist_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "therapist_notes_select" ON public.therapist_notes;
DROP POLICY IF EXISTS "therapist_notes_insert" ON public.therapist_notes;
DROP POLICY IF EXISTS "therapist_notes_update" ON public.therapist_notes;
DROP POLICY IF EXISTS "therapist_notes_delete" ON public.therapist_notes;

-- Only the therapist who wrote it can see it (strictly private)
CREATE POLICY "therapist_notes_select"
  ON public.therapist_notes FOR SELECT
  USING (
    "therapistId" = (
      SELECT t.id FROM public.therapists t WHERE t."userId" = public.get_my_id()
    )
  );

CREATE POLICY "therapist_notes_insert"
  ON public.therapist_notes FOR INSERT
  WITH CHECK (
    "therapistId" = (
      SELECT t.id FROM public.therapists t WHERE t."userId" = public.get_my_id()
    )
  );

CREATE POLICY "therapist_notes_update"
  ON public.therapist_notes FOR UPDATE
  USING (
    "therapistId" = (
      SELECT t.id FROM public.therapists t WHERE t."userId" = public.get_my_id()
    )
  );

CREATE POLICY "therapist_notes_delete"
  ON public.therapist_notes FOR DELETE
  USING (
    "therapistId" = (
      SELECT t.id FROM public.therapists t WHERE t."userId" = public.get_my_id()
    )
  );

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('users', 'businesses', 'clients', 'appointments', 'treatment_notes', 'therapist_notes')
  AND schemaname = 'public'
ORDER BY tablename;

SELECT tablename, policyname, cmd AS command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'businesses', 'clients', 'appointments', 'treatment_notes', 'therapist_notes')
ORDER BY tablename, policyname;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies applied successfully!';
  RAISE NOTICE '   Tables protected: users, businesses, clients, appointments, treatment_notes, therapist_notes';
  RAISE NOTICE '   Note: API routes use service_role which bypasses RLS (intended).';
  RAISE NOTICE '   These policies protect against direct JWT-authenticated access.';
END $$;
