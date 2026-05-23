# Fix Supabase User Creation Error

## Problem
Getting error: **"Failed to create user: Database error creating new user"**

## Root Cause
The database triggers that sync `auth.users` with `public.users` are either:
- Not installed
- Using the wrong column name (`authProviderId` vs `authUserId`)
- Broken or outdated

## Solution

### Step 1: Apply the SQL Fix

Go to your **Supabase Dashboard**:
1. Open https://supabase.com/dashboard
2. Select your project: `cuflcxidcnwzlqdwdexr`
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file: `fix-supabase-user-creation.sql`
6. Copy ALL contents and paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

You should see success messages indicating:
- ✅ Column renamed (if needed)
- ✅ Triggers created
- ✅ Functions created

### Step 2: Test User Creation

After applying the fix, test manually:

1. In Supabase Dashboard, go to **Authentication → Users**
2. Click **Add User**
3. Fill in:
   - **Email**: test@example.com
   - **Password**: TestPassword123!
   - **Confirm email**: Yes
   - **User Metadata** (optional):
     ```json
     {
       "first_name": "Test",
       "last_name": "User",
       "role": "CLIENT"
     }
     ```
4. Click **Create User**

✅ If successful, the user will be created in both:
- `auth.users` (Supabase Auth)
- `public.users` (Your application database)

### Step 3: Verify in SQL Editor

Run this query to verify:

```sql
-- Check the latest user
SELECT
  u.id,
  u."authUserId",
  u.email,
  u."firstName",
  u."lastName",
  u.role,
  u."createdAt"
FROM public.users u
ORDER BY u."createdAt" DESC
LIMIT 5;
```

You should see your newly created user with proper data.

## What the Fix Does

1. **Renames column if needed**: `authProviderId` → `authUserId`
2. **Drops old triggers**: Removes any broken/outdated triggers
3. **Creates new triggers**:
   - `on_auth_user_created` - Syncs new users from auth to public
   - `on_auth_user_updated` - Syncs user updates
   - `on_auth_user_deleted` - Cascades user deletions
4. **Grants permissions**: Ensures triggers have proper access

## Common Issues

### Issue: "permission denied for schema auth"
**Solution**: You're not using the service role key. Make sure you're logged in as the project owner in the Supabase Dashboard.

### Issue: SQL query runs but user creation still fails
**Solution**:
1. Check the Supabase logs: Dashboard → Logs → Postgres Logs
2. Look for specific error messages
3. The trigger functions now include error logging

### Issue: Column "authProviderId" does not exist
**Solution**: This is expected! The fix script handles this automatically.

## Need More Help?

If you're still having issues after running the fix:

1. Check Supabase Postgres Logs:
   - Dashboard → Logs → Postgres Logs
   - Look for errors during user creation

2. Verify triggers exist:
   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgrelid = 'auth.users'::regclass;
   ```

3. Test the trigger function directly:
   ```sql
   -- This will show any errors in the trigger
   SELECT proname, pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'handle_new_user';
   ```

## Success!

Once the fix is applied, you should be able to:
- ✅ Create users manually in Supabase Dashboard
- ✅ Create users via Supabase Auth API
- ✅ Sign up users through your application
- ✅ See users automatically synced to `public.users` table
