# Migration Status - Clerk to Supabase

## ✅ Completed (By Claude)

### Git & Backup
- ✅ Created `.env.backup` (your original Clerk config)
- ✅ Initialized Git repository
- ✅ Created migration branch: `migration/clerk-to-supabase`
- ✅ Committed initial state (commit: `91aa5ef`)

### Documentation Created
- ✅ `MIGRATION_PLAN.md` - Complete technical guide
- ✅ `FILE_STORAGE.md` - Storage strategy & implementation
- ✅ `MIGRATION_CHECKLIST.md` - 12-day task breakdown
- ✅ `QUICK_REFERENCE.md` - Quick command reference
- ✅ `SUPABASE_SUMMARY.md` - Executive summary
- ✅ `SETUP_INSTRUCTIONS.md` - Step-by-step setup guide

### Files Created
- ✅ `.env.supabase` - Template for Supabase environment variables
- ✅ `supabase-triggers.sql` - Database triggers for auth sync
- ✅ Updated `schema.prisma` - Changed `authProviderId` → `authUserId`

---

## 📋 What YOU Need to Do Next

### Step 1: Fix NPM Permissions
```bash
# Run this to fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Verify it works
npm --version
```

### Step 2: Install Supabase Packages
```bash
# Install Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Remove Clerk
npm uninstall @clerk/nextjs @clerk/backend clerk svix
```

### Step 3: Create Supabase Account & Project

**Go to**: https://supabase.com

1. Sign up (use GitHub for faster setup)
2. Click "New Project"
3. Fill in:
   - **Name**: `wellness-crm-production`
   - **Database Password**: Generate & SAVE IT!
   - **Region**: Choose closest to you (e.g., `us-east-1`)
4. Click "Create new project"
5. Wait 2-3 minutes

### Step 4: Get Your Credentials

Once project is ready:

**Go to**: Project Settings → API

Copy these values:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbG...` (starts with eyJ)
- **service_role key**: `eyJhbG...` (SECRET!)

**Go to**: Project Settings → Database

Copy:
- **Connection string (URI)**: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

### Step 5: Update Environment Variables

Open `.env.supabase` and replace:
- `YOUR_PROJECT_ID` with your actual project ID
- `YOUR_ANON_KEY_HERE` with your anon key
- `YOUR_SERVICE_ROLE_KEY_HERE` with your service role key
- `[YOUR-PASSWORD]` with your database password

Then:
```bash
# Replace your .env
cp .env .env.clerk-backup  # One more backup
cp .env.supabase .env       # Use Supabase config
```

### Step 6: Migrate Database

```bash
cd packages/database

# Create migration
npx prisma migrate dev --name rename_auth_provider_to_auth_user
```

This will create a new migration file. **IMPORTANT**: Edit it!

Open the file at:
`packages/database/prisma/migrations/[timestamp]_rename_auth_provider_to_auth_user/migration.sql`

Add this at the **TOP** of the file:
```sql
-- Rename authProviderId to authUserId
ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";
```

Then apply:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 7: Create Database Triggers

1. Go to Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New query"
4. Open `supabase-triggers.sql` (in project root)
5. Copy entire file contents
6. Paste into SQL Editor
7. Click "Run" (or Cmd+Enter)

You should see: ✅ Success message with 3 functions and 3 triggers created

### Step 8: Verify Setup

In Supabase SQL Editor, run:
```sql
-- Check triggers exist
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;
```

Should show 3 triggers:
- `on_auth_user_created`
- `on_auth_user_updated`
- `on_auth_user_deleted`

---

## 🎯 Current Status

**Completed**: 30% of Day 1 setup

**Next**: Complete Steps 1-8 above

**Time Estimate**: 1-2 hours

**After You Complete**: We'll move to Day 2 (Backend Migration)

---

## 📂 Files You Have

```
massage/
├── .env                    # Your current (Clerk) config
├── .env.backup             # Backup of original .env
├── .env.supabase           # Template for Supabase config ← EDIT THIS
├── supabase-triggers.sql   # SQL to run in Supabase ← RUN THIS
├── MIGRATION_STATUS.md     # ← YOU ARE HERE
├── docs/
│   ├── SETUP_INSTRUCTIONS.md      # Detailed setup guide
│   ├── MIGRATION_PLAN.md          # Full technical plan
│   ├── MIGRATION_CHECKLIST.md     # Day-by-day tasks
│   ├── FILE_STORAGE.md            # Storage strategy
│   ├── QUICK_REFERENCE.md         # Quick commands
│   └── SUPABASE_SUMMARY.md        # Executive summary
└── packages/database/
    └── prisma/
        └── schema.prisma   # ← Already updated! (authUserId)
```

---

## 🚀 Quick Start (If You're Ready)

```bash
# 1. Fix npm
sudo chown -R $(whoami) ~/.npm

# 2. Install packages
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm uninstall @clerk/nextjs @clerk/backend clerk svix

# 3. Create Supabase project at https://supabase.com

# 4. Update .env.supabase with your credentials

# 5. Use new .env
cp .env.supabase .env

# 6. Migrate database
cd packages/database
npx prisma migrate dev --name rename_auth_provider_to_auth_user
# Edit the migration file (add ALTER TABLE line)
npx prisma migrate deploy
npx prisma generate

# 7. Run supabase-triggers.sql in Supabase SQL Editor

# 8. Verify triggers exist

# ✅ Done with Day 1!
```

---

## 📊 Migration Progress

```
[████████░░░░░░░░░░░░░░░░░░] 30%

Day 1: Setup & Preparation (30% done)
├── ✅ Git & backups
├── ✅ Documentation created
├── ✅ Files prepared
├── ⏳ Install Supabase packages (YOU)
├── ⏳ Create Supabase project (YOU)
├── ⏳ Update .env (YOU)
├── ⏳ Migrate database (YOU)
└── ⏳ Create triggers (YOU)

Day 2-3: Database & Triggers (0%)
Day 4-6: Backend Migration (0%)
Day 7-9: Frontend & Storage (0%)
Day 10-12: Testing & Deploy (0%)
```

---

## 🤔 Questions?

### "Which file should I read first?"
Start with `docs/SETUP_INSTRUCTIONS.md` - it's a detailed walkthrough of Steps 1-8.

### "I'm confused about the .env files"
You have 3 .env files:
- `.env` - Current config (Clerk)
- `.env.backup` - Backup of Clerk config
- `.env.supabase` - Template (edit this, then rename to .env)

### "Do I need to backup my database?"
If you have important data, yes:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### "Can I rollback if something goes wrong?"
Yes! Your original code is in commit `91aa5ef`:
```bash
git checkout main
git reset --hard 91aa5ef
cp .env.backup .env
```

### "How long will this take?"
- Steps 1-8 above: 1-2 hours
- Full migration: 10-12 days

---

## 💡 Tips

1. **Do one step at a time** - Don't skip ahead
2. **Save your Supabase password** - You'll need it!
3. **Test after each step** - Easier to debug
4. **Read error messages** - They're usually helpful
5. **Check Supabase logs** - Dashboard → Logs shows everything

---

## 🎉 When You're Done with Steps 1-8

Come back and tell me:
- ✅ "Supabase project created"
- ✅ "Environment variables updated"
- ✅ "Database migrated"
- ✅ "Triggers working"

Then we'll continue with **Day 2: Backend Migration**!

---

**Need help?** Check `docs/SETUP_INSTRUCTIONS.md` for detailed guidance.

**Ready to start?** Begin with Step 1 above! 🚀
