require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      SELECT COALESCE((NULL::jsonb->>'role')::public."UserRole", 'CLIENT');
    `);
    console.log("Success with NULL jsonb");
  } catch (e) {
    console.error("Error with NULL jsonb:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
