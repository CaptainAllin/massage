# Clerk to Supabase Migration Checklist

## 🎯 Quick Summary

**Decision**: Migrate from Clerk to Supabase
**Reason**: Unified system (auth + DB + storage + realtime)
**Timeline**: 10-12 days
**Cost**: Same as Clerk ($0 MVP, ~$25/mo production)

---

## 📅 Day-by-Day Plan

### Day 1: Setup & Preparation

#### Morning (4 hours)
- [ ] Create Supabase account at supabase.com
- [ ] Create new project (name: `wellness-crm-production`)
- [ ] Choose region closest to users (US East, EU West, etc.)
- [ ] Save credentials in password manager:
  - [ ] Project URL
  - [ ] Anon key
  - [ ] Service role key
  - [ ] Database password
- [ ] Create `.env.backup` of current environment variables

#### Afternoon (4 hours)
- [ ] Install Supabase dependencies:
  ```bash
  pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
  ```
- [ ] Remove Clerk dependencies:
  ```bash
  pnpm remove @clerk/nextjs @clerk/backend clerk svix
  ```
- [ ] Update `.env` files with Supabase credentials
- [ ] Read `MIGRATION_PLAN.md` thoroughly
- [ ] Create new Git branch: `git checkout -b migration/clerk-to-supabase`

---

### Day 2: Database Migration

#### Morning (4 hours)
- [ ] Create Prisma migration to rename `authProviderId` → `authUserId`:
  ```bash
  cd packages/database
  npx prisma migrate dev --name rename_auth_provider_to_auth_user
  ```
- [ ] Edit migration file to add:
  ```sql
  ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";
  ```
- [ ] Point `DATABASE_URL` to Supabase database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify schema in Supabase dashboard

#### Afternoon (4 hours)
- [ ] Open Supabase SQL Editor
- [ ] Create database triggers (copy from `MIGRATION_PLAN.md` Phase 2.3)
  - [ ] `handle_new_user()` function
  - [ ] `on_auth_user_created` trigger
  - [ ] `handle_user_update()` function
  - [ ] `on_auth_user_updated` trigger
  - [ ] `handle_user_delete()` function
  - [ ] `on_auth_user_deleted` trigger
- [ ] Test triggers by creating test user in Supabase Auth
- [ ] Verify user appears in `public.users` table

---

### Day 3: Backend - Part 1

#### Morning (4 hours)
- [ ] Create `services/api/src/common/supabase/` folder
- [ ] Create `supabase.service.ts` (copy from `MIGRATION_PLAN.md`)
- [ ] Create `supabase.module.ts` (copy from `MIGRATION_PLAN.md`)
- [ ] Add `SupabaseModule` to `app.module.ts` imports
- [ ] Update environment variables in NestJS:
  ```typescript
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-key
  ```

#### Afternoon (4 hours)
- [ ] Replace `services/api/src/auth/strategies/jwt.strategy.ts`
  - [ ] Copy new implementation from `MIGRATION_PLAN.md`
  - [ ] Update imports
  - [ ] Change `authProviderId` → `authUserId`
- [ ] Update `auth.module.ts` to import `SupabaseModule`
- [ ] Test JWT strategy with Postman/Thunder Client

---

### Day 4: Backend - Part 2

#### Morning (4 hours)
- [ ] Delete `services/api/src/auth/webhooks/clerk-webhook.controller.ts`
- [ ] Update `auth.module.ts` to remove webhook controller
- [ ] Search codebase for `authProviderId` references:
  ```bash
  grep -r "authProviderId" services/api/src/
  ```
- [ ] Replace all with `authUserId`
- [ ] Update all service files that query User model

#### Afternoon (4 hours)
- [ ] Run all backend tests: `pnpm test`
- [ ] Fix any failing tests
- [ ] Start backend: `pnpm dev`
- [ ] Verify no errors in console
- [ ] Test API endpoints with Postman

---

### Day 5: Frontend - Part 1

#### Morning (4 hours)
- [ ] Create `apps/web/lib/supabase/` folder
- [ ] Create `client.ts` (copy from `MIGRATION_PLAN.md`)
- [ ] Replace `apps/web/middleware.ts` with Supabase version
- [ ] Update `apps/web/lib/api-client.ts`:
  - [ ] Replace Clerk session with Supabase session
  - [ ] Update token retrieval logic
  - [ ] Update sign-out redirect

#### Afternoon (4 hours)
- [ ] Delete `apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- [ ] Delete `apps/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- [ ] Create new `apps/web/app/(auth)/sign-in/page.tsx` (copy from `MIGRATION_PLAN.md`)
- [ ] Create new `apps/web/app/(auth)/sign-up/page.tsx` (copy from `MIGRATION_PLAN.md`)
- [ ] Test sign-in/sign-up pages locally

---

### Day 6: Frontend - Part 2

