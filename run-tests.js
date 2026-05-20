#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = envVars.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

console.log('🧪 Running Comprehensive Supabase Tests\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Test Configuration
let testsPassed = 0;
let testsFailed = 0;
let testUser = null;
let testSession = null;

// Helper functions
const success = (msg) => {
  console.log('✅', msg);
  testsPassed++;
};

const fail = (msg, error) => {
  console.log('❌', msg);
  if (error) console.log('   Error:', error.message);
  testsFailed++;
};

const info = (msg) => {
  console.log('ℹ️ ', msg);
};

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test Suite
async function runTests() {

  // ═══════════════════════════════════════════════════════════════
  console.log('📦 TEST 1: Configuration Check');
  console.log('───────────────────────────────────────────────────────────────\n');

  if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
    success('Supabase URL configured');
    info(`   ${supabaseUrl}`);
  } else {
    fail('Supabase URL not configured or invalid');
  }

  if (supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')) {
    success('Anon key configured');
  } else {
    fail('Anon key not configured or invalid');
  }

  if (supabaseServiceKey && supabaseServiceKey.startsWith('eyJ')) {
    success('Service role key configured');
  } else {
    fail('Service role key not configured or invalid');
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🔌 TEST 2: Database Connection');
  console.log('───────────────────────────────────────────────────────────────\n');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (!error) {
      success('Database connected successfully');
      info('   Can query users table');
    } else {
      fail('Database connection failed', error);
    }
  } catch (err) {
    fail('Database connection error', err);
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🔐 TEST 3: Authentication Service');
  console.log('───────────────────────────────────────────────────────────────\n');

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (!error) {
      success('Auth service operational');
      info(`   Current users in system: ${data.users.length}`);
    } else {
      fail('Auth service check failed', error);
    }
  } catch (err) {
    fail('Auth service error', err);
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('👤 TEST 4: User Sign Up');
  console.log('───────────────────────────────────────────────────────────────\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';

  info(`Creating test user: ${testEmail}`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'BUSINESS_OWNER'
        }
      }
    });

    if (!error && data.user) {
      success('User sign up successful');
      testUser = data.user;
      testSession = data.session;
      info(`   User ID: ${data.user.id}`);
      info(`   Email: ${data.user.email}`);
      info(`   Session created: ${data.session ? 'Yes' : 'No'}`);
    } else {
      fail('User sign up failed', error);
    }
  } catch (err) {
    fail('User sign up error', err);
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🔄 TEST 5: Database Trigger Verification');
  console.log('───────────────────────────────────────────────────────────────\n');

  if (testUser) {
    info('Waiting 2 seconds for triggers to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('authUserId', testUser.id)
        .single();

      if (!error && data) {
        success('Database trigger worked! User synced to users table');
        info(`   Database User ID: ${data.id}`);
        info(`   Auth User ID: ${data.authUserId}`);
        info(`   Email: ${data.email}`);
        info(`   First Name: ${data.firstName}`);
        info(`   Last Name: ${data.lastName}`);
        info(`   Role: ${data.role}`);
      } else {
        fail('User not found in database table', error);
        info('   ⚠️  Database triggers may not be set up correctly');
        info('   Run supabase-triggers.sql in Supabase SQL Editor');
      }
    } catch (err) {
      fail('Error checking database sync', err);
    }
  } else {
    info('⏭️  Skipping (no test user created)');
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🔑 TEST 6: User Sign In');
  console.log('───────────────────────────────────────────────────────────────\n');

  if (testUser) {
    try {
      // Sign out first
      await supabase.auth.signOut();

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (!error && data.session) {
        success('User sign in successful');
        testSession = data.session;
        info(`   Access token received: ${data.session.access_token.substring(0, 20)}...`);
        info(`   Token expires in: ${data.session.expires_in} seconds`);
      } else {
        fail('User sign in failed', error);
      }
    } catch (err) {
      fail('User sign in error', err);
    }
  } else {
    info('⏭️  Skipping (no test user to sign in)');
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🌐 TEST 7: Backend API Connection (Optional)');
  console.log('───────────────────────────────────────────────────────────────\n');

  info('Checking if backend is running...');

  try {
    const response = await axios.get(`${apiUrl.replace('/api/v1', '')}/health`, {
      timeout: 3000
    });

    success(`Backend is running on ${apiUrl}`);
    info(`   Health check status: ${response.status}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      info('⚠️  Backend not running (this is OK for testing)');
      info('   Start with: cd services/api && npm run dev');
    } else {
      info('⚠️  Could not connect to backend');
      info(`   ${err.message}`);
    }
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🔐 TEST 8: API Authentication (Optional)');
  console.log('───────────────────────────────────────────────────────────────\n');

  if (testSession) {
    info('Testing authenticated API request...');

    try {
      const response = await axios.get(`${apiUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${testSession.access_token}`
        },
        timeout: 3000
      });

      success('Authenticated API request successful');
      info(`   Response status: ${response.status}`);
      info(`   User data retrieved: ${response.data ? 'Yes' : 'No'}`);
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        info('⚠️  Backend not running (start it to test API auth)');
      } else {
        info('⚠️  API request failed (backend may need to be started)');
        info(`   ${err.message}`);
      }
    }
  } else {
    info('⏭️  Skipping (no session available)');
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('🧹 TEST 9: Cleanup');
  console.log('───────────────────────────────────────────────────────────────\n');

  if (testUser) {
    info('Cleaning up test user...');

    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);

      if (!error) {
        success('Test user deleted successfully');
      } else {
        info('⚠️  Could not delete test user (manual cleanup needed)');
      }
    } catch (err) {
      info('⚠️  Cleanup error (test user may still exist)');
    }
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your Supabase setup is working perfectly!\n');
    console.log('📋 Next steps:');
    console.log('   1. Start backend: cd services/api && npm run dev');
    console.log('   2. Start frontend: cd apps/web && npm run dev');
    console.log('   3. Visit: http://localhost:3000/sign-up');
    console.log('   4. Create your first real user!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    console.log('📋 Common fixes:');
    console.log('   - Run supabase-triggers.sql in Supabase SQL Editor');
    console.log('   - Check .env has correct credentials');
    console.log('   - Verify Supabase project is active\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
