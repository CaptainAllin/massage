# Task 1.1 Implementation: Fix User Metadata Setup

## Status: ✅ READY TO APPLY

## Overview
Fixed the critical user metadata and business creation issue. New users signing up as BUSINESS_OWNER will now automatically get a business created and their businessId set in user_metadata.

---

## Changes Made

### 1. SQL Trigger (`fix-user-metadata-and-business.sql`)
Created a comprehensive SQL script that:
- ✅ Creates a Business record automatically for BUSINESS_OWNER users
- ✅ Sets businessId in auth.users.raw_user_meta_data
- ✅ Updates existing BUSINESS_OWNER users without businesses
- ✅ Defaults role to BUSINESS_OWNER if not specified
- ✅ Generates business name from user's name or email
- ✅ Includes error handling and verification

### 2. Sign-Up Page (`apps/web/app/(auth)/sign-up/page.tsx`)
Updated to:
- ✅ Default role changed from 'CLIENT' to 'BUSINESS_OWNER' (line 16)
- ✅ Reordered dropdown options to show Business Owner first (lines 143-146)

---

## Implementation Steps

### Step 1: Run the SQL Script
**IMPORTANT:** Run this in your Supabase SQL Editor first!

1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT/sql`
2. Copy contents of `fix-user-metadata-and-business.sql`
3. Paste and run the script
4. Look for success message in output:
   ```
   ✅ User Metadata and Business Setup Complete!
   ```

### Step 2: Verify Existing Users
The script automatically fixes existing BUSINESS_OWNER users, but verify:

```sql
-- Check existing users
SELECT
  u.id,
  u.email,
  u.role,
  b.id as business_id,
  b.name as business_name
FROM users u
LEFT JOIN businesses b ON b."ownerId" = u.id
WHERE u.role = 'BUSINESS_OWNER';
```

All BUSINESS_OWNER users should have a business.

### Step 3: Test with New User
1. Sign up a new user at `/sign-up`
2. Default role should be "Business Owner"
3. Complete sign-up

### Step 4: Verify New User Setup
```sql
-- Check the new user
SELECT
  u.id,
  u.email,
  u.role,
  b.id as business_id,
  b.name as business_name,
  au.raw_user_meta_data->>'businessId' as metadata_business_id
FROM users u
JOIN businesses b ON b."ownerId" = u.id
JOIN auth.users au ON au.id = u."authUserId"
WHERE u.email = 'YOUR_TEST_EMAIL';
```

Expected results:
- ✅ User exists in `public.users`
- ✅ Business exists in `public.businesses`
- ✅ `business_id` matches `metadata_business_id`
- ✅ Business name is "{FirstName} {LastName}'s Practice"

---

## What Gets Fixed

### For New Users
When a user signs up:
1. User record created in `public.users` with role from sign-up form
2. If role is BUSINESS_OWNER:
   - Business record created automatically
   - businessId added to `auth.users.raw_user_meta_data`
   - Business named after user (e.g., "John Doe's Practice")

### For Existing Users
The script one-time fixes:
- BUSINESS_OWNER users without a business get one created
- Their auth.users metadata gets updated with businessId
- Ensures data consistency

---

## Files Modified

1. **fix-user-metadata-and-business.sql** (NEW)
   - Complete trigger and function definitions
   - Existing user migration
   - Verification queries

2. **apps/web/app/(auth)/sign-up/page.tsx**
   - Line 16: Changed default role to 'BUSINESS_OWNER'
   - Lines 143-146: Reordered role options

---

## Expected Auth User Metadata

After sign-up, `auth.users.raw_user_meta_data` should contain:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "role": "BUSINESS_OWNER",
  "businessId": "clxxx-uuid-xxxx-xxxx"
}
```

This allows `useRole()` hook and middleware to access:
- User role for authorization
- BusinessId for data scoping

---

## Database Schema Relationships

```
auth.users (Supabase Auth)
  ├─ raw_user_meta_data: { role, businessId }
  └─ id (authUserId)
       │
       ↓
public.users
  ├─ authUserId (references auth.users.id)
  ├─ role (UserRole enum)
  └─ id
       │
       ↓ (if role = BUSINESS_OWNER)
public.businesses
  └─ ownerId (references public.users.id) [UNIQUE]
```

---

## Verification Checklist

After implementation:

- [ ] SQL script runs without errors
- [ ] Trigger `on_auth_user_created` exists
- [ ] Existing BUSINESS_OWNER users have businesses
- [ ] New user sign-up defaults to "Business Owner"
- [ ] Test user sign-up completes successfully
- [ ] Test user has business record
- [ ] Test user's auth metadata contains businessId
- [ ] Dashboard loads without "No role detected" error
- [ ] Dashboard loads without "No businessId detected" error

---

## Rollback Plan

If issues occur, rollback by running:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Restore original trigger from fix-supabase-user-creation.sql
-- (See that file for the original implementation)
```

Then revert sign-up page changes:
```typescript
// Change back to:
role: 'CLIENT',
```

---

## Next Steps (Task 1.2 & 1.3)

After verifying Task 1.1 works:
1. Task 1.2: Fix undefined API_URL in hooks
2. Task 1.3: Fix token handling in hooks
3. Test complete dashboard functionality

---

## Testing Commands

### Check Trigger Status
```sql
SELECT
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;
```

### Test Business Creation
```sql
-- Count businesses per role
SELECT
  u.role,
  COUNT(*) as user_count,
  COUNT(b.id) as business_count
FROM users u
LEFT JOIN businesses b ON b."ownerId" = u.id
GROUP BY u.role;
```

### View All User Metadata
```sql
SELECT
  email,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

---

## Success Criteria

✅ Task 1.1 is complete when:
1. SQL trigger is installed and working
2. New BUSINESS_OWNER users get a business automatically
3. businessId is set in user_metadata
4. Existing users are migrated
5. Sign-up defaults to BUSINESS_OWNER
6. No console errors: "No role detected" or "No businessId detected"

---

## Support

If you encounter issues:
1. Check Supabase logs for trigger errors
2. Verify trigger exists: `\df public.handle_new_user` in psql
3. Check auth.users metadata is being updated
4. Ensure RLS policies allow business creation
