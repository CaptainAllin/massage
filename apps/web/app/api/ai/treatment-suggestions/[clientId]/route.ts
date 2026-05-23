import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    await requireAuth(req);
    if (!process.env.ANTHROPIC_API_KEY) return res.badRequest('AI features are not configured');

    const body = await req.json();
    const { currentComplaints } = body;

    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      include: {
        medicalConditions: true,
        intakeForms: { orderBy: { createdAt: 'desc' }, take: 1 },
        treatmentNotes: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    if (!client) return res.notFound('Client not found');

    const context = [
      currentComplaints && `Current complaints: ${currentComplaints}`,
      client.medicalConditions.length > 0 && `Medical conditions: ${client.medicalConditions.map((c: any) => c.name).join(', ')}`,
      (client as any).notes && `Notes: ${(client as any).notes}`,
    ].filter(Boolean).join('\n');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `You are an AI assistant helping massage therapists plan treatment sessions. Provide evidence-based suggestions. Respond with a JSON object with keys: focusAreas (array of {area, reason, priority}), techniques (array of {technique, description, duration}), contraindications (array of {warning, severity}), expectedOutcomes (array of strings), sessionNotes (string).`,
      messages: [{ role: 'user', content: `Generate treatment suggestions for a massage therapy session.\n\nClient context:\n${context || 'No specific complaints noted.'}\n\nRespond with only a JSON object.` }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    let suggestions = { focusAreas: [], techniques: [], contraindications: [], expectedOutcomes: [], sessionNotes: '' };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) suggestions = { ...suggestions, ...JSON.parse(jsonMatch[0]) };
    } catch {}

    return res.ok({ suggestions, rawResponse: responseText, metadata: { clientId: params.clientId, timestamp: new Date().toISOString(), cost: 0, model: message.model } });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[AI]', err);
    return res.error('AI request failed');
  }
}
