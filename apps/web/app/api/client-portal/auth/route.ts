import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

// GET /api/client-portal/auth — validate client session and return client record
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return res.unauthorized();

    const token = authHeader.substring(7);
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.unauthorized('Invalid session');

    const client = await prisma.client.findFirst({
      where: { email: data.user.email },
      select: { id: true, businessId: true, firstName: true, lastName: true, email: true },
    });

    if (!client) return res.notFound('No client record found for this email');

    const business = await (prisma.business.findUnique as any)({
      where: { id: client.businessId },
      select: { id: true, name: true, logo: true, primaryColor: true, clientPortalEnabled: true, clientPortalSettings: true },
    });

    if (!business?.clientPortalEnabled) {
      return res.forbidden('Client portal is not enabled for this practice');
    }

    return res.ok({
      clientId: client.id,
      businessId: client.businessId,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      business,
    });
  } catch {
    return res.error();
  }
}
