/**
 * Integration tests for payment flows.
 * Supabase JWT is mocked; DB operations are real.
 * Stripe is disabled (ENABLE_STRIPE=false in .env.test).
 */

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

import { GET, POST } from '@/app/api/payments/route';
import { POST as webhookPost } from '@/app/api/stripe/webhook/route';
import { prisma } from '@/lib/prisma';
import { makeRequest, uniqueAuthId, uniqueEmail, cleanupTestData } from '../helpers/test-setup';

const RUN = `pay-${Date.now()}`;

const ids = {
  paymentIds: [] as string[],
  clientIds: [] as string[],
  businessIds: [] as string[],
  userAuthIds: [] as string[],
};

let ownerToken: string;
let outsiderToken: string;
let businessId: string;
let clientId: string;

beforeAll(async () => {
  // Owner
  const ownerAuthId = uniqueAuthId(`${RUN}-owner`);
  const ownerEmail = uniqueEmail(`${RUN}-owner`);
  ownerToken = `token-${RUN}-owner`;

  await prisma.user.create({
    data: { authUserId: ownerAuthId, email: ownerEmail, firstName: 'Pay', lastName: 'Owner', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(ownerAuthId);
  const ownerUser = await prisma.user.findUnique({ where: { authUserId: ownerAuthId } });

  // Outsider
  const outsiderAuthId = uniqueAuthId(`${RUN}-outsider`);
  const outsiderEmail = uniqueEmail(`${RUN}-outsider`);
  outsiderToken = `token-${RUN}-outsider`;

  await prisma.user.create({
    data: { authUserId: outsiderAuthId, email: outsiderEmail, firstName: 'Pay', lastName: 'Outsider', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(outsiderAuthId);

  // Business
  const business = await prisma.business.create({
    data: { name: `Pay Biz ${RUN}`, ownerId: ownerUser!.id },
  });
  businessId = business.id;
  ids.businessIds.push(businessId);

  // Client
  const client = await prisma.client.create({
    data: { businessId, firstName: 'Pay', lastName: 'Client', email: uniqueEmail(`${RUN}-client`) },
  });
  clientId = client.id;
  ids.clientIds.push(clientId);

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

describe('GET /api/payments', () => {
  it('returns payment list for business owner', async () => {
    const req = makeRequest('GET', '/api/payments', {
      token: ownerToken,
      params: { businessId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('denies access to outsider (IDOR protection)', async () => {
    const req = makeRequest('GET', '/api/payments', {
      token: outsiderToken,
      params: { businessId },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when businessId is missing', async () => {
    const req = makeRequest('GET', '/api/payments', { token: ownerToken });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/payments', () => {
  it('creates a cash payment record', async () => {
    const req = makeRequest('POST', '/api/payments', {
      token: ownerToken,
      body: { businessId, clientId, amount: 5000, currency: 'USD', paymentMethod: 'CASH' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.amount).toBe(5000);
    expect(body.data.paymentMethod).toBe('CASH');
    ids.paymentIds.push(body.data.id);
  });

  it('creates a check payment record', async () => {
    const req = makeRequest('POST', '/api/payments', {
      token: ownerToken,
      body: { businessId, clientId, amount: 7500, currency: 'USD', paymentMethod: 'CHECK' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.paymentMethod).toBe('CHECK');
    ids.paymentIds.push(body.data.id);
  });

  it('rejects payment without required fields', async () => {
    const req = makeRequest('POST', '/api/payments', {
      token: ownerToken,
      body: { businessId, clientId }, // missing amount and paymentMethod
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('denies outsider from creating payment for another business', async () => {
    const req = makeRequest('POST', '/api/payments', {
      token: outsiderToken,
      body: { businessId, clientId, amount: 5000, currency: 'USD', paymentMethod: 'CASH' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/stripe/webhook — signature validation', () => {
  it('rejects webhook with missing stripe-signature header', async () => {
    const req = makeRequest('POST', '/api/stripe/webhook', {
      body: { type: 'payment_intent.succeeded', data: {} },
    });
    const res = await webhookPost(req);
    // Returns 400 when ENABLE_STRIPE=false or signature missing
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.received).toBe(false);
  });

  it('rejects webhook when ENABLE_STRIPE is not set', async () => {
    const original = process.env.ENABLE_STRIPE;
    process.env.ENABLE_STRIPE = 'false';

    const headers = new Headers({ 'stripe-signature': 'sig123' });
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    }) as any;

    const res = await webhookPost(req);
    expect(res.status).toBe(400);

    process.env.ENABLE_STRIPE = original;
  });
});
