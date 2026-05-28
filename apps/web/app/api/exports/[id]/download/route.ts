import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import JSZip from 'jszip';
// @ts-ignore
import PDFDocument from 'pdfkit';

// ── CSV helpers ──────────────────────────────────────────────────────────────

function toCsvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    })
    .join(',');
}

function buildCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n');
}

function userName(user: { firstName?: string | null; lastName?: string | null } | null | undefined): string {
  if (!user) return '';
  return [user.firstName, user.lastName].filter(Boolean).join(' ');
}

// ── Data fetchers ────────────────────────────────────────────────────────────

async function fetchClients(businessId: string) {
  return prisma.client.findMany({
    where: { businessId },
    include: {
      intakeForms: true,
      preferredTherapist: { include: { user: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function fetchAppointments(businessId: string, filters: Record<string, string>) {
  const where: Record<string, unknown> = { businessId };
  if (filters.dateFrom || filters.dateTo) {
    where.startTime = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + 'T23:59:59Z') } : {}),
    };
  }
  if (filters.therapistId) where.therapistId = filters.therapistId;
  if (filters.status) where.status = filters.status;
  return prisma.appointment.findMany({
    where,
    include: { client: true, therapist: { include: { user: true } } },
    orderBy: { startTime: 'asc' },
  });
}

async function fetchInvoices(businessId: string, filters: Record<string, string>) {
  const where: Record<string, unknown> = { businessId };
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + 'T23:59:59Z') } : {}),
    };
  }
  if (filters.status) where.status = filters.status;
  return prisma.invoice.findMany({
    where,
    include: { client: true, payments: true },
    orderBy: { createdAt: 'asc' },
  });
}

