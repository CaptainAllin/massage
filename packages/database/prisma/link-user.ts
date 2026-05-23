import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔗 Link Your Supabase Account to Seeded Business\n');

  // Get current logged-in user's Supabase ID
  const supabaseUserId = await question(
    'Enter your Supabase User ID (from your account): '
  );

  if (!supabaseUserId || supabaseUserId.trim() === '') {
    console.error('❌ Error: Supabase User ID is required');
    process.exit(1);
  }

  console.log('\n🔍 Checking for existing test business...');

  // Find the test user and business
  const testUser = await prisma.user.findFirst({
    where: { email: 'test@test.com' },
    include: { ownedBusiness: true },
  });

  if (!testUser) {
    console.error('❌ Error: No test user found. Run seed script first: npm run seed');
    process.exit(1);
  }

  console.log(`✓ Found test business: ${testUser.ownedBusiness?.name}`);
  console.log(`\n🔄 Updating user ${testUser.email} with your Supabase ID...`);

  // Update the test user with the actual Supabase ID
  const updatedUser = await prisma.user.update({
    where: { id: testUser.id },
    data: {
      authUserId: supabaseUserId.trim(),
    },
  });

  console.log(`✅ Successfully linked!`);
  console.log(`\n📊 Your Account Details:`);
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   Auth ID: ${updatedUser.authUserId}`);
  console.log(`   Role: ${updatedUser.role}`);
  console.log(`   Business: ${testUser.ownedBusiness?.name}`);
  console.log(`\n✨ You can now log in and see all the seeded data!`);

  rl.close();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
