import { withAuth, res } from '@/lib/api-auth';

export const POST = withAuth(async (req) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.badRequest('AI features are not configured');

  const body = await req.json();
  const { rawText } = body;
  if (!rawText) return res.badRequest('rawText is required');

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You are an AI assistant helping massage therapists format clinical notes into SOAP format. Convert raw text into proper SOAP sections. Respond with a JSON object with keys: subjective, objective, assessment, plan.`,
      messages: [
        {
          role: 'user',
          content: `Convert this massage therapy session note into SOAP format. Respond with only a JSON object:\n\n"${rawText}"`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

    let sections = { subjective: '', objective: '', assessment: '', plan: '' };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) sections = { ...sections, ...JSON.parse(jsonMatch[0]) };
    } catch {
      sections.subjective = rawText;
    }

    return res.ok({
      ...sections,
      provider: 'claude',
      model: message.model,
      usage: { tokens: message.usage.input_tokens + message.usage.output_tokens, cost: 0 },
    });
  } catch (err: any) {
    return res.error('AI request failed');
  }
});
