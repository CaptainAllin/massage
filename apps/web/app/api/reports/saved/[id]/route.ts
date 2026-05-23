import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const report = await prisma.savedReport.findFirst({
      where: { id, businessId },
    });

    if (!report) return res.notFound('Saved report not found');

    return res.ok(report);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.savedReport.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Saved report not found');

    const report = await prisma.savedReport.update({
      where: { id },
      data: {
        ...data,
        filters: data.filters ? data.filters : undefined,
      },
    });

    return res.ok(report);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.savedReport.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Saved report not found');

    // Soft delete: set isActive = false
    const report = await prisma.savedReport.update({
      where: { id },
      data: { isActive: false },
    });

    return res.ok(report);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
