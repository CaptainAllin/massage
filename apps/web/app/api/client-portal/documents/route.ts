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

  // Return treatment notes with status APPROVED that are shared with client
  const notes = await prisma.treatmentNote.findMany({
    where: {
      clientId: client.id,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      noteTemplateName: true,
      createdAt: true,
      updatedAt: true,
      therapist: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  const mapped = notes.map((n) => ({ ...n, title: n.noteTemplateName ?? 'Treatment Note' }));

  return res.ok(mapped);
}
