import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { encryptIfPresent, decryptIfPresent } from '@/lib/encryption';
import { NextRequest } from 'next/server';

/** Fields that contain API credentials and must be encrypted at rest. */
const CREDENTIAL_FIELDS = ['twilioAuthToken', 'sendGridApiKey', 'whatsappAccessToken'] as const;

function encryptCredentials(body: Record<string, any>): Record<string, any> {
  const result = { ...body };
  for (const field of CREDENTIAL_FIELDS) {
    if (field in result) {
      result[field] = encryptIfPresent(result[field]);
    }
  }
  return result;
}

function decryptCredentials(settings: Record<string, any>): Record<string, any> {
  const result = { ...settings };
  for (const field of CREDENTIAL_FIELDS) {
    if (result[field]) {
      result[field] = decryptIfPresent(result[field]);
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const settings = await prisma.communicationSettings.upsert({
      where: { businessId },
      create: { businessId },
      update: {},
    });

    return res.ok(decryptCredentials(settings as any));
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.notFound('Business not found');
    if (user.role !== 'SUPER_ADMIN' && business.ownerId !== user.id) {
      return res.forbidden('Only the business owner can update communication settings');
    }

    const body = await req.json();
    const encrypted = encryptCredentials(body);

    const settings = await prisma.communicationSettings.upsert({
      where: { businessId },
      create: { businessId, ...encrypted },
      update: encrypted,
    });

    return res.ok(decryptCredentials(settings as any));
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
