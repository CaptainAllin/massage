const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const authUserId = '063b04a5-0891-4f86-8a71-f54afed38f28';

  console.log('Looking for user with authUserId:', authUserId);

  const user = await prisma.user.findUnique({
    where: { authUserId }
  });

  if (user) {
    console.log('✅ User found in database:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('❌ User NOT found in database');
    console.log('\nAll users in database:');
    const allUsers = await prisma.user.findMany();
    console.log(JSON.stringify(allUsers, null, 2));
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
