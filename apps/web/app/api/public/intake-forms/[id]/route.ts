import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { res } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const intakeForm = await prisma.intakeForm.findUnique({
      where: { id },
      include: {
        template: true,
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!intakeForm) return res.notFound('Form not found');

    return res.ok(intakeForm);
  } catch (err) {
    console.error('[PUBLIC API]', err);
    return res.error();
  }
}

export async function PATCH(
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

    const intakeForm = await prisma.intakeForm.update({
      where: { id },
      data: { formData, submittedAt: new Date() },
      include: { template: true, client: { select: { id: true, firstName: true, lastName: true } } },
    });

    return res.ok(intakeForm);
  } catch (err) {
    console.error('[PUBLIC API]', err);
    return res.error();
  }
}
