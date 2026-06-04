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
  return prisma.client.findFirst({
    where: { email: data.user.email },
    select: { id: true, businessId: true, preferredTherapistId: true, goals: true, birthdayMonth: true, birthdayDay: true },
  });
}

export async function GET(req: NextRequest) {
  const client = await resolveClient(req);
  if (!client) return res.unauthorized();

  const therapists = await prisma.therapist.findMany({
    where: { businessId: client.businessId, isActive: true },
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return res.ok({ preferredTherapistId: client.preferredTherapistId, goals: client.goals, birthdayMonth: client.birthdayMonth, birthdayDay: client.birthdayDay, therapists });
}

export async function PATCH(req: NextRequest) {
  const client = await resolveClient(req);
  if (!client) return res.unauthorized();

  const body = await req.json();
  const { preferredTherapistId, goals, birthdayMonth, birthdayDay } = body;

  const updateData: Record<string, any> = {};
  if (preferredTherapistId !== undefined) updateData.preferredTherapistId = preferredTherapistId || null;
  if (goals !== undefined) updateData.goals = goals || null;
  if (birthdayMonth !== undefined) {
    const m = birthdayMonth === null ? null : parseInt(birthdayMonth, 10);
    if (m !== null && (m < 1 || m > 12)) return res.badRequest('birthdayMonth must be 1–12');
    updateData.birthdayMonth = m;
  }
  if (birthdayDay !== undefined) {
    const d = birthdayDay === null ? null : parseInt(birthdayDay, 10);
    if (d !== null && (d < 1 || d > 31)) return res.badRequest('birthdayDay must be 1–31');
    updateData.birthdayDay = d;
  }

  if (Object.keys(updateData).length === 0) return res.badRequest('No fields to update');

  await prisma.client.update({ where: { id: client.id }, data: updateData });
  return res.ok({ message: 'Preferences saved' });
}
