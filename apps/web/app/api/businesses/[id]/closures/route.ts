import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireBusinessRole, res } from '@/lib/api-auth';

// GET — list all closures (upcoming by default)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id: businessId } = params;
    await requireBusinessRole(user, businessId, ['OWNER', 'SENIOR_THERAPIST', 'THERAPIST', 'RECEPTIONIST']);

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const includeRecurring = searchParams.get('includeRecurring') !== 'false';

    const closures = await prisma.businessClosure.findMany({
      where: {
        businessId,
        ...(fromDate || toDate ? {
          date: {
            ...(fromDate && { gte: new Date(fromDate) }),
            ...(toDate && { lte: new Date(toDate) }),
          },
        } : {}),
        ...(!includeRecurring && { isRecurringAnnual: false }),
      },
      orderBy: { date: 'asc' },
    });

    return res.ok(closures);
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[CLOSURES GET]', err);
    return res.error();
  }
}

// POST — add a new closure date
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id: businessId } = params;
    await requireBusinessRole(user, businessId, ['OWNER']);

    const body = await req.json();
    const { date, reason, notifyClients = false, isRecurringAnnual = false } = body;

    if (!date) return res.badRequest('date is required');

    const closure = await prisma.businessClosure.create({
      data: {
        businessId,
        date: new Date(date),
        reason: reason || null,
        notifyClients,
        isRecurringAnnual,
      },
    });

    return res.created(closure);
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[CLOSURES POST]', err);
    return res.error();
  }
}
