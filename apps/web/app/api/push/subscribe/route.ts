/**
 * POST /api/push/subscribe  — register a browser push subscription
 * DELETE /api/push/subscribe — unregister
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { addSubscriptionForUser, removeSubscriptionForUser, getSubscriptionsForUser } from '@/lib/push-subscriptions';

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { subscription } = body;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
  }

  const existing = getSubscriptionsForUser(user.id);
  const alreadyStored = existing.some((s) => s.endpoint === subscription.endpoint);
  if (!alreadyStored) {
    addSubscriptionForUser(user.id, subscription);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint } = body;

  removeSubscriptionForUser(user.id, endpoint);

  return NextResponse.json({ success: true });
}
