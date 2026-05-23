# Sidebar Not Showing - Issue & Fix

## The Problem

Your dashboard appears basic with no sidebar or menu items because **your user account doesn't have a role assigned** in Supabase.

## Why This Happens

The Sidebar component filters menu items based on the user's role:

```typescript
// If userRole is null, NO menu items show
const filteredMenuItems = menuItems.filter((item) => {
  if (!userRole) return false;  // ← This hides all menu items!
  return item.allowedRoles.includes(userRole);
});
```

## Diagnosis Steps

1. **Open your app** at http://localhost:3000
2. **Sign in** to your account
3. **Check the dashboard** - you should now see a "Debug Information" card showing your role status
4. If it says "NO ROLE ASSIGNED" - that's the issue!

## The Fix

### Option 1: Update Role in Supabase (RECOMMENDED)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this query (replace with your email):

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "BUSINESS_OWNER"}'::jsonb
WHERE email = 'your-email@example.com';
```

4. **Sign out and sign back in** to your app
5. The sidebar should now appear!

### Option 2: Use the Fix Script

1. Open `/fix-user-role.sql` in your project
2. Edit line 7: Replace `'your-email@example.com'` with your actual email
3. Copy the entire SQL query
4. Go to Supabase SQL Editor and run it
5. Sign out and sign back in

### Option 3: Create a New Account with Role

1. Sign out of your current account
2. Go to `/sign-up` page
3. Create a new account and **select a role** from the dropdown:
   - **BUSINESS_OWNER** - Full access (recommended)
   - **RECEPTIONIST** - Limited admin access
   - **THERAPIST** - Can create treatment notes
   - **CLIENT** - Client-only access

## Available Roles

| Role | Access Level | Can See |
|------|--------------|---------|
| `SUPER_ADMIN` | Everything | All features |
| `BUSINESS_OWNER` | Full admin | Dashboard, Clients, Appointments, Intake Forms, Messages, Payments, Promotions, Analytics, Reports, Exports, Therapists, Settings |
| `RECEPTIONIST` | Limited admin | Dashboard, Clients, Appointments, Intake Forms, Messages, Payments, Analytics, Reports, Exports, Settings |
| `THERAPIST` | Provider | Dashboard, Appointments, Clients, Intake Forms, Settings |
| `CLIENT` | End user | Limited client portal access |

## Sidebar Menu Items

Once you have a role assigned, you'll see these menu items:

- **Dashboard** - Overview with stats
- **Appointments** - Calendar and scheduling
- **Clients** - Client management
- **Intake Forms** - Form submissions and templates
- **Messages** - Communication center
- **Payments** - Payment tracking
- **Promotions** - Marketing campaigns (BUSINESS_OWNER only)
- **Analytics** - Business analytics
- **Reports** - Custom reports
- **Exports** - Data export tools
- **Therapists** - Staff management (BUSINESS_OWNER only)
- **Settings** - Account settings

## Pages That Already Exist

All these pages are already built and ready to use:

```
/dashboard           ✅ Main dashboard
/appointments        ✅ Appointment management
/clients             ✅ Client list
/clients/[id]        ✅ Client profile with tabs
/intake-forms        ✅ Form submissions
/intake-forms/new    ✅ Submit new form
/messages            ✅ Communication
/payments            ✅ Payment tracking
/payments/[id]       ✅ Payment details
/invoices            ✅ Invoice management
/invoices/[id]       ✅ Invoice details
/memberships         ✅ Membership plans
/memberships/[id]    ✅ Membership details
/packages            ✅ Package management
/packages/[id]       ✅ Package details
/promotions          ✅ Marketing campaigns
/analytics           ✅ Business analytics
/reports             ✅ Custom reports
/exports             ✅ Data exports
/therapists          ✅ Staff management
/treatment-notes     ✅ SOAP notes
/treatment-notes/new ✅ Create SOAP note
/settings            ✅ Account settings
```

## After Fixing

Once you've assigned a role and signed back in, you should see:

1. ✅ **Sidebar** on the left with menu items
2. ✅ **Header** at the top with your name and role
3. ✅ **Working navigation** to all pages
4. ✅ **Role-based access** - some features hidden based on your role

## Verify It's Working

After applying the fix:

1. Refresh the page or sign out/in
2. You should see the sidebar with menu items
3. Click on different menu items to navigate
4. The dashboard "Debug Information" card should show your role
5. Try accessing different pages like:
   - `/clients` - Client management
   - `/appointments` - Appointments
   - `/intake-forms` - Forms
   - `/payments` - Payments

## Still Not Working?

If the sidebar still doesn't show after assigning a role:

1. **Check browser console** (F12 → Console tab) for errors
2. **Clear your browser cache** and localStorage
3. **Sign out completely** and sign back in
4. **Verify the role update** in Supabase:
   ```sql
   SELECT email, raw_user_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```
5. **Check the debug card** on the dashboard - it should show your role and user metadata

## Technical Details

- **Auth Hook**: `useAuth()` from `@massage/auth` package
- **Role Hook**: `useRole()` extracts role from `user?.user_metadata?.role`
- **Sidebar Component**: `packages/ui/src/Sidebar.tsx`
- **Layout**: `apps/web/app/(dashboard)/layout.tsx`
- **Role Types**: Defined in `@massage/types` as `UserRole` enum

## Need More Help?

If you're still having issues:

1. Check the console output from the dev server
2. Look for authentication errors
3. Verify Supabase connection is working
4. Check that the database migrations have run
5. Ensure the `handle_new_user()` trigger exists in Supabase

---

**Quick Fix Command:**

```sql
-- Run this in Supabase SQL Editor (replace your email)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "BUSINESS_OWNER"}'::jsonb
WHERE email = 'YOUR_EMAIL_HERE';
```

Then **sign out and sign back in** to see the changes!
