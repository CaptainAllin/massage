import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendReportEmail, ReportType } from '@/lib/email';
import { generateReportDataWithTiming as generateReportData } from '@/lib/report-generator';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { businessId, reportType, reportName, emailTo, startDate: startRaw, endDate: endRaw } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!reportType) return res.badRequest('reportType is required');
    if (!emailTo || !Array.isArray(emailTo) || emailTo.length === 0) {
      return res.badRequest('emailTo must be a non-empty array');
    }
    if (!startRaw || !endRaw) return res.badRequest('startDate and endDate are required');

    const startDate = new Date(startRaw);
    const endDate = new Date(endRaw);

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    const data = await generateReportData(reportType as ReportType, businessId, startDate, endDate);

    await sendReportEmail({
      to: emailTo,
      businessName: business?.name ?? 'Your Business',
      reportName: reportName ?? `${reportType} Report`,
      reportType: reportType as ReportType,
      data,
      dateRange: {
        start: startDate.toLocaleDateString('en-AU'),
        end: endDate.toLocaleDateString('en-AU'),
      },
    });

    return res.ok({ message: `Report exported and sent to ${emailTo.join(', ')}` });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API] export report:', err);
    return res.error();
  }
}
