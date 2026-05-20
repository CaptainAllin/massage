#!/bin/bash

echo "🚀 Setting up Supabase..."
echo ""

# Fix npm permissions
echo "1️⃣ Fixing npm permissions..."
sudo chown -R $(whoami) ~/.npm
echo "✅ npm permissions fixed"
echo ""

# Install Supabase packages
echo "2️⃣ Installing Supabase packages..."
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
echo "✅ Supabase packages installed"
echo ""

# Remove Clerk packages
echo "3️⃣ Removing Clerk packages..."
npm uninstall @clerk/nextjs @clerk/backend clerk svix 2>/dev/null || echo "Clerk packages already removed"
echo "✅ Clerk packages removed"
echo ""

# Generate Prisma client
echo "4️⃣ Regenerating Prisma client..."
cd packages/database && npx prisma generate && cd ../..
echo "✅ Prisma client generated"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Supabase Dashboard → SQL Editor"
echo "2. Run the SQL from 'supabase-triggers.sql'"
echo "3. Test by starting the servers:"
echo "   - Backend: cd services/api && npm run dev"
echo "   - Frontend: cd apps/web && npm run dev"
echo ""
echo "🎉 You're ready to go!"
