import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const reports = await prisma.savedReport.findMany({
      where: { businessId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ success: true, data: reports });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { businessId, name, type, filters, schedule, emailTo } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!name) return res.badRequest('name is required');
    if (!type) return res.badRequest('type is required');
    if (!filters) return res.badRequest('filters is required');

    const report = await prisma.savedReport.create({
      data: {
        businessId,
        name,
        type,
        filters,
        schedule,
        emailTo: emailTo || [],
      },
    });

    return res.created(report);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
