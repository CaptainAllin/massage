# Wellness CRM - Setup & Verification Guide

This guide will walk you through setting up the Wellness CRM platform and verifying that all components work correctly.

## ✅ Pre-Setup Checklist

Before starting, ensure you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 10+ installed (`npm --version`)
- [ ] Docker Desktop installed and running
- [ ] A Clerk account (sign up at [clerk.com](https://clerk.com))
- [ ] A code editor (VS Code recommended)

## 📝 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd /Users/amit/Desktop/Apps/massage
npm install
```

**Expected output**: Installation should complete without errors. You'll see messages about installing packages for the monorepo.

### Step 2: Setup Clerk Authentication

1. **Create a Clerk Application**
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Click "Add application"
   - Name it "Wellness CRM"
   - Choose authentication methods (Email + Password recommended)
   - Click "Create application"

2. **Get Your API Keys**
   - In the Clerk dashboard, go to "API Keys"
   - Copy the **Publishable Key** (starts with `pk_test_`)
   - Copy the **Secret Key** (starts with `sk_test_`)

3. **Setup Webhook for User Sync**
   - In Clerk dashboard, go to "Webhooks"
   - Click "Add Endpoint"
   - **Endpoint URL**: `http://localhost:3001/api/v1/webhooks/clerk` (for local dev)
   - **Subscribe to events**: `user.created`, `user.updated`, `user.deleted`
   - Click "Create"
   - Copy the **Signing Secret** (starts with `whsec_`)

   **Note**: For local development with webhooks, you'll need to use a tunneling service like [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.github.io/www/) to expose your local server. Update the webhook URL with the public URL once you have it.

### Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Open .env in your editor and fill in the values
```

Your `.env` should look like this:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wellness_crm_dev?schema=public"

# Clerk Authentication (from Step 2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
FRONTEND_URL=http://localhost:3000

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=change_this_to_a_random_32_plus_character_string

# Node Environment
NODE_ENV=development
```

### Step 4: Start PostgreSQL Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Verify it's running
docker ps
```

**Expected output**: You should see a container named `wellness-crm-postgres` with status "Up"

```
CONTAINER ID   IMAGE                COMMAND                  STATUS          PORTS
abc123def456   postgres:16-alpine   "docker-entrypoint.s…"   Up 10 seconds   0.0.0.0:5432->5432/tcp
```

### Step 5: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate
```

**Expected output**:
- `db:generate`: "Generated Prisma Client"
- `db:migrate`: Migration files applied successfully

You can optionally run the seed script:

```bash
npm run db:seed
```

This creates a super admin user in the database (for testing purposes).

### Step 6: Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

**Expected output**: Both servers should start successfully:

```
web:0: ready - started server on 0.0.0.0:3000
api:0: 🚀 API server is running on http://localhost:3001/api/v1
api:0: 📚 API documentation is available at http://localhost:3001/api/docs
```

## 🧪 Verification Tests

### Test 1: Frontend Loads ✅

**Steps**:
1. Open browser and go to http://localhost:3000
2. You should see the landing page with "Practice Management for Wellness Professionals"
3. The page should have sage green colors and Poppins fonts

**Expected result**: Landing page loads without errors, shows proper styling

### Test 2: API Health Check ✅

**Steps**:
1. Open browser and go to http://localhost:3001/api/v1/health
2. You should see JSON response

**Expected result**:
```json
{
  "success": true,
  "message": "Wellness CRM API is running",
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

### Test 3: API Documentation ✅

**Steps**:
1. Open browser and go to http://localhost:3001/api/docs
2. You should see Swagger UI with API endpoints

**Expected result**: Swagger documentation loads showing all endpoints (users, businesses, clients, therapists, appointments)

### Test 4: Sign Up Flow ✅

**Steps**:
1. Go to http://localhost:3000
2. Click "Get Started Free" or "Sign Up"
3. Enter email and password
4. Complete sign-up process

**Expected result**:
- Clerk sign-up form appears with wellness theme colors
- After sign-up, redirected to `/dashboard`
- Dashboard shows welcome message with your name

**Troubleshooting**:
- If webhook fails, user won't be created in database. Check webhook logs in Clerk dashboard.
- For local development, set up ngrok to make webhooks work:
  ```bash
  # In a new terminal
  ngrok http 3001

  # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
  # Update Clerk webhook to: https://abc123.ngrok.io/api/v1/webhooks/clerk
  ```

### Test 5: Database User Sync ✅

**Steps**:
1. After signing up, open Prisma Studio:
   ```bash
   npm run db:studio
   ```
2. Navigate to http://localhost:5555
3. Click on "User" table
4. You should see your user record

**Expected result**: User exists in database with:
- `authProviderId` matching Clerk user ID
- Email address
- First and last name
- Role set to `CLIENT` (default)
- `createdAt` timestamp

### Test 6: Role Assignment ✅

**Steps**:
1. Go to Clerk Dashboard → Users
2. Click on your user
3. Scroll to "Public metadata"
4. Click "Edit"
5. Add JSON: `{ "role": "BUSINESS_OWNER" }`
6. Save
7. Refresh your browser on the dashboard

**Expected result**:
- Sidebar now shows all menu items (Dashboard, Appointments, Clients, etc.)
- Your role shows as BUSINESS_OWNER in the dashboard card

### Test 7: Navigation & RBAC ✅

**Steps**:
1. As BUSINESS_OWNER, verify sidebar shows all items
2. Click through each menu item:
   - Dashboard → Shows stats cards
   - Appointments → Empty state
   - Clients → Empty state
   - Intake Forms → Empty state
   - Messages → Coming soon message
   - Payments → Coming soon message
   - Promotions → Coming soon message
   - Analytics → Coming soon message
   - Therapists → Empty state
   - Settings → Settings cards

**Expected result**: All pages load without errors, showing appropriate empty states

### Test 8: API Authentication ✅

**Steps**:
1. Open browser DevTools (F12)
2. Go to Application → Cookies → localhost:3000
3. Find `__session` cookie (Clerk session)
4. Try calling API endpoint:

```bash
# In terminal, get your Clerk session token from browser
# Then test API call (replace TOKEN with actual token)

curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/v1/users/me
```

**Expected result**: Returns your user profile JSON

### Test 9: Create Business ✅

**Steps**:
1. Make sure you're logged in as BUSINESS_OWNER
2. Use API docs at http://localhost:3001/api/docs
3. Find `POST /businesses` endpoint
4. Click "Try it out"
5. Enter data:
   ```json
   {
     "name": "My Wellness Clinic",
     "email": "clinic@example.com",
     "phoneNumber": "555-0100",
     "address": "123 Main St",
     "city": "San Francisco",
     "state": "CA",
     "postalCode": "94102"
   }
   ```
6. Click "Execute"

**Expected result**:
- Status 201 Created
- Response with business object including `id`
- Check Prisma Studio to verify business record exists

### Test 10: RBAC Enforcement ✅

**Steps**:
1. Change user role to CLIENT in Clerk
2. Refresh dashboard
3. Try accessing http://localhost:3000/appointments

**Expected result**:
- Sidebar should not show or should filter items
- Access to certain pages might be restricted

To verify API-level RBAC:
```bash
# Try accessing clients endpoint as CLIENT (should fail)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/v1/clients?businessId=YOUR_BUSINESS_ID
```

**Expected result**: 403 Forbidden error

## 🎯 Success Criteria

You've successfully completed setup if:

- [x] PostgreSQL is running in Docker
- [x] Database migrations applied successfully
- [x] Frontend loads at http://localhost:3000
- [x] API responds at http://localhost:3001/api/v1
- [x] Can sign up and sign in with Clerk
- [x] User is created in database after sign-up
- [x] Can change role in Clerk and see sidebar update
- [x] Can navigate through all dashboard pages
- [x] API authentication works with JWT tokens
- [x] RBAC prevents unauthorized access

## 🐛 Common Issues & Solutions

### Issue: "Port 3000 is already in use"

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Issue: "Cannot connect to PostgreSQL"

**Solution**:
```bash
# Check if Docker is running
docker ps

# Restart PostgreSQL
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs postgres
```

### Issue: "Prisma Client is not generated"

**Solution**:
```bash
npm run db:generate
```

### Issue: "Clerk webhook not working"

**Solution**:
1. For local development, use ngrok:
   ```bash
   ngrok http 3001
   ```
2. Update webhook URL in Clerk to ngrok URL
3. Make sure API server is running
4. Check webhook logs in Clerk dashboard for errors

### Issue: "User not created in database after sign-up"

**Solution**:
1. Check Clerk webhook is configured correctly
2. Check API server logs for webhook errors
3. Verify `CLERK_WEBHOOK_SECRET` is correct in `.env`
4. Make sure ngrok is running (for local dev)

### Issue: "API returns 401 Unauthorized"

**Solution**:
1. Make sure you're logged in to Clerk
2. Check if session token is being sent in Authorization header
3. Verify `CLERK_SECRET_KEY` is correct in `.env`
4. Try logging out and back in

## 📊 Database Schema Verification

Open Prisma Studio to verify all tables exist:

```bash
npm run db:studio
```

You should see these tables:
- ✅ users
- ✅ businesses
- ✅ therapists
- ✅ clients
- ✅ appointments
- ✅ intake_forms
- ✅ treatment_notes
- ✅ audit_logs

## 🎉 Next Steps

Once everything is verified:

1. **Explore the codebase** - Look at the modular structure
2. **Read the PRD** - See the full roadmap in `/docs/prd.md`
3. **Plan Stage 2A** - Client Profiles + Intake Forms is next
4. **Customize the design** - Update colors in `packages/config-tailwind`
5. **Add more users** - Invite team members via Clerk

## 📚 Additional Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **NestJS Documentation**: https://docs.nestjs.com
- **Turborepo Documentation**: https://turbo.build/repo/docs

---

**Stage 1 Foundation Setup Complete!** 🚀

If you've completed all verification tests, you're ready to start building features in Stage 2!
