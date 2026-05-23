import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Unique run ID ensures test data doesn't collide across concurrent runs
const RUN_ID = crypto.randomUUID().slice(0, 8);

export function uniqueEmail(label: string) {
  return `test-${RUN_ID}-${label}@example.com`;
}

export function uniqueAuthId(label: string) {
  return `test-auth-${RUN_ID}-${label}`;
}

export function makeRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  url: string,
  options: { token?: string; body?: unknown; params?: Record<string, string> } = {}
): NextRequest {
  const fullUrl = new URL(`http://localhost:3000${url}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => fullUrl.searchParams.set(k, v));
  }

  const headers = new Headers();
  if (options.token) headers.set('authorization', `Bearer ${options.token}`);
  if (options.body) headers.set('content-type', 'application/json');

  return new NextRequest(fullUrl.toString(), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function parseJson(res: Response) {
  return res.json();
}

// Create a real Prisma user and return the auth token string for mocking
export async function createTestUser(
  label: string,
  role: 'BUSINESS_OWNER' | 'THERAPIST' | 'RECEPTIONIST' | 'CLIENT',
  mockGetUser: jest.Mock
) {
  const authUserId = uniqueAuthId(label);
  const email = uniqueEmail(label);
  const token = `mock-token-${RUN_ID}-${label}`;

  await prisma.user.create({
    data: {
      authUserId,
      email,
      firstName: 'Test',
      lastName: label,
      role: role as any,
    },
  });

  mockGetUser.mockImplementation(async (tok: string) => {
    if (tok === token) {
      return { data: { user: { id: authUserId, email, user_metadata: { role } } }, error: null };
    }
    // Return invalid for any other token
    return { data: { user: null }, error: { message: 'Invalid token' } };
  });

  return { authUserId, email, token };
}

// Cleanup helpers — pass collected IDs to delete in the right order
export async function cleanupTestData(ids: {
  appointmentIds?: string[];
  paymentIds?: string[];
  therapistAvailabilityIds?: string[];
  therapistIds?: string[];
  clientIds?: string[];
  businessIds?: string[];
  userAuthIds?: string[];
}) {
  if (ids.appointmentIds?.length) {
    await prisma.appointment.deleteMany({ where: { id: { in: ids.appointmentIds } } });
  }
  if (ids.paymentIds?.length) {
    await prisma.payment.deleteMany({ where: { id: { in: ids.paymentIds } } });
  }
  if (ids.therapistAvailabilityIds?.length) {
    await prisma.therapistAvailability.deleteMany({ where: { id: { in: ids.therapistAvailabilityIds } } });
  }
  if (ids.therapistIds?.length) {
    await prisma.therapist.deleteMany({ where: { id: { in: ids.therapistIds } } });
  }
  if (ids.clientIds?.length) {
    await prisma.client.deleteMany({ where: { id: { in: ids.clientIds } } });
  }
  if (ids.businessIds?.length) {
    await prisma.business.deleteMany({ where: { id: { in: ids.businessIds } } });
  }
  if (ids.userAuthIds?.length) {
    await prisma.user.deleteMany({ where: { authUserId: { in: ids.userAuthIds } } });
  }
}
