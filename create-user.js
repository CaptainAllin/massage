const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const authUserId = '063b04a5-0891-4f86-8a71-f54afed38f28';

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { authUserId }
  });

  if (existingUser) {
    console.log('User already exists:', existingUser.email);
    return existingUser;
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      authUserId,
      role: 'BUSINESS_OWNER',
      firstName: 'Test',
      lastName: 'User',
    }
  });

  console.log('✓ Created user:', user.email);
  return user;
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
