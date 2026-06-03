import {
  PrismaClient,
  UserRole,
  AppointmentStatus,
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  MembershipStatus,
  PackageStatus,
  AnalyticsSnapshotType,
  ReportType,
  ReportSchedule,
  AIFeature,
  VoiceNoteStatus,
  VideoSessionStatus,
  PromotionChannel,
  PromotionStatus,
  InsuranceClaimStatus,
  ReimbursementStatus,
  GroupBookingStatus,
  WaitlistStatus,
  AccountingProvider,
  AccountingStatus,
  SyncDirection,
  SyncLogStatus,
  ExportFormat,
  ExportStatus,
  ScheduleFrequency,
  AIProvider,
  MessageChannel,
  MessageLogStatus,
  TaskPriority,
  TaskStatus,
  CommunityTemplateStatus,
  PayrollStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Configuration — override via env vars to seed against your real account
// ---------------------------------------------------------------------------
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'test@test.com';
const OWNER_AUTH_ID = process.env.OWNER_AUTH_ID || 'seed_test_user_001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysAhead(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function setHour(date: Date, hour: number) {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting comprehensive database seed...');
  console.log(`Owner email: ${OWNER_EMAIL}`);

  // ── 1. Business Owner ────────────────────────────────────────────────────
  const ownerUser = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { role: UserRole.BUSINESS_OWNER, phoneNumber: '0412 345 678' },
    create: {
      email: OWNER_EMAIL,
      authUserId: OWNER_AUTH_ID,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: UserRole.BUSINESS_OWNER,
      phoneNumber: '0412 345 678',
      profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${OWNER_EMAIL}`,
    },
  });
  console.log('✓ Owner:', ownerUser.email);

  // ── 2. Business ──────────────────────────────────────────────────────────
  const business = await prisma.business.upsert({
    where: { ownerId: ownerUser.id },
    update: {
      phoneNumber: '03 9123 4567',
      address: '45 Collins Street, Level 8',
      city: 'Melbourne',
      state: 'VIC',
      postalCode: '3000',
      country: 'AU',
    },
    create: {
      name: 'Serenity Wellness Clinic',
      email: 'info@serenitywellness.com',
      phoneNumber: '03 9123 4567',
      address: '45 Collins Street, Level 8',
      city: 'Melbourne',
      state: 'VIC',
      postalCode: '3000',
      country: 'AU',
      website: 'https://serenitywellness.com',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=serenity',
      primaryColor: '#A8C3A0',
      secondaryColor: '#E7D8C9',
      subscriptionTier: 'PRO',
      subscriptionStatus: 'ACTIVE',
      ownerId: ownerUser.id,
    },
  });
  console.log('✓ Business:', business.name);

  // ── 3. Therapists (3) ────────────────────────────────────────────────────
  const therapistDefs = [
    {
      email: 'sarah.johnson@serenity.com',
      authId: 'seed_therapist_001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '0421 567 890',
      specializations: ['Deep Tissue', 'Swedish Massage', 'Sports Massage'],
      bio: 'Licensed massage therapist with 10+ years in therapeutic bodywork and sports rehab.',
      license: 'VIC-MT-12345',
      licenseExpiry: new Date('2026-12-31'),
      rate: 120,
    },
    {
      email: 'mike.chen@serenity.com',
      authId: 'seed_therapist_002',
      firstName: 'Mike',
      lastName: 'Chen',
      phone: '0434 678 901',
      specializations: ['Prenatal Massage', 'Hot Stone', 'Aromatherapy'],
      bio: 'Specializing in prenatal and relaxation techniques. Certified hot stone practitioner.',
      license: 'VIC-MT-67890',
      licenseExpiry: new Date('2027-06-30'),
      rate: 110,
    },
    {
      email: 'lisa.martinez@serenity.com',
      authId: 'seed_therapist_003',
      firstName: 'Lisa',
      lastName: 'Martinez',
      phone: '0447 789 012',
      specializations: ['Reflexology', 'Thai Massage', 'Lymphatic Drainage'],
      bio: 'Holistic practitioner trained in Thai massage and manual lymphatic drainage therapy.',
      license: 'VIC-MT-24680',
      licenseExpiry: new Date('2027-03-31'),
      rate: 115,
    },
  ];

  const therapists: any[] = [];
  for (const def of therapistDefs) {
    const u = await prisma.user.upsert({
      where: { authUserId: def.authId },
      update: { email: def.email, firstName: def.firstName, lastName: def.lastName, phoneNumber: def.phone },
      create: {
        email: def.email,
        authUserId: def.authId,
        firstName: def.firstName,
        lastName: def.lastName,
        role: UserRole.THERAPIST,
        phoneNumber: def.phone,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${def.firstName}`,
      },
    });
    const t = await prisma.therapist.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        businessId: business.id,
        specializations: def.specializations,
        bio: def.bio,
        licenseNumber: def.license,
        licenseExpiry: def.licenseExpiry,
        hourlyRate: def.rate,
        isActive: true,
      },
    });
    therapists.push(t);
  }
  console.log('✓ Therapists:', therapists.length);

  // ── 4. Therapist Availability ────────────────────────────────────────────
  for (const therapist of therapists) {
    for (const day of [1, 2, 3, 4, 5]) {
      const existing = await prisma.therapistAvailability.findFirst({
        where: { therapistId: therapist.id, dayOfWeek: day },
      });
      if (!existing) {
        await prisma.therapistAvailability.create({
          data: {
            businessId: business.id,
            therapistId: therapist.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
          },
        });
      }
    }
    // Saturday for first two therapists
    if (therapists.indexOf(therapist) < 2) {
      const existing = await prisma.therapistAvailability.findFirst({
        where: { therapistId: therapist.id, dayOfWeek: 6 },
      });
      if (!existing) {
        await prisma.therapistAvailability.create({
          data: {
            businessId: business.id,
            therapistId: therapist.id,
            dayOfWeek: 6,
            startTime: '10:00',
            endTime: '15:00',
            isActive: true,
          },
        });
      }
    }
  }
  console.log('✓ Therapist availability');

  // ── 5. Clients (15) ──────────────────────────────────────────────────────
  const clientDefs = [
    { first: 'Emma', last: 'Williams', email: 'emma.williams@example.com', phone: '0412 111 201', dob: new Date('1988-03-14'), job: 'Software Engineer', goals: 'Reduce back pain from desk work', allergies: [], meds: [], physician: 'Dr. Smith' },
    { first: 'James', last: 'Brown', email: 'james.brown@example.com', phone: '0423 222 202', dob: new Date('1975-07-22'), job: 'Construction Manager', goals: 'Manage shoulder injury and improve range of motion', allergies: ['Peanuts'], meds: ['Aspirin'], physician: 'Dr. Jones' },
    { first: 'Olivia', last: 'Davis', email: 'olivia.davis@example.com', phone: '0434 333 203', dob: new Date('1992-11-05'), job: 'Graphic Designer', goals: 'Relieve neck tension and headaches', allergies: ['Lavender oil'], meds: [], physician: 'Dr. Smith' },
    { first: 'Noah', last: 'Miller', email: 'noah.miller@example.com', phone: '0445 444 204', dob: new Date('1983-01-30'), job: 'Accountant', goals: 'General relaxation, stress relief', allergies: [], meds: ['Ibuprofen'], physician: 'Dr. Patel' },
    { first: 'Sophia', last: 'Garcia', email: 'sophia.garcia@example.com', phone: '0456 555 205', dob: new Date('1995-06-18'), job: 'Nurse Practitioner', goals: 'Prenatal care, relaxation', allergies: [], meds: ['Prenatal vitamins'], physician: 'Dr. Lee' },
    { first: 'Liam', last: 'Wilson', email: 'liam.wilson@example.com', phone: '0467 666 206', dob: new Date('1980-09-12'), job: 'Personal Trainer', goals: 'Sports recovery, muscle maintenance', allergies: [], meds: [], physician: 'Dr. Kim' },
    { first: 'Ava', last: 'Taylor', email: 'ava.taylor@example.com', phone: '0478 777 207', dob: new Date('1990-04-25'), job: 'Teacher', goals: 'Stress reduction, improve sleep quality', allergies: ['Eucalyptus oil'], meds: [], physician: 'Dr. Smith' },
    { first: 'William', last: 'Anderson', email: 'william.anderson@example.com', phone: '03 9008 0208', dob: new Date('1968-12-08'), job: 'Retired', goals: 'Manage arthritis pain, maintain mobility', allergies: [], meds: ['Metformin', 'Atorvastatin'], physician: 'Dr. Patel' },
    { first: 'Isabella', last: 'Thomas', email: 'isabella.thomas@example.com', phone: '0489 999 209', dob: new Date('1998-08-15'), job: 'Student', goals: 'Sports massage after track meets', allergies: [], meds: [], physician: 'Dr. Jones' },
    { first: 'Benjamin', last: 'Jackson', email: 'benjamin.jackson@example.com', phone: '0411 100 210', dob: new Date('1985-02-27'), job: 'Chef', goals: 'Relief from repetitive strain, wrists and shoulders', allergies: ['Shellfish'], meds: [], physician: 'Dr. Kim' },
    { first: 'Mia', last: 'White', email: 'mia.white@example.com', phone: '0422 200 211', dob: new Date('1993-10-11'), job: 'Marketing Manager', goals: 'Tension headaches, jaw pain (TMJ)', allergies: [], meds: ['Zoloft'], physician: 'Dr. Chen' },
    { first: 'Lucas', last: 'Harris', email: 'lucas.harris@example.com', phone: '0433 300 212', dob: new Date('1977-05-03'), job: 'Firefighter', goals: 'Recovery from job-related physical stress', allergies: [], meds: [], physician: 'Dr. Patel' },
    { first: 'Charlotte', last: 'Martin', email: 'charlotte.martin@example.com', phone: '0444 400 213', dob: new Date('2000-01-19'), job: 'Yoga Instructor', goals: 'Deepen body awareness, fascia work', allergies: ['Nut oils'], meds: [], physician: 'Dr. Lee' },
    { first: 'Henry', last: 'Thompson', email: 'henry.thompson@example.com', phone: '03 9014 0214', dob: new Date('1970-07-07'), job: 'Lawyer', goals: 'Lower back pain from long hours sitting', allergies: [], meds: ['Lisinopril'], physician: 'Dr. Jones' },
    { first: 'Amelia', last: 'Moore', email: 'amelia.moore@example.com', phone: '0466 600 215', dob: new Date('1987-03-22'), job: 'Photographer', goals: 'Shoulder and neck tension from carrying equipment', allergies: ['Lavender oil'], meds: [], physician: 'Dr. Smith' },
  ];

  const clients: any[] = [];
  for (let i = 0; i < clientDefs.length; i++) {
    const def = clientDefs[i];
    const authId = `seed_client_${String(i + 1).padStart(3, '0')}`;
    const u = await prisma.user.upsert({
      where: { authUserId: authId },
      update: { email: def.email, firstName: def.first, lastName: def.last, phoneNumber: def.phone },
      create: {
        email: def.email,
        authUserId: authId,
        firstName: def.first,
        lastName: def.last,
        role: UserRole.CLIENT,
        phoneNumber: def.phone,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${def.first}${def.last}`,
      },
    });
    const c = await prisma.client.upsert({
      where: { userId: u.id },
      update: { phoneNumber: def.phone },
      create: {
        businessId: business.id,
        userId: u.id,
        firstName: def.first,
        lastName: def.last,
        email: def.email,
        phoneNumber: def.phone,
        dateOfBirth: def.dob,
        address: `${(i + 1) * 10 + 100} Collins Street`,
        city: ['Melbourne', 'Fitzroy', 'Richmond', 'South Yarra', 'Carlton'][i % 5],
        state: 'VIC',
        postalCode: `${3000 + (i % 9)}`,
        emergencyContactName: `${def.first} Contact`,
        emergencyContactPhone: `04${String(10 + i).padStart(2, '0')} 900 ${String(i).padStart(3, '0')}`,
        allergies: def.allergies,
        medications: def.meds,
        primaryPhysician: def.physician,
        occupation: def.job,
        goals: def.goals,
        preferredTherapistId: therapists[i % therapists.length].id,
        lastVisitDate: daysAgo(i * 5 + 1),
        totalVisits: 3 + i * 2,
        isActive: true,
      },
    });
    clients.push(c);
  }
  console.log('✓ Clients:', clients.length);

  // ── 6. Medical Conditions ─────────────────────────────────────────────────
  const medConditions = [
    { clientIdx: 0, name: 'Chronic Lower Back Pain', date: new Date('2023-03-15'), status: 'active', severity: 'moderate', notes: 'Pain increases with prolonged sitting', plan: 'Weekly massage therapy and daily stretching' },
    { clientIdx: 1, name: 'Rotator Cuff Tear (partial)', date: new Date('2024-06-10'), status: 'active', severity: 'moderate', notes: 'Post-surgical recovery, avoid deep pressure on shoulder', plan: 'Gentle massage around area, heat therapy' },
    { clientIdx: 2, name: 'Cervicogenic Headaches', date: new Date('2024-01-20'), status: 'managed', severity: 'mild', notes: 'Triggered by neck tension and poor posture', plan: 'Neck and shoulder massage, postural correction exercises' },
    { clientIdx: 4, name: 'Pregnancy (28 weeks)', date: new Date('2025-10-01'), status: 'active', severity: 'mild', notes: 'Prenatal massage only, side-lying position', plan: 'Bi-weekly prenatal massage sessions' },
    { clientIdx: 7, name: 'Osteoarthritis (hands, knees)', date: new Date('2020-05-12'), status: 'managed', severity: 'moderate', notes: 'Avoid strong pressure on affected joints', plan: 'Gentle massage and joint mobility work' },
    { clientIdx: 10, name: 'TMJ Disorder', date: new Date('2024-09-05'), status: 'active', severity: 'mild', notes: 'Jaw clicking and tension headaches', plan: 'Facial massage and intraoral technique monthly' },
    { clientIdx: 13, name: 'Hypertension (controlled)', date: new Date('2022-11-30'), status: 'managed', severity: 'mild', notes: 'On medication, avoid deep pressure to neck arteries', plan: 'Moderate pressure massage, avoid prone position if uncomfortable' },
  ];

  for (const mc of medConditions) {
    const existing = await prisma.medicalCondition.findFirst({
      where: { clientId: clients[mc.clientIdx].id, name: mc.name },
    });
    if (!existing) {
      await prisma.medicalCondition.create({
        data: {
          businessId: business.id,
          clientId: clients[mc.clientIdx].id,
          name: mc.name,
          diagnosisDate: mc.date,
          status: mc.status,
          severity: mc.severity,
          notes: mc.notes,
          treatmentPlan: mc.plan,
        },
      });
    }
  }
  console.log('✓ Medical conditions');

  // ── 7. Intake Form Template ───────────────────────────────────────────────
  const existingTemplate = await prisma.intakeFormTemplate.findFirst({
    where: { businessId: business.id, isDefault: true },
  });
  const intakeTemplate = existingTemplate ?? await prisma.intakeFormTemplate.create({
    data: {
      businessId: business.id,
      name: 'Standard Wellness Intake Form',
      description: 'Comprehensive health and wellness intake form for new clients',
      fields: [
        { type: 'text', label: 'Primary reason for visit', required: true },
        { type: 'textarea', label: 'Current health concerns or symptoms', required: true },
        { type: 'checkbox', label: 'Areas of pain or discomfort', options: ['Neck', 'Shoulders', 'Upper Back', 'Lower Back', 'Hips', 'Legs', 'Feet', 'Arms', 'Hands'] },
        { type: 'scale', label: 'Current pain level (1-10)', min: 1, max: 10 },
        { type: 'select', label: 'Preferred pressure', options: ['Light', 'Medium', 'Firm', 'Deep'] },
        { type: 'boolean', label: 'Are you pregnant?', required: false },
        { type: 'textarea', label: 'Recent injuries or surgeries (last 12 months)', required: false },
        { type: 'boolean', label: 'Do you have any skin conditions we should be aware of?', required: false },
      ],
      isActive: true,
      isDefault: true,
    },
  });

  // ── 8. Intake Forms ───────────────────────────────────────────────────────
  for (let i = 0; i < Math.min(8, clients.length); i++) {
    const existing = await prisma.intakeForm.findFirst({
      where: { clientId: clients[i].id, templateId: intakeTemplate.id },
    });
    if (!existing) {
      await prisma.intakeForm.create({
        data: {
          businessId: business.id,
          clientId: clients[i].id,
          templateId: intakeTemplate.id,
          formData: {
            primaryReason: ['Chronic back pain', 'Shoulder tension', 'Sports recovery', 'Stress relief', 'Headaches', 'Prenatal care', 'General wellness', 'Post-surgery recovery'][i],
            healthConcerns: 'Ongoing discomfort affecting daily activities',
            areasOfPain: [['Lower Back', 'Hips'], ['Shoulders', 'Neck'], ['Upper Back'], ['Lower Back'], ['Neck', 'Shoulders'], ['Lower Back', 'Hips'], ['Shoulders'], ['Lower Back', 'Legs']][i],
            painLevel: [6, 5, 4, 3, 7, 4, 2, 5][i],
            preferredPressure: ['Firm', 'Medium', 'Deep', 'Light', 'Medium', 'Light', 'Medium', 'Firm'][i],
          },
        },
      });
    }
  }
  console.log('✓ Intake forms');

  // ── 9. Appointments (60+) ─────────────────────────────────────────────────
  const existingApptCount = await prisma.appointment.count({ where: { businessId: business.id } });
  if (existingApptCount > 0) {
    console.log(`✓ Appointments: skipped (${existingApptCount} already exist)`);
    return;
  }

  const serviceTypes = [
    'Deep Tissue Massage',
    'Swedish Massage',
    'Sports Massage',
    'Prenatal Massage',
    'Hot Stone Massage',
    'Reflexology',
    'Thai Massage',
    'Lymphatic Drainage',
    'Aromatherapy Massage',
    'Trigger Point Therapy',
  ];
  const prices = [120, 100, 130, 110, 140, 95, 125, 115, 105, 135];

  const appointments: any[] = [];

  // Past completed appointments — spread over 90 days
  const pastApptConfig = [
    { daysBack: 89, hour: 9,  clientIdx: 0,  therapistIdx: 0, serviceIdx: 0, duration: 60 },
    { daysBack: 86, hour: 11, clientIdx: 1,  therapistIdx: 1, serviceIdx: 1, duration: 90 },
    { daysBack: 83, hour: 14, clientIdx: 2,  therapistIdx: 2, serviceIdx: 5, duration: 60 },
    { daysBack: 80, hour: 10, clientIdx: 3,  therapistIdx: 0, serviceIdx: 9, duration: 60 },
    { daysBack: 77, hour: 13, clientIdx: 4,  therapistIdx: 1, serviceIdx: 3, duration: 90 },
    { daysBack: 74, hour: 9,  clientIdx: 5,  therapistIdx: 0, serviceIdx: 2, duration: 60 },
    { daysBack: 71, hour: 15, clientIdx: 6,  therapistIdx: 2, serviceIdx: 6, duration: 60 },
    { daysBack: 68, hour: 10, clientIdx: 7,  therapistIdx: 1, serviceIdx: 4, duration: 60 },
    { daysBack: 65, hour: 11, clientIdx: 8,  therapistIdx: 0, serviceIdx: 2, duration: 60 },
    { daysBack: 62, hour: 14, clientIdx: 9,  therapistIdx: 2, serviceIdx: 7, duration: 60 },
    { daysBack: 59, hour: 9,  clientIdx: 10, therapistIdx: 1, serviceIdx: 8, duration: 60 },
    { daysBack: 56, hour: 13, clientIdx: 11, therapistIdx: 0, serviceIdx: 0, duration: 90 },
    { daysBack: 53, hour: 10, clientIdx: 12, therapistIdx: 2, serviceIdx: 6, duration: 60 },
    { daysBack: 50, hour: 11, clientIdx: 13, therapistIdx: 0, serviceIdx: 0, duration: 60 },
    { daysBack: 47, hour: 14, clientIdx: 14, therapistIdx: 1, serviceIdx: 1, duration: 60 },
    { daysBack: 44, hour: 9,  clientIdx: 0,  therapistIdx: 0, serviceIdx: 0, duration: 90 },
    { daysBack: 41, hour: 10, clientIdx: 1,  therapistIdx: 1, serviceIdx: 1, duration: 60 },
    { daysBack: 38, hour: 15, clientIdx: 2,  therapistIdx: 2, serviceIdx: 5, duration: 60 },
    { daysBack: 35, hour: 11, clientIdx: 3,  therapistIdx: 0, serviceIdx: 9, duration: 60 },
    { daysBack: 32, hour: 13, clientIdx: 4,  therapistIdx: 1, serviceIdx: 3, duration: 90 },
    { daysBack: 29, hour: 9,  clientIdx: 5,  therapistIdx: 0, serviceIdx: 2, duration: 60 },
    { daysBack: 26, hour: 11, clientIdx: 6,  therapistIdx: 2, serviceIdx: 6, duration: 60 },
    { daysBack: 23, hour: 14, clientIdx: 7,  therapistIdx: 1, serviceIdx: 4, duration: 60 },
    { daysBack: 21, hour: 9,  clientIdx: 8,  therapistIdx: 0, serviceIdx: 0, duration: 60 },
    { daysBack: 19, hour: 10, clientIdx: 9,  therapistIdx: 2, serviceIdx: 7, duration: 60 },
    { daysBack: 17, hour: 13, clientIdx: 10, therapistIdx: 1, serviceIdx: 8, duration: 60 },
    { daysBack: 15, hour: 9,  clientIdx: 11, therapistIdx: 0, serviceIdx: 0, duration: 90 },
    { daysBack: 13, hour: 11, clientIdx: 12, therapistIdx: 2, serviceIdx: 6, duration: 60 },
    { daysBack: 11, hour: 14, clientIdx: 13, therapistIdx: 0, serviceIdx: 0, duration: 60 },
    { daysBack: 9,  hour: 9,  clientIdx: 14, therapistIdx: 1, serviceIdx: 1, duration: 60 },
    { daysBack: 7,  hour: 10, clientIdx: 0,  therapistIdx: 0, serviceIdx: 0, duration: 90 },
    { daysBack: 6,  hour: 13, clientIdx: 1,  therapistIdx: 1, serviceIdx: 1, duration: 60 },
    { daysBack: 5,  hour: 9,  clientIdx: 2,  therapistIdx: 2, serviceIdx: 5, duration: 60 },
    { daysBack: 4,  hour: 11, clientIdx: 3,  therapistIdx: 0, serviceIdx: 9, duration: 60 },
    { daysBack: 3,  hour: 14, clientIdx: 4,  therapistIdx: 1, serviceIdx: 3, duration: 90 },
    { daysBack: 2,  hour: 10, clientIdx: 5,  therapistIdx: 0, serviceIdx: 2, duration: 60 },
    { daysBack: 1,  hour: 9,  clientIdx: 6,  therapistIdx: 2, serviceIdx: 6, duration: 60 },
  ];

  for (const cfg of pastApptConfig) {
    const start = setHour(daysAgo(cfg.daysBack), cfg.hour);
    const appt = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients[cfg.clientIdx].id,
        therapistId: therapists[cfg.therapistIdx].id,
        startTime: start,
        endTime: addHours(start, cfg.duration / 60),
        status: AppointmentStatus.COMPLETED,
        serviceType: serviceTypes[cfg.serviceIdx],
        duration: cfg.duration,
        price: prices[cfg.serviceIdx],
        notes: 'Client requested specific focus areas.',
        isVirtual: false,
      },
    });
    appointments.push(appt);
  }

  // Cancelled appointments
  const cancelledConfigs = [
    { daysBack: 45, hour: 10, clientIdx: 3, therapistIdx: 1 },
    { daysBack: 30, hour: 14, clientIdx: 7, therapistIdx: 0 },
    { daysBack: 12, hour: 11, clientIdx: 11, therapistIdx: 2 },
  ];
  for (const cfg of cancelledConfigs) {
    const start = setHour(daysAgo(cfg.daysBack), cfg.hour);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients[cfg.clientIdx].id,
        therapistId: therapists[cfg.therapistIdx].id,
        startTime: start,
        endTime: addHours(start, 1),
        status: AppointmentStatus.CANCELLED,
        serviceType: serviceTypes[0],
        duration: 60,
        price: 120,
        isVirtual: false,
      },
    });
  }

  // No-show appointments
  for (const daysBack of [40, 20, 8]) {
    const start = setHour(daysAgo(daysBack), 10);
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients[5].id,
        therapistId: therapists[0].id,
        startTime: start,
        endTime: addHours(start, 1),
        status: AppointmentStatus.NO_SHOW,
        serviceType: serviceTypes[1],
        duration: 60,
        price: 100,
        isVirtual: false,
      },
    });
  }

  // Upcoming appointments
  const upcomingConfigs = [
    { daysAhead: 1,  hour: 10, clientIdx: 0,  therapistIdx: 0, serviceIdx: 0, status: AppointmentStatus.CONFIRMED },
    { daysAhead: 2,  hour: 14, clientIdx: 1,  therapistIdx: 1, serviceIdx: 3, status: AppointmentStatus.CONFIRMED },
    { daysAhead: 3,  hour: 9,  clientIdx: 2,  therapistIdx: 2, serviceIdx: 5, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 4,  hour: 11, clientIdx: 4,  therapistIdx: 1, serviceIdx: 3, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 5,  hour: 13, clientIdx: 6,  therapistIdx: 0, serviceIdx: 2, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 7,  hour: 10, clientIdx: 8,  therapistIdx: 2, serviceIdx: 6, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 9,  hour: 14, clientIdx: 10, therapistIdx: 1, serviceIdx: 8, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 12, hour: 9,  clientIdx: 12, therapistIdx: 0, serviceIdx: 0, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 15, hour: 11, clientIdx: 14, therapistIdx: 2, serviceIdx: 7, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 20, hour: 10, clientIdx: 3,  therapistIdx: 0, serviceIdx: 9, status: AppointmentStatus.SCHEDULED },
    { daysAhead: 25, hour: 13, clientIdx: 5,  therapistIdx: 1, serviceIdx: 1, status: AppointmentStatus.SCHEDULED, isVirtual: true },
    { daysAhead: 30, hour: 9,  clientIdx: 7,  therapistIdx: 2, serviceIdx: 4, status: AppointmentStatus.SCHEDULED },
  ];

  for (const cfg of upcomingConfigs) {
    const start = setHour(daysAhead(cfg.daysAhead), cfg.hour);
    const appt = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients[cfg.clientIdx].id,
        therapistId: therapists[cfg.therapistIdx].id,
        startTime: start,
        endTime: addHours(start, 1),
        status: cfg.status,
        serviceType: serviceTypes[cfg.serviceIdx],
        duration: 60,
        price: prices[cfg.serviceIdx],
        isVirtual: (cfg as any).isVirtual ?? false,
      },
    });
    appointments.push(appt);
  }

  console.log('✓ Appointments:', appointments.length);

  // ── 10. Treatment Notes ───────────────────────────────────────────────────
  const noteTemplates = [
    {
      subjective: 'Client reports persistent lower back pain rated 7/10. Pain worsens after prolonged sitting. Also notes tightness in glutes.',
      objective: 'Marked hypertonicity in lumbar erectors and QL. Reduced lumbar flexion (~70% normal ROM). Trigger points identified at L4-L5 level.',
      assessment: 'Chronic lumbar muscle tension, likely postural. Improvement noted in glute tightness compared to last session.',
      plan: 'Continue weekly sessions focusing on lumbar region. Add gluteal stretching protocol. Recommend ergonomic chair assessment.',
      areas: ['Lower Back', 'Gluteal Muscles', 'Hamstrings'],
      techniques: ['Deep Tissue', 'Trigger Point Therapy', 'Myofascial Release'],
    },
    {
      subjective: 'Client presents with bilateral shoulder tension, 5/10 pain. States that stress at work has increased. Headaches 2-3x per week.',
      objective: 'Elevated shoulders at rest. Tender points at upper trapezius bilaterally. Restricted cervical rotation (left 40°, right 50°).',
      assessment: 'Tension-related upper crossed syndrome pattern. Cervical ROM mildly improved from prior visit.',
      plan: 'Focus on upper trapezius, levator scapulae, and cervical extensors. Recommend daily neck stretching. Follow-up in 2 weeks.',
      areas: ['Shoulders', 'Neck', 'Upper Back'],
      techniques: ['Swedish Massage', 'Myofascial Release', 'Passive Stretching'],
    },
    {
      subjective: 'Client recovering from partial rotator cuff tear. Reports 4/10 pain around surgical site. Improved range of motion.',
      objective: 'Scar tissue softening noted medially. External rotation improved to 45° (was 30° last visit). Deltoid hypertonic.',
      assessment: 'Post-surgical recovery progressing well. Adhesion formation around incision site diminishing.',
      plan: 'Continue cross-fiber friction at scar site. Gentle passive mobilization. Avoid direct pressure on supraspinatus insertion.',
      areas: ['Right Shoulder', 'Deltoid', 'Upper Arm'],
      techniques: ['Cross-Fiber Friction', 'Passive Mobilization', 'Effleurage'],
    },
    {
      subjective: 'Client is 28 weeks pregnant. Experiencing lower back discomfort and leg swelling. First prenatal massage with us.',
      objective: 'Client in side-lying position with pillow support. Mild edema noted in ankles bilaterally. Paraspinal tension present.',
      assessment: 'Normal prenatal discomfort pattern. Client tolerated treatment well.',
      plan: 'Bi-weekly prenatal sessions. Continue with light effleurage for lymphatic drainage. Avoid deep pressure on legs.',
      areas: ['Lower Back', 'Legs', 'Hips'],
      techniques: ['Prenatal Massage', 'Lymphatic Drainage', 'Light Effleurage'],
    },
    {
      subjective: 'Client reports soreness in legs and hips following marathon training. Pain 3/10 at rest, 6/10 during activity.',
      objective: 'Bilateral IT band tightness. Tender TFL bilaterally. Calf muscles hypertonic with minor DOMS presentation.',
      assessment: 'Exercise-induced muscle fatigue and overuse. Good tissue health overall.',
      plan: 'Deep sports massage focusing on IT band and hip flexors. Recommend foam rolling post-session. Next session pre-race week.',
      areas: ['IT Band', 'TFL', 'Calves', 'Hamstrings'],
      techniques: ['Sports Massage', 'Deep Tissue', 'Compression', 'Passive Stretching'],
    },
  ];

  for (let i = 0; i < Math.min(noteTemplates.length, appointments.length); i++) {
    const appt = appointments[i];
    if (appt.status === AppointmentStatus.COMPLETED) {
      const tmpl = noteTemplates[i % noteTemplates.length];
      const existing = await prisma.treatmentNote.findFirst({
        where: { appointmentId: appt.id },
      });
      if (!existing) {
        await prisma.treatmentNote.create({
          data: {
            businessId: business.id,
            appointmentId: appt.id,
            clientId: appt.clientId,
            therapistId: appt.therapistId,
            subjectiveFindings: tmpl.subjective,
            objectiveFindings: tmpl.objective,
            assessment: tmpl.assessment,
            plan: tmpl.plan,
            areasWorked: tmpl.areas,
            techniques: tmpl.techniques,
            sessionDuration: appt.duration,
            followUpDate: daysAhead(7),
          },
        });
      }
    }
  }

  // Add more treatment notes for other appointments
  for (let i = 5; i < 15 && i < appointments.length; i++) {
    const appt = appointments[i];
    if (appt.status === AppointmentStatus.COMPLETED) {
      const existing = await prisma.treatmentNote.findFirst({
        where: { appointmentId: appt.id },
      });
      if (!existing) {
        await prisma.treatmentNote.create({
          data: {
            businessId: business.id,
            appointmentId: appt.id,
            clientId: appt.clientId,
            therapistId: appt.therapistId,
            subjectiveFindings: `Client reports improvement since last session. Pain level ${4 + (i % 4)}/10.`,
            objectiveFindings: `Muscle tension reduced compared to prior visit. ROM within normal limits.`,
            assessment: `Ongoing therapeutic progress. Client responding well to treatment.`,
            plan: `Continue current treatment plan. Reassess in 4 sessions.`,
            areasWorked: [['Lower Back', 'Hips'], ['Shoulders', 'Neck'], ['Upper Back', 'Arms'], ['Legs', 'Feet']][i % 4],
            techniques: ['Deep Tissue', 'Swedish Massage', 'Trigger Point Therapy'],
            sessionDuration: 60,
            followUpDate: daysAhead(7 + (i % 14)),
          },
        });
      }
    }
  }
  console.log('✓ Treatment notes');

  // ── 11. Body Maps ─────────────────────────────────────────────────────────
  const bodyMapData = [
    { clientIdx: 0, apptIdx: 0, view: 'back', regions: [{ name: 'Lower Back', coordinates: { x: 50, y: 70 }, painLevel: 7, notes: 'Primary pain site — bilateral' }, { name: 'Left Glute', coordinates: { x: 45, y: 80 }, painLevel: 5, notes: 'Referred pain from lumbar' }] },
    { clientIdx: 1, apptIdx: 1, view: 'front', regions: [{ name: 'Right Shoulder', coordinates: { x: 75, y: 30 }, painLevel: 5, notes: 'Post-surgical site' }, { name: 'Right Upper Arm', coordinates: { x: 78, y: 40 }, painLevel: 3, notes: 'Deltoid tightness' }] },
    { clientIdx: 2, apptIdx: 2, view: 'back', regions: [{ name: 'Upper Trapezius L', coordinates: { x: 40, y: 20 }, painLevel: 6, notes: 'Trigger point active' }, { name: 'Upper Trapezius R', coordinates: { x: 60, y: 20 }, painLevel: 5, notes: 'Tender to palpation' }] },
  ];

  for (const bm of bodyMapData) {
    const existing = await prisma.bodyMap.findFirst({
      where: { appointmentId: appointments[bm.apptIdx].id },
    });
    if (!existing) {
      await prisma.bodyMap.create({
        data: {
          businessId: business.id,
          clientId: clients[bm.clientIdx].id,
          appointmentId: appointments[bm.apptIdx].id,
          view: bm.view,
          regions: bm.regions,
          notes: 'Areas marked by client during pre-session check-in',
        },
      });
    }
  }
  console.log('✓ Body maps');

  // ── 12. Therapist Notes ───────────────────────────────────────────────────
  const therapistNoteData = [
    { clientIdx: 0, therapistIdx: 0, content: 'Emma responds very well to deep tissue on lumbar. Prefers firm pressure (7-8/10). Always warm up lower back for at least 5 minutes before deep work.', pinned: true },
    { clientIdx: 1, therapistIdx: 0, content: 'James has partial rotator cuff tear (right side). Cleared for massage by Dr. Jones. Avoid direct pressure on supraspinatus. Progress ROM exercises each session.', pinned: true },
    { clientIdx: 2, therapistIdx: 1, content: 'Olivia is sensitive to lavender oil — use unscented or eucalyptus-based blends. Prefers quiet ambient music during sessions.', pinned: true },
    { clientIdx: 3, therapistIdx: 0, content: 'Noah prefers a quieter environment. Tends to fall asleep during sessions (normal for him). Check in via touch pressure, not voice, mid-session.', pinned: false },
    { clientIdx: 4, therapistIdx: 1, content: 'Sophia is 28 weeks pregnant. Prenatal protocol only. Side-lying with bolster. Avoid deep pressure on calves (DVT risk). Dr. Lee has cleared for massage.', pinned: true },
    { clientIdx: 5, therapistIdx: 0, content: 'Liam is a personal trainer — sports massage focus. Bring up rest day recommendations. He tends to overtrain. Track muscle soreness patterns each visit.', pinned: false },
    { clientIdx: 6, therapistIdx: 2, content: 'Ava loves hot stone on upper back. Book an extra 15 minutes for stone setup when scheduling. Very chatty — engage conversation for better relaxation.', pinned: false },
    { clientIdx: 7, therapistIdx: 1, content: 'William has osteoarthritis in hands and knees. Use light pressure around joints. He finds warm packs helpful before knee work. Prefers no scented oils.', pinned: true },
    { clientIdx: 10, therapistIdx: 1, content: 'Mia has TMJ — has been referred by Dr. Chen for intraoral work. Signed consent form on file. Review protocol before each session.', pinned: true },
    { clientIdx: 13, therapistIdx: 0, content: 'Henry is a lawyer with unpredictable schedule. Tends to cancel last-minute. Confirm 48h and 24h before appointment. Prefers late afternoon slots.', pinned: false },
  ];

  for (const tn of therapistNoteData) {
    const existing = await prisma.therapistNote.findFirst({
      where: { clientId: clients[tn.clientIdx].id, therapistId: therapists[tn.therapistIdx].id },
    });
    if (!existing) {
      await prisma.therapistNote.create({
        data: {
          businessId: business.id,
          clientId: clients[tn.clientIdx].id,
          therapistId: therapists[tn.therapistIdx].id,
          content: tn.content,
          isPinned: tn.pinned,
        },
      });
    }
  }
  console.log('✓ Therapist notes');

  // ── 13. Communication Settings & Templates ────────────────────────────────
  const existingCommSettings = await prisma.communicationSettings.findUnique({
    where: { businessId: business.id },
  });
  if (!existingCommSettings) {
    await prisma.communicationSettings.create({
      data: {
        businessId: business.id,
        smsEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false,
        defaultReminderHours: 24,
        autoSendReminders: true,
        sendGridFromEmail: 'noreply@serenitywellness.com',
        sendGridFromName: 'Serenity Wellness',
        emailSignature: 'Warm regards,\nSerenity Wellness Clinic\n123 Healing Way, Suite 200, San Francisco, CA 94102\nP: (555) 935-5637',
      },
    });
  }

  const msgTemplateDefs = [
    { name: 'Appointment Reminder (SMS)', type: 'SMS', category: 'REMINDER', content: 'Hi {{clientName}}, friendly reminder of your appointment with {{therapistName}} tomorrow at {{appointmentTime}}. Reply C to confirm or R to reschedule. — Serenity Wellness', subject: null },
    { name: 'Appointment Confirmation (SMS)', type: 'SMS', category: 'CONFIRMATION', content: 'Hi {{clientName}}, your appointment on {{appointmentDate}} at {{appointmentTime}} with {{therapistName}} is confirmed! See you then. — Serenity Wellness', subject: null },
    { name: 'Welcome Email', type: 'EMAIL', category: 'CUSTOM', subject: 'Welcome to Serenity Wellness!', content: 'Dear {{clientName}},\n\nWelcome to Serenity Wellness Clinic! We\'re delighted to have you as a new client.\n\nOur team of licensed therapists is dedicated to your wellbeing. If you have any questions before your first appointment, please don\'t hesitate to reach out.\n\nSee you soon!\n\nWarm regards,\nThe Serenity Wellness Team' },
    { name: 'Follow-up Email', type: 'EMAIL', category: 'CUSTOM', subject: 'How are you feeling after your session?', content: 'Hi {{clientName}},\n\nWe hope you\'re feeling refreshed after your session with {{therapistName}} on {{appointmentDate}}.\n\nPlease stay hydrated and avoid strenuous activity for 24 hours. If you have any questions or concerns, reply to this email.\n\nYour next appointment is scheduled for {{nextAppointmentDate}}.\n\nBe well,\nSerenity Wellness Team' },
    { name: 'Birthday Greeting (SMS)', type: 'SMS', category: 'CUSTOM', content: 'Happy Birthday, {{clientName}}! 🎂 Treat yourself — use code BDAY15 for 15% off your next session this month. Book at serenitywellness.com. — Serenity Team', subject: null },
    { name: 'Invoice Email', type: 'EMAIL', category: 'CUSTOM', subject: 'Invoice #{{invoiceNumber}} from Serenity Wellness', content: 'Hi {{clientName}},\n\nPlease find your invoice #{{invoiceNumber}} for {{amount}} attached.\n\nDue date: {{dueDate}}\n\nPay securely online at: {{paymentLink}}\n\nThank you for choosing Serenity Wellness.\n\nBest,\nSerenity Wellness Billing' },
  ];

  for (const def of msgTemplateDefs) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { businessId: business.id, name: def.name },
    });
    if (!existing) {
      await prisma.messageTemplate.create({
        data: {
          businessId: business.id,
          name: def.name,
          type: def.type,
          category: def.category,
          subject: def.subject ?? undefined,
          content: def.content,
          isActive: true,
          isDefault: def.category === 'REMINDER',
        },
      });
    }
  }
  console.log('✓ Communication settings & templates');

  // ── 14. Conversations & Messages ──────────────────────────────────────────
  const conversationDefs = [
    {
      clientIdx: 0, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'Hi Emma, this is a reminder of your appointment tomorrow at 10 AM with Sarah. Reply C to confirm.' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'C' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Confirmed! See you tomorrow, Emma. Please arrive 5 minutes early to fill out intake paperwork.' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Perfect, thank you! Looking forward to it.' },
      ],
    },
    {
      clientIdx: 1, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Hi James, checking in after your session yesterday. How is the shoulder feeling?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Honestly feeling a lot better! Still a bit sore but I can tell the mobility is improving.' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Great to hear! The soreness is normal. Keep up the stretches I showed you and stay hydrated. See you next week.' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Will do, thanks Mike!' },
      ],
    },
    {
      clientIdx: 2, type: 'EMAIL', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'SYSTEM', subject: 'Welcome to Serenity Wellness!', content: 'Dear Olivia,\n\nWelcome to Serenity Wellness Clinic! We\'re delighted to have you as a new client. Your first appointment with Lisa is scheduled for this Friday at 2 PM.\n\nSee you soon!\n\nThe Serenity Team' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Thank you so much! I\'m really looking forward to it. I\'ve been dealing with tension headaches for months.' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'We\'re so glad you\'ve come to see us, Olivia. Lisa specializes in head and neck tension work and I know she\'ll be a great fit for you. Let us know if you have any questions!' },
      ],
    },
    {
      clientIdx: 3, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'Hi Noah, your appointment on Thursday at 11 AM is coming up. Reply C to confirm.' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Actually I need to reschedule — something came up at work.' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'No problem! We have openings Friday at 2 PM or next Monday at 10 AM. Which works better?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Monday at 10 works great, thank you!' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Done! You\'re booked for Monday at 10 AM with Sarah. See you then!' },
      ],
    },
    {
      clientIdx: 4, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Hi, I\'m 28 weeks pregnant and was wondering if you offer prenatal massage?' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Hi Sophia! Yes, we absolutely do. Mike Chen is our prenatal specialist and has extensive experience. Would you like to book a session?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'That sounds perfect. Do I need clearance from my doctor?' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'We recommend it for your peace of mind, though it\'s not required. If you\'d like, we can send you a form to get your OB\'s sign-off. We\'ve never had an issue!' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Great, I\'ll get the form from my doctor. Book me in for next week?' },
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'Perfect! I\'ve booked you with Mike for next Tuesday at 2 PM. Confirmation sent to your email.' },
      ],
    },
    {
      clientIdx: 6, type: 'EMAIL', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'SYSTEM', subject: 'How are you feeling after your session?', content: 'Hi Ava,\n\nHope you\'re feeling relaxed after your hot stone session with Lisa yesterday! Remember to drink plenty of water and avoid strenuous activity for 24 hours.\n\nYour next session is booked for 2 weeks from today.\n\nBe well,\nSerenity Wellness Team' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'I feel absolutely amazing! Best sleep I\'ve had in months. Definitely going to become a regular.' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'That\'s wonderful to hear, Ava! Hot stone really does wonders for sleep quality. Looking forward to seeing you again.' },
      ],
    },
    {
      clientIdx: 9, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Hi, I\'m a chef and have been getting repetitive strain in my wrists. Can massage actually help with that?' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Hi Benjamin! Yes, massage therapy is excellent for repetitive strain injuries. Targeted work on the forearms, wrists, and hands can significantly reduce inflammation and improve flexibility. Have you seen a doctor about it?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Yes, my doctor recommended massage as part of my treatment. Can I book something this week?' },
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'We have availability Thursday at 3 PM or Friday at 11 AM with Sarah (our sports specialist). Which works?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Thursday at 3 PM works perfectly.' },
      ],
    },
    {
      clientIdx: 11, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'Hi Lucas, your appointment is confirmed for tomorrow at 9 AM with Sarah. See you then!' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Thanks. Actually can I add on an extra 30 minutes if Sarah has availability?' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Checked with Sarah — she can do 90 minutes tomorrow. I\'ll update your booking. That\'ll be $180 total.' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Perfect, appreciate it.' },
      ],
    },
    {
      clientIdx: 13, type: 'EMAIL', status: 'ACTIVE',
      messages: [
        { dir: 'OUTBOUND', sender: 'SYSTEM', subject: 'Your appointment reminder', content: 'Hi Henry,\n\nThis is a reminder that your appointment is scheduled for tomorrow at 3 PM with Sarah Johnson.\n\nPlease reply to this email or call us if you need to reschedule.\n\nBest,\nSerenity Wellness' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'I\'m so sorry, I need to cancel. A client meeting just came up.' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'No problem at all, Henry. We\'ve cancelled your appointment. Our next opening with Sarah is next Monday at 4 PM or Wednesday at 3 PM — would either of those work?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Wednesday at 3 PM please. And I\'m sorry again about the last-minute cancellation.' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Booked! We understand — these things happen. See you Wednesday at 3 PM.' },
      ],
    },
    {
      clientIdx: 14, type: 'SMS', status: 'ACTIVE',
      messages: [
        { dir: 'INBOUND', sender: 'CLIENT', content: 'Hi! I heard great things about your lymphatic drainage massage. Is it good for shoulder tension from heavy camera work?' },
        { dir: 'OUTBOUND', sender: 'THERAPIST', content: 'Hi Amelia! Lymphatic drainage paired with shoulder and neck work would be excellent for you. Lisa is our specialist and she often combines techniques for photographers and musicians.' },
        { dir: 'INBOUND', sender: 'CLIENT', content: 'That sounds exactly what I need. Do you have anything this Saturday?' },
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'Lisa has 11 AM and 1 PM available this Saturday. Which would you prefer?' },
        { dir: 'INBOUND', sender: 'CLIENT', content: '1 PM please!' },
        { dir: 'OUTBOUND', sender: 'SYSTEM', content: 'Booked! Amelia Moore — Saturday at 1 PM with Lisa Martinez. Confirmation sent to your email. See you Saturday!' },
      ],
    },
  ];

  let msgIdx = 0;
  for (const convDef of conversationDefs) {
    const lastMsg = convDef.messages[convDef.messages.length - 1];
    const lastMsgTime = new Date(Date.now() - (conversationDefs.length - conversationDefs.indexOf(convDef)) * 6 * 60 * 60 * 1000);

    const conv = await prisma.conversation.create({
      data: {
        businessId: business.id,
        clientId: clients[convDef.clientIdx].id,
        type: convDef.type,
        status: convDef.status,
        lastMessageAt: lastMsgTime,
        lastMessagePreview: lastMsg.content.substring(0, 80),
        unreadCount: convDef.messages.filter(m => m.dir === 'INBOUND').length > 0 ? 1 : 0,
      },
    });

    for (let i = 0; i < convDef.messages.length; i++) {
      const msg = convDef.messages[i];
      const msgTime = new Date(lastMsgTime.getTime() - (convDef.messages.length - i) * 5 * 60 * 1000);
      await prisma.message.create({
        data: {
          businessId: business.id,
          conversationId: conv.id,
          senderType: msg.sender,
          recipientId: clients[convDef.clientIdx].id,
          recipientType: 'CLIENT',
          type: convDef.type,
          subject: (msg as any).subject ?? undefined,
          content: msg.content,
          status: 'DELIVERED',
          direction: msg.dir,
          sentAt: msgTime,
          deliveredAt: new Date(msgTime.getTime() + 30000),
          readAt: msg.dir === 'OUTBOUND' ? new Date(msgTime.getTime() + 60000) : undefined,
        },
      });
      msgIdx++;
    }
  }
  console.log('✓ Conversations & messages:', conversationDefs.length, 'conversations,', msgIdx, 'messages');

  // ── 15. Stripe Customers ──────────────────────────────────────────────────
  for (let i = 0; i < 8; i++) {
    const existing = await prisma.stripeCustomer.findFirst({
      where: { clientId: clients[i].id },
    });
    if (!existing) {
      await prisma.stripeCustomer.create({
        data: {
          businessId: business.id,
          clientId: clients[i].id,
          stripeCustomerId: `cus_seed_${String(i + 1).padStart(6, '0')}`,
        },
      });
    }
  }
  console.log('✓ Stripe customers');

  // ── 16. Invoices & Payments ───────────────────────────────────────────────
  const invoiceDefs = [
    // PAID invoices — tied to past appointments
    { clientIdx: 0,  apptIdx: 0,  status: InvoiceStatus.PAID,         amount: 120, method: PaymentMethod.STRIPE_CARD, daysBack: 88 },
    { clientIdx: 1,  apptIdx: 1,  status: InvoiceStatus.PAID,         amount: 100, method: PaymentMethod.CASH,        daysBack: 85 },
    { clientIdx: 2,  apptIdx: 2,  status: InvoiceStatus.PAID,         amount: 95,  method: PaymentMethod.STRIPE_CARD, daysBack: 82 },
    { clientIdx: 3,  apptIdx: 3,  status: InvoiceStatus.PAID,         amount: 135, method: PaymentMethod.STRIPE_CARD, daysBack: 79 },
    { clientIdx: 4,  apptIdx: 4,  status: InvoiceStatus.PAID,         amount: 110, method: PaymentMethod.CASH,        daysBack: 76 },
    { clientIdx: 5,  apptIdx: 5,  status: InvoiceStatus.PAID,         amount: 130, method: PaymentMethod.CHEQUE,      daysBack: 73 },
    { clientIdx: 6,  apptIdx: 6,  status: InvoiceStatus.PAID,         amount: 125, method: PaymentMethod.STRIPE_CARD, daysBack: 70 },
    { clientIdx: 7,  apptIdx: 7,  status: InvoiceStatus.PAID,         amount: 140, method: PaymentMethod.STRIPE_CARD, daysBack: 67 },
    { clientIdx: 8,  apptIdx: 8,  status: InvoiceStatus.PAID,         amount: 130, method: PaymentMethod.CASH,        daysBack: 64 },
    { clientIdx: 9,  apptIdx: 9,  status: InvoiceStatus.PAID,         amount: 115, method: PaymentMethod.STRIPE_CARD, daysBack: 61 },
    { clientIdx: 10, apptIdx: 10, status: InvoiceStatus.PAID,         amount: 105, method: PaymentMethod.STRIPE_CARD, daysBack: 58 },
    { clientIdx: 11, apptIdx: 11, status: InvoiceStatus.PAID,         amount: 120, method: PaymentMethod.CASH,        daysBack: 55 },
    { clientIdx: 12, apptIdx: 12, status: InvoiceStatus.PAID,         amount: 125, method: PaymentMethod.STRIPE_CARD, daysBack: 52 },
    { clientIdx: 0,  apptIdx: 15, status: InvoiceStatus.PAID,         amount: 120, method: PaymentMethod.STRIPE_CARD, daysBack: 43 },
    { clientIdx: 1,  apptIdx: 16, status: InvoiceStatus.PAID,         amount: 100, method: PaymentMethod.STRIPE_CARD, daysBack: 40 },
    { clientIdx: 2,  apptIdx: 17, status: InvoiceStatus.PAID,         amount: 95,  method: PaymentMethod.CASH,        daysBack: 37 },
    { clientIdx: 0,  apptIdx: 30, status: InvoiceStatus.PAID,         amount: 120, method: PaymentMethod.STRIPE_CARD, daysBack: 6  },
    { clientIdx: 1,  apptIdx: 31, status: InvoiceStatus.PAID,         amount: 100, method: PaymentMethod.CASH,        daysBack: 5  },
    // SENT invoices (awaiting payment)
    { clientIdx: 3,  apptIdx: 33, status: InvoiceStatus.SENT,         amount: 135, method: null,                      daysBack: 3  },
    { clientIdx: 5,  apptIdx: 35, status: InvoiceStatus.SENT,         amount: 130, method: null,                      daysBack: 2  },
    { clientIdx: 7,  apptIdx: 22, status: InvoiceStatus.SENT,         amount: 140, method: null,                      daysBack: 10 },
    // OVERDUE invoices
    { clientIdx: 8,  apptIdx: 23, status: InvoiceStatus.OVERDUE,      amount: 130, method: null,                      daysBack: 30 },
    { clientIdx: 10, apptIdx: 25, status: InvoiceStatus.OVERDUE,      amount: 105, method: null,                      daysBack: 45 },
    { clientIdx: 13, apptIdx: 13, status: InvoiceStatus.OVERDUE,      amount: 120, method: null,                      daysBack: 60 },
    // PARTIALLY_PAID
    { clientIdx: 11, apptIdx: 26, status: InvoiceStatus.PARTIALLY_PAID, amount: 120, method: PaymentMethod.CASH,     daysBack: 15 },
    // DRAFT invoices
    { clientIdx: 12, apptIdx: 27, status: InvoiceStatus.DRAFT,        amount: 125, method: null,                      daysBack: 7  },
    { clientIdx: 14, apptIdx: 28, status: InvoiceStatus.DRAFT,        amount: 115, method: null,                      daysBack: 5  },
    // CANCELLED
    { clientIdx: 3,  apptIdx: 18, status: InvoiceStatus.CANCELLED,    amount: 135, method: null,                      daysBack: 20 },
  ];

  let invoiceCount = 0;
  let paymentCount = 0;

  for (let i = 0; i < invoiceDefs.length; i++) {
    const def = invoiceDefs[i];
    if (def.apptIdx >= appointments.length) continue;

    const appt = appointments[def.apptIdx];
    const client = clients[def.clientIdx];
    const issuedDate = daysAgo(def.daysBack);
    const isPaid = def.status === InvoiceStatus.PAID;
    const isPartial = def.status === InvoiceStatus.PARTIALLY_PAID;
    const partialPaid = isPartial ? def.amount * 0.5 : 0;

    const invoiceNumber = `INV-2025-${String(invoiceCount + 1).padStart(4, '0')}`;
    const invoiceData = {
      businessId: business.id,
      clientId: client.id,
      invoiceNumber,
      status: def.status,
      lineItems: [
        { description: appt.serviceType, quantity: 1, unitPrice: def.amount, total: def.amount },
      ],
      subtotal: def.amount,
      taxAmount: 0,
      discountAmount: 0,
      total: def.amount,
      amountPaid: isPaid ? def.amount : isPartial ? partialPaid : 0,
      amountDue: isPaid ? 0 : isPartial ? def.amount - partialPaid : def.amount,
      issuedAt: issuedDate,
      sentAt: (def.status !== InvoiceStatus.DRAFT && def.status !== InvoiceStatus.CANCELLED) ? issuedDate : undefined,
      paidAt: isPaid ? new Date(issuedDate.getTime() + 2 * 24 * 60 * 60 * 1000) : undefined,
      dueDate: new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
    const invoice = await prisma.invoice.upsert({
      where: { businessId_invoiceNumber: { businessId: business.id, invoiceNumber } },
      update: {},
      create: invoiceData,
    });
    invoiceCount++;

    if (def.method && (isPaid || isPartial)) {
      const existingPayment = await prisma.payment.findFirst({ where: { invoiceId: invoice.id } });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            businessId: business.id,
            clientId: client.id,
            invoiceId: invoice.id,
            appointmentId: appt.id,
            amount: isPaid ? def.amount : partialPaid,
            currency: 'USD',
            paymentMethod: def.method,
            status: PaymentStatus.COMPLETED,
            stripePaymentIntentId: def.method === PaymentMethod.STRIPE_CARD ? `pi_seed_${String(paymentCount + 1).padStart(8, '0')}` : undefined,
            stripeChargeId: def.method === PaymentMethod.STRIPE_CARD ? `ch_seed_${String(paymentCount + 1).padStart(8, '0')}` : undefined,
            stripeFee: def.method === PaymentMethod.STRIPE_CARD ? parseFloat((def.amount * 0.029 + 0.30).toFixed(2)) : undefined,
            description: `Payment for ${appt.serviceType}`,
            paidAt: isPaid ? new Date(issuedDate.getTime() + 2 * 24 * 60 * 60 * 1000) : issuedDate,
          },
        });
        paymentCount++;
      }
    }
  }
  console.log(`✓ Invoices: ${invoiceCount}, Payments: ${paymentCount}`);

  // ── 17. Memberships ───────────────────────────────────────────────────────
  const membershipDefs = [
    { clientIdx: 0, name: 'Monthly Wellness Plan', desc: '4 sessions/month with rollover', price: 440, sessions: 4, used: 2, status: MembershipStatus.ACTIVE },
    { clientIdx: 1, name: 'Bi-Weekly Recovery Plan', desc: '2 sports sessions/month, priority booking', price: 240, sessions: 2, used: 1, status: MembershipStatus.ACTIVE },
    { clientIdx: 6, name: 'Monthly Relaxation Plan', desc: '2 sessions/month — focus on Swedish and hot stone', price: 220, sessions: 2, used: 0, status: MembershipStatus.ACTIVE },
    { clientIdx: 7, name: 'Senior Wellness Plan', desc: 'Monthly gentle massage for seniors', price: 180, sessions: 2, used: 2, status: MembershipStatus.ACTIVE },
    { clientIdx: 3, name: 'Monthly Wellness Plan', desc: '4 sessions/month with rollover', price: 440, sessions: 4, used: 4, status: MembershipStatus.PAUSED },
    { clientIdx: 9, name: 'Monthly Wellness Plan', desc: '4 sessions/month with rollover', price: 440, sessions: 4, used: 4, status: MembershipStatus.CANCELLED },
  ];

  const memberships: any[] = [];
  for (let i = 0; i < membershipDefs.length; i++) {
    const def = membershipDefs[i];
    const subId = `sub_seed_${String(i + 1).padStart(6, '0')}`;
    const membershipData = {
      businessId: business.id,
      clientId: clients[def.clientIdx].id,
      name: def.name,
      description: def.desc,
      price: def.price,
      currency: 'USD',
      sessionsPerMonth: def.sessions,
      sessionsUsed: def.used,
      rolledOverSessions: 0,
      allowRollover: true,
      status: def.status,
      stripeSubscriptionId: subId,
      billingCycleStart: daysAgo(15),
      billingCycleEnd: daysAhead(15),
      nextBillingDate: daysAhead(15),
      startDate: daysAgo(60),
      cancelledAt: def.status === MembershipStatus.CANCELLED ? daysAgo(5) : undefined,
    };
    const m = await prisma.membership.upsert({
      where: { stripeSubscriptionId: subId },
      update: {},
      create: membershipData,
    });
    memberships.push(m);
  }
  console.log('✓ Memberships:', memberships.length);

  // ── 18. Package Purchases ─────────────────────────────────────────────────
  const packageDefs = [
    { clientIdx: 2, name: '5-Session Package', desc: 'Save 10% on 5 sessions', total: 5, used: 2, price: 540, status: PackageStatus.ACTIVE },
    { clientIdx: 5, name: '10-Session Sports Package', desc: '10 sports massage sessions — save 15%', total: 10, used: 7, price: 1105, status: PackageStatus.ACTIVE },
    { clientIdx: 8, name: '5-Session Package', desc: 'Save 10% on 5 sessions', total: 5, used: 5, price: 540, status: PackageStatus.FULLY_USED },
    { clientIdx: 12, name: '10-Session Package', desc: 'Save 15% on 10 sessions', total: 10, used: 3, price: 1020, status: PackageStatus.ACTIVE },
    { clientIdx: 14, name: '3-Session Intro Package', desc: '3-session intro for new clients', total: 3, used: 0, price: 285, status: PackageStatus.ACTIVE },
  ];

  const packages: any[] = [];
  for (let i = 0; i < packageDefs.length; i++) {
    const def = packageDefs[i];
    const existing = await prisma.packagePurchase.findFirst({ where: { businessId: business.id, clientId: clients[def.clientIdx].id, name: def.name } });
    const p = existing ?? await prisma.packagePurchase.create({
      data: {
        businessId: business.id,
        clientId: clients[def.clientIdx].id,
        name: def.name,
        description: def.desc,
        totalSessions: def.total,
        sessionsUsed: def.used,
        totalPrice: def.price,
        currency: 'USD',
        status: def.status,
        expirationDate: def.status === PackageStatus.FULLY_USED ? daysAgo(10) : daysAhead(150),
      },
    });
    packages.push(p);
  }
  console.log('✓ Package purchases:', packages.length);

  // ── 19. Recurring Appointment Series ──────────────────────────────────────
  const recurringDefs = [
    { clientIdx: 0, therapistIdx: 0, frequency: 'WEEKLY', dayOfWeek: 2, hour: '10:00', service: 'Deep Tissue Massage', price: 120 },
    { clientIdx: 1, therapistIdx: 0, frequency: 'BIWEEKLY', dayOfWeek: 4, hour: '14:00', service: 'Sports Massage', price: 130 },
    { clientIdx: 4, therapistIdx: 1, frequency: 'WEEKLY', dayOfWeek: 3, hour: '11:00', service: 'Prenatal Massage', price: 110 },
    { clientIdx: 7, therapistIdx: 1, frequency: 'MONTHLY', dayOfWeek: 1, hour: '10:00', service: 'Swedish Massage', price: 100 },
  ];

  for (const def of recurringDefs) {
    const existing = await prisma.recurringAppointmentSeries.findFirst({
      where: { clientId: clients[def.clientIdx].id, isActive: true },
    });
    if (!existing) {
      await prisma.recurringAppointmentSeries.create({
        data: {
          businessId: business.id,
          clientId: clients[def.clientIdx].id,
          therapistId: therapists[def.therapistIdx].id,
          frequency: def.frequency,
          interval: 1,
          dayOfWeek: def.dayOfWeek,
          startTime: def.hour,
          duration: 60,
          startDate: daysAhead(7),
          serviceType: def.service,
          price: def.price,
          notes: 'Standing recurring appointment',
          isActive: true,
        },
      });
    }
  }
  console.log('✓ Recurring appointment series');

  // ── 20. Voice Notes ───────────────────────────────────────────────────────
  const voiceNoteDefs = [
    { clientIdx: 0, therapistIdx: 0, apptIdx: 0, transcription: 'Client presented with significant lumbar tension today, particularly on the left side. Trigger points at L3 and L5 were quite active. I used extended myofascial release techniques for approximately 15 minutes before transitioning to deep tissue work. She reported the pain dropped from a 7 to about a 3 by the end of the session.' },
    { clientIdx: 1, therapistIdx: 0, apptIdx: 1, transcription: 'James had good tolerance today. Right shoulder ROM is definitely improving — external rotation was about 45 degrees compared to 30 last visit. Cross-fiber friction on the scar tissue is paying off. Reminded him to do the pendulum exercises twice daily.' },
    { clientIdx: 2, therapistIdx: 2, apptIdx: 2, transcription: 'Olivia responded very well to the scalene and suboccipital release. Cervical rotation improved significantly mid-session. She mentioned her headaches have decreased from daily to about twice a week since we started. Will maintain current protocol.' },
    { clientIdx: 4, therapistIdx: 1, apptIdx: 4, transcription: 'Sophia tolerated the session very well. Baby was active during the first 10 minutes but settled once we started the light effleurage. Checked in frequently on comfort level. She\'s sleeping much better according to her. Next session in 2 weeks.' },
    { clientIdx: 5, therapistIdx: 0, apptIdx: 5, transcription: 'Liam came in post-competition. Bilateral IT band tightness was significant. Spent majority of time on TFL and iliotibial band bilaterally. Good response to compression and cross-fiber. Advised him to take 2 rest days minimum before next training session.' },
  ];

  for (let i = 0; i < voiceNoteDefs.length; i++) {
    const def = voiceNoteDefs[i];
    if (def.apptIdx >= appointments.length) continue;
    const existing = await prisma.voiceNote.findFirst({
      where: { appointmentId: appointments[def.apptIdx].id },
    });
    if (!existing) {
      await prisma.voiceNote.create({
        data: {
          businessId: business.id,
          clientId: clients[def.clientIdx].id,
          therapistId: therapists[def.therapistIdx].id,
          appointmentId: appointments[def.apptIdx].id,
          audioFileUrl: `https://storage.serenitywellness.com/voice-notes/vn_seed_${String(i + 1).padStart(4, '0')}.m4a`,
          audioFileName: `session_note_${String(i + 1).padStart(4, '0')}.m4a`,
          audioFileSize: 1024 * 1024 * (1 + i),
          audioMimeType: 'audio/mp4',
          audioDuration: 60 + i * 30,
          transcription: def.transcription,
          transcriptionCost: 0.006,
          status: VoiceNoteStatus.TRANSCRIBED,
          recordedAt: appointments[def.apptIdx].endTime,
          transcribedAt: new Date(appointments[def.apptIdx].endTime.getTime() + 5 * 60 * 1000),
        },
      });
    }
  }
  console.log('✓ Voice notes');

  // ── 21. Analytics Snapshots (90 daily + 12 weekly + 3 monthly) ───────────
  let snapshotCount = 0;

  // Daily snapshots — 90 days
  for (let d = 89; d >= 0; d--) {
    const date = daysAgo(d);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const baseAppts = isWeekday ? 6 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 3);
    const completed = Math.max(0, baseAppts - Math.floor(Math.random() * 2));
    const cancelled = baseAppts - completed;
    const avgPrice = 100 + Math.random() * 40;
    const revenue = completed * avgPrice;
    const newClients = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;

    try {
      await prisma.analyticsSnapshot.upsert({
        where: { businessId_date_type: { businessId: business.id, date, type: AnalyticsSnapshotType.DAILY } },
        update: {},
        create: {
          businessId: business.id,
          date,
          type: AnalyticsSnapshotType.DAILY,
          metrics: {
            totalRevenue: parseFloat(revenue.toFixed(2)),
            totalAppointments: baseAppts,
            completedAppointments: completed,
            cancelledAppointments: cancelled,
            noShowAppointments: Math.floor(Math.random() * 2),
            newClients,
            activeClients: 8 + Math.floor(Math.random() * 5),
            averageSessionDuration: 60 + Math.floor(Math.random() * 30),
            occupancyRate: parseFloat((completed / Math.max(baseAppts, 1)).toFixed(2)),
            therapist0Revenue: parseFloat((revenue * 0.45).toFixed(2)),
            therapist1Revenue: parseFloat((revenue * 0.35).toFixed(2)),
            therapist2Revenue: parseFloat((revenue * 0.20).toFixed(2)),
          },
        },
      });
      snapshotCount++;
    } catch {
      // Skip duplicate
    }
  }

  // Weekly snapshots — 12 weeks
  for (let w = 11; w >= 0; w--) {
    const date = daysAgo(w * 7);
    date.setHours(0, 0, 0, 0);
    // Set to Monday of that week
    const dayOfWeek = date.getDay();
    date.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekRevenue = 3000 + Math.random() * 2000;
    const weekAppts = 25 + Math.floor(Math.random() * 15);
    const completed = Math.floor(weekAppts * (0.85 + Math.random() * 0.1));

    try {
      await prisma.analyticsSnapshot.upsert({
        where: { businessId_date_type: { businessId: business.id, date, type: AnalyticsSnapshotType.WEEKLY } },
        update: {},
        create: {
          businessId: business.id,
          date,
          type: AnalyticsSnapshotType.WEEKLY,
          metrics: {
            totalRevenue: parseFloat(weekRevenue.toFixed(2)),
            totalAppointments: weekAppts,
            completedAppointments: completed,
            cancelledAppointments: weekAppts - completed,
            newClients: Math.floor(Math.random() * 5),
            activeClients: 10 + Math.floor(Math.random() * 5),
            averageSessionDuration: 65,
            occupancyRate: parseFloat((completed / weekAppts).toFixed(2)),
          },
        },
      });
      snapshotCount++;
    } catch {
      // Skip duplicate
    }
  }

  // Monthly snapshots — 6 months
  for (let m = 5; m >= 0; m--) {
    const date = new Date();
    date.setMonth(date.getMonth() - m, 1);
    date.setHours(0, 0, 0, 0);

    const monthRevenue = 14000 + Math.random() * 6000;
    const monthAppts = 110 + Math.floor(Math.random() * 40);
    const completed = Math.floor(monthAppts * (0.88 + Math.random() * 0.08));

    try {
      await prisma.analyticsSnapshot.upsert({
        where: { businessId_date_type: { businessId: business.id, date, type: AnalyticsSnapshotType.MONTHLY } },
        update: {},
        create: {
          businessId: business.id,
          date,
          type: AnalyticsSnapshotType.MONTHLY,
          metrics: {
            totalRevenue: parseFloat(monthRevenue.toFixed(2)),
            totalAppointments: monthAppts,
            completedAppointments: completed,
            cancelledAppointments: monthAppts - completed,
            newClients: 3 + Math.floor(Math.random() * 8),
            activeClients: 12 + Math.floor(Math.random() * 5),
            averageSessionDuration: 65,
            occupancyRate: parseFloat((completed / monthAppts).toFixed(2)),
            topService: serviceTypes[Math.floor(Math.random() * 3)],
            topTherapist: 'Sarah Johnson',
          },
        },
      });
      snapshotCount++;
    } catch {
      // Skip duplicate
    }
  }

  console.log('✓ Analytics snapshots:', snapshotCount);

  // ── 22. Saved Reports ─────────────────────────────────────────────────────
  const reportDefs = [
    { name: 'Monthly Revenue Overview', type: ReportType.REVENUE, schedule: ReportSchedule.MONTHLY, filters: { dateRange: 'last_30_days', groupBy: 'therapist' } },
    { name: 'Weekly Appointment Summary', type: ReportType.APPOINTMENTS, schedule: ReportSchedule.WEEKLY, filters: { dateRange: 'last_7_days', groupBy: 'status' } },
    { name: 'Client Retention Report', type: ReportType.CLIENTS, schedule: ReportSchedule.MONTHLY, filters: { dateRange: 'last_90_days', metric: 'retention' } },
    { name: 'Therapist Performance', type: ReportType.THERAPISTS, schedule: ReportSchedule.MONTHLY, filters: { dateRange: 'last_30_days', groupBy: 'therapist' } },
    { name: 'Financial Summary Q1', type: ReportType.FINANCIAL_SUMMARY, schedule: ReportSchedule.MONTHLY, filters: { dateRange: 'custom', startDate: '2025-01-01', endDate: '2025-03-31' } },
  ];

  for (const def of reportDefs) {
    const existing = await prisma.savedReport.findFirst({
      where: { businessId: business.id, name: def.name },
    });
    if (!existing) {
      await prisma.savedReport.create({
        data: {
          businessId: business.id,
          name: def.name,
          type: def.type,
          filters: def.filters,
          schedule: def.schedule,
          emailTo: [OWNER_EMAIL],
          isActive: true,
        },
      });
    }
  }
  console.log('✓ Saved reports:', reportDefs.length);

  // ── 23. AI Prompt Templates ───────────────────────────────────────────────
  const aiTemplateDefs = [
    {
      name: 'SOAP Note Summary',
      feature: AIFeature.NOTE_SUMMARY,
      template: 'Summarize the following SOAP note in 2-3 sentences for a client-facing follow-up message:\n\nSubjective: {{subjective}}\nObjective: {{objective}}\nAssessment: {{assessment}}\nPlan: {{plan}}',
      variables: [
        { name: 'subjective', description: 'Subjective findings' },
        { name: 'objective', description: 'Objective findings' },
        { name: 'assessment', description: 'Clinician assessment' },
        { name: 'plan', description: 'Treatment plan' },
      ],
    },
    {
      name: 'Treatment Recommendations',
      feature: AIFeature.TREATMENT_SUGGESTION,
      template: 'Based on the following client history and current presentation, suggest 3 treatment recommendations:\n\nClient Goals: {{goals}}\nMedical History: {{medicalHistory}}\nCurrent Concerns: {{currentConcerns}}\nPrevious Treatments: {{previousTreatments}}',
      variables: [
        { name: 'goals', description: 'Client goals' },
        { name: 'medicalHistory', description: 'Medical history summary' },
        { name: 'currentConcerns', description: 'Current presenting concerns' },
        { name: 'previousTreatments', description: 'Previous treatments and outcomes' },
      ],
    },
  ];

  for (const def of aiTemplateDefs) {
    const existing = await prisma.aIPromptTemplate.findFirst({
      where: { businessId: business.id, name: def.name },
    });
    if (!existing) {
      await prisma.aIPromptTemplate.create({
        data: {
          businessId: business.id,
          name: def.name,
          description: `AI template for ${def.name.toLowerCase()}`,
          feature: def.feature,
          template: def.template,
          variables: def.variables,
          provider: 'ANY',
          isActive: true,
          isDefault: true,
        },
      });
    }
  }
  console.log('✓ AI prompt templates');

  // ── 24. Audit Logs ────────────────────────────────────────────────────────
  const auditEvents = [
    { action: 'USER_LOGIN', entityType: 'User', entityId: ownerUser.id, meta: { method: 'supabase', success: true } },
    { action: 'CLIENT_CREATED', entityType: 'Client', entityId: clients[0].id, meta: { clientName: 'Emma Williams' } },
    { action: 'APPOINTMENT_CREATED', entityType: 'Appointment', entityId: appointments[0].id, meta: { clientId: clients[0].id, serviceType: serviceTypes[0] } },
    { action: 'INVOICE_SENT', entityType: 'Invoice', entityId: 'inv_audit_ref', meta: { amount: 120, clientId: clients[0].id } },
    { action: 'PAYMENT_RECEIVED', entityType: 'Payment', entityId: 'pay_audit_ref', meta: { amount: 120, method: 'STRIPE_CARD' } },
    { action: 'USER_LOGIN', entityType: 'User', entityId: ownerUser.id, meta: { method: 'supabase', success: true } },
  ];

  for (const ev of auditEvents) {
    await prisma.auditLog.create({
      data: {
        userId: ownerUser.id,
        businessId: business.id,
        action: ev.action,
        entityType: ev.entityType,
        entityId: ev.entityId,
        metadata: ev.meta,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });
  }
  console.log('✓ Audit logs');

  // ── 25. Global Note Templates ─────────────────────────────────────────────
  const globalNoteTemplates = [
    {
      name: 'SOAP Note',
      category: 'General',
      fields: [
        { label: 'Subjective', type: 'text', required: true, placeholder: 'Client-reported symptoms, pain level, history...' },
        { label: 'Objective', type: 'text', required: true, placeholder: 'Observable findings, palpation, ROM...' },
        { label: 'Assessment', type: 'text', required: true, placeholder: 'Clinical impression and analysis...' },
        { label: 'Plan', type: 'text', required: true, placeholder: 'Treatment plan and follow-up...' },
        { label: 'Areas Worked', type: 'checkbox', required: false, placeholder: '', options: ['Neck', 'Shoulders', 'Upper Back', 'Lower Back', 'Hips', 'Gluteals', 'Hamstrings', 'Calves', 'Arms', 'Feet'] },
        { label: 'Techniques Used', type: 'text', required: false, placeholder: 'e.g., Deep tissue, myofascial release...' },
        { label: 'Session Duration (min)', type: 'text', required: false, placeholder: 'e.g., 60' },
        { label: 'Follow-up Date', type: 'text', required: false, placeholder: 'e.g., 2 weeks' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Initial Assessment',
      category: 'General',
      fields: [
        { label: 'Chief Complaint', type: 'text', required: true, placeholder: 'Primary reason for visit...' },
        { label: 'History of Present Condition', type: 'text', required: true, placeholder: 'Onset, duration, mechanism...' },
        { label: 'Relevant Medical History', type: 'text', required: false, placeholder: 'Past injuries, surgeries, conditions...' },
        { label: 'Current Medications', type: 'text', required: false, placeholder: 'List medications and dosages...' },
        { label: 'Pain Location', type: 'body-map', required: false, placeholder: '' },
        { label: 'Pain Level (0-10)', type: 'scale', required: true, placeholder: '' },
        { label: 'Functional Limitations', type: 'text', required: false, placeholder: 'Activities affected by condition...' },
        { label: 'Client Goals', type: 'text', required: true, placeholder: 'What does the client want to achieve...' },
        { label: 'Contraindications', type: 'checkbox', required: false, placeholder: '', options: ['Pregnancy', 'Recent surgery', 'Open wounds', 'Infectious skin condition', 'Blood clots/DVT', 'Severe osteoporosis', 'None'] },
        { label: 'Treatment Plan', type: 'text', required: false, placeholder: 'Proposed treatment approach...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Progress Note',
      category: 'General',
      fields: [
        { label: 'Progress Since Last Visit', type: 'text', required: true, placeholder: 'Changes, improvements, setbacks...' },
        { label: 'Current Pain Level (0-10)', type: 'scale', required: true, placeholder: '' },
        { label: 'Areas of Focus Today', type: 'body-map', required: false, placeholder: '' },
        { label: 'Techniques Applied', type: 'text', required: false, placeholder: 'Methods used in this session...' },
        { label: 'Client Response to Treatment', type: 'text', required: true, placeholder: 'How the client responded during and after...' },
        { label: 'Home Care Compliance', type: 'checkbox', required: false, placeholder: '', options: ['Completed exercises', 'Used ice/heat', 'Took recommended breaks', 'Did not complete home care'] },
        { label: 'Next Session Goals', type: 'text', required: false, placeholder: 'Focus areas for the next appointment...' },
      ],
    },
    {
      name: 'Discharge Summary',
      category: 'General',
      fields: [
        { label: 'Reason for Discharge', type: 'checkbox', required: true, placeholder: '', options: ['Treatment goals met', 'Client request', 'Referral to another provider', 'Non-compliance', 'Other'] },
        { label: 'Summary of Treatment Course', type: 'text', required: true, placeholder: 'Overview of sessions, techniques, and approach...' },
        { label: 'Outcomes Achieved', type: 'text', required: true, placeholder: 'Measurable improvements from initial assessment...' },
        { label: 'Final Pain Level (0-10)', type: 'scale', required: false, placeholder: '' },
        { label: 'Recommendations', type: 'text', required: false, placeholder: 'Ongoing care, referrals, lifestyle advice...' },
        { label: 'Home Care Instructions', type: 'text', required: false, placeholder: 'Exercises, self-care strategies...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Remedial Massage',
      category: 'Massage',
      fields: [
        { label: 'Presenting Complaint', type: 'text', required: true, placeholder: 'Chief symptom and onset...' },
        { label: 'Postural Observation', type: 'body-map', required: false, placeholder: '' },
        { label: 'Range of Motion Assessment', type: 'text', required: false, placeholder: 'ROM findings for affected joints...' },
        { label: 'Muscle Testing Findings', type: 'text', required: false, placeholder: 'Strength and tone observations...' },
        { label: 'Special Tests Performed', type: 'text', required: false, placeholder: 'e.g., Orthopedic tests and results...' },
        { label: 'Treatment Applied', type: 'text', required: true, placeholder: 'Techniques and areas treated...' },
        { label: 'Client Response', type: 'text', required: false, placeholder: 'Immediate response and feedback...' },
        { label: 'Homecare Advice', type: 'text', required: false, placeholder: 'Stretches, ice/heat, activity modifications...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Sports Injury',
      category: 'Sports',
      fields: [
        { label: 'Sport / Activity', type: 'text', required: true, placeholder: 'e.g., Running, football, swimming...' },
        { label: 'Mechanism of Injury', type: 'text', required: true, placeholder: 'How the injury occurred...' },
        { label: 'Pain Level (0-10)', type: 'scale', required: true, placeholder: '' },
        { label: 'Injury Location', type: 'body-map', required: false, placeholder: '' },
        { label: 'Injury Status', type: 'checkbox', required: false, placeholder: '', options: ['Acute (< 72hrs)', 'Sub-acute', 'Chronic', 'Re-injury'] },
        { label: 'Functional Testing', type: 'text', required: false, placeholder: 'Movement tests and results...' },
        { label: 'Treatment Applied', type: 'text', required: true, placeholder: 'Techniques used, areas treated, duration...' },
        { label: 'Return to Sport Timeline', type: 'text', required: false, placeholder: 'Estimated recovery and return milestones...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Pregnancy Massage',
      category: 'Prenatal',
      fields: [
        { label: 'Weeks Gestation', type: 'text', required: true, placeholder: 'e.g., 24 weeks' },
        { label: 'Medical Clearance Confirmed', type: 'checkbox', required: true, placeholder: '', options: ['Yes — verbal', 'Yes — written', 'Not required (under 12 weeks)', 'Pending'] },
        { label: 'Client Position Used', type: 'checkbox', required: false, placeholder: '', options: ['Side-lying (left)', 'Side-lying (right)', 'Semi-reclined', 'Seated'] },
        { label: 'Presenting Concerns', type: 'text', required: true, placeholder: 'Back pain, swelling, hip tension...' },
        { label: 'Areas Treated', type: 'body-map', required: false, placeholder: '' },
        { label: 'Techniques Used', type: 'text', required: false, placeholder: 'Light effleurage, lymphatic drainage...' },
        { label: 'Client and Baby Response', type: 'text', required: true, placeholder: 'Client comfort level, fetal movement observed...' },
        { label: 'Safety Considerations', type: 'text', required: false, placeholder: 'Precautions taken, contraindications noted...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Postural Assessment',
      category: 'Assessment',
      fields: [
        { label: 'Anterior View Findings', type: 'body-map', required: false, placeholder: '' },
        { label: 'Posterior View Findings', type: 'body-map', required: false, placeholder: '' },
        { label: 'Head Position', type: 'checkbox', required: false, placeholder: '', options: ['Neutral', 'Forward head', 'Lateral tilt right', 'Lateral tilt left', 'Rotation right', 'Rotation left'] },
        { label: 'Shoulder Level', type: 'checkbox', required: false, placeholder: '', options: ['Level', 'Right elevated', 'Left elevated', 'Both elevated'] },
        { label: 'Spinal Curvature', type: 'checkbox', required: false, placeholder: '', options: ['Within normal limits', 'Hyperlordosis', 'Hypolordosis', 'Hyperkyphosis', 'Scoliosis (right)', 'Scoliosis (left)'] },
        { label: 'Hip Level', type: 'checkbox', required: false, placeholder: '', options: ['Level', 'Right elevated', 'Left elevated'] },
        { label: 'Foot Alignment', type: 'checkbox', required: false, placeholder: '', options: ['Neutral bilateral', 'Pronated bilateral', 'Supinated bilateral', 'Pronated right', 'Pronated left'] },
        { label: 'Key Imbalances Noted', type: 'text', required: false, placeholder: 'Muscle length, strength imbalances observed...' },
        { label: 'Treatment Implications', type: 'text', required: true, placeholder: 'How findings will shape the treatment plan...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
    },
    {
      name: 'Pain Scale',
      category: 'Assessment',
      fields: [
        { label: 'Current Pain Level (0-10)', type: 'scale', required: true, placeholder: '' },
        { label: 'Pain at Worst (0-10)', type: 'scale', required: false, placeholder: '' },
        { label: 'Pain at Best (0-10)', type: 'scale', required: false, placeholder: '' },
        { label: 'Pain Location', type: 'body-map', required: true, placeholder: '' },
        { label: 'Pain Type', type: 'checkbox', required: false, placeholder: '', options: ['Sharp', 'Dull', 'Aching', 'Burning', 'Throbbing', 'Radiating', 'Stabbing', 'Tingling'] },
        { label: 'Pain Duration', type: 'text', required: false, placeholder: 'Constant, intermittent, how long per episode...' },
        { label: 'Aggravating Factors', type: 'text', required: false, placeholder: 'Activities or positions that worsen pain...' },
        { label: 'Relieving Factors', type: 'text', required: false, placeholder: 'What helps reduce the pain...' },
        { label: 'Impact on Daily Activities', type: 'text', required: false, placeholder: 'Sleep, work, exercise, daily tasks affected...' },
      ],
    },
    {
      name: 'Movement Screen',
      category: 'Assessment',
      fields: [
        { label: 'Overhead Squat', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Arms fall forward', 'Trunk lean', 'Knee valgus', 'Heel rise'] },
        { label: 'Hurdle Step (Left)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Hip shift', 'Trunk lean', 'Loss of balance'] },
        { label: 'Hurdle Step (Right)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Hip shift', 'Trunk lean', 'Loss of balance'] },
        { label: 'Inline Lunge (Left)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Trunk rotation', 'Knee valgus', 'Loss of balance'] },
        { label: 'Inline Lunge (Right)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Trunk rotation', 'Knee valgus', 'Loss of balance'] },
        { label: 'Shoulder Mobility (Left)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Limited internal rotation', 'Limited external rotation', 'Pain'] },
        { label: 'Shoulder Mobility (Right)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Limited internal rotation', 'Limited external rotation', 'Pain'] },
        { label: 'Active Straight Leg Raise (Left)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Partial range', 'Compensatory pelvic shift'] },
        { label: 'Active Straight Leg Raise (Right)', type: 'checkbox', required: false, placeholder: '', options: ['Pass', 'Partial range', 'Compensatory pelvic shift'] },
        { label: 'Compensations / Asymmetries Noted', type: 'text', required: false, placeholder: 'Observations across all tests...' },
        { label: 'Recommendations', type: 'text', required: true, placeholder: 'Priority areas to address, corrective strategies...' },
      ],
    },
  ];

  for (const tmpl of globalNoteTemplates) {
    const existing = await prisma.noteTemplate.findFirst({
      where: { isGlobal: true, name: tmpl.name },
    });
    if (!existing) {
      await prisma.noteTemplate.create({
        data: {
          businessId: null,
          name: tmpl.name,
          category: tmpl.category,
          fields: tmpl.fields,
          isGlobal: true,
          createdBy: null,
        },
      });
    }
  }
  console.log('✓ Global note templates:', globalNoteTemplates.length);

  // ── 26. Locations ─────────────────────────────────────────────────────────
  const locationDefs = [
    { name: 'Collins Street (Main)', address: '45 Collins Street, Level 8', city: 'Melbourne', state: 'VIC', postalCode: '3000', phone: '03 9123 4567', email: 'collins@serenitywellness.com', timezone: 'Australia/Melbourne', isPrimary: true },
    { name: 'Fitzroy Studio', address: '210 Brunswick Street', city: 'Fitzroy', state: 'VIC', postalCode: '3065', phone: '03 9456 7890', email: 'fitzroy@serenitywellness.com', timezone: 'Australia/Melbourne', isPrimary: false },
  ];
  const locations: any[] = [];
  for (const def of locationDefs) {
    const existing = await prisma.location.findFirst({ where: { businessId: business.id, name: def.name } });
    const loc = existing ?? await prisma.location.create({
      data: { businessId: business.id, name: def.name, address: def.address, city: def.city, state: def.state, postalCode: def.postalCode, phoneNumber: def.phone, email: def.email, timezone: def.timezone, isActive: true, isPrimary: def.isPrimary },
    });
    locations.push(loc);
  }
  console.log('✓ Locations:', locations.length);

  // ── 27. Rooms ──────────────────────────────────────────────────────────────
  const roomDefs = [
    { name: 'Room 1 — Serenity', color: '#8B5CF6', locationIdx: 0 },
    { name: 'Room 2 — Harmony', color: '#EC4899', locationIdx: 0 },
    { name: 'Room 3 — Tranquility', color: '#3B82F6', locationIdx: 0 },
    { name: 'Room 1 — Fitzroy', color: '#10B981', locationIdx: 1 },
  ];
  const rooms: any[] = [];
  for (const def of roomDefs) {
    const existing = await prisma.room.findFirst({ where: { businessId: business.id, name: def.name } });
    const room = existing ?? await prisma.room.create({
      data: { businessId: business.id, locationId: locations[def.locationIdx].id, name: def.name, color: def.color, capacity: 1, isActive: true },
    });
    rooms.push(room);
  }
  console.log('✓ Rooms:', rooms.length);

  // ── 28. Therapist Locations ────────────────────────────────────────────────
  const therapistLocationDefs = [
    { therapistIdx: 0, locationIdx: 0 },
    { therapistIdx: 1, locationIdx: 0 },
    { therapistIdx: 2, locationIdx: 0 },
    { therapistIdx: 2, locationIdx: 1 },
  ];
  for (const def of therapistLocationDefs) {
    const existing = await prisma.therapistLocation.findFirst({ where: { therapistId: therapists[def.therapistIdx].id, locationId: locations[def.locationIdx].id } });
    if (!existing) {
      await prisma.therapistLocation.create({ data: { therapistId: therapists[def.therapistIdx].id, locationId: locations[def.locationIdx].id } });
    }
  }
  console.log('✓ Therapist locations');

  // ── 29. Therapist Time Off ─────────────────────────────────────────────────
  const timeOffDefs: { therapistIdx: number; start: Date; end: Date; reason: string }[] = [
    { therapistIdx: 0, start: daysAhead(30), end: daysAhead(36), reason: 'Annual leave' },
    { therapistIdx: 1, start: daysAhead(45), end: daysAhead(47), reason: 'Personal appointment' },
    { therapistIdx: 2, start: daysAhead(14), end: daysAhead(14), reason: 'Conference — Remedial Massage Summit' },
    { therapistIdx: 0, start: daysAgo(60), end: daysAgo(55), reason: 'Sick leave' },
    { therapistIdx: 1, start: daysAgo(20), end: daysAgo(20), reason: 'Medical appointment' },
  ];
  for (const def of timeOffDefs) {
    const existing = await prisma.therapistTimeOff.findFirst({ where: { therapistId: therapists[def.therapistIdx].id, startDate: def.start } });
    if (!existing) {
      await prisma.therapistTimeOff.create({
        data: { businessId: business.id, therapistId: therapists[def.therapistIdx].id, startDate: def.start, endDate: def.end, reason: def.reason, isAllDay: true },
      });
    }
  }
  console.log('✓ Therapist time off');

  // ── 30. Appointment Cancellations ─────────────────────────────────────────
  const cancelledAppts = await prisma.appointment.findMany({ where: { businessId: business.id, status: AppointmentStatus.CANCELLED }, take: 3 });
  const cancellationDefs = [
    { reason: 'Work conflict — meeting rescheduled last minute', type: 'CLIENT_REQUESTED', clientIdx: 3 },
    { reason: 'Client called in sick', type: 'CLIENT_REQUESTED', clientIdx: 7 },
    { reason: 'Therapist unavailable — family emergency', type: 'BUSINESS_INITIATED', clientIdx: 11 },
  ];
  for (let i = 0; i < cancelledAppts.length; i++) {
    const appt = cancelledAppts[i];
    const existing = await prisma.appointmentCancellation.findUnique({ where: { appointmentId: appt.id } });
    if (!existing) {
      const def = cancellationDefs[i % cancellationDefs.length];
      await prisma.appointmentCancellation.create({
        data: { appointmentId: appt.id, businessId: business.id, cancelledBy: def.type === 'CLIENT_REQUESTED' ? clients[def.clientIdx].id : ownerUser.id, reason: def.reason, cancellationType: def.type },
      });
    }
  }
  console.log('✓ Appointment cancellations');

  // ── 31. Appointment Reminders ─────────────────────────────────────────────
  const upcomingForReminders = await prisma.appointment.findMany({
    where: { businessId: business.id, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] }, startTime: { gte: new Date() } },
    orderBy: { startTime: 'asc' }, take: 8,
  });
  for (const appt of upcomingForReminders) {
    for (const [type, hoursOffset] of [['SMS_24H', 24], ['EMAIL_48H', 48]] as [string, number][]) {
      const existing = await prisma.appointmentReminder.findFirst({ where: { appointmentId: appt.id, reminderType: type } });
      if (!existing) {
        await prisma.appointmentReminder.create({
          data: { appointmentId: appt.id, businessId: business.id, reminderType: type, scheduledFor: new Date(appt.startTime.getTime() - hoursOffset * 3600000), status: 'PENDING' },
        });
      }
    }
  }
  const recentCompleted = await prisma.appointment.findMany({
    where: { businessId: business.id, status: AppointmentStatus.COMPLETED }, orderBy: { startTime: 'desc' }, take: 6,
  });
  for (const appt of recentCompleted) {
    const existing = await prisma.appointmentReminder.findFirst({ where: { appointmentId: appt.id } });
    if (!existing) {
      const scheduledAt = new Date(appt.startTime.getTime() - 24 * 3600000);
      await prisma.appointmentReminder.create({
        data: { appointmentId: appt.id, businessId: business.id, reminderType: 'SMS_24H', scheduledFor: scheduledAt, status: 'SENT', sentAt: scheduledAt },
      });
    }
  }
  console.log('✓ Appointment reminders');

  // ── 32. Saved Payment Methods ──────────────────────────────────────────────
  const savedPaymentDefs = [
    { clientIdx: 0, brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2027 },
    { clientIdx: 1, brand: 'Mastercard', last4: '5555', expMonth: 8, expYear: 2026 },
    { clientIdx: 2, brand: 'Visa', last4: '1234', expMonth: 3, expYear: 2028 },
    { clientIdx: 3, brand: 'Amex', last4: '0005', expMonth: 11, expYear: 2026 },
    { clientIdx: 4, brand: 'Visa', last4: '9876', expMonth: 6, expYear: 2027 },
    { clientIdx: 6, brand: 'Mastercard', last4: '3456', expMonth: 9, expYear: 2026 },
  ];
  for (let i = 0; i < savedPaymentDefs.length; i++) {
    const def = savedPaymentDefs[i];
    const existing = await prisma.savedPaymentMethod.findFirst({ where: { clientId: clients[def.clientIdx].id } });
    if (!existing) {
      await prisma.savedPaymentMethod.create({
        data: {
          businessId: business.id, clientId: clients[def.clientIdx].id,
          stripePaymentMethodId: `pm_seed_${String(i + 1).padStart(8, '0')}`,
          stripeCustomerId: `cus_seed_${String(def.clientIdx + 1).padStart(6, '0')}`,
          brand: def.brand, last4: def.last4, expMonth: def.expMonth, expYear: def.expYear, isDefault: true,
        },
      });
    }
  }
  console.log('✓ Saved payment methods');

  // ── 33. Membership Sessions ────────────────────────────────────────────────
  const completedByClient: Record<string, any[]> = {};
  for (const appt of appointments) {
    if (appt.status === AppointmentStatus.COMPLETED) {
      if (!completedByClient[appt.clientId]) completedByClient[appt.clientId] = [];
      completedByClient[appt.clientId].push(appt);
    }
  }
  const membershipClientPairs: [number, number][] = [[0, 0], [1, 1], [6, 2], [7, 3]];
  let membershipSessionCount = 0;
  for (const [clientIdx, membershipIdx] of membershipClientPairs) {
    const clientAppts = completedByClient[clients[clientIdx].id] || [];
    for (let i = 0; i < Math.min(2, clientAppts.length); i++) {
      const appt = clientAppts[i];
      const existing = await prisma.membershipSession.findUnique({ where: { appointmentId: appt.id } });
      if (!existing) {
        await prisma.membershipSession.create({ data: { membershipId: memberships[membershipIdx].id, appointmentId: appt.id, businessId: business.id, redeemedAt: appt.startTime } });
        membershipSessionCount++;
      }
    }
  }
  console.log('✓ Membership sessions:', membershipSessionCount);

  // ── 34. Package Sessions ───────────────────────────────────────────────────
  const packageClientPairs: [number, number][] = [[2, 0], [5, 1]];
  let packageSessionCount = 0;
  for (const [clientIdx, pkgIdx] of packageClientPairs) {
    const clientAppts = completedByClient[clients[clientIdx].id] || [];
    for (let i = 0; i < Math.min(2, clientAppts.length); i++) {
      const appt = clientAppts[i];
      const existing = await prisma.packageSession.findUnique({ where: { appointmentId: appt.id } });
      if (!existing) {
        await prisma.packageSession.create({ data: { packagePurchaseId: packages[pkgIdx].id, appointmentId: appt.id, businessId: business.id, redeemedAt: appt.startTime } });
        packageSessionCount++;
      }
    }
  }
  console.log('✓ Package sessions:', packageSessionCount);

  // ── 35. Video Session ─────────────────────────────────────────────────────
  const virtualAppt = await prisma.appointment.findFirst({ where: { businessId: business.id, isVirtual: true }, orderBy: { startTime: 'asc' } });
  if (virtualAppt) {
    const existing = await prisma.videoSession.findUnique({ where: { appointmentId: virtualAppt.id } });
    if (!existing) {
      await prisma.videoSession.create({
        data: {
          businessId: business.id, appointmentId: virtualAppt.id, therapistId: virtualAppt.therapistId, clientId: virtualAppt.clientId,
          dailyRoomName: `serenity-${virtualAppt.id.substring(0, 8)}`, dailyRoomUrl: `https://serenitywellness.daily.co/serenity-${virtualAppt.id.substring(0, 8)}`,
          status: VideoSessionStatus.SCHEDULED, scheduledFor: virtualAppt.startTime, screenShareEnabled: true, chatEnabled: true,
        },
      });
    }
  }
  console.log('✓ Video session');

  // ── 36. Promotions ────────────────────────────────────────────────────────
  const promotionDefs = [
    {
      name: 'Summer Wellness Sale', description: '20% off all 90-minute massages throughout January',
      channel: PromotionChannel.EMAIL, status: PromotionStatus.SENT,
      subject: 'Refresh Your Body This Summer — 20% Off 90-Minute Massages',
      body: 'Hi {{clientName}},\n\nThis January, enjoy 20% off all 90-minute massage sessions with code SUMMER20.\n\nOffer valid until January 31. Book now at serenitywellness.com.\n\nWarm regards,\nThe Serenity Wellness Team',
      recipientFilter: { lastVisitDays: 90, isActive: true }, sentAt: daysAgo(20), totalSent: 12, totalOpened: 8, totalClicked: 5, totalConverted: 3,
    },
    {
      name: 'Re-engagement Campaign', description: 'Bring back clients who haven\'t visited in 60+ days',
      channel: PromotionChannel.SMS, status: PromotionStatus.SENT, subject: null,
      body: 'Hi {{clientName}}, we miss you at Serenity Wellness! Come back and feel amazing. Book this week and save 15% with code COMEBACK15. Reply STOP to unsubscribe.',
      recipientFilter: { lastVisitDays: 60, isActive: true }, sentAt: daysAgo(10), totalSent: 5, totalOpened: 5, totalClicked: 3, totalConverted: 2,
    },
    {
      name: 'New Client Welcome Offer', description: 'First-time client introductory discount',
      channel: PromotionChannel.EMAIL, status: PromotionStatus.SCHEDULED,
      subject: 'Welcome to Serenity Wellness — Your First Session is Special',
      body: 'Hi {{clientName}},\n\nWe\'re thrilled to welcome you! As a new client, enjoy $20 off your first session. No code needed — mention this email when you book.\n\nBest,\nSerenity Wellness Team',
      recipientFilter: { newClientsOnly: true }, scheduledFor: daysAhead(7), totalSent: 0, totalOpened: 0, totalClicked: 0, totalConverted: 0,
    },
    {
      name: 'Member Appreciation — Complimentary Add-On', description: 'Loyalty reward for active members',
      channel: PromotionChannel.EMAIL, status: PromotionStatus.DRAFT,
      subject: 'A Special Gift from Serenity Wellness',
      body: 'Dear {{clientName}},\n\nAs a valued member, we\'re giving you a complimentary 15-minute add-on with your next session — free!\n\nMention this email on arrival.\n\nWith gratitude,\nSerenity Wellness Team',
      recipientFilter: { membershipStatus: 'ACTIVE' }, totalSent: 0, totalOpened: 0, totalClicked: 0, totalConverted: 0,
    },
    {
      name: 'Birthday Month Treat', description: 'Happy birthday discount for clients in their birthday month',
      channel: PromotionChannel.SMS, status: PromotionStatus.SENT, subject: null,
      body: 'Happy Birthday {{clientName}}! 🎂 Treat yourself — use BDAY15 for 15% off any session this month. Book: serenitywellness.com',
      recipientFilter: { birthdayMonth: true }, sentAt: daysAgo(5), totalSent: 3, totalOpened: 3, totalClicked: 2, totalConverted: 1,
    },
  ];
  const promotions: any[] = [];
  for (const def of promotionDefs) {
    const existing = await prisma.promotion.findFirst({ where: { businessId: business.id, name: def.name } });
    const p = existing ?? await prisma.promotion.create({
      data: {
        businessId: business.id, name: def.name, description: def.description, channel: def.channel, status: def.status,
        subject: def.subject ?? undefined, body: def.body, recipientFilter: def.recipientFilter,
        scheduledFor: (def as any).scheduledFor ?? undefined, sentAt: (def as any).sentAt ?? undefined,
        totalSent: def.totalSent, totalOpened: def.totalOpened, totalClicked: def.totalClicked, totalConverted: def.totalConverted,
      },
    });
    promotions.push(p);
  }
  console.log('✓ Promotions:', promotions.length);

  // ── 37. Promotion Recipients ───────────────────────────────────────────────
  if (promotions[0]) {
    for (let i = 0; i < Math.min(10, clients.length); i++) {
      const existing = await prisma.promotionRecipient.findUnique({ where: { promotionId_clientId: { promotionId: promotions[0].id, clientId: clients[i].id } } });
      if (!existing) {
        await prisma.promotionRecipient.create({
          data: {
            promotionId: promotions[0].id, clientId: clients[i].id,
            status: i < 3 ? 'CONVERTED' : i < 5 ? 'CLICKED' : i < 8 ? 'OPENED' : 'SENT',
            sentAt: daysAgo(20), openedAt: i < 8 ? daysAgo(19) : undefined,
            clickedAt: i < 5 ? daysAgo(18) : undefined, convertedAt: i < 3 ? daysAgo(17) : undefined,
          },
        });
      }
    }
  }
  if (promotions[1]) {
    for (let i = 3; i < Math.min(8, clients.length); i++) {
      const existing = await prisma.promotionRecipient.findUnique({ where: { promotionId_clientId: { promotionId: promotions[1].id, clientId: clients[i].id } } });
      if (!existing) {
        await prisma.promotionRecipient.create({
          data: {
            promotionId: promotions[1].id, clientId: clients[i].id,
            status: i < 5 ? 'CONVERTED' : i < 7 ? 'CLICKED' : 'SENT',
            sentAt: daysAgo(10), openedAt: i < 7 ? daysAgo(9) : undefined,
            clickedAt: i < 5 ? daysAgo(8) : undefined, convertedAt: i < 5 ? daysAgo(7) : undefined,
          },
        });
      }
    }
  }
  if (promotions[4]) {
    for (let i = 0; i < 3; i++) {
      const existing = await prisma.promotionRecipient.findUnique({ where: { promotionId_clientId: { promotionId: promotions[4].id, clientId: clients[i].id } } });
      if (!existing) {
        await prisma.promotionRecipient.create({
          data: {
            promotionId: promotions[4].id, clientId: clients[i].id,
            status: i < 1 ? 'CONVERTED' : i < 2 ? 'CLICKED' : 'SENT',
            sentAt: daysAgo(5), openedAt: daysAgo(4),
            clickedAt: i < 2 ? daysAgo(4) : undefined, convertedAt: i < 1 ? daysAgo(3) : undefined,
          },
        });
      }
    }
  }
  console.log('✓ Promotion recipients');

  // ── 38. Gift Cards ─────────────────────────────────────────────────────────
  const giftCardDefs = [
    { purchaserIdx: 3, recipientEmail: 'sarah.giftee@example.com', recipientName: 'Sarah Williams', amount: 100, balance: 100, expiresAhead: 365, note: 'Happy Birthday! Treat yourself.' },
    { purchaserIdx: 5, recipientEmail: 'tom.giftee@example.com', recipientName: 'Tom Anderson', amount: 150, balance: 50, expiresAhead: 365, note: 'Get well soon — enjoy some relaxation.' },
    { purchaserIdx: 7, recipientEmail: 'jenny.giftee@example.com', recipientName: 'Jenny Thompson', amount: 200, balance: 200, expiresAhead: 365, note: 'Anniversary gift — you deserve it!' },
    { purchaserIdx: 9, recipientEmail: 'mike.giftee@example.com', recipientName: 'Mike Davies', amount: 75, balance: 75, expiresAhead: 180, note: 'Thank you for everything you do.' },
    { purchaserIdx: 11, recipientEmail: 'lisa.giftee@example.com', recipientName: 'Lisa Chen', amount: 120, balance: 0, expiresAhead: -10, note: 'Wedding present — congratulations!' },
    { purchaserIdx: 0, recipientEmail: 'dan.giftee@example.com', recipientName: 'Dan Roberts', amount: 80, balance: 80, expiresAhead: 270, note: 'Just because!' },
  ];
  const giftCards: any[] = [];
  for (let i = 0; i < giftCardDefs.length; i++) {
    const def = giftCardDefs[i];
    const code = `GC-${String(20250000 + i + 1).padStart(8, '0')}`;
    const existing = await prisma.giftCard.findUnique({ where: { code } });
    const gc = existing ?? await prisma.giftCard.create({
      data: {
        businessId: business.id, code, originalAmount: def.amount, balance: def.balance, currency: 'USD',
        purchasedById: clients[def.purchaserIdx].id, recipientEmail: def.recipientEmail, recipientName: def.recipientName,
        note: def.note, expiresAt: def.expiresAhead > 0 ? daysAhead(def.expiresAhead) : daysAgo(Math.abs(def.expiresAhead)),
        isActive: def.balance > 0, sentAt: daysAgo(30 - i * 4), purchasedAt: daysAgo(32 - i * 4),
      },
    });
    giftCards.push(gc);
  }
  console.log('✓ Gift cards:', giftCards.length);

  // ── 39. Gift Card Redemptions ──────────────────────────────────────────────
  if (giftCards[1]) {
    const ex1 = await prisma.giftCardRedemption.findFirst({ where: { giftCardId: giftCards[1].id } });
    if (!ex1) await prisma.giftCardRedemption.create({ data: { giftCardId: giftCards[1].id, businessId: business.id, amount: 100, redeemedAt: daysAgo(15) } });
  }
  if (giftCards[4]) {
    const ex4 = await prisma.giftCardRedemption.findFirst({ where: { giftCardId: giftCards[4].id } });
    if (!ex4) await prisma.giftCardRedemption.create({ data: { giftCardId: giftCards[4].id, businessId: business.id, amount: 120, redeemedAt: daysAgo(5) } });
  }
  console.log('✓ Gift card redemptions');

  // ── 40. Loyalty Settings ──────────────────────────────────────────────────
  const existingLoyaltySettings = await prisma.loyaltySettings.findUnique({ where: { businessId: business.id } });
  if (!existingLoyaltySettings) {
    await prisma.loyaltySettings.create({
      data: { businessId: business.id, pointsPerDollar: 1.0, dollarPerPoint: 0.01, bronzeMinPoints: 0, silverMinPoints: 500, goldMinPoints: 1500, isActive: true, expiryDays: 365 },
    });
  }
  console.log('✓ Loyalty settings');

  // ── 41. Loyalty Accounts & Transactions ───────────────────────────────────
  const loyaltyAccountDefs = [
    { clientIdx: 0, points: 1720, lifetimePoints: 1720, tier: 'GOLD' },
    { clientIdx: 1, points: 850, lifetimePoints: 950, tier: 'SILVER' },
    { clientIdx: 2, points: 380, lifetimePoints: 380, tier: 'BRONZE' },
    { clientIdx: 3, points: 540, lifetimePoints: 690, tier: 'SILVER' },
    { clientIdx: 4, points: 220, lifetimePoints: 220, tier: 'BRONZE' },
    { clientIdx: 5, points: 1100, lifetimePoints: 1100, tier: 'SILVER' },
    { clientIdx: 6, points: 430, lifetimePoints: 430, tier: 'BRONZE' },
    { clientIdx: 7, points: 780, lifetimePoints: 780, tier: 'SILVER' },
    { clientIdx: 8, points: 260, lifetimePoints: 260, tier: 'BRONZE' },
    { clientIdx: 9, points: 115, lifetimePoints: 115, tier: 'BRONZE' },
    { clientIdx: 10, points: 310, lifetimePoints: 310, tier: 'BRONZE' },
    { clientIdx: 12, points: 950, lifetimePoints: 1050, tier: 'SILVER' },
    { clientIdx: 14, points: 170, lifetimePoints: 170, tier: 'BRONZE' },
  ];
  const loyaltyAccounts: any[] = [];
  for (const def of loyaltyAccountDefs) {
    const existing = await prisma.loyaltyAccount.findUnique({ where: { businessId_clientId: { businessId: business.id, clientId: clients[def.clientIdx].id } } });
    const acc = existing ?? await prisma.loyaltyAccount.create({ data: { businessId: business.id, clientId: clients[def.clientIdx].id, points: def.points, lifetimePoints: def.lifetimePoints, tier: def.tier } });
    loyaltyAccounts.push(acc);
  }
  const loyaltyTxDefs = [
    { accountIdx: 0, type: 'EARN', points: 120, desc: 'Session — Deep Tissue Massage', daysBack: 7 },
    { accountIdx: 0, type: 'EARN', points: 120, desc: 'Session — Deep Tissue Massage', daysBack: 21 },
    { accountIdx: 0, type: 'REDEEM', points: -50, desc: 'Reward redeemed — $5 discount applied', daysBack: 14 },
    { accountIdx: 1, type: 'EARN', points: 100, desc: 'Session — Swedish Massage', daysBack: 30 },
    { accountIdx: 1, type: 'EARN', points: 130, desc: 'Session — Sports Massage', daysBack: 60 },
    { accountIdx: 1, type: 'REDEEM', points: -100, desc: 'Reward redeemed — $10 discount applied', daysBack: 45 },
    { accountIdx: 2, type: 'EARN', points: 95, desc: 'Session — Reflexology', daysBack: 5 },
    { accountIdx: 3, type: 'EARN', points: 135, desc: 'Session — Trigger Point Therapy', daysBack: 3 },
    { accountIdx: 3, type: 'REDEEM', points: -150, desc: 'Reward redeemed — $15 discount applied', daysBack: 20 },
    { accountIdx: 5, type: 'EARN', points: 130, desc: 'Session — Sports Massage', daysBack: 2 },
    { accountIdx: 5, type: 'EARN', points: 120, desc: 'Session — Deep Tissue Massage', daysBack: 10 },
    { accountIdx: 7, type: 'EARN', points: 140, desc: 'Session — Hot Stone Massage', daysBack: 10 },
    { accountIdx: 7, type: 'EARN', points: 100, desc: 'Session — Swedish Massage', daysBack: 25 },
    { accountIdx: 9, type: 'EARN', points: 115, desc: 'Session — Lymphatic Drainage', daysBack: 1 },
  ];
  for (const def of loyaltyTxDefs) {
    if (def.accountIdx >= loyaltyAccounts.length) continue;
    const existing = await prisma.loyaltyTransaction.findFirst({ where: { loyaltyAccountId: loyaltyAccounts[def.accountIdx].id, description: def.desc, points: def.points } });
    if (!existing) {
      await prisma.loyaltyTransaction.create({ data: { loyaltyAccountId: loyaltyAccounts[def.accountIdx].id, businessId: business.id, type: def.type, points: def.points, description: def.desc, createdAt: daysAgo(def.daysBack) } });
    }
  }
  console.log('✓ Loyalty accounts & transactions:', loyaltyAccounts.length);

  // ── 42. Products ──────────────────────────────────────────────────────────
  const productDefs = [
    { name: 'Deep Tissue Massage Oil — 500ml', sku: 'OIL-DT-500', category: 'Massage Oils', price: 28.95, stock: 24, lowStock: 5, unit: 'bottle', desc: 'Professional-grade deep tissue blend' },
    { name: 'Lavender Essential Oil — 30ml', sku: 'OIL-LAV-30', category: 'Essential Oils', price: 18.50, stock: 18, lowStock: 5, unit: 'bottle', desc: 'Pure therapeutic-grade lavender' },
    { name: 'Eucalyptus Essential Oil — 30ml', sku: 'OIL-EUC-30', category: 'Essential Oils', price: 16.00, stock: 22, lowStock: 5, unit: 'bottle', desc: 'Pure eucalyptus for invigoration' },
    { name: 'Hot Stone Set — 18 pieces', sku: 'STONES-18', category: 'Equipment', price: 89.00, stock: 4, lowStock: 2, unit: 'set', desc: 'Basalt hot stone set for hot stone massage' },
    { name: 'Massage Table Fleece Cover', sku: 'COVER-FLEECE', category: 'Table Accessories', price: 34.00, stock: 8, lowStock: 3, unit: 'unit', desc: 'Fitted fleece table cover, multiple sizes' },
    { name: 'Disposable Face Cradle Cover (100pk)', sku: 'COVER-FACE-100', category: 'Consumables', price: 12.00, stock: 15, lowStock: 3, unit: 'pack', desc: 'Single-use hygienic face cradle covers' },
    { name: 'Organic Coconut Oil — 1L', sku: 'OIL-COCO-1L', category: 'Massage Oils', price: 22.00, stock: 10, lowStock: 4, unit: 'bottle', desc: 'Cold-pressed organic coconut oil' },
    { name: 'Epsom Salt — 2kg', sku: 'SALT-EPSOM-2KG', category: 'Consumables', price: 8.50, stock: 30, lowStock: 8, unit: 'bag', desc: 'Pharmaceutical-grade magnesium sulphate' },
    { name: 'Serenity Wellness Gift Bag', sku: 'GIFT-BAG', category: 'Retail', price: 45.00, stock: 12, lowStock: 4, unit: 'unit', desc: 'Curated gift bag with oils, candle & voucher' },
    { name: 'Reusable Gel Heat Pack', sku: 'HEAT-GEL', category: 'Equipment', price: 14.95, stock: 16, lowStock: 5, unit: 'unit', desc: 'Microwavable gel heat pack for pre-treatment warm-up' },
    { name: 'Peppermint Essential Oil — 30ml', sku: 'OIL-PEPP-30', category: 'Essential Oils', price: 15.00, stock: 20, lowStock: 5, unit: 'bottle', desc: 'Cooling peppermint oil for headache relief blends' },
    { name: 'Massage Cream — Unscented 500ml', sku: 'CREAM-UNSC-500', category: 'Massage Oils', price: 24.00, stock: 14, lowStock: 4, unit: 'bottle', desc: 'Hypoallergenic unscented massage cream' },
  ];
  const products: any[] = [];
  for (const def of productDefs) {
    const existing = await prisma.product.findFirst({ where: { businessId: business.id, sku: def.sku } });
    const prod = existing ?? await prisma.product.create({
      data: { businessId: business.id, name: def.name, description: def.desc, sku: def.sku, category: def.category, unitPrice: def.price, currentStock: def.stock, lowStockThreshold: def.lowStock, unit: def.unit, isActive: true },
    });
    products.push(prod);
  }
  console.log('✓ Products:', products.length);

  // ── 43. Inventory Adjustments ─────────────────────────────────────────────
  const inventoryAdjDefs = [
    { productIdx: 0, type: 'PURCHASE', qty: 12, prevStock: 12, newStock: 24, notes: 'Monthly restock from AromaSupply' },
    { productIdx: 1, type: 'USAGE', qty: -3, prevStock: 21, newStock: 18, notes: 'Used in sessions this week' },
    { productIdx: 5, type: 'PURCHASE', qty: 5, prevStock: 10, newStock: 15, notes: 'Restocked — running low' },
    { productIdx: 6, type: 'USAGE', qty: -2, prevStock: 12, newStock: 10, notes: 'Used in hot stone and general sessions' },
    { productIdx: 4, type: 'DAMAGE', qty: -1, prevStock: 9, newStock: 8, notes: 'One cover damaged during laundry — disposed of' },
    { productIdx: 7, type: 'PURCHASE', qty: 10, prevStock: 20, newStock: 30, notes: 'Restocked for foot soak treatments' },
    { productIdx: 8, type: 'PURCHASE', qty: 6, prevStock: 6, newStock: 12, notes: 'Pre-Christmas stock-up for gift sales' },
    { productIdx: 3, type: 'USAGE', qty: -1, prevStock: 5, newStock: 4, notes: 'One stone set cracked — removed from service' },
    { productIdx: 2, type: 'PURCHASE', qty: 8, prevStock: 14, newStock: 22, notes: 'Restock — used frequently in relaxation blends' },
  ];
  for (const def of inventoryAdjDefs) {
    const existing = await prisma.inventoryAdjustment.findFirst({ where: { productId: products[def.productIdx].id, notes: def.notes } });
    if (!existing) {
      await prisma.inventoryAdjustment.create({
        data: { productId: products[def.productIdx].id, businessId: business.id, type: def.type, quantity: def.qty, previousStock: def.prevStock, newStock: def.newStock, notes: def.notes, adjustedById: ownerUser.id },
      });
    }
  }
  console.log('✓ Inventory adjustments');

  // ── 44. Payroll Periods & Records ─────────────────────────────────────────
  const payrollPeriodDefs = [
    { startDaysBack: 90, endDaysBack: 61, status: PayrollStatus.PAID, total: 8640, paidAt: daysAgo(58), notes: 'March 2026 payroll — processed on time' },
    { startDaysBack: 60, endDaysBack: 31, status: PayrollStatus.PAID, total: 9120, paidAt: daysAgo(28), notes: 'April 2026 payroll — Easter public holiday adjustment included' },
    { startDaysBack: 30, endDaysBack: 1, status: PayrollStatus.PROCESSING, total: 8880, paidAt: undefined, notes: 'May 2026 payroll — pending therapist timesheet sign-off' },
  ];
  const payrollPeriods: any[] = [];
  for (const def of payrollPeriodDefs) {
    const start = daysAgo(def.startDaysBack); start.setHours(0, 0, 0, 0);
    const end = daysAgo(def.endDaysBack); end.setHours(23, 59, 59, 0);
    const existing = await prisma.payrollPeriod.findFirst({ where: { businessId: business.id, startDate: start } });
    const pp = existing ?? await prisma.payrollPeriod.create({
      data: { businessId: business.id, startDate: start, endDate: end, status: def.status, totalAmount: def.total, paidAt: def.paidAt, notes: def.notes },
    });
    payrollPeriods.push(pp);
  }
  const payrollRecordDefs = [
    { periodIdx: 0, therapistIdx: 0, hours: 40, sessions: 28, baseRate: 120, commissionRate: 0.60, commissionAmount: 2016, bonus: 200, deductions: 0, total: 2216, notes: 'Top performer — exceeded KPIs' },
    { periodIdx: 0, therapistIdx: 1, hours: 35, sessions: 22, baseRate: 110, commissionRate: 0.55, commissionAmount: 1540, bonus: 0, deductions: 0, total: 1540, notes: 'Standard period' },
    { periodIdx: 0, therapistIdx: 2, hours: 38, sessions: 25, baseRate: 115, commissionRate: 0.58, commissionAmount: 1725, bonus: 100, deductions: 0, total: 1825, notes: 'Good progress with new clients' },
    { periodIdx: 1, therapistIdx: 0, hours: 42, sessions: 30, baseRate: 120, commissionRate: 0.60, commissionAmount: 2160, bonus: 300, deductions: 0, total: 2460, notes: 'Performance bonus — 5-star review week' },
    { periodIdx: 1, therapistIdx: 1, hours: 38, sessions: 26, baseRate: 110, commissionRate: 0.55, commissionAmount: 1716, bonus: 100, deductions: 0, total: 1816, notes: 'Improved prenatal referrals' },
    { periodIdx: 1, therapistIdx: 2, hours: 40, sessions: 28, baseRate: 115, commissionRate: 0.58, commissionAmount: 1972, bonus: 200, deductions: 0, total: 2172, notes: 'Excellent client retention score' },
    { periodIdx: 2, therapistIdx: 0, hours: 40, sessions: 27, baseRate: 120, commissionRate: 0.60, commissionAmount: 1944, bonus: 0, deductions: 0, total: 1944, notes: 'Pending approval' },
    { periodIdx: 2, therapistIdx: 1, hours: 36, sessions: 23, baseRate: 110, commissionRate: 0.55, commissionAmount: 1529, bonus: 0, deductions: 0, total: 1529, notes: 'Pending approval' },
    { periodIdx: 2, therapistIdx: 2, hours: 38, sessions: 26, baseRate: 115, commissionRate: 0.58, commissionAmount: 1783, bonus: 0, deductions: 0, total: 1783, notes: 'Pending approval' },
  ];
  for (const def of payrollRecordDefs) {
    if (def.periodIdx >= payrollPeriods.length) continue;
    const existing = await prisma.payrollRecord.findUnique({ where: { payrollPeriodId_therapistId: { payrollPeriodId: payrollPeriods[def.periodIdx].id, therapistId: therapists[def.therapistIdx].id } } });
    if (!existing) {
      await prisma.payrollRecord.create({
        data: { payrollPeriodId: payrollPeriods[def.periodIdx].id, businessId: business.id, therapistId: therapists[def.therapistIdx].id, hoursWorked: def.hours, sessionsCompleted: def.sessions, baseRate: def.baseRate, commissionRate: def.commissionRate, commissionAmount: def.commissionAmount, bonusAmount: def.bonus, deductions: def.deductions, totalAmount: def.total, notes: def.notes },
      });
    }
  }
  console.log('✓ Payroll periods & records:', payrollPeriods.length, 'periods');

  // ── 45. Automation Rules & Logs ───────────────────────────────────────────
  const automationRuleDefs = [
    { name: 'Send 24h SMS Appointment Reminder', desc: 'Automatically send SMS reminder 24 hours before any scheduled appointment', trigger: 'APPOINTMENT_UPCOMING', conditions: { hoursBefore: 24 }, actions: [{ type: 'SEND_SMS', templateId: 'sms_reminder', delay: 0 }], isActive: true, runCount: 124, lastRunAt: daysAgo(1) },
    { name: 'Post-Session Follow-up Email', desc: 'Send follow-up email 4 hours after session completion', trigger: 'APPOINTMENT_COMPLETED', conditions: {}, actions: [{ type: 'SEND_EMAIL', templateId: 'email_followup', delay: 240 }], isActive: true, runCount: 89, lastRunAt: daysAgo(1) },
    { name: 'Re-engagement After 45 Days Inactive', desc: 'Send SMS to clients who haven\'t booked in 45 days', trigger: 'CLIENT_INACTIVE', conditions: { inactiveDays: 45 }, actions: [{ type: 'SEND_SMS', content: 'We miss you! Use code COMEBACK15 for 15% off your next visit.', delay: 0 }], isActive: true, runCount: 12, lastRunAt: daysAgo(3) },
    { name: 'Birthday Greeting SMS', desc: 'Send birthday wish SMS on the client\'s birthday', trigger: 'CLIENT_BIRTHDAY', conditions: {}, actions: [{ type: 'SEND_SMS', content: 'Happy Birthday from Serenity Wellness! Use BDAY15 for 15% off any session this month.', delay: 0 }], isActive: true, runCount: 7, lastRunAt: daysAgo(5) },
    { name: 'Invoice Overdue Payment Reminder', desc: 'Send email reminder when invoice is 7 days overdue', trigger: 'INVOICE_OVERDUE', conditions: { daysOverdue: 7 }, actions: [{ type: 'SEND_EMAIL', templateId: 'email_overdue_invoice', delay: 0 }], isActive: true, runCount: 6, lastRunAt: daysAgo(2) },
    { name: 'New Client Welcome & Intake Form', desc: 'Welcome email + intake form sent on first booking', trigger: 'CLIENT_FIRST_BOOKING', conditions: {}, actions: [{ type: 'SEND_EMAIL', templateId: 'email_welcome', delay: 0 }, { type: 'SEND_INTAKE_FORM', delay: 30 }], isActive: false, runCount: 22, lastRunAt: daysAgo(14) },
    { name: 'Membership Renewal Reminder', desc: 'Remind member 7 days before billing cycle renews', trigger: 'MEMBERSHIP_RENEWAL_UPCOMING', conditions: { daysBefore: 7 }, actions: [{ type: 'SEND_EMAIL', templateId: 'email_membership_renewal', delay: 0 }], isActive: true, runCount: 18, lastRunAt: daysAgo(7) },
    { name: 'Package Expiry Warning', desc: 'Alert when a package has fewer than 2 sessions remaining', trigger: 'PACKAGE_LOW_SESSIONS', conditions: { sessionsRemaining: 2 }, actions: [{ type: 'SEND_SMS', content: 'Heads up! Your session package has only 2 sessions remaining. Book to use them before they expire.', delay: 0 }], isActive: true, runCount: 4, lastRunAt: daysAgo(8) },
  ];
  const automationRules: any[] = [];
  for (const def of automationRuleDefs) {
    const existing = await prisma.automationRule.findFirst({ where: { businessId: business.id, name: def.name } });
    const rule = existing ?? await prisma.automationRule.create({
      data: { businessId: business.id, name: def.name, description: def.desc, isActive: def.isActive, trigger: def.trigger, conditions: def.conditions, actions: def.actions, lastRunAt: def.lastRunAt, runCount: def.runCount },
    });
    automationRules.push(rule);
  }
  for (let i = 0; i < Math.min(4, automationRules.length); i++) {
    for (let j = 0; j < 3; j++) {
      await prisma.automationLog.create({
        data: {
          automationRuleId: automationRules[i].id, businessId: business.id,
          status: j < 2 ? 'SUCCESS' : 'FAILED',
          triggerData: { clientId: clients[(i + j) % clients.length].id },
          result: j < 2 ? { messagesSent: 1 } : null,
          errorMessage: j === 2 ? 'Client phone number not found' : undefined,
          executedAt: daysAgo(j * 2 + 1),
        },
      });
    }
  }
  const upcomingForActions = await prisma.appointment.findMany({ where: { businessId: business.id, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] }, startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' }, take: 5 });
  for (const appt of upcomingForActions) {
    await prisma.scheduledAction.create({
      data: { automationRuleId: automationRules[0].id, businessId: business.id, actionIndex: 0, executeAt: new Date(appt.startTime.getTime() - 24 * 3600000), triggerData: { appointmentId: appt.id, clientId: appt.clientId }, status: 'PENDING', cancelIfEvent: 'APPOINTMENT_CANCELLED' },
    });
  }
  console.log('✓ Automation rules, logs & scheduled actions:', automationRules.length, 'rules');

  // ── 46. Insurance Providers & Claims ─────────────────────────────────────
  const insuranceProviderDefs = [
    { name: 'Medibank Private', payerId: 'MEDIBANK-001', address: '101 Bourke Street', city: 'Melbourne', state: 'VIC', postalCode: '3000', phone: '1300 722 568', claimsEmail: 'claims@medibank.com.au', notes: 'Rebates available for remedial massage — confirm item number with therapist' },
    { name: 'BUPA Australia', payerId: 'BUPA-001', address: '233 Collins Street', city: 'Melbourne', state: 'VIC', postalCode: '3000', phone: '134 135', claimsEmail: 'claims@bupa.com.au', notes: 'Requires HCF provider number for online claiming' },
    { name: 'HCF Health Insurance', payerId: 'HCF-001', address: '403 George Street', city: 'Sydney', state: 'NSW', postalCode: '2000', phone: '13 13 34', claimsEmail: 'claims@hcf.com.au', notes: 'Online claiming portal: my.hcf.com.au. Fast reimbursement usually 2-3 days' },
    { name: 'NIB Health Funds', payerId: 'NIB-001', address: '22 Honeysuckle Drive', city: 'Newcastle', state: 'NSW', postalCode: '2300', phone: '13 14 63', claimsEmail: 'claims@nib.com.au', notes: 'Extras cover varies by plan — clients should confirm prior to appointment' },
  ];
  const insuranceProviders: any[] = [];
  for (const def of insuranceProviderDefs) {
    const existing = await prisma.insuranceProvider.findFirst({ where: { businessId: business.id, name: def.name } });
    const prov = existing ?? await prisma.insuranceProvider.create({
      data: { businessId: business.id, name: def.name, payerId: def.payerId, address: def.address, city: def.city, state: def.state, postalCode: def.postalCode, phone: def.phone, claimsEmail: def.claimsEmail, notes: def.notes, isActive: true },
    });
    insuranceProviders.push(prov);
  }
  const insuranceClaimDefs = [
    { clientIdx: 0, apptIdx: 0, providerIdx: 0, claimNum: 'CLM-2026-0001', status: InsuranceClaimStatus.PAID, totalCharge: 120, claimedAmount: 80, submittedAt: daysAgo(85), diagnosisCodes: ['M54.5'], procedureCodes: ['97124'] },
    { clientIdx: 1, apptIdx: 1, providerIdx: 1, claimNum: 'CLM-2026-0002', status: InsuranceClaimStatus.APPROVED, totalCharge: 100, claimedAmount: 65, submittedAt: daysAgo(75), diagnosisCodes: ['M75.1'], procedureCodes: ['97140'] },
    { clientIdx: 5, apptIdx: 5, providerIdx: 0, claimNum: 'CLM-2026-0003', status: InsuranceClaimStatus.SUBMITTED, totalCharge: 130, claimedAmount: 85, submittedAt: daysAgo(60), diagnosisCodes: ['M79.3'], procedureCodes: ['97124'] },
    { clientIdx: 7, apptIdx: 7, providerIdx: 2, claimNum: 'CLM-2026-0004', status: InsuranceClaimStatus.PENDING, totalCharge: 140, claimedAmount: 90, submittedAt: daysAgo(50), diagnosisCodes: ['M19.90'], procedureCodes: ['97110'] },
    { clientIdx: 11, apptIdx: 11, providerIdx: 1, claimNum: 'CLM-2026-0005', status: InsuranceClaimStatus.DRAFT, totalCharge: 120, claimedAmount: 80, submittedAt: undefined, diagnosisCodes: ['M54.4'], procedureCodes: ['97124'] },
    { clientIdx: 14, apptIdx: 14, providerIdx: 3, claimNum: 'CLM-2026-0006', status: InsuranceClaimStatus.DENIED, totalCharge: 115, claimedAmount: 70, submittedAt: daysAgo(30), diagnosisCodes: ['M54.2'], procedureCodes: ['97124'] },
  ];
  const insuranceClaims: any[] = [];
  for (const def of insuranceClaimDefs) {
    if (def.apptIdx >= appointments.length) continue;
    const existing = await prisma.insuranceClaim.findUnique({ where: { businessId_claimNumber: { businessId: business.id, claimNumber: def.claimNum } } });
    const claim = existing ?? await prisma.insuranceClaim.create({
      data: {
        businessId: business.id, clientId: clients[def.clientIdx].id, appointmentId: appointments[def.apptIdx].id,
        insuranceProviderId: insuranceProviders[def.providerIdx].id, claimNumber: def.claimNum, status: def.status,
        submittedAt: def.submittedAt, subscriberName: `${clients[def.clientIdx].firstName} ${clients[def.clientIdx].lastName}`,
        subscriberPolicyNumber: `POL${String(100000 + def.clientIdx)}`, diagnosisCodes: def.diagnosisCodes, procedureCodes: def.procedureCodes,
        renderingProviderName: 'Sarah Johnson', renderingProviderNPI: '1234567890',
        billingProviderName: 'Serenity Wellness Clinic', billingProviderNPI: '0987654321', billingProviderTaxId: '123-456-789',
        totalCharge: def.totalCharge, claimedAmount: def.claimedAmount, submissionMethod: 'ELECTRONIC', relationshipToSubscriber: 'SELF',
      },
    });
    insuranceClaims.push(claim);
  }
  if (insuranceClaims[0]) {
    const ex = await prisma.claimReimbursement.findFirst({ where: { claimId: insuranceClaims[0].id } });
    if (!ex) await prisma.claimReimbursement.create({ data: { businessId: business.id, claimId: insuranceClaims[0].id, checkNumber: 'CHK-2026-001234', eobNumber: 'EOB-2026-001234', paymentDate: daysAgo(70), amountBilled: 120, amountAllowed: 85, amountPaid: 80, patientResponsibility: 40, adjustmentReasons: [{ code: 'CO-45', desc: 'Charge exceeds fee schedule' }], status: ReimbursementStatus.RECONCILED, notes: 'Applied to client account' } });
  }
  if (insuranceClaims[1]) {
    const ex = await prisma.claimReimbursement.findFirst({ where: { claimId: insuranceClaims[1].id } });
    if (!ex) await prisma.claimReimbursement.create({ data: { businessId: business.id, claimId: insuranceClaims[1].id, eobNumber: 'EOB-2026-001298', paymentDate: daysAgo(60), amountBilled: 100, amountAllowed: 70, amountPaid: 65, patientResponsibility: 35, adjustmentReasons: [], status: ReimbursementStatus.RECEIVED, notes: 'Awaiting reconciliation' } });
  }
  console.log('✓ Insurance providers:', insuranceProviders.length, '| Claims:', insuranceClaims.length);

  // ── 47. Group Appointment & Bookings ──────────────────────────────────────
  const groupStart = setHour(daysAhead(10), 10);
  const groupAppt = await prisma.appointment.create({
    data: { businessId: business.id, clientId: clients[0].id, therapistId: therapists[2].id, startTime: groupStart, endTime: addHours(groupStart, 1), status: AppointmentStatus.SCHEDULED, serviceType: 'Group Stretch & Recovery', duration: 60, price: 60, isGroup: true, capacity: 6, notes: 'Group session — max 6 participants. Bring your own mat.' },
  });
  for (const clientIdx of [0, 3, 6, 9, 12]) {
    const existing = await prisma.groupBooking.findUnique({ where: { appointmentId_clientId: { appointmentId: groupAppt.id, clientId: clients[clientIdx].id } } });
    if (!existing) {
      await prisma.groupBooking.create({ data: { appointmentId: groupAppt.id, clientId: clients[clientIdx].id, status: GroupBookingStatus.REGISTERED, paidAt: clientIdx === 0 ? daysAgo(2) : undefined } });
    }
  }
  console.log('✓ Group appointment & bookings');

  // ── 48. Waitlist ──────────────────────────────────────────────────────────
  const waitlistDefs = [
    { clientIdx: 2, therapistIdx: 0, serviceType: 'Deep Tissue Massage', preferredDates: ['2026-06-08', '2026-06-09'], preferredTimes: ['09:00-11:00', '14:00-16:00'], notes: 'Client in pain — prioritise when possible', status: WaitlistStatus.WAITING },
    { clientIdx: 8, therapistIdx: 1, serviceType: 'Prenatal Massage', preferredDates: ['2026-06-10', '2026-06-11', '2026-06-12'], preferredTimes: ['11:00-14:00'], notes: '', status: WaitlistStatus.WAITING },
    { clientIdx: 13, therapistIdx: null, serviceType: 'Swedish Massage', preferredDates: ['2026-06-07'], preferredTimes: ['15:00-18:00'], notes: 'Any therapist, prefers late afternoon', status: WaitlistStatus.WAITING },
    { clientIdx: 10, therapistIdx: 0, serviceType: 'Trigger Point Therapy', preferredDates: ['2026-06-09'], preferredTimes: ['09:00-12:00'], notes: '', status: WaitlistStatus.OFFERED },
    { clientIdx: 4, therapistIdx: 1, serviceType: 'Prenatal Massage', preferredDates: ['2026-06-06'], preferredTimes: ['10:00-13:00'], notes: 'Offered slot — waiting for confirmation', status: WaitlistStatus.BOOKED },
  ];
  for (const def of waitlistDefs) {
    const existing = await prisma.waitlist.findFirst({ where: { businessId: business.id, clientId: clients[def.clientIdx].id, status: def.status } });
    if (!existing) {
      await prisma.waitlist.create({
        data: { businessId: business.id, clientId: clients[def.clientIdx].id, therapistId: def.therapistIdx !== null ? therapists[def.therapistIdx].id : undefined, serviceType: def.serviceType, preferredDates: def.preferredDates, preferredTimes: def.preferredTimes, status: def.status, notes: def.notes || undefined, offerExpiresAt: def.status === WaitlistStatus.OFFERED ? daysAhead(2) : undefined },
      });
    }
  }
  console.log('✓ Waitlist entries:', waitlistDefs.length);

  // ── 49. Booking Invites ───────────────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const existing = await prisma.bookingInvite.findFirst({ where: { businessId: business.id, clientId: clients[i + 10].id } });
    if (!existing) {
      await prisma.bookingInvite.create({ data: { businessId: business.id, clientId: clients[i + 10].id, expiresAt: daysAhead(30) } });
    }
  }
  console.log('✓ Booking invites');

  // ── 50. Availability Rules ────────────────────────────────────────────────
  const availabilityRuleDefs = [
    { therapistIdx: 0, roomIdx: 0, serviceType: null, daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', priority: 1 },
    { therapistIdx: 0, roomIdx: null, serviceType: null, daysOfWeek: [6], startTime: '09:00', endTime: '13:00', priority: 1 },
    { therapistIdx: 1, roomIdx: 1, serviceType: null, daysOfWeek: [1, 2, 3, 4, 5], startTime: '10:00', endTime: '18:00', priority: 1 },
    { therapistIdx: 2, roomIdx: 2, serviceType: null, daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', priority: 1 },
    { therapistIdx: 2, roomIdx: 3, serviceType: null, daysOfWeek: [6], startTime: '10:00', endTime: '15:00', priority: 1 },
    { therapistIdx: null, roomIdx: 0, serviceType: 'Hot Stone Massage', daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '10:00', endTime: '16:00', priority: 2 },
    { therapistIdx: null, roomIdx: 1, serviceType: 'Prenatal Massage', daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', priority: 2 },
  ];
  for (const def of availabilityRuleDefs) {
    const existing = await prisma.availabilityRule.findFirst({ where: { businessId: business.id, therapistId: def.therapistIdx !== null ? therapists[def.therapistIdx].id : null, roomId: def.roomIdx !== null ? rooms[def.roomIdx].id : null, startTime: def.startTime, endTime: def.endTime } });
    if (!existing) {
      await prisma.availabilityRule.create({
        data: { businessId: business.id, therapistId: def.therapistIdx !== null ? therapists[def.therapistIdx].id : undefined, roomId: def.roomIdx !== null ? rooms[def.roomIdx].id : undefined, serviceType: def.serviceType ?? undefined, daysOfWeek: def.daysOfWeek, startTime: def.startTime, endTime: def.endTime, priority: def.priority },
      });
    }
  }
  console.log('✓ Availability rules:', availabilityRuleDefs.length);

  // ── 51. Accounting Integration & Sync Logs ────────────────────────────────
  const existingAccIntegration = await prisma.accountingIntegration.findUnique({ where: { businessId_provider: { businessId: business.id, provider: AccountingProvider.XERO } } });
  const accountingIntegration = existingAccIntegration ?? await prisma.accountingIntegration.create({
    data: { businessId: business.id, provider: AccountingProvider.XERO, status: AccountingStatus.CONNECTED, tenantId: 'xero_tenant_seed_001', tenantName: 'Serenity Wellness Clinic', tokenExpiresAt: daysAhead(30), webhookKey: 'whk_seed_xero_001', lastSyncAt: daysAgo(1), syncEnabled: true },
  });
  const syncLogDefs = [
    { entityType: 'Invoice', entityId: 'inv_sync_001', externalId: 'xero_inv_001', direction: SyncDirection.OUTBOUND, status: SyncLogStatus.SUCCESS },
    { entityType: 'Invoice', entityId: 'inv_sync_002', externalId: 'xero_inv_002', direction: SyncDirection.OUTBOUND, status: SyncLogStatus.SUCCESS },
    { entityType: 'Payment', entityId: 'pay_sync_001', externalId: 'xero_pay_001', direction: SyncDirection.OUTBOUND, status: SyncLogStatus.SUCCESS },
    { entityType: 'Invoice', entityId: 'inv_sync_003', externalId: null, direction: SyncDirection.OUTBOUND, status: SyncLogStatus.FAILED, errorMessage: 'Xero API rate limit exceeded — retrying in 60s' },
    { entityType: 'Contact', entityId: clients[0].id, externalId: 'xero_contact_001', direction: SyncDirection.OUTBOUND, status: SyncLogStatus.SUCCESS },
    { entityType: 'Contact', entityId: clients[1].id, externalId: 'xero_contact_002', direction: SyncDirection.OUTBOUND, status: SyncLogStatus.CONFLICT, errorMessage: 'Duplicate contact name detected in Xero' },
  ];
  for (let i = 0; i < syncLogDefs.length; i++) {
    const def = syncLogDefs[i];
    await prisma.accountingSyncLog.create({
      data: { integrationId: accountingIntegration.id, businessId: business.id, entityType: def.entityType, entityId: def.entityId, externalId: def.externalId ?? undefined, direction: def.direction, status: def.status, errorMessage: (def as any).errorMessage ?? undefined, createdAt: daysAgo(i + 1) },
    });
  }
  console.log('✓ Accounting integration & sync logs');

  // ── 52. Message Logs ──────────────────────────────────────────────────────
  const messageLogDefs = [
    { clientIdx: 0, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', recipient: '0412111201', status: MessageLogStatus.DELIVERED, daysBack: 2, smsCost: 0.04 },
    { clientIdx: 1, channel: MessageChannel.SMS, type: 'APPOINTMENT_CONFIRMATION', recipient: '0423222202', status: MessageLogStatus.DELIVERED, daysBack: 3, smsCost: 0.04 },
    { clientIdx: 2, channel: MessageChannel.EMAIL, type: 'WELCOME', recipient: 'olivia.davis@example.com', subject: 'Welcome to Serenity Wellness!', status: MessageLogStatus.DELIVERED, daysBack: 5, smsCost: null },
    { clientIdx: 3, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', recipient: '0445444204', status: MessageLogStatus.DELIVERED, daysBack: 4, smsCost: 0.04 },
    { clientIdx: 4, channel: MessageChannel.EMAIL, type: 'APPOINTMENT_CONFIRMATION', recipient: 'sophia.garcia@example.com', subject: 'Your appointment is confirmed', status: MessageLogStatus.DELIVERED, daysBack: 3, smsCost: null },
    { clientIdx: 5, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', recipient: '0467666206', status: MessageLogStatus.FAILED, daysBack: 1, smsCost: null, errorCode: 'INVALID_DESTINATION' },
    { clientIdx: 6, channel: MessageChannel.EMAIL, type: 'SESSION_FOLLOWUP', recipient: 'ava.taylor@example.com', subject: 'How are you feeling after your session?', status: MessageLogStatus.DELIVERED, daysBack: 1, smsCost: null },
    { clientIdx: 7, channel: MessageChannel.SMS, type: 'INVOICE_REMINDER', recipient: '0390080208', status: MessageLogStatus.SENT, daysBack: 0, smsCost: 0.04 },
    { clientIdx: 9, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', recipient: '0411100210', status: MessageLogStatus.DELIVERED, daysBack: 7, smsCost: 0.04 },
    { clientIdx: 10, channel: MessageChannel.EMAIL, type: 'BIRTHDAY_GREETING', recipient: 'mia.white@example.com', subject: 'Happy Birthday from Serenity Wellness!', status: MessageLogStatus.DELIVERED, daysBack: 10, smsCost: null },
    { clientIdx: 11, channel: MessageChannel.SMS, type: 'REENGAGEMENT', recipient: '0422200211', status: MessageLogStatus.DELIVERED, daysBack: 10, smsCost: 0.04 },
    { clientIdx: 13, channel: MessageChannel.EMAIL, type: 'CANCELLATION_NOTICE', recipient: 'henry.thompson@example.com', subject: 'Your appointment has been cancelled', status: MessageLogStatus.DELIVERED, daysBack: 12, smsCost: null },
  ];
  for (let i = 0; i < messageLogDefs.length; i++) {
    const def = messageLogDefs[i];
    await prisma.messageLog.create({
      data: {
        businessId: business.id, clientId: clients[def.clientIdx].id, channel: def.channel, messageType: def.type, recipient: def.recipient,
        subject: (def as any).subject ?? undefined, status: def.status,
        providerMessageId: def.status !== MessageLogStatus.FAILED ? `msg_${String(i + 1).padStart(8, '0')}` : undefined,
        errorCode: (def as any).errorCode ?? undefined,
        sentAt: def.status !== MessageLogStatus.QUEUED ? daysAgo(def.daysBack) : undefined,
        deliveredAt: def.status === MessageLogStatus.DELIVERED ? new Date(daysAgo(def.daysBack).getTime() + 30000) : undefined,
        smsCost: def.smsCost ?? undefined, createdAt: daysAgo(def.daysBack),
      },
    });
  }
  console.log('✓ Message logs:', messageLogDefs.length);

  // ── 53. Tasks ─────────────────────────────────────────────────────────────
  const taskDefs = [
    { title: 'Review and approve Emma Williams treatment plan', desc: 'SOAP notes from last 3 sessions need owner review before advancing deep tissue protocol.', priority: TaskPriority.HIGH, status: TaskStatus.TODO, clientIdx: 0, dueInDays: 2 },
    { title: 'Restock massage oil supply — lavender & coconut', desc: 'Running low. Lavender: 18 bottles remaining. Coconut: 10 bottles. Order from AromaSupply — next delivery Tuesday.', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, clientIdx: null, dueInDays: 3 },
    { title: 'Update prenatal client intake form', desc: 'Add gestational week, previous pregnancy complications, and OB-GYN contact. Run past Lisa before publishing.', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: null, dueInDays: 7 },
    { title: 'Follow up James Brown — shoulder exercise compliance', desc: 'James has not been doing pendulum exercises. Send a friendly reminder with the video link from his last session notes.', priority: TaskPriority.LOW, status: TaskStatus.TODO, clientIdx: 1, dueInDays: 1 },
    { title: 'Team meeting — recurring appointments feature walkthrough', desc: 'Book a 1-hour session with all 3 therapists to walk through the new recurring appointment booking system.', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, clientIdx: null, dueInDays: 5 },
    { title: 'Renew Sarah Johnson professional indemnity insurance', desc: 'Certificate expires in 14 days. Contact Marsh Insurance for renewal quote. Upload new cert to staff file.', priority: TaskPriority.HIGH, status: TaskStatus.TODO, clientIdx: null, dueInDays: 14 },
    { title: 'Xero bank reconciliation — May invoices', desc: '23 invoices from May still unreconciled in Xero. Download bank statement and match. Flag any discrepancies for accountant.', priority: TaskPriority.HIGH, status: TaskStatus.DONE, clientIdx: null, dueInDays: -2 },
    { title: 'Call Olivia Davis re: recurring headache concerns', desc: 'Olivia mentioned headaches are returning between sessions. Check in by phone — may need to refer to GP for cervicogenic investigation.', priority: TaskPriority.URGENT, status: TaskStatus.TODO, clientIdx: 2, dueInDays: 0 },
    { title: 'Set up staff roster for July', desc: 'All therapist availability submitted. Create July schedule, account for Sarah\'s annual leave (30th June – 6th July) and Mike\'s conference on 14th.', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: null, dueInDays: 10 },
    { title: 'Review overdue invoices — collections follow-up', desc: '3 invoices are 30+ days overdue. Review client history and send polite payment reminder. Escalate to collections if no response within 7 days.', priority: TaskPriority.HIGH, status: TaskStatus.TODO, clientIdx: null, dueInDays: 3 },
    { title: 'Update website service pricing — new rates', desc: 'Rate increase effective 1st July. Update website service page, booking form, and print menu. Inform existing clients by email.', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: null, dueInDays: 14 },
    { title: 'Prepare Q2 financial summary for accountant', desc: 'Export all invoices, payments, and payroll data for April–June. Create summary spreadsheet. Due by end of month.', priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, clientIdx: null, dueInDays: 7 },
  ];
  for (const def of taskDefs) {
    const existing = await prisma.task.findFirst({ where: { businessId: business.id, title: def.title } });
    if (!existing) {
      await prisma.task.create({
        data: { businessId: business.id, createdById: ownerUser.id, title: def.title, description: def.desc, priority: def.priority, status: def.status, relatedClientId: def.clientIdx !== null ? clients[def.clientIdx].id : undefined, dueDate: def.dueInDays >= 0 ? daysAhead(def.dueInDays) : daysAgo(Math.abs(def.dueInDays)), completedAt: def.status === TaskStatus.DONE ? daysAgo(1) : undefined },
      });
    }
  }
  console.log('✓ Tasks:', taskDefs.length);

  // ── 54. API Keys ──────────────────────────────────────────────────────────
  const existingApiKey = await prisma.apiKey.findFirst({ where: { businessId: business.id } });
  if (!existingApiKey) {
    await prisma.apiKey.create({
      data: { businessId: business.id, name: 'Production Integration Key', keyHash: 'sk_live_' + Buffer.from('serenity_api_prod_001').toString('hex').substring(0, 32), permissions: ['read:appointments', 'read:clients', 'write:appointments', 'read:invoices'], lastUsedAt: daysAgo(2), isActive: true },
    });
    await prisma.apiKey.create({
      data: { businessId: business.id, name: 'Reporting Dashboard Key', keyHash: 'sk_live_' + Buffer.from('serenity_reporting_002').toString('hex').substring(0, 32), permissions: ['read:analytics', 'read:reports'], lastUsedAt: daysAgo(1), isActive: true },
    });
    await prisma.apiKey.create({
      data: { businessId: business.id, name: 'Website Booking Widget Key', keyHash: 'sk_live_' + Buffer.from('serenity_booking_003').toString('hex').substring(0, 32), permissions: ['write:bookings', 'read:availability'], lastUsedAt: daysAgo(0), isActive: true },
    });
  }
  console.log('✓ API keys');

  // ── 55. Webhooks & Deliveries ─────────────────────────────────────────────
  const existingWebhook = await prisma.webhook.findFirst({ where: { businessId: business.id } });
  let webhook: any = existingWebhook;
  if (!existingWebhook) {
    webhook = await prisma.webhook.create({
      data: { businessId: business.id, url: 'https://hooks.serenitywellness.com/incoming', events: ['appointment.created', 'appointment.completed', 'payment.received', 'client.created', 'invoice.paid'], secret: 'whsec_seed_serenity_001', isActive: true, lastTriggeredAt: daysAgo(1), failureCount: 0 },
    });
  }
  if (webhook) {
    const deliveryDefs = [
      { event: 'appointment.completed', payload: { appointmentId: appointments[0]?.id, status: 'COMPLETED', amount: 120 }, statusCode: 200, succeeded: true, daysBack: 7 },
      { event: 'payment.received', payload: { amount: 120, method: 'STRIPE_CARD', clientId: clients[0].id }, statusCode: 200, succeeded: true, daysBack: 5 },
      { event: 'client.created', payload: { clientId: clients[14].id, name: 'Amelia Moore' }, statusCode: 200, succeeded: true, daysBack: 3 },
      { event: 'appointment.created', payload: { appointmentId: 'appt_new_001', clientId: clients[2].id }, statusCode: 500, succeeded: false, daysBack: 2 },
      { event: 'invoice.paid', payload: { invoiceId: 'inv_001', amount: 100, clientId: clients[1].id }, statusCode: 200, succeeded: true, daysBack: 1 },
      { event: 'appointment.completed', payload: { appointmentId: appointments[2]?.id, status: 'COMPLETED' }, statusCode: 200, succeeded: true, daysBack: 1 },
    ];
    for (const def of deliveryDefs) {
      await prisma.webhookDelivery.create({
        data: { webhookId: webhook.id, event: def.event, payload: def.payload, statusCode: def.statusCode, responseBody: def.succeeded ? '{"received":true}' : '{"error":"Internal Server Error"}', succeeded: def.succeeded, attemptedAt: daysAgo(def.daysBack) },
      });
    }
  }
  console.log('✓ Webhooks & deliveries');

  // ── 56. Community Templates ───────────────────────────────────────────────
  const communityTemplateDefs = [
    {
      name: 'Myofascial Release Protocol', category: 'Massage', description: 'Comprehensive MFR assessment and treatment note with tissue quality ratings',
      fields: [
        { label: 'Fascial Restrictions Identified', type: 'body-map', required: true, placeholder: '' },
        { label: 'Tissue Quality (1-10)', type: 'scale', required: true, placeholder: '' },
        { label: 'Techniques Used', type: 'checkbox', required: false, placeholder: '', options: ['J-Stroke', 'Cross-hand release', 'Longitudinal plane release', 'Transverse plane release', 'Compression', 'Rebounding'] },
        { label: 'Client Response to Treatment', type: 'text', required: true, placeholder: 'Immediate tissue response, pain changes, ROM improvements...' },
        { label: 'Home Stretching Protocol', type: 'text', required: false, placeholder: 'Recommended stretches and frequency...' },
        { label: 'Next Session Focus', type: 'text', required: false, placeholder: 'Priority areas for follow-up...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
      status: CommunityTemplateStatus.APPROVED, usageCount: 47,
    },
    {
      name: 'Post-Surgical Rehabilitation', category: 'Rehabilitation', description: 'Specialized note for post-surgical massage therapy clients with contraindication tracking',
      fields: [
        { label: 'Surgery Type & Date', type: 'text', required: true, placeholder: 'e.g., ACL reconstruction — March 2025' },
        { label: 'Medical Clearance', type: 'checkbox', required: true, placeholder: '', options: ['Written clearance on file', 'Verbal clearance confirmed', 'Not yet cleared — informational only'] },
        { label: 'Contraindicated Areas', type: 'body-map', required: true, placeholder: '' },
        { label: 'Scar Tissue Assessment', type: 'text', required: false, placeholder: 'Colour, texture, mobility, adhesions...' },
        { label: 'ROM Before Treatment', type: 'text', required: false, placeholder: 'Joint angles prior to treatment...' },
        { label: 'ROM After Treatment', type: 'text', required: false, placeholder: 'Joint angles post-treatment...' },
        { label: 'Treatment Applied', type: 'text', required: true, placeholder: 'Techniques, areas, duration...' },
        { label: 'Pain Response (0-10)', type: 'scale', required: true, placeholder: '' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
      status: CommunityTemplateStatus.APPROVED, usageCount: 31,
    },
    {
      name: 'Corporate Chair Massage — Event Note', category: 'Corporate', description: 'Quick-format note for corporate on-site chair massage sessions',
      fields: [
        { label: 'Company / Event Name', type: 'text', required: true, placeholder: 'e.g., Acme Corp wellness day' },
        { label: 'Session Duration', type: 'text', required: true, placeholder: 'e.g., 15 minutes' },
        { label: 'Areas Addressed', type: 'checkbox', required: false, placeholder: '', options: ['Neck', 'Shoulders', 'Upper back', 'Lower back', 'Arms', 'Hands'] },
        { label: 'Pressure Preference', type: 'checkbox', required: false, placeholder: '', options: ['Light', 'Medium', 'Firm'] },
        { label: 'Client Feedback', type: 'text', required: false, placeholder: 'Brief notes on client experience...' },
      ],
      status: CommunityTemplateStatus.PENDING, usageCount: 0,
    },
    {
      name: 'TMJ & Jaw Tension Protocol', category: 'Specialised', description: 'Structured note for intraoral and external TMJ massage therapy',
      fields: [
        { label: 'Presenting Jaw Symptoms', type: 'text', required: true, placeholder: 'Clicking, pain, limited opening, bruxism...' },
        { label: 'Maximum Mouth Opening (mm)', type: 'text', required: false, placeholder: 'e.g., 38mm' },
        { label: 'Pain Location', type: 'body-map', required: true, placeholder: '' },
        { label: 'Intraoral Consent Confirmed', type: 'checkbox', required: true, placeholder: '', options: ['Yes — signed consent on file', 'External work only — no intraoral'] },
        { label: 'Muscles Treated', type: 'checkbox', required: false, placeholder: '', options: ['Masseter (external)', 'Masseter (internal)', 'Temporalis', 'Medial pterygoid', 'Lateral pterygoid', 'Digastric'] },
        { label: 'Post-Treatment Opening (mm)', type: 'text', required: false, placeholder: 'e.g., 44mm' },
        { label: 'Home Care Advice', type: 'text', required: false, placeholder: 'Self-massage, heat, jaw exercises...' },
        { label: 'Therapist Signature', type: 'signature', required: true, placeholder: '' },
      ],
      status: CommunityTemplateStatus.APPROVED, usageCount: 22,
    },
  ];
  for (const def of communityTemplateDefs) {
    const existing = await prisma.communityTemplate.findFirst({ where: { name: def.name, submittedByUserId: ownerUser.id } });
    if (!existing) {
      await prisma.communityTemplate.create({
        data: { name: def.name, category: def.category, description: def.description, fields: def.fields, status: def.status, usageCount: def.usageCount, submittedByUserId: ownerUser.id, submittedByBusinessId: business.id, moderatedBy: def.status === CommunityTemplateStatus.APPROVED ? ownerUser.id : undefined, moderatedAt: def.status === CommunityTemplateStatus.APPROVED ? daysAgo(30) : undefined },
      });
    }
  }
  console.log('✓ Community templates:', communityTemplateDefs.length);

  // ── 57. Export History & Scheduled Exports ────────────────────────────────
  const exportHistoryDefs = [
    { exportType: 'clients', format: ExportFormat.CSV, status: ExportStatus.COMPLETED, rows: 15, fileName: 'clients_export_2026-05-01.csv', daysBack: 30 },
    { exportType: 'appointments', format: ExportFormat.CSV, status: ExportStatus.COMPLETED, rows: 52, fileName: 'appointments_may_2026.csv', daysBack: 15 },
    { exportType: 'invoices', format: ExportFormat.PDF, status: ExportStatus.COMPLETED, rows: 28, fileName: 'invoices_q1_2026.pdf', daysBack: 10 },
    { exportType: 'analytics', format: ExportFormat.EXCEL, status: ExportStatus.COMPLETED, rows: 90, fileName: 'analytics_90day_report.xlsx', daysBack: 5 },
    { exportType: 'payroll', format: ExportFormat.CSV, status: ExportStatus.COMPLETED, rows: 9, fileName: 'payroll_may_2026.csv', daysBack: 3 },
    { exportType: 'clients', format: ExportFormat.CSV, status: ExportStatus.FAILED, rows: null, fileName: null, daysBack: 2, error: 'Timeout — dataset exceeds limit' },
  ];
  for (const def of exportHistoryDefs) {
    await prisma.exportHistory.create({
      data: {
        businessId: business.id, userId: ownerUser.id, exportType: def.exportType, format: def.format, status: def.status,
        fileName: def.fileName ?? undefined, fileUrl: def.status === ExportStatus.COMPLETED ? `https://storage.serenitywellness.com/exports/${def.fileName}` : undefined,
        fileSize: def.status === ExportStatus.COMPLETED && def.rows ? def.rows * 512 : undefined, rowCount: def.rows ?? undefined,
        requestedAt: daysAgo(def.daysBack), completedAt: def.status === ExportStatus.COMPLETED ? new Date(daysAgo(def.daysBack).getTime() + 5000) : undefined,
        expiresAt: def.status === ExportStatus.COMPLETED ? daysAhead(30) : undefined, downloadCount: def.status === ExportStatus.COMPLETED ? Math.floor(Math.random() * 3) + 1 : 0,
        errorMessage: (def as any).error ?? undefined, triggeredBy: 'MANUAL',
      },
    });
  }
  const existingScheduledExport = await prisma.scheduledExport.findFirst({ where: { businessId: business.id } });
  if (!existingScheduledExport) {
    await prisma.scheduledExport.create({ data: { businessId: business.id, userId: ownerUser.id, name: 'Weekly Revenue Report', exportType: 'analytics', format: ExportFormat.EXCEL, frequency: ScheduleFrequency.WEEKLY, filters: { reportType: 'revenue', period: 'last_7_days' }, emailTo: OWNER_EMAIL, isActive: true, lastRunAt: daysAgo(7), nextRunAt: daysAhead(0) } });
    await prisma.scheduledExport.create({ data: { businessId: business.id, userId: ownerUser.id, name: 'Monthly Client List', exportType: 'clients', format: ExportFormat.CSV, frequency: ScheduleFrequency.MONTHLY, filters: { isActive: true }, emailTo: OWNER_EMAIL, isActive: true, lastRunAt: daysAgo(30), nextRunAt: daysAhead(1) } });
  }
  console.log('✓ Export history & scheduled exports');

  // ── 58. AI Usage Logs ─────────────────────────────────────────────────────
  const aiUsageDefs = [
    { feature: AIFeature.NOTE_SUMMARY, model: 'claude-3-haiku-20240307', provider: AIProvider.CLAUDE, promptTokens: 450, completionTokens: 120, cost: 0.0006, daysBack: 7 },
    { feature: AIFeature.TREATMENT_SUGGESTION, model: 'claude-3-5-sonnet-20241022', provider: AIProvider.CLAUDE, promptTokens: 820, completionTokens: 380, cost: 0.0042, daysBack: 6 },
    { feature: AIFeature.SOAP_ASSIST, model: 'claude-3-haiku-20240307', provider: AIProvider.CLAUDE, promptTokens: 620, completionTokens: 290, cost: 0.0026, daysBack: 5 },
    { feature: AIFeature.VOICE_TRANSCRIPTION, model: 'whisper-1', provider: AIProvider.OPENAI, promptTokens: 0, completionTokens: 0, cost: 0.006, daysBack: 4 },
    { feature: AIFeature.SMART_REMINDER, model: 'gpt-4o-mini', provider: AIProvider.OPENAI, promptTokens: 150, completionTokens: 60, cost: 0.0002, daysBack: 3 },
    { feature: AIFeature.ANALYTICS_INSIGHT, model: 'claude-3-5-sonnet-20241022', provider: AIProvider.CLAUDE, promptTokens: 1200, completionTokens: 450, cost: 0.0068, daysBack: 2 },
    { feature: AIFeature.NOTE_SUMMARY, model: 'claude-3-haiku-20240307', provider: AIProvider.CLAUDE, promptTokens: 390, completionTokens: 100, cost: 0.0005, daysBack: 2 },
    { feature: AIFeature.VOICE_TO_SOAP, model: 'claude-3-5-sonnet-20241022', provider: AIProvider.CLAUDE, promptTokens: 950, completionTokens: 680, cost: 0.0095, daysBack: 1 },
    { feature: AIFeature.TREATMENT_SUGGESTION, model: 'claude-3-haiku-20240307', provider: AIProvider.CLAUDE, promptTokens: 540, completionTokens: 220, cost: 0.0018, daysBack: 1 },
    { feature: AIFeature.NOTE_SUMMARY, model: 'claude-3-haiku-20240307', provider: AIProvider.CLAUDE, promptTokens: 410, completionTokens: 95, cost: 0.0005, daysBack: 0 },
  ];
  for (const def of aiUsageDefs) {
    await prisma.aIUsage.create({
      data: { businessId: business.id, userId: ownerUser.id, provider: def.provider, model: def.model, feature: def.feature, promptTokens: def.promptTokens, completionTokens: def.completionTokens, totalTokens: def.promptTokens + def.completionTokens, cost: def.cost, requestDuration: 800 + Math.floor(Math.random() * 1200), createdAt: daysAgo(def.daysBack) },
    });
  }
  console.log('✓ AI usage logs:', aiUsageDefs.length);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Business:              ${business.name}`);
  console.log(`   Owner:                 ${ownerUser.email}`);
  console.log(`   Locations:             ${locations.length} (main + branch)`);
  console.log(`   Rooms:                 ${rooms.length}`);
  console.log(`   Therapists:            ${therapists.length}`);
  console.log(`   Clients:               ${clients.length}`);
  console.log(`   Appointments:          ${appointments.length}+ (incl. group & virtual)`);
  console.log(`   Treatment notes:       seeded for completed appointments`);
  console.log(`   Invoices:              ${invoiceCount}`);
  console.log(`   Payments:              ${paymentCount}`);
  console.log(`   Memberships:           ${memberships.length}`);
  console.log(`   Packages:              ${packages.length}`);
  console.log(`   Gift cards:            ${giftCards.length}`);
  console.log(`   Loyalty accounts:      ${loyaltyAccounts.length}`);
  console.log(`   Products:              ${products.length}`);
  console.log(`   Promotions:            ${promotions.length}`);
  console.log(`   Payroll periods:       ${payrollPeriods.length}`);
  console.log(`   Automation rules:      ${automationRules.length}`);
  console.log(`   Insurance providers:   ${insuranceProviders.length}`);
  console.log(`   Insurance claims:      ${insuranceClaims.length}`);
  console.log(`   Conversations:         ${conversationDefs.length} (${msgIdx} messages)`);
  console.log(`   Tasks:                 ${taskDefs.length}`);
  console.log(`   Analytics snapshots:   ${snapshotCount}`);
  console.log(`   Community templates:   ${communityTemplateDefs.length}`);
  console.log('\n✅ All features seeded — ready for full testing!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
