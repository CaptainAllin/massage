import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendReportEmail, ReportType } from '@/lib/email';
import { generateReportDataWithTiming as generateReportData } from '@/lib/report-generator';
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const savedReport = await prisma.savedReport.findFirst({
      where: { id, businessId, isActive: true },
    });

    if (!savedReport) return res.notFound('Saved report not found');

    const emailTo = savedReport.emailTo as string[];
    if (!emailTo || emailTo.length === 0) {
      return res.badRequest('No email recipients configured for this report');
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    const filters = savedReport.filters as Record<string, any>;
    const startDate = new Date(filters.startDate ?? Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(filters.endDate ?? Date.now());
    const therapistId: string | undefined = filters.therapistId ?? undefined;
    const serviceType: string | undefined = filters.serviceType ?? undefined;

    const reportType = savedReport.type as ReportType;
    const data = await generateReportData(reportType, businessId, startDate, endDate, therapistId, serviceType);

    await sendReportEmail({
      to: emailTo,
      businessName: business?.name ?? 'Your Business',
      reportName: savedReport.name,
      reportType,
      data,
      dateRange: {
        start: startDate.toLocaleDateString('en-AU'),
        end: endDate.toLocaleDateString('en-AU'),
      },
    });

    return res.ok({ message: `Report sent to ${emailTo.join(', ')}` });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API] trigger report:', err);
    return res.error();
  }
}
