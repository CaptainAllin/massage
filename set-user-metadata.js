// Script to set user metadata (role and businessId) in Supabase
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

async function setUserMetadata() {
  try {
    console.log('Fetching users from database...\n');

    // Get all users with their business info
    const users = await prisma.user.findMany({
      include: {
        ownedBusiness: true,
        therapist: {
          include: {
            business: true,
          },
        },
        client: {
          include: {
            business: true,
          },
        },
      },
    });

    console.log(`Found ${users.length} users to update\n`);

    for (const user of users) {
      // Determine businessId
      let businessId = null;
      if (user.ownedBusiness) {
        businessId = user.ownedBusiness.id;
      } else if (user.therapist?.business) {
        businessId = user.therapist.business.id;
      } else if (user.client?.business) {
        businessId = user.client.business.id;
      }

      const metadata = {
        role: user.role,
        businessId: businessId,
        first_name: user.firstName,
        last_name: user.lastName,
      };

      console.log(`Updating ${user.email}...`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Business ID: ${businessId || 'N/A'}`);

      // Update user metadata in Supabase
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.authUserId,
        {
          user_metadata: metadata,
        }
      );

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Updated successfully`);
      }
      console.log('');
    }

    console.log('All users updated!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setUserMetadata();
