-- Manual sync: Copy user from auth.users to public.users
-- Run this AFTER creating a user in Supabase Auth dashboard

-- First, let's see what users exist in auth
SELECT
  id as auth_user_id,
  email,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'role' as role_metadata,
  email_confirmed_at
FROM auth.users
WHERE email = 'test@example.com'; -- Change this to your test email

-- Then manually insert into public.users
-- (Replace the UUID with the auth_user_id from above)
INSERT INTO public.users (
  "authUserId",
  email,
  "firstName",
  "lastName",
  role,
  "createdAt",
  "updatedAt"
)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'first_name', 'Test'),
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  'CLIENT'::"UserRole",
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE "authUserId" = auth.users.id
);

-- Verify it worked
SELECT
  u.*,
  au.email as auth_email
FROM public.users u
JOIN auth.users au ON au.id = u."authUserId"
WHERE u.email = 'test@example.com';
