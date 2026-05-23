const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnosing Supabase Configuration\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check if users table exists and its structure
    console.log('\n1️⃣  Checking users table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'users'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('   ⚠️  Cannot query table structure (trying direct query)');

      // Try a simpler approach
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (testError) {
        console.log('   ❌ Users table error:', testError.message);
      } else {
        console.log('   ✓ Users table exists and is accessible');
      }
    } else {
      console.log('   ✓ Users table structure:');
      columns.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });
    }

    // Test 2: Check if triggers exist
    console.log('\n2️⃣  Checking for triggers...');
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT tgname AS trigger_name
          FROM pg_trigger
          WHERE tgrelid = 'auth.users'::regclass
            AND tgname IN ('on_auth_user_created', 'on_auth_user_updated', 'on_auth_user_deleted');
        `
      });

    if (triggersError) {
      console.log('   ⚠️  Cannot query triggers (likely permission issue)');
    } else if (triggers && triggers.length > 0) {
      console.log('   ✓ Found triggers:');
      triggers.forEach(t => console.log(`     - ${t.trigger_name}`));
    } else {
      console.log('   ❌ No triggers found - this is likely the issue!');
    }

    // Test 3: Try to create a test user
    console.log('\n3️⃣  Testing user creation via Supabase Admin API...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'CLIENT'
      }
    });

    if (createError) {
      console.log('   ❌ Failed to create user:', createError.message);
      console.log('\n   📋 Common causes:');
      console.log('      1. Triggers not installed (run supabase-triggers.sql)');
      console.log('      2. Database migration not applied');
      console.log('      3. Column name mismatch (authProviderId vs authUserId)');
    } else {
      console.log('   ✓ User created successfully in auth.users');
      console.log('   ✓ User ID:', newUser.user.id);

      // Check if user was created in public.users
      const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('authUserId', newUser.user.id)
        .single();

      if (publicError) {
        console.log('   ❌ User NOT created in public.users table');
        console.log('   ⚠️  This confirms the trigger is not working!');
      } else {
        console.log('   ✓ User also created in public.users table');
      }

      // Cleanup
      await supabase.auth.admin.deleteUser(newUser.user.id);
      console.log('   ✓ Test user cleaned up');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnosis complete\n');
}

diagnose().catch(console.error);
