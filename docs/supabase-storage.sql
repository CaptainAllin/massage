-- ============================================================
-- SUPABASE STORAGE SETUP
-- Phase 0.4 — Run in Supabase SQL Editor
-- ============================================================
-- Creates storage buckets and RLS policies.
-- Run AFTER the main schema and trigger setup.
-- ============================================================

-- ============================================================
-- CREATE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profiles',        'profiles',        true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('branding',        'branding',        true,  10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('documents',       'documents',       false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('progress-photos', 'progress-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- ENABLE RLS ON STORAGE.OBJECTS
-- ============================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES BUCKET — Public read, owner write
-- Path convention: profiles/{authUserId}/{filename}
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_public" ON storage.objects;
DROP POLICY IF EXISTS "profiles_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update_own" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete_own" ON storage.objects;

-- Anyone can view profile images (public bucket)
CREATE POLICY "profiles_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- Users can upload their own profile image
CREATE POLICY "profiles_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own profile image
CREATE POLICY "profiles_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own profile image
CREATE POLICY "profiles_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- BRANDING BUCKET — Public read, business owner write
-- Path convention: branding/{businessId}/{filename}
-- ============================================================

DROP POLICY IF EXISTS "branding_select_public" ON storage.objects;
DROP POLICY IF EXISTS "branding_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "branding_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "branding_delete_owner" ON storage.objects;

-- Anyone can view branding assets (public bucket)
CREATE POLICY "branding_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

-- Business owners can upload branding (folder = businessId)
CREATE POLICY "branding_insert_owner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] = public.get_my_owned_business_id()
  );

-- Business owners can update branding
CREATE POLICY "branding_update_owner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] = public.get_my_owned_business_id()
  );

-- Business owners can delete branding
CREATE POLICY "branding_delete_owner"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] = public.get_my_owned_business_id()
  );

-- ============================================================
-- DOCUMENTS BUCKET — Private, business-scoped
-- Path convention: documents/{businessId}/{clientId}/{filename}
-- ============================================================

DROP POLICY IF EXISTS "documents_select_business" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_business" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_owner" ON storage.objects;

-- Business staff can read documents for their business
CREATE POLICY "documents_select_business"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND public.is_in_business((storage.foldername(name))[1])
  );

-- Business staff can upload documents
CREATE POLICY "documents_insert_business"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_in_business((storage.foldername(name))[1])
  );

-- Only business owner can delete documents
CREATE POLICY "documents_delete_owner"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_my_owned_business_id()
  );

-- ============================================================
-- PROGRESS-PHOTOS BUCKET — Private, business-scoped
-- Path convention: progress-photos/{businessId}/{clientId}/{filename}
-- ============================================================

DROP POLICY IF EXISTS "progress_photos_select_business" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_insert_business" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_delete_owner" ON storage.objects;

-- Business staff can read progress photos
CREATE POLICY "progress_photos_select_business"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND public.is_in_business((storage.foldername(name))[1])
  );

-- Business staff can upload progress photos
CREATE POLICY "progress_photos_insert_business"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND public.is_in_business((storage.foldername(name))[1])
  );

-- Only business owner can delete progress photos
CREATE POLICY "progress_photos_delete_owner"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = public.get_my_owned_business_id()
  );

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT id, name, public, file_size_limit FROM storage.buckets
WHERE id IN ('profiles', 'branding', 'documents', 'progress-photos');

SELECT policyname, tablename, cmd AS command
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

DO $$
BEGIN
  RAISE NOTICE '✅ Storage setup complete!';
  RAISE NOTICE '   Buckets: profiles (public), branding (public), documents (private), progress-photos (private)';
  RAISE NOTICE '   Path conventions:';
  RAISE NOTICE '     profiles/{authUserId}/{filename}';
  RAISE NOTICE '     branding/{businessId}/{filename}';
  RAISE NOTICE '     documents/{businessId}/{clientId}/{filename}';
  RAISE NOTICE '     progress-photos/{businessId}/{clientId}/{filename}';
END $$;
