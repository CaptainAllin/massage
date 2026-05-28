import { randomBytes, createHash } from 'crypto';
import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_SCOPES = [
  'appointments:read', 'appointments:write',
  'clients:read', 'clients:write',
  'invoices:read', 'invoices:write',
  'treatment-notes:read', 'treatment-notes:write',
];

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const owner = await prisma.business.findFirst({ where: { id: businessId, ownerId: user.id }, select: { id: true } });
  if (!owner) return res.forbidden();

  const keys = await prisma.apiKey.findMany({
    where: { businessId },
    select: { id: true, name: true, permissions: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok({ keys, scopes: ALLOWED_SCOPES });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, permissions = [], expiresInDays } = body;
  if (!businessId || !name) return res.badRequest('businessId and name are required');

  const owner = await prisma.business.findFirst({ where: { id: businessId, ownerId: user.id }, select: { id: true } });
  if (!owner) return res.forbidden();

  const invalidScopes = (permissions as string[]).filter(p => !ALLOWED_SCOPES.includes(p));
  if (invalidScopes.length) return res.badRequest(`Invalid scopes: ${invalidScopes.join(', ')}`);

  const rawKey = `mk_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

  const key = await prisma.apiKey.create({
    data: { businessId, name, keyHash, permissions, ...(expiresAt && { expiresAt }) },
    select: { id: true, name: true, permissions: true, expiresAt: true, createdAt: true },
  });

  // Return raw key only on creation — never stored
  return res.created({ ...key, key: rawKey });
});
