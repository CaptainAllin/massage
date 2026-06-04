import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

async function awardWelcomePoints(clientId: string, businessId: string) {
  const existing = await prisma.loyaltyAccount.findUnique({ where: { businessId_clientId: { businessId, clientId } } });
  if (existing) return;

  const appointmentCount = await prisma.appointment.count({ where: { clientId, businessId } });
  const bonusPoints = 100 + (appointmentCount > 0 ? 50 : 0);

  const account = await prisma.loyaltyAccount.create({
    data: { businessId, clientId, points: bonusPoints, lifetimePoints: bonusPoints, tier: 'BRONZE' },
  });

  const transactions = [
    { loyaltyAccountId: account.id, businessId, type: 'EARN', points: 100, description: 'Welcome bonus — account created' },
  ];
  if (appointmentCount > 0) {
    transactions.push({ loyaltyAccountId: account.id, businessId, type: 'EARN', points: 50, description: 'First booking bonus' });
  }
  await prisma.loyaltyTransaction.createMany({ data: transactions });
}

// GET /api/client-portal/auth — validate client session and return client record
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return res.unauthorized();

    const token = authHeader.substring(7);
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.unauthorized('Invalid session');

    const userMeta = data.user.user_metadata ?? {};

    let client = await prisma.client.findFirst({
      where: { email: data.user.email },
      select: { id: true, businessId: true, firstName: true, lastName: true, email: true, userId: true },
    });

    if (!client) return res.notFound('No client record found for this email');

    // Auto-link userId if not already linked (first login after account creation)
    if (!client.userId) {
      const updateData: Record<string, any> = { userId: data.user.id };
      if (userMeta.first_name && !client.firstName) updateData.firstName = userMeta.first_name;
      if (userMeta.last_name && !client.lastName) updateData.lastName = userMeta.last_name;
      await prisma.client.updateMany({ where: { email: data.user.email, userId: null }, data: updateData });
      // Award welcome points (non-blocking)
      awardWelcomePoints(client.id, client.businessId).catch(() => {});
      // Auto-create intake form if business has a default template and client has none (non-blocking)
      prisma.intakeFormTemplate.findFirst({
        where: { businessId: client.businessId, isActive: true },
        select: { id: true, fields: true },
        orderBy: { createdAt: 'asc' },
      }).then(async (template) => {
        if (!template) return;
        const hasForm = await prisma.intakeForm.findFirst({ where: { clientId: client!.id, businessId: client!.businessId } });
        if (hasForm) return;
        await prisma.intakeForm.create({
          data: { businessId: client!.businessId, clientId: client!.id, templateId: template.id, formData: {}, isSubmitted: false },
        });
      }).catch(() => {});
    }

    const business = await (prisma.business.findUnique as any)({
      where: { id: client.businessId },
      select: { id: true, name: true, logo: true, primaryColor: true, clientPortalEnabled: true, clientPortalSettings: true },
    });

    if (!business?.clientPortalEnabled) {
      return res.forbidden('Client portal is not enabled for this practice');
    }

    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { businessId_clientId: { businessId: client.businessId, clientId: client.id } },
      select: { points: true, lifetimePoints: true, tier: true },
    });

    return res.ok({
      clientId: client.id,
      businessId: client.businessId,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      business,
      loyalty: loyaltyAccount ?? null,
    });
  } catch {
    return res.error();
  }
}