async function fetchTreatmentNotes(businessId: string, filters: Record<string, string>) {
  const where: Record<string, unknown> = { businessId };
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + 'T23:59:59Z') } : {}),
    };
  }
  if (filters.therapistId) where.therapistId = filters.therapistId;
  if (filters.clientId) where.clientId = filters.clientId;
  return prisma.treatmentNote.findMany({
    where,
    include: {
      client: true,
      therapist: { include: { user: true } },
      appointment: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ── CSV generators ───────────────────────────────────────────────────────────

async function generateClientsCsv(businessId: string): Promise<string> {
  const clients = await fetchClients(businessId);
  const headers = [
    'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Address', 'City', 'State', 'Postal Code',
    'Emergency Contact', 'Emergency Phone', 'Occupation', 'Goals', 'Insurance Provider', 'Insurance Policy #',
    'Preferred Therapist', 'Total Visits', 'Last Visit', 'Active', 'Allergies', 'Medications', 'Created At',
    'Intake Forms Count', 'Intake Form Data',
  ];
  const rows = (clients as any[]).map((c) => [
    c.id, c.firstName, c.lastName, c.email ?? '', c.phoneNumber ?? '',
    c.dateOfBirth ? c.dateOfBirth.toISOString().split('T')[0] : '',
    c.address ?? '', c.city ?? '', c.state ?? '', c.postalCode ?? '',
    c.emergencyContactName ?? '', c.emergencyContactPhone ?? '',
    c.occupation ?? '', c.goals ?? '', c.insuranceProvider ?? '', c.insurancePolicyNumber ?? '',
    userName(c.preferredTherapist?.user),
    c.totalVisits, c.lastVisitDate ? c.lastVisitDate.toISOString().split('T')[0] : '',
    c.isActive ? 'Yes' : 'No',
    c.allergies.join('; '), c.medications.join('; '),
    c.createdAt.toISOString(),
    c.intakeForms.length,
    c.intakeForms.map((f: any) => JSON.stringify(f.formData)).join(' | '),
  ]);
  return buildCsv(headers, rows);
}

async function generateAppointmentsCsv(businessId: string, filters: Record<string, string>): Promise<string> {
  const appointments = await fetchAppointments(businessId, filters);
  const headers = [
    'ID', 'Date', 'Start Time', 'End Time', 'Duration (min)', 'Status',
    'Client Name', 'Client Email', 'Therapist', 'Service Type', 'Price',
    'Virtual', 'Group', 'Notes', 'Created At',
  ];
  const rows = (appointments as any[]).map((a) => [
    a.id,
    a.startTime.toISOString().split('T')[0],
    a.startTime.toTimeString().slice(0, 5),
    a.endTime.toTimeString().slice(0, 5),
    a.duration, a.status,
    `${a.client.firstName} ${a.client.lastName}`,
    a.client.email ?? '',
    userName(a.therapist?.user),
    a.serviceType ?? '',
    a.price ?? '',
    a.isVirtual ? 'Yes' : 'No',
    a.isGroup ? 'Yes' : 'No',
    a.notes ?? '',
    a.createdAt.toISOString(),
  ]);
  return buildCsv(headers, rows);
}

async function generateInvoicesPaymentsCsv(businessId: string, filters: Record<string, string>): Promise<string> {
  const invoices = await fetchInvoices(businessId, filters);
  const headers = [
    'Invoice ID', 'Invoice Number', 'Status', 'Client Name', 'Client Email',
    'Subtotal', 'Tax', 'Discount', 'Total', 'Amount Paid', 'Amount Due',
    'Issued At', 'Due Date', 'Paid At', 'Sent At', 'Notes',
    'Payment Methods', 'Created At',
  ];
  const rows = (invoices as any[]).map((inv) => [
    inv.id, inv.invoiceNumber, inv.status,
    `${inv.client.firstName} ${inv.client.lastName}`, inv.client.email ?? '',
    inv.subtotal, inv.taxAmount, inv.discountAmount, inv.total, inv.amountPaid, inv.amountDue,
    inv.issuedAt ? inv.issuedAt.toISOString().split('T')[0] : '',
    inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : '',
    inv.paidAt ? inv.paidAt.toISOString().split('T')[0] : '',
    inv.sentAt ? inv.sentAt.toISOString().split('T')[0] : '',
    inv.notes ?? '', inv.payments.map((p: any) => p.paymentMethod).join('; '),
    inv.createdAt.toISOString(),
  ]);
  return buildCsv(headers, rows);
}

async function generateTreatmentNotesCsv(businessId: string, filters: Record<string, string>): Promise<string> {
  const notes = await fetchTreatmentNotes(businessId, filters);
  const headers = [
    'ID', 'Status', 'Client Name', 'Therapist', 'Appointment Date', 'Service Type',
    'Subjective', 'Objective', 'Assessment', 'Plan',
    'Areas Worked', 'Techniques', 'Session Duration (min)',
    'Follow-up Date', 'AI Summary', 'Created At',
  ];
  const rows = (notes as any[]).map((n) => [
    n.id, n.status,
    `${n.client.firstName} ${n.client.lastName}`,
    userName(n.therapist?.user),
    n.appointment.startTime.toISOString().split('T')[0],
    n.appointment.serviceType ?? '',
    n.subjectiveFindings ?? '', n.objectiveFindings ?? '', n.assessment ?? '', n.plan ?? '',
    n.areasWorked.join('; '), n.techniques.join('; '),
    n.sessionDuration ?? '',
    n.followUpDate ? n.followUpDate.toISOString().split('T')[0] : '',
    n.aiSummary ?? '',
    n.createdAt.toISOString(),
  ]);
  return buildCsv(headers, rows);
}

// ── JSON generators ──────────────────────────────────────────────────────────

async function generateClientsJson(businessId: string): Promise<string> {
  const clients = await fetchClients(businessId);
  return JSON.stringify(
    (clients as any[]).map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phoneNumber: c.phoneNumber,
      dateOfBirth: c.dateOfBirth,
      address: c.address,
      city: c.city,
      state: c.state,
      postalCode: c.postalCode,
      emergencyContactName: c.emergencyContactName,
      emergencyContactPhone: c.emergencyContactPhone,
      occupation: c.occupation,
      goals: c.goals,
      insuranceProvider: c.insuranceProvider,
      insurancePolicyNumber: c.insurancePolicyNumber,
      preferredTherapist: userName(c.preferredTherapist?.user) || null,
      totalVisits: c.totalVisits,
      lastVisitDate: c.lastVisitDate,
      isActive: c.isActive,
      allergies: c.allergies,
      medications: c.medications,
      createdAt: c.createdAt,
      intakeForms: c.intakeForms.map((f: any) => ({ id: f.id, formData: f.formData, completedAt: f.completedAt })),
    })),
    null,
    2
  );
}

