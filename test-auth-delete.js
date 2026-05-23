require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error('List error:', listError);
  
  const testUsers = users.users.filter(u => u.email.includes('test-'));
  if (testUsers.length === 0) return console.log('No test users found.');

  const userId = testUsers[0].id;
  console.log('Attempting to delete user:', testUsers[0].email, userId);
  
  const { data, error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Error deleting user:', error);
  } else {
    console.log('Successfully deleted user');
  }
}
main();
