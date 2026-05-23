import { withAuth, res } from '@/lib/api-auth';

export const POST = withAuth(async (req) => {
  if (!process.env.ANTHROPIC_API_KEY) return res.badRequest('AI features are not configured');

  const body = await req.json();
  const { text, section } = body;
  if (!text || !section) return res.badRequest('text and section are required');

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are an AI assistant helping massage therapists improve SOAP notes. Enhance clarity, professionalism, and clinical accuracy. Maintain original meaning. Use proper medical terminology.`,
      messages: [
        {
          role: 'user',
          content: `Improve this ${section} section of a SOAP note:\n\n"${text}"\n\nProvide only the improved text, no explanation.`,
        },
      ],
    });

    const improved = message.content[0].type === 'text' ? message.content[0].text : text;

    return res.ok({
      text: improved.trim(),
      provider: 'claude',
      model: message.model,
      usage: { tokens: message.usage.input_tokens + message.usage.output_tokens, cost: 0 },
    });
  } catch (err: any) {
    return res.error('AI request failed');
  }
});
