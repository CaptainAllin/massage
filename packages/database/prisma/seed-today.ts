/**
 * seed-today.ts — Seed a realistic full day of activity for today.
 * Adds: appointments (completed, in-progress, upcoming), treatment notes,
 * payments, invoices, voice notes, body maps, messages, loyalty transactions,
 * audit logs, and an analytics snapshot for today.
 *
 * Run: cd packages/database && npx tsx prisma/seed-today.ts
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
  TreatmentNoteStatus,
  MessageChannel,
  MessageLogStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'test@test.com';

function today(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMins(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60 * 1000);
}

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

const NOW = new Date();
const CURRENT_HOUR = NOW.getHours();

const SERVICE_TYPES = [
  'Deep Tissue Massage',
  'Swedish Massage',
  'Sports Massage',
  'Hot Stone Massage',
  'Reflexology',
  'Thai Massage',
  'Aromatherapy Massage',
  'Trigger Point Therapy',
  'Lymphatic Drainage',
  'Prenatal Massage',
];
const PRICES = [120, 100, 130, 140, 95, 125, 105, 135, 115, 110];
const DURATIONS = [60, 60, 60, 90, 60, 90, 60, 60, 60, 90];

async function main() {
  console.log(`Seeding today's data (current time: ${NOW.toLocaleTimeString()})...`);

  const ownerUser = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!ownerUser) throw new Error('Owner not found. Run main seed first.');

  const business = await prisma.business.findUnique({ where: { ownerId: ownerUser.id } });
  if (!business) throw new Error('Business not found.');

  const therapists = await prisma.therapist.findMany({ where: { businessId: business.id, isActive: true } });
  const clients = await prisma.client.findMany({ where: { businessId: business.id, isActive: true } });
  const location = await prisma.location.findFirst({ where: { businessId: business.id } });
  const room = await prisma.room.findFirst({ where: { businessId: business.id } });
  const room2 = await prisma.room.findFirst({ where: { businessId: business.id, name: { contains: 'Room 2' } } });

  // ── Today's schedule ─────────────────────────────────────────────────────
  // 9:00  — COMPLETED  (session finished this morning)
  // 10:30 — COMPLETED  (finished before lunch)
  // 12:00 — COMPLETED  (lunchtime slot, just done)
  // 13:30 — IN_PROGRESS or COMPLETED (current slot, depending on time)
  // 15:00 — SCHEDULED  (upcoming this afternoon)
  // 16:30 — CONFIRMED  (end of day, confirmed)

  type SlotDef = {
    startHour: number;
    startMin: number;
    therapistIdx: number;
    clientIdx: number;
    serviceIdx: number;
    label: string;
  };

  const slots: SlotDef[] = [
    { startHour: 9,  startMin: 0,  therapistIdx: 0, clientIdx: 0,  serviceIdx: 0, label: '9:00 AM' },
    { startHour: 9,  startMin: 0,  therapistIdx: 1, clientIdx: 3,  serviceIdx: 1, label: '9:00 AM (T2)' },
    { startHour: 9,  startMin: 0,  therapistIdx: 2, clientIdx: 6,  serviceIdx: 4, label: '9:00 AM (T3)' },
    { startHour: 10, startMin: 30, therapistIdx: 0, clientIdx: 1,  serviceIdx: 2, label: '10:30 AM' },
    { startHour: 10, startMin: 30, therapistIdx: 1, clientIdx: 4,  serviceIdx: 9, label: '10:30 AM (T2)' },
    { startHour: 10, startMin: 30, therapistIdx: 2, clientIdx: 7,  serviceIdx: 5, label: '10:30 AM (T3)' },
    { startHour: 12, startMin: 0,  therapistIdx: 0, clientIdx: 2,  serviceIdx: 7, label: '12:00 PM' },
    { startHour: 12, startMin: 0,  therapistIdx: 1, clientIdx: 5,  serviceIdx: 3, label: '12:00 PM (T2)' },
    { startHour: 12, startMin: 0,  therapistIdx: 2, clientIdx: 8,  serviceIdx: 8, label: '12:00 PM (T3)' },
    { startHour: 13, startMin: 30, therapistIdx: 0, clientIdx: 9,  serviceIdx: 0, label: '1:30 PM' },
    { startHour: 13, startMin: 30, therapistIdx: 1, clientIdx: 10, serviceIdx: 1, label: '1:30 PM (T2)' },
    { startHour: 13, startMin: 30, therapistIdx: 2, clientIdx: 11, serviceIdx: 6, label: '1:30 PM (T3)' },
    { startHour: 15, startMin: 0,  therapistIdx: 0, clientIdx: 12, serviceIdx: 2, label: '3:00 PM' },
    { startHour: 15, startMin: 0,  therapistIdx: 1, clientIdx: 13, serviceIdx: 4, label: '3:00 PM (T2)' },
    { startHour: 15, startMin: 0,  therapistIdx: 2, clientIdx: 14, serviceIdx: 7, label: '3:00 PM (T3)' },
    { startHour: 16, startMin: 30, therapistIdx: 0, clientIdx: 0,  serviceIdx: 1, label: '4:30 PM' },
    { startHour: 16, startMin: 30, therapistIdx: 1, clientIdx: 3,  serviceIdx: 5, label: '4:30 PM (T2)' },
  ];

  const todayAppointments: any[] = [];
  let invoiceNum = 1500;
  let paymentNum = 1500;

  for (const slot of slots) {
    const therapist = therapists[slot.therapistIdx];
    const client = clients[slot.clientIdx % clients.length];
    const serviceType = SERVICE_TYPES[slot.serviceIdx];
    const price = PRICES[slot.serviceIdx];
    const duration = DURATIONS[slot.serviceIdx];

    const startTime = today(slot.startHour, slot.startMin);
    const endTime = addMins(startTime, duration);

    // Determine status based on current time
    let status: AppointmentStatus;
    if (endTime < NOW) {
      status = AppointmentStatus.COMPLETED;
    } else if (startTime <= NOW && endTime >= NOW) {
      status = AppointmentStatus.IN_PROGRESS;
    } else if (slot.startHour <= 16) {
      status = AppointmentStatus.CONFIRMED;
    } else {
      status = AppointmentStatus.SCHEDULED;
    }

    // Check duplicate
    const existing = await prisma.appointment.findFirst({
      where: { businessId: business.id, therapistId: therapist.id, startTime },
    });
    if (existing) {
      todayAppointments.push(existing);
      console.log(`  (skip existing) ${slot.label}`);
      continue;
    }

    const appt = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        therapistId: therapist.id,
        locationId: location?.id,
        roomId: slot.therapistIdx % 2 === 0 ? room?.id : room2?.id,
        startTime,
        endTime,
        status,
        serviceType,
        duration,
        price,
        notes: status === AppointmentStatus.COMPLETED ? 'Client reported significant improvement post-session.' : 'Please arrive 5 minutes early.',
        isVirtual: false,
      },
    });
    todayAppointments.push(appt);
    console.log(`  ✓ ${slot.label} → ${serviceType} (${status})`);

    // ── Treatment note for completed sessions ──
    if (status === AppointmentStatus.COMPLETED) {
      const noteTemplates = [
        {
          subj: 'Client reports lower back pain 6/10, improved from 8/10 last week. Tension in glutes persists.',
          obj: 'Lumbar erectors hypertonic bilaterally. Trigger points at L4-L5 responding well to pressure. ROM 80% of normal.',
          assess: 'Good progress. Chronic lumbar pattern stabilising with regular treatment.',
          plan: 'Maintain weekly sessions. Introduce gluteal stretch protocol at home.',
          areas: ['Lower Back', 'Gluteal Muscles', 'Hamstrings'],
          techniques: ['Deep Tissue', 'Trigger Point Therapy', 'Myofascial Release'],
          noteStatus: TreatmentNoteStatus.APPROVED,
        },
        {
          subj: 'Shoulder tension 4/10. Client has been doing prescribed stretches — reports improvement.',
          obj: 'Upper trapezius less hypertonic than last visit. Cervical rotation improved (L 55°, R 60°).',
          assess: 'Ongoing improvement with consistent treatment. Upper crossed syndrome resolving.',
          plan: 'Maintain bi-weekly cadence. Progress to strengthening exercises.',
          areas: ['Shoulders', 'Neck', 'Upper Back'],
          techniques: ['Swedish Massage', 'Myofascial Release', 'Passive Stretching'],
          noteStatus: TreatmentNoteStatus.APPROVED,
        },
        {
          subj: 'Client presented post-competition. Bilateral leg soreness 5/10. First session in 3 weeks.',
          obj: 'IT band tightness moderate. Calf DOMS present. TFL tender to palpation bilaterally.',
          assess: 'Exercise-induced overuse. Tissue health good. Responding well to treatment.',
          plan: 'Sports massage weekly during training cycle. Foam rolling daily.',
          areas: ['IT Band', 'TFL', 'Calves', 'Hamstrings'],
          techniques: ['Sports Massage', 'Deep Tissue', 'Compression'],
          noteStatus: TreatmentNoteStatus.PENDING_REVIEW,
        },
        {
          subj: 'General stress and tension. Rates discomfort 3/10. Sleeping poorly past week.',
          obj: 'Moderate muscle tension across upper back and shoulders. No acute findings.',
          assess: 'Stress-related myofascial tension. Good baseline tissue health.',
          plan: 'Monthly maintenance sessions. Breathing exercises for stress management.',
          areas: ['Upper Back', 'Shoulders', 'Neck'],
          techniques: ['Swedish Massage', 'Aromatherapy', 'Light Effleurage'],
          noteStatus: TreatmentNoteStatus.DRAFT,
        },
        {
          subj: 'Reflexology for general wellness. No acute complaints. Energy levels low.',
          obj: 'Reflex points for digestive system and adrenals tender. Feet well-hydrated.',
          assess: 'Stress response presenting via reflexology. Client tolerating session well.',
          plan: 'Continue reflexology monthly. Refer to naturopath for adrenal support.',
          areas: ['Feet', 'Ankles'],
          techniques: ['Reflexology', 'Light Effleurage'],
          noteStatus: TreatmentNoteStatus.APPROVED,
        },
        {
          subj: 'Prenatal — 30 weeks. Lower back and hip discomfort 5/10. Leg cramps at night.',
          obj: 'Client side-lying with pillow support. Paraspinal tension moderate. Mild ankle oedema.',
          assess: 'Normal prenatal presentation. Tolerating treatment well. Oedema improving with drainage work.',
          plan: 'Bi-weekly prenatal sessions. Encourage gentle walking and hydration.',
          areas: ['Lower Back', 'Hips', 'Legs'],
          techniques: ['Prenatal Massage', 'Lymphatic Drainage', 'Light Effleurage'],
          noteStatus: TreatmentNoteStatus.APPROVED,
        },
      ];

      const tmpl = noteTemplates[slot.therapistIdx * 2 + (slot.startHour >= 12 ? 1 : 0)] ?? noteTemplates[0];

      const existingNote = await prisma.treatmentNote.findFirst({ where: { appointmentId: appt.id } });
      if (!existingNote) {
        await prisma.treatmentNote.create({
          data: {
            businessId: business.id,
            appointmentId: appt.id,
            clientId: client.id,
            therapistId: therapist.id,
            status: tmpl.noteStatus,
            subjectiveFindings: tmpl.subj,
            objectiveFindings: tmpl.obj,
            assessment: tmpl.assess,
            plan: tmpl.plan,
            areasWorked: tmpl.areas,
            techniques: tmpl.techniques,
            sessionDuration: duration,
            followUpDate: daysAhead(7),
            aiSummary: tmpl.noteStatus === TreatmentNoteStatus.APPROVED
              ? `Client showed measurable improvement in ${tmpl.areas[0].toLowerCase()} tension. Treatment goals on track with current protocol.`
              : undefined,
            reviewedAt: tmpl.noteStatus === TreatmentNoteStatus.APPROVED ? new Date() : undefined,
            submittedForReviewAt: tmpl.noteStatus !== TreatmentNoteStatus.DRAFT ? addMins(endTime, 10) : undefined,
          },
        });
      }

      // Body map for first few completed sessions
      if (slot.startHour <= 12) {
        const existingBM = await prisma.bodyMap.findFirst({ where: { appointmentId: appt.id } });
        if (!existingBM) {
          await prisma.bodyMap.create({
            data: {
              businessId: business.id,
              clientId: client.id,
              appointmentId: appt.id,
              view: slot.serviceIdx % 2 === 0 ? 'back' : 'front',
              regions: [
                {
                  name: tmpl.areas[0],
                  coordinates: { x: 50, y: 65 },
                  painLevel: 5 + (slot.startHour % 3),
                  notes: `Primary treatment area — ${tmpl.techniques[0]}`,
                },
                ...(tmpl.areas[1] ? [{
                  name: tmpl.areas[1],
                  coordinates: { x: 55, y: 45 },
                  painLevel: 3 + (slot.startHour % 3),
                  notes: 'Secondary area addressed',
                }] : []),
              ],
              notes: 'Marked by therapist pre-session.',
            },
          });
        }
      }

      // Voice note for morning completed sessions
      if (slot.startHour <= 10 && slot.therapistIdx === 0) {
        const existingVN = await prisma.voiceNote.findFirst({ where: { appointmentId: appt.id } });
        if (!existingVN) {
          await prisma.voiceNote.create({
            data: {
              businessId: business.id,
              clientId: client.id,
              therapistId: therapist.id,
              appointmentId: appt.id,
              audioFileUrl: `https://storage.serenitywellness.com/voice-notes/today_${slot.startHour}.m4a`,
              audioFileName: `session_${slot.startHour}00.m4a`,
              audioFileSize: 1024 * 1024 * 2,
              audioMimeType: 'audio/mp4',
              audioDuration: 90 + slot.startHour * 5,
              transcription: `${tmpl.subj} ${tmpl.obj} Plan: ${tmpl.plan}`,
              transcriptionCost: 0.006,
              status: VoiceNoteStatus.TRANSCRIBED,
              recordedAt: addMins(endTime, 2),
              transcribedAt: addMins(endTime, 7),
            },
          });

          // AI usage for transcription
          await prisma.aIUsage.create({
            data: {
              businessId: business.id,
              userId: ownerUser.id,
              provider: AIProvider.OPENAI,
              model: 'whisper-1',
              feature: AIFeature.VOICE_TRANSCRIPTION,
              promptTokens: 0,
              completionTokens: 280,
              totalTokens: 280,
              cost: 0.006,
              requestDuration: 3200,
              createdAt: addMins(endTime, 7),
            },
          });
        }
      }

      // Invoice + Payment for completed sessions
      invoiceNum++;
      const invNumber = `INV-2026-${String(invoiceNum).padStart(4, '0')}`;
      const existingInv = await prisma.invoice.findFirst({ where: { businessId: business.id, invoiceNumber: invNumber } });
      if (!existingInv) {
        const payMethod = slot.therapistIdx === 0
          ? PaymentMethod.STRIPE_CARD
          : slot.therapistIdx === 1
          ? PaymentMethod.CASH
          : PaymentMethod.EFTPOS;

        const invoice = await prisma.invoice.create({
          data: {
            businessId: business.id,
            clientId: client.id,
            invoiceNumber: invNumber,
            status: InvoiceStatus.PAID,
            lineItems: [
              { description: serviceType, quantity: 1, unitPrice: price, total: price },
            ],
            subtotal: price,
            taxAmount: 0,
            discountAmount: 0,
            total: price,
            amountPaid: price,
            amountDue: 0,
            issuedAt: endTime,
            sentAt: endTime,
            paidAt: addMins(endTime, 5),
            dueDate: endTime,
          },
        });

        paymentNum++;
        await prisma.payment.create({
          data: {
            businessId: business.id,
            clientId: client.id,
            invoiceId: invoice.id,
            appointmentId: appt.id,
            amount: price,
            currency: 'AUD',
            paymentMethod: payMethod,
            status: PaymentStatus.COMPLETED,
            stripePaymentIntentId: payMethod === PaymentMethod.STRIPE_CARD
              ? `pi_today_${String(paymentNum).padStart(8, '0')}`
              : undefined,
            stripeChargeId: payMethod === PaymentMethod.STRIPE_CARD
              ? `ch_today_${String(paymentNum).padStart(8, '0')}`
              : undefined,
            stripeFee: payMethod === PaymentMethod.STRIPE_CARD
              ? parseFloat((price * 0.0175 + 0.30).toFixed(2))
              : undefined,
            description: `Payment for ${serviceType} — ${new Date().toLocaleDateString('en-AU')}`,
            paidAt: addMins(endTime, 5),
          },
        });

        // Loyalty points earned
        const loyaltyAcct = await prisma.loyaltyAccount.findFirst({
          where: { businessId: business.id, clientId: client.id },
        });
        if (loyaltyAcct) {
          const pointsEarned = Math.floor(price);
          await prisma.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: loyaltyAcct.id,
              businessId: business.id,
              type: 'EARN',
              points: pointsEarned,
              description: `${serviceType} — session payment`,
              referenceType: 'APPOINTMENT',
              referenceId: appt.id,
            },
          });
          await prisma.loyaltyAccount.update({
            where: { id: loyaltyAcct.id },
            data: {
              points: { increment: pointsEarned },
              lifetimePoints: { increment: pointsEarned },
            },
          });
        }
      }
    }

    // Appointment reminder for upcoming sessions
    if (status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.CONFIRMED) {
      const existingReminder = await prisma.appointmentReminder.findFirst({ where: { appointmentId: appt.id } });
      if (!existingReminder) {
        await prisma.appointmentReminder.create({
          data: {
            appointmentId: appt.id,
            businessId: business.id,
            reminderType: 'SMS',
            scheduledFor: addMins(startTime, -60),
            status: 'PENDING',
          },
        });
      }
    }
  }

  console.log(`\n✓ Today's appointments: ${todayAppointments.length}`);

  // ── Message logs for today ────────────────────────────────────────────────
  const todayMsgDefs = [
    { clientIdx: 0, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', status: MessageLogStatus.DELIVERED, hoursAgo: 10 },
    { clientIdx: 1, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', status: MessageLogStatus.DELIVERED, hoursAgo: 9 },
    { clientIdx: 2, channel: MessageChannel.EMAIL, type: 'BOOKING_CONFIRMATION', status: MessageLogStatus.DELIVERED, hoursAgo: 8 },
    { clientIdx: 3, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', status: MessageLogStatus.DELIVERED, hoursAgo: 8 },
    { clientIdx: 4, channel: MessageChannel.EMAIL, type: 'APPOINTMENT_REMINDER', status: MessageLogStatus.DELIVERED, hoursAgo: 7 },
    { clientIdx: 5, channel: MessageChannel.SMS, type: 'APPOINTMENT_REMINDER', status: MessageLogStatus.FAILED, hoursAgo: 6 },
    { clientIdx: 6, channel: MessageChannel.EMAIL, type: 'FOLLOW_UP', status: MessageLogStatus.SENT, hoursAgo: 2 },
    { clientIdx: 9, channel: MessageChannel.EMAIL, type: 'INVOICE_SENT', status: MessageLogStatus.DELIVERED, hoursAgo: 1 },
    { clientIdx: 0, channel: MessageChannel.EMAIL, type: 'FOLLOW_UP', status: MessageLogStatus.DELIVERED, hoursAgo: 0 },
  ];

  for (const def of todayMsgDefs) {
    const client = clients[def.clientIdx % clients.length];
    const sentAt = new Date(NOW.getTime() - def.hoursAgo * 60 * 60 * 1000);
    await prisma.messageLog.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        channel: def.channel,
        messageType: def.type,
        recipient: def.channel === MessageChannel.EMAIL ? (client.email ?? 'client@example.com') : (client.phoneNumber ?? '0400000000'),
        subject: def.channel === MessageChannel.EMAIL ? `${def.type.replace(/_/g, ' ')} — Serenity Wellness` : undefined,
        status: def.status,
        providerMessageId: def.status !== MessageLogStatus.FAILED ? `msg_today_${def.clientIdx}_${def.hoursAgo}` : undefined,
        errorCode: def.status === MessageLogStatus.FAILED ? 'UNDELIVERABLE' : undefined,
        sentAt: def.status !== MessageLogStatus.FAILED ? sentAt : undefined,
        deliveredAt: def.status === MessageLogStatus.DELIVERED ? new Date(sentAt.getTime() + 15000) : undefined,
        smsCost: def.channel === MessageChannel.SMS ? 0.075 : undefined,
        createdAt: sentAt,
      },
    });
  }
  console.log('✓ Today\'s message logs');

  // ── Today's analytics snapshot ────────────────────────────────────────────
  const completedToday = todayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  const todayRevenue = todayAppointments
    .filter(a => a.status === AppointmentStatus.COMPLETED)
    .reduce((sum: number, a: any) => sum + (a.price ?? 0), 0);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  await prisma.analyticsSnapshot.upsert({
    where: { businessId_date_type: { businessId: business.id, date: todayDate, type: AnalyticsSnapshotType.DAILY } },
    update: {
      metrics: {
        totalRevenue: parseFloat(todayRevenue.toFixed(2)),
        totalAppointments: todayAppointments.length,
        completedAppointments: completedToday,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        newClients: 0,
        activeClients: 15,
        averageSessionDuration: 68,
        occupancyRate: parseFloat((completedToday / Math.max(todayAppointments.length, 1)).toFixed(2)),
        therapist0Revenue: parseFloat((todayRevenue * 0.42).toFixed(2)),
        therapist1Revenue: parseFloat((todayRevenue * 0.35).toFixed(2)),
        therapist2Revenue: parseFloat((todayRevenue * 0.23).toFixed(2)),
        inProgress: todayAppointments.filter(a => a.status === AppointmentStatus.IN_PROGRESS).length,
        upcoming: todayAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(a.status)).length,
      },
    },
    create: {
      businessId: business.id,
      date: todayDate,
      type: AnalyticsSnapshotType.DAILY,
      metrics: {
        totalRevenue: parseFloat(todayRevenue.toFixed(2)),
        totalAppointments: todayAppointments.length,
        completedAppointments: completedToday,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        newClients: 0,
        activeClients: 15,
        averageSessionDuration: 68,
        occupancyRate: parseFloat((completedToday / Math.max(todayAppointments.length, 1)).toFixed(2)),
        therapist0Revenue: parseFloat((todayRevenue * 0.42).toFixed(2)),
        therapist1Revenue: parseFloat((todayRevenue * 0.35).toFixed(2)),
        therapist2Revenue: parseFloat((todayRevenue * 0.23).toFixed(2)),
        inProgress: todayAppointments.filter(a => a.status === AppointmentStatus.IN_PROGRESS).length,
        upcoming: todayAppointments.filter(a => [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(a.status)).length,
      },
    },
  });
  console.log('✓ Today\'s analytics snapshot');

  // ── Audit logs for today ──────────────────────────────────────────────────
  const todayAuditEvents = [
    { action: 'USER_LOGIN', entityType: 'User', meta: { method: 'clerk', success: true, time: '09:01' } },
    { action: 'APPOINTMENT_COMPLETED', entityType: 'Appointment', meta: { serviceType: 'Deep Tissue Massage', clientName: clients[0]?.firstName } },
    { action: 'PAYMENT_RECEIVED', entityType: 'Payment', meta: { amount: PRICES[0], method: 'STRIPE_CARD' } },
    { action: 'TREATMENT_NOTE_CREATED', entityType: 'TreatmentNote', meta: { clientName: clients[0]?.firstName, status: 'APPROVED' } },
    { action: 'APPOINTMENT_COMPLETED', entityType: 'Appointment', meta: { serviceType: 'Swedish Massage', clientName: clients[1]?.firstName } },
    { action: 'PAYMENT_RECEIVED', entityType: 'Payment', meta: { amount: PRICES[1], method: 'CASH' } },
    { action: 'VOICE_NOTE_TRANSCRIBED', entityType: 'VoiceNote', meta: { duration: 95, feature: 'VOICE_TRANSCRIPTION' } },
    { action: 'INVOICE_SENT', entityType: 'Invoice', meta: { amount: PRICES[7], clientName: clients[2]?.firstName } },
    { action: 'LOYALTY_POINTS_AWARDED', entityType: 'LoyaltyAccount', meta: { points: PRICES[0], clientName: clients[0]?.firstName } },
  ];

  for (const ev of todayAuditEvents) {
    await prisma.auditLog.create({
      data: {
        userId: ownerUser.id,
        businessId: business.id,
        action: ev.action,
        entityType: ev.entityType,
        entityId: `today-${ev.action.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
        metadata: ev.meta,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: new Date(NOW.getTime() - Math.floor(Math.random() * 8 * 60 * 60 * 1000)),
      },
    });
  }
  console.log('✓ Today\'s audit logs');

  // ── Summary ───────────────────────────────────────────────────────────────
  const statusBreakdown = {
    COMPLETED: todayAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
    IN_PROGRESS: todayAppointments.filter(a => a.status === AppointmentStatus.IN_PROGRESS).length,
    CONFIRMED: todayAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
    SCHEDULED: todayAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length,
  };

  console.log('\n✅ Today\'s seed complete!');
  console.log(`   Appointments: ${todayAppointments.length} total`);
  console.log(`     • Completed:   ${statusBreakdown.COMPLETED}`);
  console.log(`     • In Progress: ${statusBreakdown.IN_PROGRESS}`);
  console.log(`     • Confirmed:   ${statusBreakdown.CONFIRMED}`);
  console.log(`     • Scheduled:   ${statusBreakdown.SCHEDULED}`);
  console.log(`   Revenue so far: $${todayRevenue.toFixed(2)} AUD`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
