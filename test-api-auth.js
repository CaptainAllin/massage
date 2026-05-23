const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = 'https://cuflcxidcnwzlqdwdexr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZmxjeGlkY253emxxZHdkZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjE5MzQsImV4cCI6MjA5NDgzNzkzNH0.A37CJQ4lDQ5_tw_0o_YLAYKu3_Y2sYqOrKRwtiHJ3l0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    // Sign in with test credentials
    console.log('Signing in to Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@test.com',
      password: 'BestTherapy7788' // Using the same password from DATABASE_URL
    });

    if (error) {
      console.error('❌ Supabase sign in error:', error);
      return;
    }

    console.log('✅ Signed in successfully');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Access Token (first 50 chars):', data.session.access_token.substring(0, 50) + '...');

    // Try to make an API request
    console.log('\nMaking API request to /api/v1/appointments...');
    try {
      const response = await axios.get('http://localhost:3001/api/v1/appointments', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      console.log('✅ API request successful:', response.status);
      console.log('Response data:', response.data);
    } catch (apiError) {
      console.error('❌ API request failed:');
      console.error('Status:', apiError.response?.status);
      console.error('Status Text:', apiError.response?.statusText);
      console.error('Error data:', apiError.response?.data);
      console.error('Headers:', apiError.response?.headers);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuth();