async function generateAppointmentsJson(businessId: string, filters: Record<string, string>): Promise<string> {
  const appointments = await fetchAppointments(businessId, filters);
  return JSON.stringify(
    (appointments as any[]).map((a) => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      duration: a.duration,
      status: a.status,
      serviceType: a.serviceType,
      price: a.price,
      isVirtual: a.isVirtual,
      isGroup: a.isGroup,
      notes: a.notes,
      client: { id: a.client.id, firstName: a.client.firstName, lastName: a.client.lastName, email: a.client.email },
      therapist: userName(a.therapist?.user) || null,
      createdAt: a.createdAt,
    })),
    null,
    2
  );
}

async function generateInvoicesJson(businessId: string, filters: Record<string, string>): Promise<string> {
  const invoices = await fetchInvoices(businessId, filters);
  return JSON.stringify(
    (invoices as any[]).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      client: { id: inv.client.id, firstName: inv.client.firstName, lastName: inv.client.lastName, email: inv.client.email },
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      discountAmount: inv.discountAmount,
      total: inv.total,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      issuedAt: inv.issuedAt,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      sentAt: inv.sentAt,
      notes: inv.notes,
      payments: inv.payments.map((p: any) => ({ id: p.id, amount: p.amount, paymentMethod: p.paymentMethod, paidAt: p.paidAt })),
      createdAt: inv.createdAt,
    })),
    null,
    2
  );
}

async function generateTreatmentNotesJson(businessId: string, filters: Record<string, string>): Promise<string> {
  const notes = await fetchTreatmentNotes(businessId, filters);
  return JSON.stringify(
    (notes as any[]).map((n) => ({
      id: n.id,
      status: n.status,
      client: { id: n.client.id, firstName: n.client.firstName, lastName: n.client.lastName },
      therapist: userName(n.therapist?.user) || null,
      appointment: { id: n.appointment.id, startTime: n.appointment.startTime, serviceType: n.appointment.serviceType },
      subjectiveFindings: n.subjectiveFindings,
      objectiveFindings: n.objectiveFindings,
      assessment: n.assessment,
      plan: n.plan,
      areasWorked: n.areasWorked,
      techniques: n.techniques,
      sessionDuration: n.sessionDuration,
      followUpDate: n.followUpDate,
      aiSummary: n.aiSummary,
      createdAt: n.createdAt,
    })),
    null,
    2
  );
}

// ── PDF generator (treatment notes) ─────────────────────────────────────────

