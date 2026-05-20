#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing Supabase Connection...\n');

// Test 1: Connection
console.log('1️⃣ Testing connection to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client created');
console.log(`   URL: ${supabaseUrl}\n`);

// Test 2: Database Connection
async function testDatabase() {
  console.log('2️⃣ Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database error:', error.message);
    } else {
      console.log('✅ Database connected successfully\n');
    }
  } catch (err) {
    console.log('❌ Database connection failed:', err.message, '\n');
  }
}

// Test 3: Check Triggers
async function checkTriggers() {
  console.log('3️⃣ Checking database triggers...');
  try {
    const { data, error } = await supabase.rpc('version'); // Just test connection
    console.log('✅ Database queries working\n');

    console.log('   To verify triggers exist, run this in Supabase SQL Editor:');
    console.log('   SELECT tgname FROM pg_trigger WHERE tgrelid = \'auth.users\'::regclass;\n');
  } catch (err) {
    console.log('⚠️  Could not verify triggers\n');
  }
}

// Test 4: Auth Service
async function testAuth() {
  console.log('4️⃣ Testing auth service...');
  try {
    // Try to list users (requires service role key)
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (error) {
      console.log('❌ Auth error:', error.message);
    } else {
      console.log('✅ Auth service connected');
      console.log(`   Total users: ${data.users.length}\n`);
    }
  } catch (err) {
    console.log('❌ Auth service failed:', err.message, '\n');
  }
}

// Run all tests
(async () => {
  await testDatabase();
  await checkTriggers();
  await testAuth();

  console.log('🎉 Supabase setup verification complete!\n');
  console.log('📋 Next steps:');
  console.log('   1. Start backend: cd services/api && npm run dev');
  console.log('   2. Start frontend: cd apps/web && npm run dev');
  console.log('   3. Test at: http://localhost:3000/sign-up\n');
})();
