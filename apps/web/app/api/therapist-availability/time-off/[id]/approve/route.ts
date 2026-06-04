import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireBusinessRole, res } from '@/lib/api-auth';
import { sendLeaveDecisionEmail } from '@/lib/email';

// PATCH — approve or decline a leave request
// Body: { action: "approve" | "decline" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id: timeOffId } = params;

    const timeOff = await prisma.therapistTimeOff.findUnique({
      where: { id: timeOffId },
      include: {
        therapist: { include: { user: { select: { email: true, firstName: true, lastName: true, notificationPrefs: true } } } },
        business: { select: { name: true } },
      },
    });
    if (!timeOff) return res.notFound('Leave request not found');

    await requireBusinessRole(user, timeOff.businessId, ['OWNER', 'SENIOR_THERAPIST']);

    const body = await req.json();
    const { action } = body;

    if (action !== 'approve' && action !== 'decline') {
      return res.badRequest('action must be "approve" or "decline"');
    }

    const updated = await prisma.therapistTimeOff.update({
      where: { id: timeOffId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'DECLINED',
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    // 7.1.2 — notify staff of the leave decision (respect user notification prefs)
    const { email: staffEmail, firstName, lastName, notificationPrefs } = timeOff.therapist.user;
    if (staffEmail) {
      const prefs = notificationPrefs as Record<string, boolean> | null;
      const wantsEmail = prefs?.leaveDecision !== false;
      if (wantsEmail) {
        const staffName = [firstName, lastName].filter(Boolean).join(' ') || staffEmail;
        sendLeaveDecisionEmail({
          to: staffEmail,
          staffName,
          businessName: timeOff.business.name,
          action,
          leaveType: (timeOff as any).leaveType ?? 'PERSONAL',
          startDate: timeOff.startDate,
          endDate: timeOff.endDate,
        }).catch(() => {});
      }
    }

    return res.ok(updated);
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[TIME OFF APPROVE]', err);
    return res.error();
  }
}
