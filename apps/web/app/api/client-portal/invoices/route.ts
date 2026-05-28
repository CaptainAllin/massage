import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

async function resolveClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(authHeader.substring(7));
  if (error || !data.user) return null;
  return prisma.client.findFirst({ where: { email: data.user.email } });
}

export async function GET(req: NextRequest) {
  const client = await resolveClient(req);
  if (!client) return res.unauthorized();

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.ok(invoices);
}
