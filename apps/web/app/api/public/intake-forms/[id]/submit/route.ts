import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { res } from '@/lib/api-auth';

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
        submittedAt: new Date(),
      },
    });

    return res.ok(updated);
  } catch (err) {
    console.error('[PUBLIC API]', err);
    return res.error();
  }
}
