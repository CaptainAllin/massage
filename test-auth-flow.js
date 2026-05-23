const axios = require('axios');

// Test authentication flow
async function testAuth() {
  console.log('Testing API authentication...\n');

  // First, test without token (should get 401)
  console.log('1. Testing without authentication token:');
  try {
    const response = await axios.get('http://localhost:3001/api/v1/appointments');
    console.log('  ❌ Unexpected success:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('  ✓ Correctly returned 401 Unauthorized');
    } else {
      console.log('  ❌ Unexpected error:', error.response?.status || error.message);
    }
  }

  // Now test with a token from the browser
  console.log('\n2. To test with authentication:');
  console.log('  - Open test-token.html in your browser');
  console.log('  - Copy the access_token value');
  console.log('  - Run: curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/appointments');

  console.log('\n3. Frontend should now be working:');
  console.log('  - Refresh your browser at http://localhost:3000');
  console.log('  - The 401 errors should be resolved');
  console.log('  - Check the browser console for any remaining errors');
}

testAuth();