async function generateTreatmentNotesPdf(businessId: string, filters: Record<string, string>): Promise<Buffer> {
  const notes = await fetchTreatmentNotes(businessId, filters);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const purple = '#5D4AA8';
    const gray = '#6B7280';
    const lightGray = '#F3F4F6';
    const dark = '#1E1830';

    // Cover header
    doc.rect(0, 0, doc.page.width, 80).fill(purple);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('Treatment Notes Export', 50, 25);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  ${notes.length} note${notes.length !== 1 ? 's' : ''}`, 50, 54);
    doc.fillColor(dark);
    doc.y = 100;

    (notes as any[]).forEach((n, i) => {
      if (i > 0) {
        doc.addPage();
        doc.y = 50;
      }

      const clientName = `${n.client.firstName} ${n.client.lastName}`;
      const therapist = userName(n.therapist?.user);
      const apptDate = n.appointment.startTime.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

      // Note header bar
      doc.rect(50, doc.y, doc.page.width - 100, 36).fill(lightGray);
      doc.fillColor(purple).fontSize(13).font('Helvetica-Bold')
        .text(clientName, 60, doc.y + 10, { continued: true });
      doc.fillColor(gray).fontSize(10).font('Helvetica')
        .text(`  ·  ${apptDate}`, { continued: true });
      if (n.appointment.serviceType) {
        doc.text(`  ·  ${n.appointment.serviceType}`);
      } else {
        doc.text('');
      }
      doc.y += 10;

      // Meta row
      doc.fillColor(gray).fontSize(9).font('Helvetica');
      const metaParts = [];
      if (therapist) metaParts.push(`Therapist: ${therapist}`);
      metaParts.push(`Status: ${n.status}`);
      if (n.sessionDuration) metaParts.push(`Duration: ${n.sessionDuration} min`);
      doc.text(metaParts.join('   |   '), 50, doc.y + 4);
      doc.y += 14;

      // Status badge
      const statusColor = n.status === 'APPROVED' ? '#16A34A' : n.status === 'DRAFT' ? '#D97706' : purple;
      doc.fillColor(statusColor).fontSize(8).font('Helvetica-Bold')
        .text(`● ${n.status}`, doc.page.width - 120, doc.y - 30, { align: 'right' });

      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke();
      doc.y += 8;

      const section = (label: string, content: string | null | undefined) => {
        if (!content) return;
        doc.fillColor(purple).fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), 50, doc.y);
        doc.y += 3;
        doc.fillColor(dark).fontSize(10).font('Helvetica').text(content, 50, doc.y, { width: doc.page.width - 100 });
        doc.y += 10;
      };

      section('Subjective Findings', n.subjectiveFindings);
      section('Objective Findings', n.objectiveFindings);
      section('Assessment', n.assessment);
      section('Plan', n.plan);

      if (n.areasWorked?.length) {
        doc.fillColor(purple).fontSize(9).font('Helvetica-Bold').text('AREAS WORKED', 50, doc.y);
        doc.y += 3;
        doc.fillColor(dark).fontSize(10).font('Helvetica').text(n.areasWorked.join(', '), 50, doc.y, { width: doc.page.width - 100 });
        doc.y += 10;
      }

      if (n.techniques?.length) {
        doc.fillColor(purple).fontSize(9).font('Helvetica-Bold').text('TECHNIQUES', 50, doc.y);
        doc.y += 3;
        doc.fillColor(dark).fontSize(10).font('Helvetica').text(n.techniques.join(', '), 50, doc.y, { width: doc.page.width - 100 });
        doc.y += 10;
      }

      if (n.followUpDate) {
        doc.fillColor(purple).fontSize(9).font('Helvetica-Bold').text('FOLLOW-UP DATE', 50, doc.y);
        doc.y += 3;
        doc.fillColor(dark).fontSize(10).font('Helvetica')
          .text(n.followUpDate.toLocaleDateString('en-AU'), 50, doc.y);
        doc.y += 10;
      }

      if (n.aiSummary) {
        doc.y += 4;
        doc.rect(50, doc.y, doc.page.width - 100, 16).fill('#EDE9FE');
        doc.fillColor(purple).fontSize(8).font('Helvetica-Bold').text('AI SUMMARY', 56, doc.y + 4);
        doc.y += 18;
        doc.fillColor('#4B3F8D').fontSize(9).font('Helvetica').text(n.aiSummary, 50, doc.y, { width: doc.page.width - 100 });
        doc.y += 8;
      }

      // Page footer
      doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
        .text(`Note ID: ${n.id}  ·  Created: ${n.createdAt.toISOString()}`, 50, doc.page.height - 40, { align: 'left' });
    });

    if (notes.length === 0) {
      doc.y = 150;
      doc.fillColor(gray).fontSize(14).text('No treatment notes found for the selected filters.', { align: 'center' });
    }

    doc.end();
  });
}

// ── Generic table PDF for non-note types ─────────────────────────────────────

function buildTablePdf(
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  subtitle?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const purple = '#5D4AA8';
    const pageW = doc.page.width;
    const colW = Math.min(120, Math.floor((pageW - 80) / headers.length));

    // Header bar
    doc.rect(0, 0, pageW, 60).fill(purple);
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text(title, 40, 16);
    if (subtitle) doc.fontSize(9).font('Helvetica').text(subtitle, 40, 38);
    doc.fillColor('#1E1830');
    doc.y = 75;

    const drawRow = (cells: (string | number | null | undefined)[], isHeader = false) => {
      const rowH = isHeader ? 20 : 16;
      if (doc.y + rowH > doc.page.height - 40) {
        doc.addPage();
        doc.y = 40;
      }
      if (isHeader) {
        doc.rect(40, doc.y, pageW - 80, rowH).fill('#EDE9FE');
      } else if (rows.indexOf(cells as any) % 2 === 1) {
        doc.rect(40, doc.y, pageW - 80, rowH).fill('#F9FAFB');
      }
      doc.fillColor(isHeader ? purple : '#111827')
        .fontSize(isHeader ? 7 : 7)
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      cells.forEach((cell, ci) => {
        const x = 40 + ci * colW;
        if (x + colW > pageW - 40) return;
        const val = cell == null ? '' : String(cell);
        doc.text(val.length > 20 ? val.slice(0, 18) + '…' : val, x + 2, doc.y + (isHeader ? 6 : 4), { width: colW - 4, lineBreak: false });
      });
      doc.y += rowH;
    };

    drawRow(headers, true);
    rows.forEach((row) => drawRow(row));

    // Footer
    doc.fillColor('#9CA3AF').fontSize(7)
      .text(`Exported ${new Date().toISOString()}  ·  ${rows.length} records`, 40, doc.page.height - 28);

    doc.end();
  });
}

async function generateClientsPdf(businessId: string): Promise<Buffer> {
  const clients = await fetchClients(businessId);
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'DOB', 'Active', 'Visits', 'Last Visit', 'Created'];
  const rows = (clients as any[]).map((c) => [
    c.firstName, c.lastName, c.email ?? '', c.phoneNumber ?? '',
    c.dateOfBirth ? c.dateOfBirth.toISOString().split('T')[0] : '',
    c.isActive ? 'Yes' : 'No',
    c.totalVisits,
    c.lastVisitDate ? c.lastVisitDate.toISOString().split('T')[0] : '',
    c.createdAt.toISOString().split('T')[0],
  ]);
  return buildTablePdf('Clients Export', headers, rows, `${clients.length} clients`);
}

async function generateAppointmentsPdf(businessId: string, filters: Record<string, string>): Promise<Buffer> {
  const appointments = await fetchAppointments(businessId, filters);
  const headers = ['Date', 'Time', 'Client', 'Therapist', 'Service', 'Duration', 'Status', 'Price'];
  const rows = (appointments as any[]).map((a) => [
    a.startTime.toISOString().split('T')[0],
    a.startTime.toTimeString().slice(0, 5),
    `${a.client.firstName} ${a.client.lastName}`,
    userName(a.therapist?.user),
    a.serviceType ?? '',
    a.duration,
    a.status,
    a.price ?? '',
  ]);
  return buildTablePdf('Appointments Export', headers, rows, `${appointments.length} appointments`);
}

async function generateInvoicesPdf(businessId: string, filters: Record<string, string>): Promise<Buffer> {
  const invoices = await fetchInvoices(businessId, filters);
  const headers = ['Invoice #', 'Client', 'Status', 'Total', 'Paid', 'Due', 'Issued', 'Due Date'];
  const rows = (invoices as any[]).map((inv) => [
    inv.invoiceNumber,
    `${inv.client.firstName} ${inv.client.lastName}`,
    inv.status,
    inv.total, inv.amountPaid, inv.amountDue,
    inv.issuedAt ? inv.issuedAt.toISOString().split('T')[0] : '',
    inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : '',
  ]);
  return buildTablePdf('Invoices & Payments Export', headers, rows, `${invoices.length} invoices`);
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const exportRecord = await prisma.exportHistory.findUnique({ where: { id } });
    if (!exportRecord) return res.notFound('Export not found');
    await requireBusinessAccess(user, exportRecord.businessId);

    if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
      return res.badRequest('Export has expired');
    }

    const filters = (exportRecord.filters as Record<string, string>) ?? {};
    const fmt = exportRecord.format;
    const businessId = exportRecord.businessId;
    const dateStamp = new Date().toISOString().split('T')[0];

    const trackDownload = () =>
      prisma.exportHistory.update({
        where: { id },
        data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() },
      });

    // ── Full practice ZIP ────────────────────────────────────────────────────
    if (exportRecord.exportType === 'FULL_PRACTICE') {
      if (fmt === 'JSON') {
        const zip = new JSZip();
        zip.file('clients.json', await generateClientsJson(businessId));
        zip.file('appointments.json', await generateAppointmentsJson(businessId, filters));
        zip.file('invoices_payments.json', await generateInvoicesJson(businessId, filters));
        zip.file('treatment_notes.json', await generateTreatmentNotesJson(businessId, filters));
        const buf = await zip.generateAsync({ type: 'nodebuffer' }) as Buffer;
        await trackDownload();
        return new NextResponse(buf as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="full_practice_export_${dateStamp}.zip"`,
          },
        });
      }

      // Default: CSV zip
      const zip = new JSZip();
      zip.file('clients.csv', await generateClientsCsv(businessId));
      zip.file('appointments.csv', await generateAppointmentsCsv(businessId, filters));
      zip.file('invoices_payments.csv', await generateInvoicesPaymentsCsv(businessId, filters));
      zip.file('treatment_notes.csv', await generateTreatmentNotesCsv(businessId, filters));
      const buf = await zip.generateAsync({ type: 'nodebuffer' }) as Buffer;
      await trackDownload();
      return new NextResponse(buf as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="full_practice_export_${dateStamp}.zip"`,
        },
      });
    }

    // ── JSON format ──────────────────────────────────────────────────────────
    if (fmt === 'JSON') {
      let json = '';
      switch (exportRecord.exportType) {
        case 'CLIENTS':       json = await generateClientsJson(businessId); break;
        case 'APPOINTMENTS':  json = await generateAppointmentsJson(businessId, filters); break;
        case 'INVOICES':
        case 'PAYMENTS':      json = await generateInvoicesJson(businessId, filters); break;
        case 'TREATMENT_NOTES': json = await generateTreatmentNotesJson(businessId, filters); break;
        default: return res.badRequest('Unsupported export type');
      }
      const fname = exportRecord.fileName ?? `export_${dateStamp}.json`;
      await trackDownload();
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fname}"`,
        },
      });
    }

    // ── PDF format ───────────────────────────────────────────────────────────
    if (fmt === 'PDF') {
      let pdfBuf: Buffer;
      switch (exportRecord.exportType) {
        case 'CLIENTS':       pdfBuf = await generateClientsPdf(businessId); break;
        case 'APPOINTMENTS':  pdfBuf = await generateAppointmentsPdf(businessId, filters); break;
        case 'INVOICES':
        case 'PAYMENTS':      pdfBuf = await generateInvoicesPdf(businessId, filters); break;
        case 'TREATMENT_NOTES': pdfBuf = await generateTreatmentNotesPdf(businessId, filters); break;
        default: return res.badRequest('Unsupported export type');
      }
      const fname = exportRecord.fileName ?? `export_${dateStamp}.pdf`;
      await trackDownload();
      return new NextResponse(pdfBuf as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fname}"`,
        },
      });
    }

    // ── CSV format (default) ──────────────────────────────────────────────────
    let csv = '';
    switch (exportRecord.exportType) {
      case 'CLIENTS':       csv = await generateClientsCsv(businessId); break;
      case 'APPOINTMENTS':  csv = await generateAppointmentsCsv(businessId, filters); break;
      case 'INVOICES':
      case 'PAYMENTS':      csv = await generateInvoicesPaymentsCsv(businessId, filters); break;
      case 'TREATMENT_NOTES': csv = await generateTreatmentNotesCsv(businessId, filters); break;
      default: return res.badRequest('Unsupported export type');
    }
    const fname = exportRecord.fileName ?? `export_${dateStamp}.csv`;
    await trackDownload();
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fname}"`,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized((err as AuthError).message);
    console.error('[API] export download:', err);
    return res.error();
  }
}