#### Morning (4 hours)
- [ ] Create `apps/web/components/providers/AuthProvider.tsx`
- [ ] Update `apps/web/app/layout.tsx` to include `AuthProvider`
- [ ] Search for Clerk hooks in codebase:
  ```bash
  grep -r "useAuth\|useUser\|useClerk" apps/web/
  ```
- [ ] Replace with Supabase `useAuth` hook

#### Afternoon (4 hours)
- [ ] Update `packages/auth/src/useRole.ts` if needed
- [ ] Test authentication flow:
  - [ ] Sign up
  - [ ] Sign in
  - [ ] Session persistence
  - [ ] Sign out
- [ ] Fix any console errors
- [ ] Verify token passed to API correctly

---

### Day 7: Storage Setup

#### Morning (4 hours)
- [ ] Open Supabase Storage in dashboard
- [ ] Create buckets (run SQL from `FILE_STORAGE.md`):
  - [ ] `profiles` (public)
  - [ ] `documents` (private)
  - [ ] `progress-photos` (private)
  - [ ] `branding` (public)
- [ ] Enable RLS on storage.objects table

#### Afternoon (4 hours)
- [ ] Create storage RLS policies (copy from `FILE_STORAGE.md`)
  - [ ] Profile images policies (4 policies)
  - [ ] Documents policies (3 policies)
  - [ ] Progress photos policies (2 policies)
  - [ ] Branding policies (2 policies)
- [ ] Test policies by uploading test files
- [ ] Verify access control works

---

### Day 8: Storage Implementation

#### Morning (4 hours)
- [ ] Create `services/api/src/common/storage/storage.service.ts`
- [ ] Create `services/api/src/common/storage/storage.module.ts`
- [ ] Add `StorageModule` to `app.module.ts`
- [ ] Implement upload endpoints in relevant controllers

#### Afternoon (4 hours)
- [ ] Create `apps/web/components/FileUpload.tsx`
- [ ] Add file upload to client profile page
- [ ] Test file uploads from frontend
- [ ] Verify files appear in Supabase Storage dashboard
- [ ] Test image transformations

---

### Day 9: Row Level Security (RLS)

