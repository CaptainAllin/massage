/**
 * POST /api/push/send — send a push notification to a user or all business staff
 * Body: { userId?, payload: PushPayload }
 * Requires BUSINESS_OWNER or SUPER_ADMIN role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { broadcastToSubscriptions, type PushPayload } from '@/lib/push-notifications';
import { getSubscriptionsForUser } from '../subscribe/route';

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'BUSINESS_OWNER' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, payload } = body as { userId?: string; payload: PushPayload };

  if (!payload?.title || !payload?.body) {
    return NextResponse.json({ error: 'payload.title and payload.body are required' }, { status: 400 });
  }

  const subscriptions = getSubscriptionsForUser(userId || user.id);

  if (subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No active subscriptions' });
  }

  const { expired } = await broadcastToSubscriptions(subscriptions, payload);

  return NextResponse.json({
    success: true,
    sent: subscriptions.length - expired.length,
    expired: expired.length,
  });
}
