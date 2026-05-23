# Authentication Fix Guide

## Problem
You have a corrupted/stale session cookie that's preventing you from accessing sign-in/sign-up pages. The middleware thinks you're authenticated and redirects you to dashboard, but the session is invalid.

---

## 🚀 Quick Fix (Choose ONE method)

### Method 1: Browser Script (Fastest)
1. Open `clear-cookies.html` in your browser
2. Click "Clear All Cookies & Storage"
3. You'll be automatically redirected to sign-in

### Method 2: Direct URL
1. Visit: `http://localhost:3000/auth/clear-session`
2. This will clear your session and redirect to sign-in

### Method 3: Browser Console (Manual)
1. Open your app in browser (any page)
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Paste and run:
```javascript
// Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear storage
localStorage.clear();
sessionStorage.clear();

// Redirect
window.location.href = '/sign-in';
```

### Method 4: Browser DevTools (Manual)
1. Open DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "Cookies" in left sidebar
4. Click on `http://localhost:3000`
5. Right-click → "Clear all from localhost:3000"
6. Expand "Local Storage" → Clear it
7. Expand "Session Storage" → Clear it
8. Refresh page and go to `/sign-in`

---

## 🔧 Changes Made to Prevent This

### 1. Created Clear Session Route
**File:** `apps/web/app/auth/clear-session/route.ts`

This route:
- Properly signs out from Supabase
- Clears all auth cookies
- Redirects to sign-in page

### 2. Updated Middleware
**File:** `apps/web/middleware.ts`

Changes:
- Added `/auth/clear-session` to public routes
- Added session error handling
- If session is corrupted, auto-redirect to clear-session

### 3. Created Browser Script
**File:** `clear-cookies.html`

A standalone HTML file you can open to clear cookies without running the server.

---

## ✅ After Clearing Session

You should now be able to:
1. ✅ Access `http://localhost:3000/sign-in`
2. ✅ Access `http://localhost:3000/sign-up`
3. ✅ Sign up for a new account
4. ✅ Sign in with existing account
5. ✅ Sign out properly using the dashboard button

---

## 🧪 Testing Sign-Up Flow

After clearing your session:

1. **Sign Up**
   ```
   http://localhost:3000/sign-up
   ```
   - Default role should be "Business Owner"
   - Fill in: First Name, Last Name, Email, Password
   - Click "Sign up"

2. **Verify in Dashboard**
   - Should redirect to `/dashboard`
   - Sidebar should appear with menu items
   - User menu should show your name
   - No console errors

3. **Check Database** (if you ran the SQL script)
   - User created in `public.users`
   - Business created in `public.businesses`
   - businessId in user metadata

---

## 🐛 If Still Having Issues

### Check 1: Verify Server is Running
```bash
cd apps/web
npm run dev
```

### Check 2: Check Console Logs
Open browser console and look for:
```
[MIDDLEWARE] ...
[AUTH PROVIDER] ...
```

### Check 3: Verify Environment Variables
```bash
cat apps/web/.env.local
```

Should have:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Check 4: Check Middleware Logs
In your terminal running the dev server, you should see:
```
[MIDDLEWARE] { path: '/sign-in', hasSession: false, ... }
```

---

## 🔄 Sign-Out Not Working?

If the dashboard "Sign Out" button doesn't work:

### Option 1: Use Clear Session URL
```
http://localhost:3000/auth/clear-session
```

### Option 2: Check Browser Console
When you click "Sign Out", check console for errors:
```javascript
[AUTH PROVIDER] State change: { event: 'SIGNED_OUT', ... }
[AUTH PROVIDER] Navigating to sign-in...
```

---

## 📋 Complete Flow After Fix

### Normal Sign-Out Flow
1. Click "Sign Out" button in dashboard header
2. `useAuth().signOut()` is called
3. Supabase clears session
4. AuthProvider detects SIGNED_OUT event
5. Router navigates to `/sign-in`
6. Middleware allows access (no session)

### Normal Sign-In Flow
1. Visit `/sign-in`
2. Middleware checks session (none found)
3. Allows access to sign-in page
4. Enter credentials and submit
5. Supabase creates session
6. AuthProvider detects SIGNED_IN event
7. Router navigates to `/dashboard`
8. Middleware allows access (session exists)

---

## 🎯 Next Steps After Authentication Works

Once you can sign in/sign up/sign out properly:

1. **Run SQL Script** (if not done yet)
   - File: `fix-user-metadata-and-business.sql`
   - Run in Supabase SQL Editor
   - This enables automatic business creation

2. **Test Complete Flow**
   - Sign up new user
   - Verify business is created
   - Check dashboard loads properly

3. **Continue with Phase 1 Tasks**
   - Task 1.2: Fix API_URL
   - Task 1.3: Fix token handling

---

## 💡 Pro Tips

1. **Development Mode**: Keep browser DevTools open to catch auth issues early

2. **Clear Cache**: If weird behavior persists:
   ```
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

3. **Incognito/Private Mode**: Test in incognito to verify it works with clean state

4. **Multiple Browsers**: Test in different browsers to rule out browser-specific issues

---

## ⚠️ Common Mistakes to Avoid

1. ❌ Don't manually edit cookies in DevTools (use clear-session route)
2. ❌ Don't have multiple tabs open during auth testing
3. ❌ Don't refresh during auth redirects
4. ❌ Don't skip clearing localStorage/sessionStorage

---

## 🆘 Emergency Reset

If NOTHING works, nuclear option:

```bash
# Stop dev server (Ctrl+C)

# Clear Next.js cache
rm -rf apps/web/.next

# Restart
cd apps/web
npm run dev
```

Then use Method 1, 2, or 3 above to clear cookies.
