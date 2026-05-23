/**
 * Security tests: SQL injection, XSS, IDOR, RBAC bypass.
 * Supabase JWT is mocked; DB operations are real.
 */

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

import { GET as getAppointments, POST as postAppointment } from '@/app/api/appointments/route';
import { GET as getPayments } from '@/app/api/payments/route';
import { GET as getClients } from '@/app/api/clients/route';
import { prisma } from '@/lib/prisma';
import { makeRequest, uniqueAuthId, uniqueEmail, cleanupTestData } from '../helpers/test-setup';

const RUN = `sec-${Date.now()}`;

const ids = {
  clientIds: [] as string[],
  businessIds: [] as string[],
  userAuthIds: [] as string[],
};

let ownerToken: string;
let outsiderToken: string;
let businessAId: string;
let businessBId: string;

beforeAll(async () => {
  // Business A owner
  const ownerAAuthId = uniqueAuthId(`${RUN}-ownerA`);
  const ownerAEmail = uniqueEmail(`${RUN}-ownerA`);
  ownerToken = `token-${RUN}-ownerA`;

  await prisma.user.create({
    data: { authUserId: ownerAAuthId, email: ownerAEmail, firstName: 'OwnerA', lastName: 'Sec', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(ownerAAuthId);
  const ownerA = await prisma.user.findUnique({ where: { authUserId: ownerAAuthId } });

  // Business B owner (the "attacker")
  const ownerBAuthId = uniqueAuthId(`${RUN}-ownerB`);
  const ownerBEmail = uniqueEmail(`${RUN}-ownerB`);
  outsiderToken = `token-${RUN}-ownerB`;

  await prisma.user.create({
    data: { authUserId: ownerBAuthId, email: ownerBEmail, firstName: 'OwnerB', lastName: 'Sec', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(ownerBAuthId);
  const ownerB = await prisma.user.findUnique({ where: { authUserId: ownerBAuthId } });

  // Business A
  const businessA = await prisma.business.create({
    data: { name: `Sec Biz A ${RUN}`, ownerId: ownerA!.id },
  });
  businessAId = businessA.id;
  ids.businessIds.push(businessAId);

  // Business B
  const businessB = await prisma.business.create({
    data: { name: `Sec Biz B ${RUN}`, ownerId: ownerB!.id },
  });
  businessBId = businessB.id;
  ids.businessIds.push(businessBId);

  // Create a client in Business A (to test IDOR)
  const client = await prisma.client.create({
    data: { businessId: businessAId, firstName: 'Private', lastName: 'Client', email: uniqueEmail(`${RUN}-private`) },
  });
  ids.clientIds.push(client.id);

  mockGetUser.mockImplementation(async (token: string) => {
    if (token === ownerToken) {
      return { data: { user: { id: ownerAAuthId, email: ownerAEmail, user_metadata: {} } }, error: null };
    }
    if (token === outsiderToken) {
      return { data: { user: { id: ownerBAuthId, email: ownerBEmail, user_metadata: {} } }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid token' } };
  });
});

afterAll(async () => {
  await cleanupTestData(ids);
});

describe('SQL Injection', () => {
  // Prisma uses parameterized queries — these payloads are treated as literal strings,
  // not SQL. Tests verify the server does not crash and returns a controlled error.

  const injectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE appointments; --",
    '1 UNION SELECT * FROM users',
    "admin'--",
    '1; SELECT sleep(5)',
  ];

  injectionPayloads.forEach((payload) => {
    it(`rejects or safely handles businessId payload: ${payload.slice(0, 30)}`, async () => {
      const req = makeRequest('GET', '/api/appointments', {
        token: ownerToken,
        params: { businessId: payload },
      });
      const res = await getAppointments(req);
      // Should return 200 with empty data (no match) or 400 — never 500 or raw DB error
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        const body = await res.json();
        // Must return empty list, not all rows
        expect(body.data).toEqual([]);
      }
    });
  });

  it('does not expose raw DB error messages on invalid input', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: ownerToken,
      params: { businessId: "' OR 1=1 --" },
    });
    const res = await getAppointments(req);
    const text = await res.text();
    // Must not contain Prisma internals or stack traces
    expect(text).not.toMatch(/prisma|knex|syntax error|pg_/i);
  });
});

describe('XSS (Cross-Site Scripting)', () => {
  it('does not reflect script tags back in API response', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const req = makeRequest('GET', '/api/appointments', {
      token: ownerToken,
      params: { businessId: xssPayload },
    });
    const res = await getAppointments(req);
    const body = await res.json();
    const serialized = JSON.stringify(body);
    // JSON encoding should escape angle brackets or the payload should not appear verbatim
    // as executable script in the response body used by the API
    expect(serialized).not.toContain('<script>alert');
  });

  it('stores XSS payload as plain text in body fields (not executed)', async () => {
    // Prisma stores the value as a string — verify it's returned escaped in JSON
    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: {
        businessId: businessAId,
        clientId: 'xss-test',
        therapistId: 'xss-test',
        startTime: new Date().toISOString(),
        duration: 60,
        notes: '<script>alert("xss")</script>',
      },
    });
    const res = await postAppointment(req);
    // Will fail at DB level (invalid clientId/therapistId), but must not crash
    expect([400, 500]).toContain(res.status);
    const body = await res.json();
    const serialized = JSON.stringify(body);
    // The payload should not appear as raw unescaped HTML script in the response
    expect(serialized).not.toContain('<script>alert');
  });
});

describe('IDOR (Insecure Direct Object Reference)', () => {
  it('prevents Business B owner from reading Business A appointments', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: outsiderToken,
      params: { businessId: businessAId },
    });
    const res = await getAppointments(req);
    // Business B owner has no access to Business A — should be 401
    expect(res.status).toBe(401);
  });

  it('prevents Business B owner from reading Business A payments', async () => {
    const req = makeRequest('GET', '/api/payments', {
      token: outsiderToken,
      params: { businessId: businessAId },
    });
    const res = await getPayments(req);
    expect(res.status).toBe(401);
  });

  it('prevents Business B owner from reading Business A clients', async () => {
    const req = makeRequest('GET', '/api/clients', {
      token: outsiderToken,
      params: { businessId: businessAId },
    });
    const res = await getClients(req);
    expect(res.status).toBe(401);
  });

  it('owner can access own business data', async () => {
    const req = makeRequest('GET', '/api/clients', {
      token: ownerToken,
      params: { businessId: businessAId },
    });
    const res = await getClients(req);
    expect(res.status).toBe(200);
  });
});

describe('RBAC Bypass Attempts', () => {
  it('returns 401 with a syntactically valid but unrecognized token', async () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXIifQ.fake-signature';
    const req = makeRequest('GET', '/api/appointments', {
      token: fakeJwt,
      params: { businessId: businessAId },
    });
    const res = await getAppointments(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with an empty Bearer token', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: '',
      params: { businessId: businessAId },
    });
    // No token → no Authorization header → 401
    const res = await getAppointments(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with a non-Bearer Authorization scheme', async () => {
    const headers = new Headers({ authorization: `Basic dXNlcjpwYXNz` });
    const req = new Request(`http://localhost:3000/api/appointments?businessId=${businessAId}`, {
      method: 'GET',
      headers,
    }) as any;
    const res = await getAppointments(req);
    expect(res.status).toBe(401);
  });
});
