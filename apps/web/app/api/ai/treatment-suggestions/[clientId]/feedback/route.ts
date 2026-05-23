import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    console.log('[AI feedback]', { clientId: params.clientId, ...body, userId: user.id });
    return res.ok({ success: true, message: 'Feedback recorded' });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
