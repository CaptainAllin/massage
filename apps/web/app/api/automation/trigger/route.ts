import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { emitAutomation } from '@/lib/automation';

// POST /api/automation/trigger — manual trigger for testing or external integrations
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, trigger, data } = body;
  if (!businessId || !trigger) return res.badRequest('businessId and trigger are required');
  await requireBusinessAccess(user, businessId);

  // emitAutomation is fire-and-forget, so we call it and return immediately
  emitAutomation(trigger, businessId, { ...data, businessId });

  return res.ok({ triggered: true, trigger, businessId });
});
