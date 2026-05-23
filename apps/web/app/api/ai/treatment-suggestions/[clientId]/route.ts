import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const MAX_INPUT_LENGTH = 2000;

/** Strip a string to a safe length and remove characters that could break prompt structure. */
function sanitize(value: string, maxLen = MAX_INPUT_LENGTH): string {
  return value.replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, maxLen).trim();
}

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    await requireAuth(req);
    if (!process.env.ANTHROPIC_API_KEY) return res.badRequest('AI features are not configured');

    const body = await req.json();
    const { currentComplaints } = body;

    // Fetch only clinical data — no PII (name, email, phone, address) sent to AI
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: {
        medicalConditions: { select: { name: true } },
        treatmentNotes: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            subjectiveFindings: true,
            objectiveFindings: true,
            assessment: true,
            areasWorked: true,
            techniques: true,
          },
        },
      },
    });
    if (!client) return res.notFound('Client not found');

    // Build anonymised clinical context — never include client name, contact, or physician details
    const contextParts: string[] = [];
    if (currentComplaints) {
      contextParts.push(`Current complaints: ${sanitize(currentComplaints)}`);
    }
    if (client.medicalConditions.length > 0) {
      contextParts.push(`Medical conditions: ${client.medicalConditions.map((c) => c.name).join(', ')}`);
    }
    if (client.treatmentNotes.length > 0) {
      const recent = client.treatmentNotes[0];
      const parts = [
        recent.subjectiveFindings && `S: ${recent.subjectiveFindings}`,
        recent.objectiveFindings && `O: ${recent.objectiveFindings}`,
        recent.assessment && `A: ${recent.assessment}`,
        recent.areasWorked?.length && `Areas: ${recent.areasWorked.join(', ')}`,
        recent.techniques?.length && `Techniques: ${recent.techniques.join(', ')}`,
      ].filter(Boolean);
      if (parts.length > 0) {
        contextParts.push(`Most recent session:\n${parts.join('\n')}`);
      }
    }

    const context = contextParts.join('\n\n');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `You are an AI assistant helping massage therapists plan treatment sessions. You receive only anonymised clinical data — no patient identifiers. Provide evidence-based suggestions. Respond with a JSON object with keys: focusAreas (array of {area, reason, priority}), techniques (array of {technique, description, duration}), contraindications (array of {warning, severity}), expectedOutcomes (array of strings), sessionNotes (string).`,
      messages: [{ role: 'user', content: `Generate treatment suggestions for a massage therapy session.\n\nClinical context:\n${context || 'No specific complaints noted.'}\n\nRespond with only a JSON object.` }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    let suggestions = { focusAreas: [], techniques: [], contraindications: [], expectedOutcomes: [], sessionNotes: '' };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) suggestions = { ...suggestions, ...JSON.parse(jsonMatch[0]) };
    } catch {
      // keep defaults if AI response is malformed
    }

    return res.ok({ suggestions, metadata: { timestamp: new Date().toISOString(), cost: 0, model: message.model } });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[AI]', err);
    return res.error('AI request failed');
  }
}
