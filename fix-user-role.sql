-- Fix User Role Script
-- This script updates your user's metadata to include a role

-- OPTION 1: Update via auth.users table (run this in Supabase SQL Editor)
-- Replace 'your-email@example.com' with your actual email

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "BUSINESS_OWNER"}'::jsonb
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email = 'your-email@example.com';

-- OPTION 2: If you want to make yourself SUPER_ADMIN (full access)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "SUPER_ADMIN"}'::jsonb
-- WHERE email = 'your-email@example.com';

-- OPTION 3: Update multiple users at once
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "BUSINESS_OWNER"}'::jsonb
-- WHERE email IN ('user1@example.com', 'user2@example.com');
