import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { res } from '@/lib/api-auth';
import { emitAutomation } from '@/lib/automation';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { formData } = body;

    if (!formData) return res.badRequest('formData is required');

    const existing = await prisma.intakeForm.findUnique({ where: { id } });
    if (!existing) return res.notFound('Form not found');

    const currentData = existing.formData as Record<string, any>;
    if (currentData?._completed) {
      return Response.json({ error: 'This form has already been submitted' }, { status: 409 });
    }

    const updated = await prisma.intakeForm.update({
      where: { id },
      data: {
        formData: { ...formData, _completed: true },
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });

    emitAutomation('INTAKE_FORM_SUBMITTED', existing.businessId, {
      intakeFormId: id,
      clientId: existing.clientId ?? undefined,
      businessId: existing.businessId,
    });

    // Award 25 loyalty points for completing intake form (non-blocking)
    if (existing.clientId) {
      (async () => {
        try {
          const account = await prisma.loyaltyAccount.findUnique({
            where: { businessId_clientId: { businessId: existing.businessId, clientId: existing.clientId! } },
          });
          if (account) {
            await prisma.$transaction([
              prisma.loyaltyAccount.update({
                where: { id: account.id },
                data: { points: { increment: 25 }, lifetimePoints: { increment: 25 } },
              }),
              prisma.loyaltyTransaction.create({
                data: { loyaltyAccountId: account.id, businessId: existing.businessId, type: 'EARN', points: 25, description: 'Intake form completed', referenceId: id, referenceType: 'intake_form' },
              }),
            ]);
          }
        } catch {}
      })();
    }

    return res.ok(updated);
  } catch (err) {
    console.error('[PUBLIC API]', err);
    return res.error();
  }
}
