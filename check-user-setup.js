// Quick script to check user setup in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function checkUserSetup() {
  try {
    console.log('Checking database setup...\n');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        ownedBusiness: true,
        therapist: true,
        client: true,
      },
    });

    console.log(`Found ${users.length} user(s):\n`);
    users.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Auth User ID: ${user.authUserId}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Business Owner: ${user.ownedBusiness ? 'Yes (ID: ' + user.ownedBusiness.id + ')' : 'No'}`);
      console.log(`  - Therapist: ${user.therapist ? 'Yes' : 'No'}`);
      console.log(`  - Client: ${user.client ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Get all businesses
    const businesses = await prisma.business.findMany();
    console.log(`Found ${businesses.length} business(es):\n`);
    businesses.forEach(business => {
      console.log(`Business: ${business.name}`);
      console.log(`  - ID: ${business.id}`);
      console.log(`  - Owner ID: ${business.ownerId}`);
      console.log('');
    });

    // Get counts
    const clientCount = await prisma.client.count();
    const appointmentCount = await prisma.appointment.count();
    const therapistCount = await prisma.therapist.count();

    console.log('Database counts:');
    console.log(`  - Clients: ${clientCount}`);
    console.log(`  - Appointments: ${appointmentCount}`);
    console.log(`  - Therapists: ${therapistCount}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSetup();
