require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.users (
        id,
        "authUserId",
        email,
        "firstName",
        "lastName",
        role,
        "phoneNumber",
        "profileImageUrl",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        gen_random_uuid()::text,
        'test-error@example.com',
        'Test',
        'User',
        'CLIENT'::public."UserRole",
        '1234567890',
        NULL,
        NOW(),
        NOW()
      )
    `);
    console.log("Success");
  } catch (e) {
    console.error("Error inserting:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
