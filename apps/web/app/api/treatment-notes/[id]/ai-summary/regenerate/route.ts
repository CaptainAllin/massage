import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');
    if (!process.env.ANTHROPIC_API_KEY) return res.badRequest('AI features are not configured');

    const note = await prisma.treatmentNote.findFirst({ where: { id, businessId } });
    if (!note) return res.notFound('Treatment note not found');

    const noteText = [
      note.subjectiveFindings && `Subjective: ${note.subjectiveFindings}`,
      note.objectiveFindings && `Objective: ${note.objectiveFindings}`,
      note.assessment && `Assessment: ${note.assessment}`,
      note.plan && `Plan: ${note.plan}`,
      note.areasWorked?.length && `Areas worked: ${note.areasWorked.join(', ')}`,
      note.techniques?.length && `Techniques: ${note.techniques.join(', ')}`,
      note.sessionDuration && `Session duration: ${note.sessionDuration} minutes`,
    ]
      .filter(Boolean)
      .join('\n');

    if (!noteText.trim()) return res.badRequest('Treatment note has no content to summarize');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const start = Date.now();
    const message = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are an AI assistant helping massage therapists create concise clinical summaries of SOAP notes. Write a 2-4 sentence summary that captures the key findings, treatment performed, and outcomes/next steps. Use clear, professional language suitable for a client record. This is a regeneration — produce a fresh perspective on the same note.`,
      messages: [
        {
          role: 'user',
          content: `Summarize this SOAP note:\n\n${noteText}`,
        },
      ],
    });

    const summary = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const duration = Date.now() - start;

    const updated = await prisma.treatmentNote.update({
      where: { id },
      data: { aiSummary: summary },
    });

    return res.ok({
      success: true,
      summary: updated.aiSummary,
      metadata: {
        provider: 'claude',
        model: message.model,
        tokens: message.usage.input_tokens + message.usage.output_tokens,
        cost: 0,
        duration,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[AI summary regenerate]', err);
    return res.error('Failed to regenerate AI summary');
  }
}
