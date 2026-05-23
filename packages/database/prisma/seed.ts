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
    update: { role: UserRole.BUSINESS_OWNER },
    create: {
      email: OWNER_EMAIL,
      authUserId: OWNER_AUTH_ID,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: UserRole.BUSINESS_OWNER,
      phoneNumber: '+1-555-0001',
      profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${OWNER_EMAIL}`,
    },
  });
  console.log('✓ Owner:', ownerUser.email);

  // ── 2. Business ──────────────────────────────────────────────────────────
  const business = await prisma.business.upsert({
    where: { ownerId: ownerUser.id },
    update: {},
    create: {
      name: 'Serenity Wellness Clinic',
      email: 'info@serenitywellness.com',
      phoneNumber: '+1-555-935-5637',
      address: '123 Healing Way, Suite 200',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
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
      phone: '+1-555-0101',
      specializations: ['Deep Tissue', 'Swedish Massage', 'Sports Massage'],
      bio: 'Licensed massage therapist with 10+ years in therapeutic bodywork and sports rehab.',
      license: 'CA-MT-12345',
      licenseExpiry: new Date('2026-12-31'),
      rate: 120,
    },
    {
      email: 'mike.chen@serenity.com',
      authId: 'seed_therapist_002',
      firstName: 'Mike',
      lastName: 'Chen',
      phone: '+1-555-0102',
      specializations: ['Prenatal Massage', 'Hot Stone', 'Aromatherapy'],
      bio: 'Specializing in prenatal and relaxation techniques. Certified hot stone practitioner.',
      license: 'CA-MT-67890',
      licenseExpiry: new Date('2027-06-30'),
      rate: 110,
    },
    {
      email: 'lisa.martinez@serenity.com',
      authId: 'seed_therapist_003',
      firstName: 'Lisa',
      lastName: 'Martinez',
      phone: '+1-555-0103',
      specializations: ['Reflexology', 'Thai Massage', 'Lymphatic Drainage'],
      bio: 'Holistic practitioner trained in Thai massage and manual lymphatic drainage therapy.',
      license: 'CA-MT-24680',
      licenseExpiry: new Date('2027-03-31'),
      rate: 115,
    },
  ];

  const therapists: any[] = [];
  for (const def of therapistDefs) {
    const u = await prisma.user.upsert({
      where: { authUserId: def.authId },
      update: { email: def.email, firstName: def.firstName, lastName: def.lastName },
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
    { first: 'Emma', last: 'Williams', email: 'emma.williams@example.com', phone: '+1-555-0201', dob: new Date('1988-03-14'), job: 'Software Engineer', goals: 'Reduce back pain from desk work', allergies: [], meds: [], physician: 'Dr. Smith' },
    { first: 'James', last: 'Brown', email: 'james.brown@example.com', phone: '+1-555-0202', dob: new Date('1975-07-22'), job: 'Construction Manager', goals: 'Manage shoulder injury and improve range of motion', allergies: ['Peanuts'], meds: ['Aspirin'], physician: 'Dr. Jones' },
    { first: 'Olivia', last: 'Davis', email: 'olivia.davis@example.com', phone: '+1-555-0203', dob: new Date('1992-11-05'), job: 'Graphic Designer', goals: 'Relieve neck tension and headaches', allergies: ['Lavender oil'], meds: [], physician: 'Dr. Smith' },
    { first: 'Noah', last: 'Miller', email: 'noah.miller@example.com', phone: '+1-555-0204', dob: new Date('1983-01-30'), job: 'Accountant', goals: 'General relaxation, stress relief', allergies: [], meds: ['Ibuprofen'], physician: 'Dr. Patel' },
    { first: 'Sophia', last: 'Garcia', email: 'sophia.garcia@example.com', phone: '+1-555-0205', dob: new Date('1995-06-18'), job: 'Nurse Practitioner', goals: 'Prenatal care, relaxation', allergies: [], meds: ['Prenatal vitamins'], physician: 'Dr. Lee' },
    { first: 'Liam', last: 'Wilson', email: 'liam.wilson@example.com', phone: '+1-555-0206', dob: new Date('1980-09-12'), job: 'Personal Trainer', goals: 'Sports recovery, muscle maintenance', allergies: [], meds: [], physician: 'Dr. Kim' },
    { first: 'Ava', last: 'Taylor', email: 'ava.taylor@example.com', phone: '+1-555-0207', dob: new Date('1990-04-25'), job: 'Teacher', goals: 'Stress reduction, improve sleep quality', allergies: ['Eucalyptus oil'], meds: [], physician: 'Dr. Smith' },
    { first: 'William', last: 'Anderson', email: 'william.anderson@example.com', phone: '+1-555-0208', dob: new Date('1968-12-08'), job: 'Retired', goals: 'Manage arthritis pain, maintain mobility', allergies: [], meds: ['Metformin', 'Atorvastatin'], physician: 'Dr. Patel' },
    { first: 'Isabella', last: 'Thomas', email: 'isabella.thomas@example.com', phone: '+1-555-0209', dob: new Date('1998-08-15'), job: 'Student', goals: 'Sports massage after track meets', allergies: [], meds: [], physician: 'Dr. Jones' },
    { first: 'Benjamin', last: 'Jackson', email: 'benjamin.jackson@example.com', phone: '+1-555-0210', dob: new Date('1985-02-27'), job: 'Chef', goals: 'Relief from repetitive strain, wrists and shoulders', allergies: ['Shellfish'], meds: [], physician: 'Dr. Kim' },
    { first: 'Mia', last: 'White', email: 'mia.white@example.com', phone: '+1-555-0211', dob: new Date('1993-10-11'), job: 'Marketing Manager', goals: 'Tension headaches, jaw pain (TMJ)', allergies: [], meds: ['Zoloft'], physician: 'Dr. Chen' },
    { first: 'Lucas', last: 'Harris', email: 'lucas.harris@example.com', phone: '+1-555-0212', dob: new Date('1977-05-03'), job: 'Firefighter', goals: 'Recovery from job-related physical stress', allergies: [], meds: [], physician: 'Dr. Patel' },
    { first: 'Charlotte', last: 'Martin', email: 'charlotte.martin@example.com', phone: '+1-555-0213', dob: new Date('2000-01-19'), job: 'Yoga Instructor', goals: 'Deepen body awareness, fascia work', allergies: ['Nut oils'], meds: [], physician: 'Dr. Lee' },
    { first: 'Henry', last: 'Thompson', email: 'henry.thompson@example.com', phone: '+1-555-0214', dob: new Date('1970-07-07'), job: 'Lawyer', goals: 'Lower back pain from long hours sitting', allergies: [], meds: ['Lisinopril'], physician: 'Dr. Jones' },
    { first: 'Amelia', last: 'Moore', email: 'amelia.moore@example.com', phone: '+1-555-0215', dob: new Date('1987-03-22'), job: 'Photographer', goals: 'Shoulder and neck tension from carrying equipment', allergies: ['Lavender oil'], meds: [], physician: 'Dr. Smith' },
  ];

  const clients: any[] = [];
  for (let i = 0; i < clientDefs.length; i++) {
    const def = clientDefs[i];
    const authId = `seed_client_${String(i + 1).padStart(3, '0')}`;
    const u = await prisma.user.upsert({
      where: { authUserId: authId },
      update: { email: def.email, firstName: def.first, lastName: def.last },
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
      update: {},
      create: {
        businessId: business.id,
        userId: u.id,
        firstName: def.first,
        lastName: def.last,
        email: def.email,
        phoneNumber: def.phone,
        dateOfBirth: def.dob,
        address: `${(i + 1) * 10 + 100} Oak Street`,
        city: ['San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto'][i % 5],
        state: 'CA',
        postalCode: `9410${i % 9}`,
        emergencyContactName: `${def.first} Contact`,
        emergencyContactPhone: `+1-555-09${String(i).padStart(2, '0')}`,
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
    { clientIdx: 5,  apptIdx: 5,  status: InvoiceStatus.PAID,         amount: 130, method: PaymentMethod.CHECK,       daysBack: 73 },
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

    const invoice = await prisma.invoice.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        invoiceNumber: `INV-2025-${String(invoiceCount + 1).padStart(4, '0')}`,
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
      },
    });
    invoiceCount++;

    if (def.method && (isPaid || isPartial)) {
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
    const m = await prisma.membership.create({
      data: {
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
        stripeSubscriptionId: `sub_seed_${String(i + 1).padStart(6, '0')}`,
        billingCycleStart: daysAgo(15),
        billingCycleEnd: daysAhead(15),
        nextBillingDate: daysAhead(15),
        startDate: daysAgo(60),
        cancelledAt: def.status === MembershipStatus.CANCELLED ? daysAgo(5) : undefined,
      },
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
    const p = await prisma.packagePurchase.create({
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

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Business:       ${business.name}`);
  console.log(`   Owner:          ${ownerUser.email}`);
  console.log(`   Therapists:     ${therapists.length}`);
  console.log(`   Clients:        ${clients.length}`);
  console.log(`   Appointments:   ${appointments.length}+`);
  console.log(`   Invoices:       ${invoiceCount}`);
  console.log(`   Payments:       ${paymentCount}`);
  console.log(`   Memberships:    ${memberships.length}`);
  console.log(`   Packages:       ${packages.length}`);
  console.log(`   Conversations:  ${conversationDefs.length} (${msgIdx} messages)`);
  console.log(`   Analytics:      ${snapshotCount} snapshots`);
  console.log('\n✅ Ready for testing!');
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
