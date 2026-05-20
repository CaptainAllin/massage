# Supabase Setup Instructions - Step by Step

## ✅ What We've Done So Far

- ✅ Created backup: `.env.backup`
- ✅ Initialized Git repository
- ✅ Created migration branch: `migration/clerk-to-supabase`
- ✅ Committed initial state

---

## 🔧 Step 1: Fix NPM Permissions (If Needed)

If you got an npm permission error, run:

```bash
sudo chown -R $(whoami) ~/.npm
```

Then verify:
```bash
npm --version
```

---

## 📦 Step 2: Install Supabase Dependencies

Run these commands:

```bash
# Install Supabase packages
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Remove Clerk packages
npm uninstall @clerk/nextjs @clerk/backend clerk svix
```

---

## 🌐 Step 3: Create Supabase Project

### 3.1 Sign Up for Supabase

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

### 3.2 Create New Project

1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Project Name**: `wellness-crm-production`
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users:
     - US: `us-east-1` (N. Virginia) or `us-west-1` (California)
     - EU: `eu-west-1` (Ireland) or `eu-central-1` (Frankfurt)
     - Asia: `ap-southeast-1` (Singapore) or `ap-northeast-1` (Tokyo)
   - **Pricing Plan**: Free (for now)

4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

### 3.3 Get Your Credentials

Once project is ready:

1. Go to Project Settings → API
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ SECRET!)

3. Go to Project Settings → Database
4. Copy **Connection string** (URI format)
   - Should look like: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

---

## 🔐 Step 4: Update Environment Variables

I've created a new `.env.supabase` file for you. Let's update it:

### 4.1 Fill in Your Supabase Credentials

Open `.env.supabase` and replace the placeholder values with your actual Supabase credentials from Step 3.

### 4.2 When Ready, Replace Your .env

```bash
# Backup current .env (already done, but just in case)
cp .env .env.clerk-backup

# Use new Supabase env
cp .env.supabase .env
```

---

## 🗄️ Step 5: Migrate Database to Supabase

### 5.1 Update DATABASE_URL

Your `.env` should now point to Supabase database:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 5.2 Create Prisma Migration

```bash
cd packages/database

# Create migration to rename column
npx prisma migrate dev --name rename_auth_provider_to_auth_user
```

This will create a new migration file. You'll need to edit it manually.

### 5.3 Edit the Migration File

Open the newly created migration file at:
`packages/database/prisma/migrations/[timestamp]_rename_auth_provider_to_auth_user/migration.sql`

Add this at the TOP of the file:
```sql
-- Rename authProviderId to authUserId
ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";
```

### 5.4 Apply Migration

```bash
# Apply the migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## 🔄 Step 6: Create Database Triggers

### 6.1 Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New query"

### 6.2 Run Trigger Setup Script

I've created a file `supabase-triggers.sql` for you.

Copy the contents and paste into Supabase SQL Editor, then click "Run".

This creates:
- `handle_new_user()` - Syncs new users from auth to public.users
- `handle_user_update()` - Syncs user updates
- `handle_user_delete()` - Handles user deletion

---

## ✅ Step 7: Verify Database Setup

### 7.1 Check Tables Exist

In Supabase Dashboard → Table Editor, you should see:
- users
- businesses
- therapists
- clients
- appointments
- treatment_notes
- (and all other tables)

### 7.2 Test Trigger

In SQL Editor, run:
```sql
-- Check if triggers exist
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;
```

You should see 3 triggers:
- `on_auth_user_created`
- `on_auth_user_updated`
- `on_auth_user_deleted`

---

## 🎉 Next Steps

Once you complete these 7 steps:

1. ✅ NPM permissions fixed
2. ✅ Supabase packages installed
3. ✅ Supabase project created
4. ✅ Credentials saved
5. ✅ Environment variables updated
6. ✅ Database migrated
7. ✅ Triggers created

**You're ready for Day 2!**

Continue with `MIGRATION_CHECKLIST.md` → Day 2

---

## 🚨 Troubleshooting

### Problem: npm permission error
**Solution**:
```bash
sudo chown -R $(whoami) ~/.npm
# Or use sudo for the install
sudo npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Problem: Prisma migration fails
**Solution**:
```bash
# Reset database and start fresh
npx prisma migrate reset
npx prisma migrate deploy
```

### Problem: Can't connect to Supabase database
**Solution**:
- Check DATABASE_URL is correct
- Verify password doesn't have special characters (URL encode if needed)
- Check IP is allowed (Supabase allows all by default)

### Problem: Triggers don't work
**Solution**:
- Check triggers exist: `SELECT * FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;`
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
- Run the SQL script again

---

## 📞 Need Help?

- Check: `MIGRATION_PLAN.md` for detailed technical guide
- Check: `MIGRATION_CHECKLIST.md` for day-by-day tasks
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

---

**Current Status**: Setup Phase Complete ✅

**Next**: Continue with backend migration (Day 3-4)
