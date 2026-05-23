/**
 * POST /api/push/subscribe  — register a browser push subscription
 * DELETE /api/push/subscribe — unregister
 *
 * Subscriptions are stored in-memory per process for development.
 * In production, persist to a DB table or Redis.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// In-memory store keyed by userId → subscription[]
// Replace with DB persistence (e.g., a PushSubscription table) for production.
const subscriptionStore = new Map<string, any[]>();

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

  const existing = subscriptionStore.get(user.id) || [];
  const alreadyStored = existing.some((s) => s.endpoint === subscription.endpoint);
  if (!alreadyStored) {
    subscriptionStore.set(user.id, [...existing, subscription]);
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

  const existing = subscriptionStore.get(user.id) || [];
  subscriptionStore.set(
    user.id,
    existing.filter((s) => s.endpoint !== endpoint)
  );

  return NextResponse.json({ success: true });
}

/** Used by other server-side code to retrieve subscriptions for a user */
export function getSubscriptionsForUser(userId: string) {
  return subscriptionStore.get(userId) || [];
}
