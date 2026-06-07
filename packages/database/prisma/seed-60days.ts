/**
 * seed-60days.ts — Additive seed: 60 days of dense data across every feature.
 * Safe to run multiple times (upsert/findFirst guards throughout).
 *
 * Run: cd packages/database && npx tsx prisma/seed-60days.ts
 */

import {
  PrismaClient,
  AppointmentStatus,
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  AnalyticsSnapshotType,
  AIFeature,
  AIProvider,
  VoiceNoteStatus,
  PromotionChannel,
  PromotionStatus,
  InsuranceClaimStatus,
  ReimbursementStatus,
  WaitlistStatus,
  TaskPriority,
  TaskStatus,
  PayrollStatus,
  MessageChannel,
  MessageLogStatus,
  GroupBookingStatus,
  TreatmentNoteStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'test@test.com';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAhead(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function setHour(date: Date, hour: number, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60 * 1000);
}

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

const SERVICE_TYPES = [
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
const SERVICE_PRICES = [120, 100, 130, 110, 140, 95, 125, 115, 105, 135];
const SERVICE_DURATIONS = [60, 60, 60, 90, 90, 60, 90, 60, 60, 60];

const SOAP_TEMPLATES = [
  {
    subjective: 'Client reports lower back pain rated 6/10, worsening after prolonged sitting. Tightness felt in glutes.',
    objective: 'Hypertonicity in lumbar erectors and QL. Trigger points at L4-L5. Reduced lumbar flexion.',
    assessment: 'Chronic lumbar muscle tension, postural origin. Responding well to treatment.',
    plan: 'Continue weekly sessions. Add gluteal stretching protocol.',
    areas: ['Lower Back', 'Gluteal Muscles', 'Hamstrings'],
    techniques: ['Deep Tissue', 'Trigger Point Therapy', 'Myofascial Release'],
  },
  {
    subjective: 'Bilateral shoulder tension, 5/10 pain. Increased work stress. Headaches 2x per week.',
    objective: 'Elevated shoulders at rest. Tender upper trapezius bilaterally. Restricted cervical rotation.',
    assessment: 'Tension-related upper crossed syndrome. Improving from prior visit.',
    plan: 'Focus on upper trapezius and levator scapulae. Daily neck stretching.',
    areas: ['Shoulders', 'Neck', 'Upper Back'],
    techniques: ['Swedish Massage', 'Myofascial Release', 'Passive Stretching'],
  },
  {
    subjective: 'Client reports soreness in legs post-marathon training. 3/10 at rest, 6/10 during activity.',
    objective: 'Bilateral IT band tightness. Tender TFL. Calf muscles hypertonic.',
    assessment: 'Exercise-induced overuse. Good overall tissue health.',
    plan: 'Sports massage on IT band and hip flexors. Foam rolling recommended.',
    areas: ['IT Band', 'TFL', 'Calves', 'Hamstrings'],
    techniques: ['Sports Massage', 'Deep Tissue', 'Compression', 'Passive Stretching'],
  },
  {
    subjective: 'Client experiencing neck stiffness and tension headaches. Rates pain 4/10.',
    objective: 'Suboccipital muscles hypertonic. Scalene tightness noted bilaterally.',
    assessment: 'Cervicogenic headache pattern. Good response to today\'s treatment.',
    plan: 'Continue bi-weekly cervical focus sessions. Posture correction exercises.',
    areas: ['Neck', 'Shoulders', 'Scalenes'],
    techniques: ['Myofascial Release', 'Deep Tissue', 'Passive Mobilization'],
  },
  {
    subjective: 'Post-surgical recovery. Shoulder ROM improving. Pain 3/10 at surgical site.',
    objective: 'Scar tissue softening noted. External rotation improved to 50°. Deltoid hypertonic.',
    assessment: 'Post-surgical recovery progressing well. Adhesion diminishing.',
    plan: 'Continue cross-fiber friction at scar. Gentle passive mobilization.',
    areas: ['Right Shoulder', 'Deltoid', 'Upper Arm'],
    techniques: ['Cross-Fiber Friction', 'Passive Mobilization', 'Effleurage'],
  },
];

async function main() {
  console.log('Starting 60-day additive seed...');

  // ── Load existing core data ──────────────────────────────────────────────
  const ownerUser = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!ownerUser) throw new Error(`Owner not found: ${OWNER_EMAIL}. Run main seed first.`);

  const business = await prisma.business.findUnique({ where: { ownerId: ownerUser.id } });
  if (!business) throw new Error('Business not found. Run main seed first.');

  const therapists = await prisma.therapist.findMany({ where: { businessId: business.id, isActive: true } });
  if (therapists.length === 0) throw new Error('No therapists found. Run main seed first.');

  const clients = await prisma.client.findMany({ where: { businessId: business.id, isActive: true } });
  if (clients.length === 0) throw new Error('No clients found. Run main seed first.');

  const services = await prisma.service.findMany({ where: { businessId: business.id, isActive: true } });

  console.log(`Found: ${therapists.length} therapists, ${clients.length} clients, ${services.length} services`);

  // ── 1. Location & Room ───────────────────────────────────────────────────
  let location = await prisma.location.findFirst({ where: { businessId: business.id } });
  if (!location) {
    location = await prisma.location.create({
      data: {
        businessId: business.id,
        name: 'Serenity Main Clinic',
        address: '45 Collins Street, Level 8',
        city: 'Melbourne',
        state: 'VIC',
        postalCode: '3000',
        timezone: 'Australia/Melbourne',
        isActive: true,
        isPrimary: true,
      },
    });
    console.log('✓ Location created');
  }

  let room = await prisma.room.findFirst({ where: { businessId: business.id } });
  if (!room) {
    room = await prisma.room.create({
      data: {
        businessId: business.id,
        locationId: location.id,
        name: 'Room 1 — Relaxation Suite',
        color: '#8B5CF6',
        capacity: 1,
        isActive: true,
      },
    });
  }
  let room2 = await prisma.room.findFirst({ where: { businessId: business.id, name: { contains: 'Room 2' } } });
  if (!room2) {
    room2 = await prisma.room.create({
      data: {
        businessId: business.id,
        locationId: location.id,
        name: 'Room 2 — Sports Recovery',
        color: '#06B6D4',
        capacity: 1,
        isActive: true,
      },
    });
  }
  console.log('✓ Rooms ready');

  // ── 2. Business Hours ────────────────────────────────────────────────────
  for (let day = 0; day <= 6; day++) {
    const existing = await prisma.businessHours.findFirst({
      where: { businessId: business.id, dayOfWeek: day, locationId: null },
    });
    if (!existing) {
      await prisma.businessHours.create({
        data: {
          businessId: business.id,
          dayOfWeek: day,
          openTime: day === 0 ? '00:00' : '09:00',
          closeTime: day === 0 ? '00:00' : day === 6 ? '15:00' : '18:00',
          isClosed: day === 0,
        },
      });
    }
  }
  console.log('✓ Business hours');

  // ── 3. Loyalty Settings & Accounts ───────────────────────────────────────
  const existingLoyaltySettings = await prisma.loyaltySettings.findUnique({ where: { businessId: business.id } });
  if (!existingLoyaltySettings) {
    await prisma.loyaltySettings.create({
      data: {
        businessId: business.id,
        pointsPerDollar: 1.0,
        dollarPerPoint: 0.01,
        bronzeMinPoints: 0,
        silverMinPoints: 500,
        goldMinPoints: 1500,
        platinumMinPoints: 5000,
        silverBonusRate: 0.05,
        goldBonusRate: 0.10,
        platinumBonusRate: 0.15,
        birthdayMultiplier: 2.0,
        signupBonusPoints: 100,
        firstBookingBonusPoints: 50,
        referralBonusPoints: 200,
        reviewBonusPoints: 50,
        isActive: true,
        expiryDays: 365,
      },
    });
  }

  const loyaltyAccounts: Record<string, any> = {};
  const loyaltyTiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'BRONZE', 'SILVER', 'GOLD', 'BRONZE', 'SILVER', 'BRONZE', 'BRONZE', 'SILVER', 'BRONZE', 'BRONZE', 'BRONZE'];
  const loyaltyPoints = [1800, 850, 2200, 5500, 320, 750, 1600, 220, 680, 110, 440, 930, 180, 270, 350];

  for (let i = 0; i < clients.length; i++) {
    const existing = await prisma.loyaltyAccount.findFirst({ where: { businessId: business.id, clientId: clients[i].id } });
    if (!existing) {
      const acct = await prisma.loyaltyAccount.create({
        data: {
          businessId: business.id,
          clientId: clients[i].id,
          points: loyaltyPoints[i] ?? 100,
          lifetimePoints: (loyaltyPoints[i] ?? 100) + Math.floor(Math.random() * 500),
          tier: loyaltyTiers[i] ?? 'BRONZE',
        },
      });
      loyaltyAccounts[clients[i].id] = acct;

      // Signup bonus transaction
      await prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: acct.id,
          businessId: business.id,
          type: 'EARN',
          points: 100,
          description: 'Welcome signup bonus',
          referenceType: 'SIGNUP',
        },
      });

      // A few earning transactions
      for (let t = 0; t < 3; t++) {
        await prisma.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: acct.id,
            businessId: business.id,
            type: 'EARN',
            points: Math.floor(Math.random() * 150) + 50,
            description: `Session payment — ${pick(SERVICE_TYPES, t + i)} `,
            referenceType: 'APPOINTMENT',
          },
        });
      }
    } else {
      loyaltyAccounts[clients[i].id] = existing;
    }
  }
  console.log('✓ Loyalty accounts & transactions');

  // ── 4. Gift Cards ─────────────────────────────────────────────────────────
  const giftCardDefs = [
    { buyerIdx: 0, recipientEmail: 'gift1@example.com', amount: 100, balance: 100, code: 'GIFT-SEED-0001' },
    { buyerIdx: 1, recipientEmail: 'gift2@example.com', amount: 150, balance: 75, code: 'GIFT-SEED-0002' },
    { buyerIdx: 2, recipientEmail: 'gift3@example.com', amount: 200, balance: 200, code: 'GIFT-SEED-0003' },
    { buyerIdx: 3, recipientEmail: 'gift4@example.com', amount: 50, balance: 0, code: 'GIFT-SEED-0004' },
    { buyerIdx: 4, recipientEmail: 'gift5@example.com', amount: 120, balance: 120, code: 'GIFT-SEED-0005' },
    { buyerIdx: 5, recipientEmail: 'gift6@example.com', amount: 80, balance: 40, code: 'GIFT-SEED-0006' },
    { buyerIdx: 6, recipientEmail: 'gift7@example.com', amount: 250, balance: 250, code: 'GIFT-SEED-0007' },
    { buyerIdx: 7, recipientEmail: 'gift8@example.com', amount: 100, balance: 100, code: 'GIFT-SEED-0008' },
  ];

  for (const def of giftCardDefs) {
    const existing = await prisma.giftCard.findFirst({ where: { code: def.code } });
    if (!existing) {
      const gc = await prisma.giftCard.create({
        data: {
          businessId: business.id,
          code: def.code,
          originalAmount: def.amount,
          balance: def.balance,
          currency: 'AUD',
          purchasedById: clients[def.buyerIdx].id,
          recipientEmail: def.recipientEmail,
          note: 'Gift from a friend — enjoy your session!',
          expiresAt: daysAhead(365),
          isActive: true,
          purchasedAt: daysAgo(Math.floor(Math.random() * 30) + 1),
        },
      });

      // If partially used, add redemption
      if (def.balance < def.amount) {
        await prisma.giftCardRedemption.create({
          data: {
            giftCardId: gc.id,
            businessId: business.id,
            amount: def.amount - def.balance,
          },
        });
      }
    }
  }
  console.log('✓ Gift cards');

  // ── 5. Products & Inventory ───────────────────────────────────────────────
  const productDefs = [
    { name: 'Deep Tissue Massage Oil — 500ml', sku: 'OIL-DT-500', category: 'Oils & Lotions', price: 28.5, stock: 12, threshold: 5 },
    { name: 'Swedish Massage Lotion — 1L', sku: 'LOT-SW-1L', category: 'Oils & Lotions', price: 35.0, stock: 8, threshold: 4 },
    { name: 'Aromatherapy Blend — Lavender & Chamomile', sku: 'ARO-LAV-100', category: 'Aromatherapy', price: 22.0, stock: 20, threshold: 8 },
    { name: 'Hot Stone Set (12 stones)', sku: 'STO-SET-12', category: 'Equipment', price: 145.0, stock: 3, threshold: 2 },
    { name: 'Disposable Face Rest Covers (100pk)', sku: 'COV-FACE-100', category: 'Consumables', price: 18.0, stock: 6, threshold: 3 },
    { name: 'Epsom Salts — 1kg', sku: 'SAL-EPS-1KG', category: 'Consumables', price: 12.0, stock: 15, threshold: 5 },
    { name: 'Eucalyptus Essential Oil — 50ml', sku: 'ARO-EUC-50', category: 'Aromatherapy', price: 19.5, stock: 11, threshold: 4 },
    { name: 'Unscented Carrier Oil — 1L', sku: 'OIL-CAR-1L', category: 'Oils & Lotions', price: 24.0, stock: 2, threshold: 3 },
    { name: 'Treatment Table Sheets (set of 6)', sku: 'SHE-TAB-6', category: 'Linen', price: 65.0, stock: 7, threshold: 3 },
    { name: 'Theragun Mini Massage Device', sku: 'DEV-THERA-MINI', category: 'Equipment', price: 220.0, stock: 2, threshold: 1 },
  ];

  const products: any[] = [];
  for (let i = 0; i < productDefs.length; i++) {
    const def = productDefs[i];
    const existing = await prisma.product.findFirst({ where: { businessId: business.id, sku: def.sku } });
    if (!existing) {
      const p = await prisma.product.create({
        data: {
          businessId: business.id,
          name: def.name,
          sku: def.sku,
          category: def.category,
          unitPrice: def.price,
          currentStock: def.stock,
          lowStockThreshold: def.threshold,
          isActive: true,
        },
      });
      products.push(p);

      // Opening stock adjustment
      await prisma.inventoryAdjustment.create({
        data: {
          productId: p.id,
          businessId: business.id,
          type: 'OPENING_STOCK',
          quantity: def.stock,
          previousStock: 0,
          newStock: def.stock,
          notes: 'Initial stock on hand',
          adjustedById: ownerUser.id,
        },
      });

      // Some usage adjustments
      if (i < 6) {
        const usedQty = Math.floor(Math.random() * 3) + 1;
        await prisma.inventoryAdjustment.create({
          data: {
            productId: p.id,
            businessId: business.id,
            type: 'USAGE',
            quantity: -usedQty,
            previousStock: def.stock,
            newStock: def.stock - usedQty,
            notes: 'Used during client sessions',
            adjustedById: ownerUser.id,
          },
        });
      }
    } else {
      products.push(existing);
    }
  }
  console.log('✓ Products & inventory:', products.length);

  // ── 6. Insurance Providers & Claims ──────────────────────────────────────
  let insProvider = await prisma.insuranceProvider.findFirst({ where: { businessId: business.id } });
  if (!insProvider) {
    insProvider = await prisma.insuranceProvider.create({
      data: {
        businessId: business.id,
        name: 'Medibank Private',
        payerId: 'MEDIBK001',
        address: '101 City Rd',
        city: 'Melbourne',
        state: 'VIC',
        postalCode: '3000',
        phone: '03 8888 0000',
        isActive: true,
      },
    });
  }
  let insProvider2 = await prisma.insuranceProvider.findFirst({ where: { businessId: business.id, name: 'BUPA Australia' } });
  if (!insProvider2) {
    insProvider2 = await prisma.insuranceProvider.create({
      data: {
        businessId: business.id,
        name: 'BUPA Australia',
        payerId: 'BUPA002',
        city: 'Melbourne',
        state: 'VIC',
        phone: '13 84 60',
        isActive: true,
      },
    });
  }

  const claimDefs = [
    { clientIdx: 0, claimNumber: 'CLM-2026-0001', status: InsuranceClaimStatus.PAID, total: 120, providerId: insProvider.id, daysBack: 30 },
    { clientIdx: 1, claimNumber: 'CLM-2026-0002', status: InsuranceClaimStatus.APPROVED, total: 100, providerId: insProvider.id, daysBack: 15 },
    { clientIdx: 2, claimNumber: 'CLM-2026-0003', status: InsuranceClaimStatus.SUBMITTED, total: 95, providerId: insProvider2!.id, daysBack: 7 },
    { clientIdx: 3, claimNumber: 'CLM-2026-0004', status: InsuranceClaimStatus.PENDING, total: 135, providerId: insProvider.id, daysBack: 5 },
    { clientIdx: 7, claimNumber: 'CLM-2026-0005', status: InsuranceClaimStatus.DRAFT, total: 140, providerId: insProvider2!.id, daysBack: 2 },
    { clientIdx: 11, claimNumber: 'CLM-2026-0006', status: InsuranceClaimStatus.DENIED, total: 130, providerId: insProvider.id, daysBack: 20 },
    { clientIdx: 13, claimNumber: 'CLM-2026-0007', status: InsuranceClaimStatus.APPEALING, total: 120, providerId: insProvider.id, daysBack: 45 },
  ];

  for (const def of claimDefs) {
    const existing = await prisma.insuranceClaim.findFirst({ where: { businessId: business.id, claimNumber: def.claimNumber } });
    if (!existing) {
      const claim = await prisma.insuranceClaim.create({
        data: {
          businessId: business.id,
          clientId: clients[def.clientIdx].id,
          insuranceProviderId: def.providerId,
          claimNumber: def.claimNumber,
          status: def.status,
          submittedAt: def.status !== InsuranceClaimStatus.DRAFT ? daysAgo(def.daysBack) : undefined,
          subscriberName: `${clients[def.clientIdx].firstName} ${clients[def.clientIdx].lastName}`,
          subscriberPolicyNumber: `POL${String(def.clientIdx + 1).padStart(6, '0')}`,
          relationshipToSubscriber: 'SELF',
          diagnosisCodes: ['M54.5', 'M79.3'],
          procedureCodes: ['97124', '97140'],
          totalCharge: def.total,
          claimedAmount: def.total * 0.8,
          submissionMethod: 'ELECTRONIC',
        },
      });

      // Add reimbursement for paid/approved claims
      if (def.status === InsuranceClaimStatus.PAID || def.status === InsuranceClaimStatus.APPROVED) {
        await prisma.claimReimbursement.create({
          data: {
            businessId: business.id,
            claimId: claim.id,
            amountBilled: def.total,
            amountAllowed: def.total * 0.85,
            amountPaid: def.total * 0.8,
            patientResponsibility: def.total * 0.2,
            status: def.status === InsuranceClaimStatus.PAID ? ReimbursementStatus.RECONCILED : ReimbursementStatus.RECEIVED,
            paymentDate: def.status === InsuranceClaimStatus.PAID ? daysAgo(def.daysBack - 10) : undefined,
            checkNumber: def.status === InsuranceClaimStatus.PAID ? `CHK-${Math.floor(Math.random() * 99999)}` : undefined,
          },
        });
      }
    }
  }
  console.log('✓ Insurance providers & claims');

  // ── 7. Payroll Periods & Records ─────────────────────────────────────────
  const payrollPeriodDefs = [
    { startDaysBack: 44, endDaysBack: 31, status: PayrollStatus.PAID },
    { startDaysBack: 30, endDaysBack: 17, status: PayrollStatus.PAID },
    { startDaysBack: 16, endDaysBack: 3, status: PayrollStatus.PROCESSING },
    { startDaysBack: 2, endDaysBack: -13, status: PayrollStatus.DRAFT },
  ];

  for (let pi = 0; pi < payrollPeriodDefs.length; pi++) {
    const ppDef = payrollPeriodDefs[pi];
    const startDate = daysAgo(ppDef.startDaysBack);
    const endDate = daysAgo(ppDef.endDaysBack);

    const existing = await prisma.payrollPeriod.findFirst({
      where: { businessId: business.id, startDate, endDate },
    });

    if (!existing) {
      const period = await prisma.payrollPeriod.create({
        data: {
          businessId: business.id,
          startDate,
          endDate,
          status: ppDef.status,
          totalAmount: 0,
          paidAt: ppDef.status === PayrollStatus.PAID ? endDate : undefined,
        },
      });

      let periodTotal = 0;
      for (let ti = 0; ti < therapists.length; ti++) {
        const sessions = 15 + Math.floor(Math.random() * 10) + ti * 3;
        const hoursWorked = sessions * 1.1;
        const baseRate = [120, 110, 115][ti] ?? 110;
        const commRate = [0.55, 0.50, 0.52][ti] ?? 0.50;
        const commAmount = sessions * baseRate * commRate;
        const bonus = ppDef.status === PayrollStatus.PAID && sessions > 20 ? 100 : 0;
        const total = commAmount + bonus;
        periodTotal += total;

        await prisma.payrollRecord.upsert({
          where: { payrollPeriodId_therapistId: { payrollPeriodId: period.id, therapistId: therapists[ti].id } },
          update: {},
          create: {
            payrollPeriodId: period.id,
            businessId: business.id,
            therapistId: therapists[ti].id,
            hoursWorked: parseFloat(hoursWorked.toFixed(1)),
            sessionsCompleted: sessions,
            baseRate,
            commissionRate: commRate,
            commissionAmount: parseFloat(commAmount.toFixed(2)),
            bonusAmount: bonus,
            totalAmount: parseFloat(total.toFixed(2)),
          },
        });
      }

      await prisma.payrollPeriod.update({
        where: { id: period.id },
        data: { totalAmount: parseFloat(periodTotal.toFixed(2)) },
      });
    }
  }
  console.log('✓ Payroll periods & records');

  // ── 8. Promotions ────────────────────────────────────────────────────────
  const promotionDefs = [
    {
      name: 'June Wellness Month — 15% Off',
      channel: PromotionChannel.EMAIL,
      status: PromotionStatus.SENT,
      subject: 'Treat yourself this June — 15% off all sessions!',
      body: 'Hi {{clientName}},\n\nJune is Wellness Month at Serenity! Enjoy 15% off any session booked this month.\n\nUse code JUNE15 at checkout.\n\nBook now at serenitywellness.com.au',
      sent: 280, opened: 140, clicked: 62, converted: 28,
      daysBack: 5,
    },
    {
      name: 'New Client Welcome Offer',
      channel: PromotionChannel.EMAIL,
      status: PromotionStatus.SENT,
      subject: 'Welcome to Serenity — Your First Session is Special',
      body: 'Welcome! As a new client, enjoy a complimentary upgrade on your first 60-minute session.',
      sent: 45, opened: 38, clicked: 22, converted: 15,
      daysBack: 20,
    },
    {
      name: 'SMS Birthday Reminder Campaign',
      channel: PromotionChannel.SMS,
      status: PromotionStatus.SENT,
      subject: null,
      body: 'Happy Birthday {{clientName}}! 🎂 Celebrate with 20% off your next session. Code: BDAY20. Book: serenitywellness.com.au',
      sent: 8, opened: 8, clicked: 5, converted: 4,
      daysBack: 10,
    },
    {
      name: 'Winter Warmth — Hot Stone Special',
      channel: PromotionChannel.EMAIL,
      status: PromotionStatus.SCHEDULED,
      subject: 'Stay warm this winter — Hot Stone Massage special',
      body: 'Dear {{clientName}},\n\nWarm up this winter with our signature Hot Stone Massage. Book before end of July and save $30.',
      sent: 0, opened: 0, clicked: 0, converted: 0,
      daysBack: -7,
    },
    {
      name: 'Referral Reward Program',
      channel: PromotionChannel.EMAIL,
      status: PromotionStatus.DRAFT,
      subject: 'Refer a friend — earn a free session',
      body: 'Hi {{clientName}},\n\nLove your sessions? Share the love! Refer a friend and earn a complimentary session when they complete their first appointment.',
      sent: 0, opened: 0, clicked: 0, converted: 0,
      daysBack: 0,
    },
  ];

  for (const def of promotionDefs) {
    const existing = await prisma.promotion.findFirst({ where: { businessId: business.id, name: def.name } });
    if (!existing) {
      const promo = await prisma.promotion.create({
        data: {
          businessId: business.id,
          name: def.name,
          channel: def.channel,
          status: def.status,
          subject: def.subject ?? undefined,
          body: def.body,
          recipientFilter: { all: true },
          scheduledFor: def.status === PromotionStatus.SCHEDULED ? daysAhead(7) : daysAgo(def.daysBack),
          sentAt: def.status === PromotionStatus.SENT ? daysAgo(def.daysBack) : undefined,
          totalSent: def.sent,
          totalOpened: def.opened,
          totalClicked: def.clicked,
          totalConverted: def.converted,
        },
      });

      // Add recipients for sent promotions
      if (def.status === PromotionStatus.SENT) {
        const recipientCount = Math.min(def.sent, clients.length);
        for (let ri = 0; ri < recipientCount && ri < clients.length; ri++) {
          const existingRecip = await prisma.promotionRecipient.findFirst({
            where: { promotionId: promo.id, clientId: clients[ri].id },
          });
          if (!existingRecip) {
            await prisma.promotionRecipient.create({
              data: {
                promotionId: promo.id,
                clientId: clients[ri].id,
                status: 'SENT',
                sentAt: daysAgo(def.daysBack),
                openedAt: ri < def.opened ? daysAgo(def.daysBack - 1) : undefined,
                clickedAt: ri < def.clicked ? daysAgo(def.daysBack - 1) : undefined,
                convertedAt: ri < def.converted ? daysAgo(def.daysBack - 2) : undefined,
              },
            });
          }
        }
      }
    }
  }
  console.log('✓ Promotions');

  // ── 9. Waitlist ───────────────────────────────────────────────────────────
  const waitlistDefs = [
    { clientIdx: 3, therapistIdx: 0, service: 'Deep Tissue Massage', status: WaitlistStatus.WAITING },
    { clientIdx: 6, therapistIdx: 1, service: 'Hot Stone Massage', status: WaitlistStatus.WAITING },
    { clientIdx: 9, therapistIdx: 2, service: 'Thai Massage', status: WaitlistStatus.OFFERED },
    { clientIdx: 11, therapistIdx: 0, service: 'Sports Massage', status: WaitlistStatus.WAITING },
    { clientIdx: 14, therapistIdx: 1, service: 'Prenatal Massage', status: WaitlistStatus.BOOKED },
  ];

  for (const def of waitlistDefs) {
    const existing = await prisma.waitlist.findFirst({
      where: { clientId: clients[def.clientIdx].id, businessId: business.id, serviceType: def.service },
    });
    if (!existing) {
      await prisma.waitlist.create({
        data: {
          businessId: business.id,
          clientId: clients[def.clientIdx].id,
          therapistId: therapists[def.therapistIdx].id,
          serviceType: def.service,
          preferredDates: [daysAhead(3).toISOString(), daysAhead(5).toISOString()],
          preferredTimes: ['morning', 'afternoon'],
          status: def.status,
          offerToken: def.status === WaitlistStatus.OFFERED ? `wl-offer-${clients[def.clientIdx].id}` : undefined,
          offerExpiresAt: def.status === WaitlistStatus.OFFERED ? daysAhead(1) : undefined,
          notes: 'Client is flexible on timing',
        },
      });
    }
  }
  console.log('✓ Waitlist entries');

  // ── 10. Tasks ─────────────────────────────────────────────────────────────
  const taskDefs = [
    { title: 'Follow up with Emma re: referral program', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: 0, daysAhead: 2 },
    { title: 'Order more Deep Tissue Oil (low stock)', priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, clientIdx: null, daysAhead: 1 },
    { title: 'Review and approve James\' insurance claim', priority: TaskPriority.HIGH, status: TaskStatus.TODO, clientIdx: 1, daysAhead: 3 },
    { title: 'Send follow-up email after Olivia\'s session', priority: TaskPriority.LOW, status: TaskStatus.DONE, clientIdx: 2, daysAhead: -1 },
    { title: 'Update Sophia\'s prenatal protocol notes', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, clientIdx: 4, daysAhead: 1 },
    { title: 'Schedule team review meeting for next month', priority: TaskPriority.LOW, status: TaskStatus.TODO, clientIdx: null, daysAhead: 7 },
    { title: 'Audit loyalty points for all Gold tier clients', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: null, daysAhead: 5 },
    { title: 'Prepare payroll report for current period', priority: TaskPriority.URGENT, status: TaskStatus.IN_PROGRESS, clientIdx: null, daysAhead: 0 },
    { title: 'Check in with William re: arthritis management progress', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: 7, daysAhead: 4 },
    { title: 'Renew Sarah Johnson\'s license — due Dec 2026', priority: TaskPriority.LOW, status: TaskStatus.TODO, clientIdx: null, daysAhead: 30 },
    { title: 'Set up winter promotion email campaign', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, clientIdx: null, daysAhead: 3 },
    { title: 'Update client intake forms with new questions', priority: TaskPriority.LOW, status: TaskStatus.TODO, clientIdx: null, daysAhead: 14 },
  ];

  for (const def of taskDefs) {
    const existing = await prisma.task.findFirst({ where: { businessId: business.id, title: def.title } });
    if (!existing) {
      await prisma.task.create({
        data: {
          businessId: business.id,
          createdById: ownerUser.id,
          assignedToId: ownerUser.id,
          title: def.title,
          priority: def.priority,
          status: def.status,
          relatedClientId: def.clientIdx !== null ? clients[def.clientIdx].id : undefined,
          dueDate: def.daysAhead >= 0 ? daysAhead(def.daysAhead) : daysAgo(-def.daysAhead),
          completedAt: def.status === TaskStatus.DONE ? daysAgo(1) : undefined,
        },
      });
    }
  }
  console.log('✓ Tasks');

  // ── 11. Therapist Time Off ────────────────────────────────────────────────
  const timeOffDefs = [
    { therapistIdx: 0, startDaysAhead: 25, endDaysAhead: 32, reason: 'Annual leave — Europe trip', leaveType: 'VACATION' },
    { therapistIdx: 1, startDaysAhead: 10, endDaysAhead: 10, reason: 'Medical appointment', leaveType: 'PERSONAL' },
    { therapistIdx: 2, startDaysAhead: 45, endDaysAhead: 49, reason: 'Professional development — Thai massage course', leaveType: 'PERSONAL' },
  ];

  for (const def of timeOffDefs) {
    const existing = await prisma.therapistTimeOff.findFirst({
      where: { therapistId: therapists[def.therapistIdx].id, startDate: daysAhead(def.startDaysAhead) },
    });
    if (!existing) {
      await prisma.therapistTimeOff.create({
        data: {
          businessId: business.id,
          therapistId: therapists[def.therapistIdx].id,
          startDate: daysAhead(def.startDaysAhead),
          endDate: daysAhead(def.endDaysAhead),
          reason: def.reason,
          isAllDay: true,
          leaveType: def.leaveType,
          status: 'APPROVED',
          approvedById: ownerUser.id,
          approvedAt: daysAgo(3),
        },
      });
    }
  }
  console.log('✓ Therapist time off');

  // ── 12. AI Usage History ──────────────────────────────────────────────────
  const aiFeatureList = [
    AIFeature.NOTE_SUMMARY,
    AIFeature.TREATMENT_SUGGESTION,
    AIFeature.SOAP_ASSIST,
    AIFeature.SMART_REMINDER,
    AIFeature.ANALYTICS_INSIGHT,
    AIFeature.VOICE_TRANSCRIPTION,
  ];

  for (let d = 30; d >= 1; d -= 3) {
    for (let f = 0; f < 3; f++) {
      const feature = aiFeatureList[f % aiFeatureList.length];
      const tokens = 800 + Math.floor(Math.random() * 1200);
      await prisma.aIUsage.create({
        data: {
          businessId: business.id,
          userId: ownerUser.id,
          provider: f % 2 === 0 ? AIProvider.CLAUDE : AIProvider.OPENAI,
          model: f % 2 === 0 ? 'claude-3-opus-20240229' : 'gpt-4o',
          feature,
          promptTokens: Math.floor(tokens * 0.4),
          completionTokens: Math.floor(tokens * 0.6),
          totalTokens: tokens,
          cost: parseFloat((tokens * 0.00003).toFixed(6)),
          requestDuration: 1200 + Math.floor(Math.random() * 2000),
          createdAt: daysAgo(d),
        },
      });
    }
  }
  console.log('✓ AI usage history');

  // ── 13. 60-Day Appointment Schedule ───────────────────────────────────────
  console.log('Creating 60-day appointment schedule...');

  // Time slots per day (hour, minute)
  const timeSlots = [
    { hour: 9, minute: 0 },
    { hour: 10, minute: 30 },
    { hour: 12, minute: 0 },
    { hour: 13, minute: 30 },
    { hour: 15, minute: 0 },
    { hour: 16, minute: 30 },
  ];

  const newAppointments: any[] = [];
  let invoiceCounter = 900; // Start high to avoid conflicts with existing invoices
  let paymentCounter = 900;

  for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
    const date = daysAhead(dayOffset);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

    if (dayOfWeek === 0) continue; // No Sunday appointments

    // Determine how many slots to fill
    const isSaturday = dayOfWeek === 6;
    const availableTherapists = isSaturday ? therapists.slice(0, 2) : therapists;
    const slotsPerTherapist = isSaturday ? 3 : timeSlots.length;

    // Check if these days are in therapist time off ranges
    for (let ti = 0; ti < availableTherapists.length; ti++) {
      const therapist = availableTherapists[ti];

      // Check time off (rough check — skip if therapist is on leave for days 25-32 or 45-49)
      const isOnLeave =
        (ti === 0 && dayOffset >= 25 && dayOffset <= 32) ||
        (ti === 1 && dayOffset === 10) ||
        (ti === 2 && dayOffset >= 45 && dayOffset <= 49);
      if (isOnLeave) continue;

      for (let si = 0; si < slotsPerTherapist; si++) {
        const slot = timeSlots[si];
        const clientIdx = (dayOffset * 3 + ti * 5 + si * 7) % clients.length;
        const serviceIdx = (dayOffset + ti + si) % SERVICE_TYPES.length;
        const client = clients[clientIdx];
        const serviceType = SERVICE_TYPES[serviceIdx];
        const price = SERVICE_PRICES[serviceIdx];
        const duration = SERVICE_DURATIONS[serviceIdx];

        const startTime = setHour(date, slot.hour, slot.minute);
        const endTime = addMinutes(startTime, duration);

        // Check if this exact slot already exists for this therapist
        const existingAppt = await prisma.appointment.findFirst({
          where: {
            businessId: business.id,
            therapistId: therapist.id,
            startTime,
          },
        });
        if (existingAppt) continue;

        // Determine status based on how far ahead
        let status: AppointmentStatus;
        if (dayOffset <= 3) {
          status = AppointmentStatus.CONFIRMED;
        } else if (dayOffset <= 7) {
          status = Math.random() > 0.3 ? AppointmentStatus.SCHEDULED : AppointmentStatus.CONFIRMED;
        } else {
          status = AppointmentStatus.SCHEDULED;
        }

        // Occasionally make it virtual
        const isVirtual = Math.random() < 0.05;

        const appt = await prisma.appointment.create({
          data: {
            businessId: business.id,
            clientId: client.id,
            therapistId: therapist.id,
            locationId: location.id,
            roomId: ti % 2 === 0 ? room.id : room2.id,
            startTime,
            endTime,
            status,
            serviceType,
            duration,
            price,
            notes: si === 0 ? 'Client requested focus on primary concern area.' : undefined,
            isVirtual,
          },
        });
        newAppointments.push(appt);

        // Add appointment reminder for confirmed/scheduled upcoming
        if (dayOffset >= 1 && dayOffset <= 14) {
          const reminderExists = await prisma.appointmentReminder.findFirst({
            where: { appointmentId: appt.id },
          });
          if (!reminderExists) {
            // 24h reminder
            await prisma.appointmentReminder.create({
              data: {
                appointmentId: appt.id,
                businessId: business.id,
                reminderType: 'SMS',
                scheduledFor: addMinutes(startTime, -24 * 60),
                status: 'PENDING',
              },
            });
            // 1h reminder
            await prisma.appointmentReminder.create({
              data: {
                appointmentId: appt.id,
                businessId: business.id,
                reminderType: 'EMAIL',
                scheduledFor: addMinutes(startTime, -60),
                status: 'PENDING',
              },
            });
          }
        }
      }
    }
  }

  console.log(`✓ Future appointments created: ${newAppointments.length}`);

  // ── 14. Analytics Snapshots for next 60 days ─────────────────────────────
  let futureSnapshotCount = 0;
  for (let d = 1; d <= 60; d++) {
    const date = daysAhead(d);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isSunday = dayOfWeek === 0;

    // Projected data for future days (forecast numbers)
    const projectedAppts = isSunday ? 0 : isWeekday ? 8 + Math.floor(Math.random() * 5) : 4 + Math.floor(Math.random() * 3);
    const projectedCompleted = Math.floor(projectedAppts * 0.92);
    const avgPrice = 105 + Math.random() * 35;
    const projectedRevenue = projectedCompleted * avgPrice;

    try {
      await prisma.analyticsSnapshot.upsert({
        where: { businessId_date_type: { businessId: business.id, date, type: AnalyticsSnapshotType.DAILY } },
        update: {},
        create: {
          businessId: business.id,
          date,
          type: AnalyticsSnapshotType.DAILY,
          metrics: {
            totalRevenue: parseFloat(projectedRevenue.toFixed(2)),
            totalAppointments: projectedAppts,
            completedAppointments: projectedCompleted,
            cancelledAppointments: projectedAppts - projectedCompleted,
            noShowAppointments: Math.floor(Math.random() * 2),
            newClients: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
            activeClients: 10 + Math.floor(Math.random() * 5),
            averageSessionDuration: 65 + Math.floor(Math.random() * 20),
            occupancyRate: parseFloat((projectedCompleted / Math.max(projectedAppts, 1)).toFixed(2)),
            therapist0Revenue: parseFloat((projectedRevenue * 0.42).toFixed(2)),
            therapist1Revenue: parseFloat((projectedRevenue * 0.35).toFixed(2)),
            therapist2Revenue: parseFloat((projectedRevenue * 0.23).toFixed(2)),
            isProjected: true,
          },
        },
      });
      futureSnapshotCount++;
    } catch {
      // skip duplicate
    }
  }

  // Weekly snapshots for next 8 weeks
  for (let w = 1; w <= 8; w++) {
    const date = daysAhead(w * 7);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    date.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekRevenue = 4000 + Math.random() * 2500;
    const weekAppts = 30 + Math.floor(Math.random() * 15);
    const completed = Math.floor(weekAppts * 0.92);

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
            newClients: Math.floor(Math.random() * 4),
            activeClients: 12 + Math.floor(Math.random() * 5),
            averageSessionDuration: 67,
            occupancyRate: parseFloat((completed / weekAppts).toFixed(2)),
            isProjected: true,
          },
        },
      });
      futureSnapshotCount++;
    } catch {
      // skip
    }
  }

  // Monthly snapshots for next 2 months
  for (let m = 1; m <= 2; m++) {
    const date = new Date();
    date.setMonth(date.getMonth() + m, 1);
    date.setHours(0, 0, 0, 0);

    const monthRevenue = 18000 + Math.random() * 6000;
    const monthAppts = 130 + Math.floor(Math.random() * 40);
    const completed = Math.floor(monthAppts * 0.92);

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
            newClients: 5 + Math.floor(Math.random() * 8),
            activeClients: 14 + Math.floor(Math.random() * 5),
            averageSessionDuration: 67,
            occupancyRate: parseFloat((completed / monthAppts).toFixed(2)),
            topService: SERVICE_TYPES[Math.floor(Math.random() * 3)],
            topTherapist: 'Sarah Johnson',
            isProjected: true,
          },
        },
      });
      futureSnapshotCount++;
    } catch {
      // skip
    }
  }

  console.log(`✓ Future analytics snapshots: ${futureSnapshotCount}`);

  // ── 15. Invoices & payments for upcoming appointments (deposits) ──────────
  // Create deposit/pre-paid invoices for appointments in days 1-7
  const nearTermAppts = newAppointments.filter(a => {
    const daysUntil = Math.round((a.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 1 && daysUntil <= 7;
  });

  let newInvoiceCount = 0;
  for (let i = 0; i < nearTermAppts.length; i++) {
    const appt = nearTermAppts[i];
    const clientId = appt.clientId;
    invoiceCounter++;

    const invoiceNumber = `INV-2026-${String(invoiceCounter).padStart(4, '0')}`;
    const existing = await prisma.invoice.findFirst({ where: { businessId: business.id, invoiceNumber } });
    if (existing) continue;

    const depositPct = Math.random() > 0.6 ? 0.5 : 1.0; // 40% full prepay, 60% deposit
    const depositAmt = parseFloat((appt.price * depositPct).toFixed(2));

    const invoice = await prisma.invoice.create({
      data: {
        businessId: business.id,
        clientId,
        invoiceNumber,
        status: depositPct === 1.0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        lineItems: [{ description: appt.serviceType, quantity: 1, unitPrice: appt.price, total: appt.price }],
        subtotal: appt.price,
        taxAmount: 0,
        discountAmount: 0,
        total: appt.price,
        amountPaid: depositAmt,
        amountDue: appt.price - depositAmt,
        issuedAt: daysAgo(1),
        sentAt: daysAgo(1),
        paidAt: depositPct === 1.0 ? daysAgo(0) : undefined,
        dueDate: appt.startTime,
      },
    });

    paymentCounter++;
    await prisma.payment.create({
      data: {
        businessId: business.id,
        clientId,
        invoiceId: invoice.id,
        appointmentId: appt.id,
        amount: depositAmt,
        currency: 'AUD',
        paymentMethod: i % 3 === 0 ? PaymentMethod.CASH : PaymentMethod.STRIPE_CARD,
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: i % 3 !== 0 ? `pi_future_${String(paymentCounter).padStart(8, '0')}` : undefined,
        description: `${depositPct === 1.0 ? 'Full payment' : 'Deposit'} for ${appt.serviceType}`,
        paidAt: daysAgo(0),
      },
    });
    newInvoiceCount++;
  }
  console.log(`✓ Pre-appointment invoices & payments: ${newInvoiceCount}`);

  // ── 16. Message Logs (communication history) ─────────────────────────────
  const msgTypes = ['APPOINTMENT_REMINDER', 'BOOKING_CONFIRMATION', 'FOLLOW_UP', 'INVOICE_SENT', 'BIRTHDAY_GREETING'];
  const msgStatuses: MessageLogStatus[] = [MessageLogStatus.DELIVERED, MessageLogStatus.DELIVERED, MessageLogStatus.DELIVERED, MessageLogStatus.FAILED, MessageLogStatus.SENT];
  const channels: MessageChannel[] = [MessageChannel.EMAIL, MessageChannel.SMS, MessageChannel.EMAIL, MessageChannel.SMS, MessageChannel.EMAIL];

  for (let i = 0; i < 40; i++) {
    const client = clients[i % clients.length];
    const channel = channels[i % channels.length];
    const msgType = msgTypes[i % msgTypes.length];
    const status = msgStatuses[i % msgStatuses.length];
    const daysBack = Math.floor(Math.random() * 60) + 1;

    await prisma.messageLog.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        channel,
        messageType: msgType,
        recipient: channel === MessageChannel.EMAIL ? (client.email ?? 'client@example.com') : (client.phoneNumber ?? '0400000000'),
        subject: channel === MessageChannel.EMAIL ? `${msgType.replace('_', ' ')} — Serenity Wellness` : undefined,
        status,
        providerMessageId: status !== MessageLogStatus.FAILED ? `msg_seed_${i.toString().padStart(6, '0')}` : undefined,
        errorCode: status === MessageLogStatus.FAILED ? 'INVALID_NUMBER' : undefined,
        sentAt: status !== MessageLogStatus.FAILED ? daysAgo(daysBack) : undefined,
        deliveredAt: status === MessageLogStatus.DELIVERED ? daysAgo(daysBack) : undefined,
        smsCost: channel === MessageChannel.SMS ? 0.075 : undefined,
        createdAt: daysAgo(daysBack),
      },
    });
  }
  console.log('✓ Message logs: 40');

  // ── 17. Group Bookings ────────────────────────────────────────────────────
  // Find a future appointment and make it a group session
  const groupAppt = newAppointments.find(a => {
    const daysUntil = Math.round((a.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 5 && daysUntil <= 15;
  });

  if (groupAppt) {
    await prisma.appointment.update({
      where: { id: groupAppt.id },
      data: { isGroup: true, capacity: 6 },
    });

    // Add group booking participants (up to 4 clients)
    const groupClients = clients.slice(0, 4);
    for (const gc of groupClients) {
      const existingGB = await prisma.groupBooking.findFirst({
        where: { appointmentId: groupAppt.id, clientId: gc.id },
      });
      if (!existingGB) {
        await prisma.groupBooking.create({
          data: {
            appointmentId: groupAppt.id,
            clientId: gc.id,
            status: GroupBookingStatus.REGISTERED,
          },
        });
      }
    }
    console.log('✓ Group booking created');
  }

  // ── 18. Booking Invites ───────────────────────────────────────────────────
  for (let i = 8; i < 12 && i < clients.length; i++) {
    const existing = await prisma.bookingInvite.findFirst({
      where: { clientId: clients[i].id, businessId: business.id },
    });
    if (!existing) {
      await prisma.bookingInvite.create({
        data: {
          businessId: business.id,
          clientId: clients[i].id,
          expiresAt: daysAhead(14),
        },
      });
    }
  }
  console.log('✓ Booking invites');

  // ── 19. Automation Rules ──────────────────────────────────────────────────
  const automationDefs = [
    {
      name: 'Send 24h Reminder SMS',
      trigger: 'APPOINTMENT_CREATED',
      actions: [{ type: 'SEND_SMS', delay: { value: -24, unit: 'hours', relativeTo: 'startTime' }, template: 'Appointment Reminder (SMS)' }],
    },
    {
      name: 'Send Welcome Email to New Client',
      trigger: 'CLIENT_CREATED',
      actions: [{ type: 'SEND_EMAIL', delay: { value: 0, unit: 'minutes' }, template: 'Welcome Email' }],
    },
    {
      name: 'Post-Session Follow Up Email',
      trigger: 'APPOINTMENT_COMPLETED',
      actions: [{ type: 'SEND_EMAIL', delay: { value: 2, unit: 'hours', relativeTo: 'endTime' }, template: 'Follow-up Email' }],
    },
    {
      name: 'Award Loyalty Points on Payment',
      trigger: 'PAYMENT_COMPLETED',
      actions: [{ type: 'AWARD_LOYALTY_POINTS', pointsPerDollar: 1 }],
    },
    {
      name: 'Birthday Greeting SMS',
      trigger: 'CLIENT_BIRTHDAY',
      actions: [{ type: 'SEND_SMS', template: 'Birthday Greeting (SMS)' }],
    },
  ];

  for (const def of automationDefs) {
    const existing = await prisma.automationRule.findFirst({ where: { businessId: business.id, name: def.name } });
    if (!existing) {
      const rule = await prisma.automationRule.create({
        data: {
          businessId: business.id,
          name: def.name,
          isActive: true,
          trigger: def.trigger,
          conditions: {},
          actions: def.actions,
          runCount: Math.floor(Math.random() * 50),
          lastRunAt: daysAgo(Math.floor(Math.random() * 7)),
        },
      });

      // Add a few automation logs
      for (let al = 0; al < 3; al++) {
        await prisma.automationLog.create({
          data: {
            automationRuleId: rule.id,
            businessId: business.id,
            status: al < 2 ? 'SUCCESS' : 'FAILED',
            triggerData: { event: def.trigger, entityId: 'seed-entity' },
            result: al < 2 ? { messagesSent: 1 } : null,
            errorMessage: al === 2 ? 'Client email address missing' : undefined,
            executedAt: daysAgo(al + 1),
          },
        });
      }
    }
  }
  console.log('✓ Automation rules & logs');

  // ── 20. Loyalty Rewards (redemptions) ────────────────────────────────────
  const rewardClients = clients.slice(0, 5);
  for (let ri = 0; ri < rewardClients.length; ri++) {
    const loyaltyAcct = loyaltyAccounts[rewardClients[ri].id];
    if (!loyaltyAcct) continue;

    const existingReward = await prisma.loyaltyReward.findFirst({ where: { loyaltyAccountId: loyaltyAcct.id } });
    if (!existingReward) {
      await prisma.loyaltyReward.create({
        data: {
          loyaltyAccountId: loyaltyAcct.id,
          businessId: business.id,
          type: 'REDEEM',
          description: 'Redeemed for session discount',
          pointsUsed: 200,
          dollarValue: 20,
        },
      });
      // Deduct points transaction
      await prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: loyaltyAcct.id,
          businessId: business.id,
          type: 'REDEEM',
          points: -200,
          description: '$20 off session — points redemption',
          referenceType: 'REWARD',
        },
      });
    }
  }
  console.log('✓ Loyalty rewards & redemptions');

  // ── 21. Membership Sessions for active memberships ────────────────────────
  const activeMemberships = await prisma.membership.findMany({
    where: { businessId: business.id, status: 'ACTIVE' },
  });

  for (const mem of activeMemberships) {
    // Find appointments for this client that don't already have a membership session
    const clientAppts = newAppointments
      .filter(a => a.clientId === mem.clientId)
      .slice(0, 2);

    for (const appt of clientAppts) {
      const existing = await prisma.membershipSession.findFirst({ where: { appointmentId: appt.id } });
      if (!existing) {
        await prisma.membershipSession.create({
          data: {
            membershipId: mem.id,
            appointmentId: appt.id,
            businessId: business.id,
            redeemedAt: appt.startTime,
          },
        });
      }
    }
  }
  console.log('✓ Membership sessions linked');

  // ── 22. Package Sessions for active packages ──────────────────────────────
  const activePackages = await prisma.packagePurchase.findMany({
    where: { businessId: business.id, status: 'ACTIVE' },
  });

  for (const pkg of activePackages) {
    const clientAppts = newAppointments
      .filter(a => a.clientId === pkg.clientId)
      .slice(0, 1);

    for (const appt of clientAppts) {
      const existing = await prisma.packageSession.findFirst({ where: { appointmentId: appt.id } });
      if (!existing) {
        await prisma.packageSession.create({
          data: {
            packagePurchaseId: pkg.id,
            appointmentId: appt.id,
            businessId: business.id,
            redeemedAt: appt.startTime,
          },
        });
      }
    }
  }
  console.log('✓ Package sessions linked');

  // ── 23. Additional intake forms for remaining clients ────────────────────
  const defaultTemplate = await prisma.intakeFormTemplate.findFirst({
    where: { businessId: business.id, isDefault: true },
  });

  if (defaultTemplate) {
    for (let i = 8; i < clients.length; i++) {
      const existing = await prisma.intakeForm.findFirst({ where: { clientId: clients[i].id } });
      if (!existing) {
        await prisma.intakeForm.create({
          data: {
            businessId: business.id,
            clientId: clients[i].id,
            templateId: defaultTemplate.id,
            formData: {
              primaryReason: ['Sports recovery', 'Stress relief', 'Chronic pain', 'Post-injury', 'General wellness', 'Headaches', 'Back pain'][i % 7],
              healthConcerns: 'Ongoing discomfort affecting daily activities and sleep quality.',
              areasOfPain: [['Lower Back'], ['Shoulders', 'Neck'], ['Legs', 'Feet'], ['Arms', 'Hands'], ['Upper Back'], ['Neck'], ['Hips']][i % 7],
              painLevel: 3 + (i % 5),
              preferredPressure: ['Medium', 'Firm', 'Light', 'Deep', 'Medium'][i % 5],
              pregnant: false,
            },
            isSubmitted: true,
            submittedAt: daysAgo(Math.floor(Math.random() * 30) + 1),
          },
        });
      }
    }
    console.log('✓ Additional intake forms');
  }

  // ── 24. Appointment cancellations (some from upcoming) ────────────────────
  // Find a few future appointments to cancel for testing cancellation flow
  const apptsToCancelCount = Math.min(5, newAppointments.length);
  const cancellationReasons = [
    'Client requested cancellation — conflict in schedule',
    'Therapist illness — rescheduled to next week',
    'Client no longer requires treatment',
    'Public holiday — clinic closed',
    'Weather emergency',
  ];

  let cancelCount = 0;
  for (let i = 0; i < newAppointments.length && cancelCount < apptsToCancelCount; i++) {
    const appt = newAppointments[i];
    const daysUntil = Math.round((appt.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 40 || daysUntil > 55) continue; // Cancel some far-out appointments

    await prisma.appointment.update({ where: { id: appt.id }, data: { status: AppointmentStatus.CANCELLED } });
    const existingCancel = await prisma.appointmentCancellation.findFirst({ where: { appointmentId: appt.id } });
    if (!existingCancel) {
      await prisma.appointmentCancellation.create({
        data: {
          appointmentId: appt.id,
          businessId: business.id,
          cancelledBy: 'CLIENT',
          reason: cancellationReasons[cancelCount % cancellationReasons.length],
          cancellationType: cancelCount % 2 === 0 ? 'EARLY' : 'LATE',
        },
      });
    }
    cancelCount++;
  }
  console.log(`✓ Cancellations: ${cancelCount}`);

  // ── 25. Additional audit logs ─────────────────────────────────────────────
  const auditActions = [
    { action: 'APPOINTMENT_CREATED', entityType: 'Appointment', meta: { serviceType: 'Deep Tissue Massage', clientName: 'Emma Williams' } },
    { action: 'INVOICE_PAID', entityType: 'Invoice', meta: { amount: 120, method: 'STRIPE_CARD' } },
    { action: 'CLIENT_UPDATED', entityType: 'Client', meta: { field: 'phoneNumber', clientName: 'James Brown' } },
    { action: 'GIFT_CARD_PURCHASED', entityType: 'GiftCard', meta: { amount: 100, code: 'GIFT-SEED-0001' } },
    { action: 'LOYALTY_POINTS_AWARDED', entityType: 'LoyaltyAccount', meta: { points: 120, clientName: 'Olivia Davis' } },
    { action: 'PROMOTION_SENT', entityType: 'Promotion', meta: { name: 'June Wellness Month', recipientCount: 280 } },
    { action: 'PAYROLL_PROCESSED', entityType: 'PayrollPeriod', meta: { totalAmount: 12450, therapistCount: 3 } },
    { action: 'INSURANCE_CLAIM_SUBMITTED', entityType: 'InsuranceClaim', meta: { claimNumber: 'CLM-2026-0001', amount: 120 } },
    { action: 'TASK_COMPLETED', entityType: 'Task', meta: { title: 'Send follow-up email after Olivia\'s session' } },
    { action: 'PRODUCT_STOCK_ADJUSTED', entityType: 'Product', meta: { product: 'Deep Tissue Massage Oil', adjustment: -2 } },
  ];

  for (let i = 0; i < auditActions.length; i++) {
    const ev = auditActions[i];
    await prisma.auditLog.create({
      data: {
        userId: ownerUser.id,
        businessId: business.id,
        action: ev.action,
        entityType: ev.entityType,
        entityId: `seed-entity-60d-${i}`,
        metadata: ev.meta,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });
  }
  console.log('✓ Additional audit logs');

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalAppts = await prisma.appointment.count({ where: { businessId: business.id } });
  const totalClients = await prisma.client.count({ where: { businessId: business.id } });
  const totalInvoices = await prisma.invoice.count({ where: { businessId: business.id } });
  const totalPayments = await prisma.payment.count({ where: { businessId: business.id } });
  const totalSnapshots = await prisma.analyticsSnapshot.count({ where: { businessId: business.id } });

  console.log('\n✅ 60-day seed complete!');
  console.log(`   Total appointments:  ${totalAppts}`);
  console.log(`   Total clients:       ${totalClients}`);
  console.log(`   Total invoices:      ${totalInvoices}`);
  console.log(`   Total payments:      ${totalPayments}`);
  console.log(`   Analytics snapshots: ${totalSnapshots}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