#### Morning (4 hours)
- [ ] Enable RLS on all tables:
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
  -- etc.
  ```
- [ ] Create RLS policies for `users` table (2 policies)
- [ ] Create RLS policies for `businesses` table (3 policies)
- [ ] Test with different user roles

#### Afternoon (4 hours)
- [ ] Create RLS policies for `clients` table (3 policies)
- [ ] Create RLS policies for `appointments` table (3 policies)
- [ ] Create RLS policies for `treatment_notes` table (3 policies)
- [ ] Create RLS policies for `therapist_notes` table (2 policies)
- [ ] Test all policies with Supabase SQL editor

---

### Day 10: Testing - Part 1

#### Morning (4 hours)
- [ ] **Authentication Testing**
  - [ ] Sign up with CLIENT role
  - [ ] Sign up with THERAPIST role
  - [ ] Sign up with RECEPTIONIST role
  - [ ] Sign up with BUSINESS_OWNER role
  - [ ] Password reset flow
  - [ ] Session persistence across page reloads

#### Afternoon (4 hours)
- [ ] **Authorization Testing**
  - [ ] Business owner can see their business data
  - [ ] Therapist can see their business clients
  - [ ] Receptionist can see business data
  - [ ] Client can only see their own data
  - [ ] Users blocked from other businesses' data

---

### Day 11: Testing - Part 2

#### Morning (4 hours)
- [ ] **API Integration Testing**
  - [ ] All endpoints return data with Supabase token
  - [ ] Unauthorized requests return 401
  - [ ] Token refresh works correctly
  - [ ] Concurrent requests don't break auth

#### Afternoon (4 hours)
- [ ] **Data Sync Testing**
  - [ ] Create user in Supabase Auth
  - [ ] Verify appears in `public.users`
  - [ ] Update user email
  - [ ] Verify updates in `public.users`
  - [ ] Delete user
  - [ ] Verify deleted from `public.users`

---

### Day 12: Final Testing & Deployment

#### Morning (4 hours)
- [ ] **End-to-End Testing**
  - [ ] Complete user journey: Sign up → Create business → Add client → Book appointment
  - [ ] Upload files and verify access control
  - [ ] Test all major features
  - [ ] Check for console errors
  - [ ] Test on mobile browser

#### Afternoon (4 hours)
- [ ] **Cleanup & Documentation**
  - [ ] Remove all Clerk references from code
  - [ ] Update README.md with new setup instructions
  - [ ] Update SETUP_GUIDE.md
  - [ ] Create migration notes in CHANGELOG.md
  - [ ] Commit all changes
  - [ ] Create pull request
  - [ ] Deploy to staging (if available)

---

## 🧪 Testing Checklist

### Authentication ✅
- [ ] Sign up (email/password)
- [ ] Sign in (email/password)
- [ ] Sign out
- [ ] Session persistence
- [ ] Password reset
- [ ] Email confirmation (if enabled)
- [ ] Token refresh
- [ ] Multiple tabs/windows

### Authorization ✅
- [ ] Super Admin sees everything
- [ ] Business Owner sees their business only
- [ ] Receptionist sees business data
- [ ] Therapist sees assigned clients only
- [ ] Client sees only their data
- [ ] Cross-business access blocked

### API Integration ✅
- [ ] GET requests with auth token
- [ ] POST requests with auth token
- [ ] PUT requests with auth token
- [ ] DELETE requests with auth token
- [ ] 401 errors trigger sign out
- [ ] Token included in all requests

### Storage ✅
- [ ] Upload profile image
- [ ] View profile image (public)
- [ ] Upload client document (private)
- [ ] View client document with signed URL
- [ ] Upload progress photo
- [ ] Upload business logo
- [ ] Image transformations work
- [ ] RLS policies enforced

### RLS Policies ✅
- [ ] Users can read own profile
- [ ] Users cannot read other profiles
- [ ] Business owners see their data
- [ ] Staff see business data
- [ ] Clients see only their data
- [ ] Therapist notes are private

---

## 🚨 Common Issues & Fixes

### Issue: "JWT expired" errors
**Solution:**
```typescript
// In middleware.ts, ensure token refresh
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  await supabase.auth.refreshSession();
}
```

### Issue: RLS blocks all queries
**Solution:**
- Check policies use `auth.uid()` correctly
- Verify user is authenticated
- Check EXISTS clauses join correctly
- Test with `USING (true)` temporarily to debug

### Issue: User not found after signup
**Solution:**
- Check database triggers are created
- Verify trigger functions have no errors
- Check Supabase logs for trigger execution
- Manually test trigger:
  ```sql
  SELECT handle_new_user();
  ```

### Issue: CORS errors
**Solution:**
- Add Supabase URL to CORS whitelist
- Check API URL matches environment variable
- Verify anon key is correct

### Issue: File uploads fail
**Solution:**
- Check bucket exists and RLS is enabled
- Verify storage policies are correct
- Check file size limits
- Verify content-type is allowed

---

## 📊 Success Metrics

Migration is successful when:

- [ ] All tests pass (100%)
- [ ] No Clerk references in code
- [ ] No console errors
- [ ] Authentication flows work smoothly
- [ ] Authorization enforced correctly
- [ ] File uploads/downloads work
- [ ] Performance is same or better
- [ ] User experience is seamless

---

## 🎉 Post-Migration Tasks

After successful migration:

1. **Update Documentation**
   - [ ] README.md
   - [ ] CONTRIBUTING.md
   - [ ] API documentation
   - [ ] Setup guides

2. **Monitor for Issues**
   - [ ] Check error logs daily for 1 week
   - [ ] Monitor Supabase dashboard
   - [ ] Watch for auth errors
   - [ ] Track storage usage

3. **Optimize**
   - [ ] Add database indexes if needed
   - [ ] Configure cache headers for storage
   - [ ] Set up monitoring/alerts
   - [ ] Review RLS policy performance

4. **Plan Next Features**
   - [ ] Real-time calendar updates (Stage 3)
   - [ ] Real-time messaging (Stage 4)
   - [ ] AI integration (Stage 7)

---

## 📞 Need Help?

### Resources
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Migration Guide**: `docs/MIGRATION_PLAN.md`
- **Storage Guide**: `docs/FILE_STORAGE.md`

### Debug Steps
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Check NestJS server logs
4. Test with Supabase SQL Editor
5. Verify RLS policies with `EXPLAIN`

---

## 🔄 Rollback Plan

If migration fails, follow `MIGRATION_PLAN.md` section "Rollback Plan":

1. Revert Git: `git checkout main && git reset --hard <commit>`
2. Restore database: `psql $DATABASE_URL < backup.sql`
3. Reinstall Clerk: `pnpm add @clerk/nextjs @clerk/backend clerk`
4. Restore .env: `cp .env.backup .env`
5. Restart services: `pnpm dev`

**Estimated rollback time**: 1 hour

---

## ✅ Final Checklist Before Going Live

- [ ] All tests pass
- [ ] No console errors
- [ ] Authentication works
- [ ] Authorization works
- [ ] File uploads work
- [ ] RLS policies tested
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Backup created
- [ ] Rollback plan ready
- [ ] Team trained on new auth system
- [ ] Monitoring configured

---

**Ready to start? Begin with Day 1!** 🚀

Create a backup first:
```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Backup .env
cp .env .env.backup

# Create migration branch
git checkout -b migration/clerk-to-supabase
git push -u origin migration/clerk-to-supabase
```

Good luck! 🎉
