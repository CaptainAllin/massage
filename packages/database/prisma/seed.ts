import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create a super admin user (will be linked to Clerk later)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@wellness-crm.com' },
    update: {},
    create: {
      email: 'admin@wellness-crm.com',
      authProviderId: 'seed_super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('Created super admin:', superAdmin);

  console.log('Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during database seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
