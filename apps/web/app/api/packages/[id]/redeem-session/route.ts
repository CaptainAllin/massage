import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { emitAutomation } from '@/lib/automation';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, appointmentId } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!appointmentId) return res.badRequest('appointmentId is required');

    const packagePurchase = await prisma.packagePurchase.findFirst({
      where: { id, businessId },
      include: {
        client: true,
        packageSessions: { orderBy: { redeemedAt: 'desc' }, include: { appointment: true } },
      },
    });

    if (!packagePurchase) return res.notFound('Package not found');
    if (packagePurchase.status !== 'ACTIVE') {
      return res.badRequest('Package is not active');
    }
    if (packagePurchase.sessionsUsed >= packagePurchase.totalSessions) {
      return res.badRequest('No sessions remaining in package');
    }
    if (packagePurchase.expirationDate && new Date() > packagePurchase.expirationDate) {
      return res.badRequest('Package has expired');
    }

    const existingSession = await prisma.packageSession.findFirst({
      where: { appointmentId },
    });
    if (existingSession) {
      return res.badRequest('Appointment already has a session redeemed');
    }

    await prisma.packageSession.create({
      data: { packagePurchaseId: id, appointmentId, businessId },
    });

    const sessionsUsed = packagePurchase.sessionsUsed + 1;
    const status = sessionsUsed >= packagePurchase.totalSessions ? 'FULLY_USED' : packagePurchase.status;

    const updatedPackage = await prisma.packagePurchase.update({
      where: { id },
      data: { sessionsUsed, status },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'PACKAGE_SESSION_REDEEMED',
        entityType: 'PackagePurchase',
        entityId: id,
        metadata: {
          appointmentId,
          sessionsRemaining: packagePurchase.totalSessions - sessionsUsed,
        },
      },
    });

    const sessionsRemaining = packagePurchase.totalSessions - sessionsUsed;
    if (sessionsRemaining <= 2 && sessionsRemaining > 0) {
      emitAutomation('PACKAGE_LOW_CREDITS', businessId, {
        packageId: id, clientId: packagePurchase.clientId, businessId,
        sessionsRemaining, packageName: packagePurchase.name, appointmentId,
      });
    }

    return res.ok(updatedPackage);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
