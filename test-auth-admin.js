require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$transaction([
      prisma.$executeRawUnsafe('SET LOCAL ROLE supabase_auth_admin;'),
      prisma.$executeRawUnsafe(`
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          raw_user_meta_data,
          aud,
          role
        ) VALUES (
          gen_random_uuid(),
          '00000000-0000-0000-0000-000000000000',
          'test-auth-admin2@example.com',
          'fake_password',
          '{"first_name": "Test", "last_name": "User", "role": "CLIENT"}'::jsonb,
          'authenticated',
          'authenticated'
        );
      `)
    ]);
    console.log("Success as supabase_auth_admin");
  } catch (e) {
    console.error("Error as supabase_auth_admin:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
