// In-memory store keyed by userId → subscription[]
// Replace with DB persistence (e.g., a PushSubscription table) for production.
const subscriptionStore = new Map<string, any[]>();

export function getSubscriptionsForUser(userId: string) {
  return subscriptionStore.get(userId) || [];
}

export function addSubscriptionForUser(userId: string, subscription: any) {
  const subs = subscriptionStore.get(userId) || [];
  subs.push(subscription);
  subscriptionStore.set(userId, subs);
}

export function removeSubscriptionForUser(userId: string, endpoint: string) {
  const subs = (subscriptionStore.get(userId) || []).filter((s: any) => s.endpoint !== endpoint);
  subscriptionStore.set(userId, subs);
}
