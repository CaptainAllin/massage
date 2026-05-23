/**
 * Integration tests for authentication and RBAC.
 * Supabase JWT validation is mocked; all Prisma operations hit the real DB.
 */

// mockGetUser must start with "mock" for Jest hoisting to allow it in the factory
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

import { GET } from '@/app/api/appointments/route';
import { GET as getPayments } from '@/app/api/payments/route';
import { prisma } from '@/lib/prisma';
import { makeRequest, uniqueAuthId, uniqueEmail, cleanupTestData } from '../helpers/test-setup';

const RUN = `auth-${Date.now()}`;

const ids = {
  userAuthIds: [] as string[],
  businessIds: [] as string[],
  clientIds: [] as string[],
};

let ownerToken: string;
let ownerAuthId: string;
let outsiderToken: string;
let outsiderAuthId: string;
let businessId: string;

beforeAll(async () => {
  // Create owner user
  ownerAuthId = uniqueAuthId(`${RUN}-owner`);
  const ownerEmail = uniqueEmail(`${RUN}-owner`);
  ownerToken = `token-${RUN}-owner`;

  await prisma.user.create({
    data: { authUserId: ownerAuthId, email: ownerEmail, firstName: 'Owner', lastName: 'Test', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(ownerAuthId);

  // Create outsider user (different business)
  outsiderAuthId = uniqueAuthId(`${RUN}-outsider`);
  const outsiderEmail = uniqueEmail(`${RUN}-outsider`);
  outsiderToken = `token-${RUN}-outsider`;

  await prisma.user.create({
    data: { authUserId: outsiderAuthId, email: outsiderEmail, firstName: 'Outsider', lastName: 'Test', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(outsiderAuthId);

  // Get owner's prisma ID to use as ownerId
  const ownerUser = await prisma.user.findUnique({ where: { authUserId: ownerAuthId } });

  // Create a business owned by owner
  const business = await prisma.business.create({
    data: { name: `Test Biz ${RUN}`, email: uniqueEmail(`${RUN}-biz`), ownerId: ownerUser!.id },
  });
  businessId = business.id;
  ids.businessIds.push(businessId);

  // Configure mock to return correct user based on token
  mockGetUser.mockImplementation(async (token: string) => {
    if (token === ownerToken) {
      return { data: { user: { id: ownerAuthId, email: ownerEmail, user_metadata: {} } }, error: null };
    }
    if (token === outsiderToken) {
      return { data: { user: { id: outsiderAuthId, email: outsiderEmail, user_metadata: {} } }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid token' } };
  });
});

afterAll(async () => {
  await cleanupTestData(ids);
});

describe('Authentication', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const req = makeRequest('GET', '/api/appointments', { params: { businessId } });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/token/i);
  });

  it('returns 401 when the Bearer token is invalid', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: 'invalid-garbage-token',
      params: { businessId },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 when the token is valid and business matches', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: ownerToken,
      params: { businessId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('auto-creates a Prisma user on first authentication if not in DB', async () => {
    const newAuthId = uniqueAuthId(`${RUN}-new-user`);
    const newEmail = uniqueEmail(`${RUN}-new-user`);
    const newToken = `token-${RUN}-new-user`;

    // Add to mock — but do NOT pre-create in Prisma
    const originalImpl = mockGetUser.getMockImplementation()!;
    mockGetUser.mockImplementation(async (token: string) => {
      if (token === newToken) {
        return { data: { user: { id: newAuthId, email: newEmail, user_metadata: { role: 'CLIENT' } } }, error: null };
      }
      return originalImpl(token);
    });

    // Hitting any authenticated endpoint triggers user auto-creation
    const req = makeRequest('GET', '/api/appointments', {
      token: newToken,
      params: { businessId },
    });
    await GET(req);

    // Verify the user was created in the DB
    const created = await prisma.user.findUnique({ where: { authUserId: newAuthId } });
    expect(created).not.toBeNull();
    expect(created!.email).toBe(newEmail);
    expect(created!.role).toBe('CLIENT');

    // Cleanup
    await prisma.user.delete({ where: { authUserId: newAuthId } });
    mockGetUser.mockImplementation(originalImpl);
  });
});

describe('RBAC — Business Access Control', () => {
  it('returns 401 for an outsider with no business membership', async () => {
    const req = makeRequest('GET', '/api/payments', {
      token: outsiderToken,
      params: { businessId },
    });
    const res = await getPayments(req);
    // Outsider has no ownership or therapist role in this business → 401 from requireBusinessAccess
    expect(res.status).toBe(401);
  });

  it('allows the owner to access their own business data', async () => {
    const req = makeRequest('GET', '/api/payments', {
      token: ownerToken,
      params: { businessId },
    });
    const res = await getPayments(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 when businessId is missing (not a bypass)', async () => {
    const req = makeRequest('GET', '/api/appointments', { token: ownerToken });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
