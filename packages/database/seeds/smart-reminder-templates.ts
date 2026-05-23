/**
 * Seed script for Smart Reminder Prompt Templates
 * Stage 7 - Task 5: Smart Reminders
 *
 * Run this script to populate default AI prompt templates for smart reminders
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSmartReminderTemplates() {
  console.log('🌱 Seeding Smart Reminder prompt templates...');

  // Template 1: Personalized Reminder with Previous Treatment Context
  const template1 = await prisma.aIPromptTemplate.upsert({
    where: {
      id: 'smart-reminder-personalized-v1',
    },
    update: {},
    create: {
      id: 'smart-reminder-personalized-v1',
      name: 'Personalized Appointment Reminder',
      description:
        'Generate a warm, personalized appointment reminder that references client history',
      feature: 'SMART_REMINDER',
      template: `You are writing a friendly, professional appointment reminder for a massage therapy client.

Client Information:
- Name: {{clientName}}
- Therapist: {{therapistName}}
- Service: {{serviceType}}
- Business: {{businessName}}
{{#if previousTreatment}}- Previous Treatment: {{previousTreatment}}{{/if}}

Generate a warm, personalized appointment reminder SMS (max 160 characters) that:
1. Greets the client by first name
2. Mentions their therapist by name
3. Includes a helpful tip (hydration, comfortable clothing, etc.) if there's space
{{#if previousTreatment}}4. References their previous treatment if relevant{{/if}}

Make it friendly but professional. End with the business name.

Reminder:`,
      variables: {
        required: ['clientName', 'therapistName', 'serviceType', 'businessName'],
        optional: ['previousTreatment'],
      },
      provider: 'ANY',
      isDefault: true,
      isActive: true,
    },
  });

  // Template 2: High No-Show Risk Reminder
  const template2 = await prisma.aIPromptTemplate.upsert({
    where: {
      id: 'smart-reminder-high-risk-v1',
    },
    update: {},
    create: {
      id: 'smart-reminder-high-risk-v1',
      name: 'High No-Show Risk Reminder',
      description:
        'Generate a more assertive reminder for clients with high no-show risk',
      feature: 'SMART_REMINDER',
      template: `You are writing an appointment confirmation reminder for a massage therapy client who has a history of missed appointments.

Client Information:
- Name: {{clientName}}
- Therapist: {{therapistName}}
- Appointment Time: {{appointmentTime}}
- Business: {{businessName}}

Generate a professional but firm appointment reminder SMS (max 160 characters) that:
1. Addresses the client by first name
2. Clearly states the appointment time
3. Requests explicit confirmation (Reply YES to confirm)
4. Mentions the cancellation policy if needed

Be polite but direct. Make the call-to-action clear.

Reminder:`,
      variables: {
        required: [
          'clientName',
          'therapistName',
          'appointmentTime',
          'businessName',
        ],
        optional: ['cancellationPolicy'],
      },
      provider: 'ANY',
      isDefault: false,
      isActive: true,
    },
  });

  // Template 3: First-Time Client Reminder
  const template3 = await prisma.aIPromptTemplate.upsert({
    where: {
      id: 'smart-reminder-first-time-v1',
    },
    update: {},
    create: {
      id: 'smart-reminder-first-time-v1',
      name: 'First-Time Client Reminder',
      description: 'Generate a welcoming reminder for first-time clients',
      feature: 'SMART_REMINDER',
      template: `You are writing a welcoming appointment reminder for a first-time massage therapy client.

Client Information:
- Name: {{clientName}}
- Therapist: {{therapistName}}
- Appointment Time: {{appointmentTime}}
- Business: {{businessName}}

Generate a warm, welcoming appointment reminder SMS (max 160 characters) that:
1. Welcomes the client by first name
2. Mentions this is their first visit
3. Includes helpful arrival tips (arrive 10 mins early, bring comfortable clothes)
4. Creates excitement for their session

Be extra welcoming and reassuring. Set a positive tone.

Reminder:`,
      variables: {
        required: [
          'clientName',
          'therapistName',
          'appointmentTime',
          'businessName',
        ],
        optional: [],
      },
      provider: 'ANY',
      isDefault: false,
      isActive: true,
    },
  });

  // Template 4: Follow-Up Reminder (for returning clients)
  const template4 = await prisma.aIPromptTemplate.upsert({
    where: {
      id: 'smart-reminder-follow-up-v1',
    },
    update: {},
    create: {
      id: 'smart-reminder-follow-up-v1',
      name: 'Follow-Up Appointment Reminder',
      description: 'Generate a reminder for follow-up appointments',
      feature: 'SMART_REMINDER',
      template: `You are writing an appointment reminder for a massage therapy client returning for follow-up treatment.

Client Information:
- Name: {{clientName}}
- Therapist: {{therapistName}}
- Previous Issue: {{previousComplaint}}
- Days Since Last Visit: {{daysSinceLastVisit}}
- Business: {{businessName}}

Generate a caring appointment reminder SMS (max 160 characters) that:
1. Greets the client warmly
2. References their previous issue/treatment
3. Expresses looking forward to continuing their care
4. Includes the therapist's name

Be warm and show continuity of care.

Reminder:`,
      variables: {
        required: [
          'clientName',
          'therapistName',
          'previousComplaint',
          'daysSinceLastVisit',
          'businessName',
        ],
        optional: [],
      },
      provider: 'ANY',
      isDefault: false,
      isActive: true,
    },
  });

  console.log('✅ Created/updated 4 Smart Reminder prompt templates:');
  console.log(`  - ${template1.name}`);
  console.log(`  - ${template2.name}`);
  console.log(`  - ${template3.name}`);
  console.log(`  - ${template4.name}`);
}

async function main() {
  try {
    await seedSmartReminderTemplates();
    console.log('\n🎉 Smart Reminder templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding Smart Reminder templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedSmartReminderTemplates };
