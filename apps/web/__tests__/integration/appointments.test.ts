/**
 * Integration tests for appointment booking with conflict detection.
 * Supabase JWT is mocked; all DB operations are real.
 */

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

import { GET, POST } from '@/app/api/appointments/route';
import { prisma } from '@/lib/prisma';
import { makeRequest, uniqueAuthId, uniqueEmail, cleanupTestData } from '../helpers/test-setup';

const RUN = `appt-${Date.now()}`;

const ids = {
  appointmentIds: [] as string[],
  therapistAvailabilityIds: [] as string[],
  therapistIds: [] as string[],
  clientIds: [] as string[],
  businessIds: [] as string[],
  userAuthIds: [] as string[],
};

let ownerToken: string;
let businessId: string;
let therapistId: string;
let clientId: string;

// Wednesday = 3 (0=Sun), so tests use a fixed upcoming Wednesday
function nextWednesday(hour: number, minute = 0) {
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

beforeAll(async () => {
  // Create owner user
  const ownerAuthId = uniqueAuthId(`${RUN}-owner`);
  const ownerEmail = uniqueEmail(`${RUN}-owner`);
  ownerToken = `token-${RUN}-owner`;

  await prisma.user.create({
    data: { authUserId: ownerAuthId, email: ownerEmail, firstName: 'Owner', lastName: 'Test', role: 'BUSINESS_OWNER' },
  });
  ids.userAuthIds.push(ownerAuthId);

  const ownerUser = await prisma.user.findUnique({ where: { authUserId: ownerAuthId } });

  // Create business
  const business = await prisma.business.create({
    data: { name: `Appt Test Biz ${RUN}`, ownerId: ownerUser!.id },
  });
  businessId = business.id;
  ids.businessIds.push(businessId);

  // Create therapist user and therapist record
  const therapistUserAuthId = uniqueAuthId(`${RUN}-therapist`);
  const therapistUserEmail = uniqueEmail(`${RUN}-therapist`);
  await prisma.user.create({
    data: { authUserId: therapistUserAuthId, email: therapistUserEmail, firstName: 'Therapist', lastName: 'Test', role: 'THERAPIST' },
  });
  ids.userAuthIds.push(therapistUserAuthId);

  const therapistUser = await prisma.user.findUnique({ where: { authUserId: therapistUserAuthId } });
  const therapist = await prisma.therapist.create({
    data: { businessId, userId: therapistUser!.id },
  });
  therapistId = therapist.id;
  ids.therapistIds.push(therapistId);

  // Set availability: Wednesday 09:00–17:00
  const availability = await prisma.therapistAvailability.create({
    data: { businessId, therapistId, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true },
  });
  ids.therapistAvailabilityIds.push(availability.id);

  // Create client
  const client = await prisma.client.create({
    data: { businessId, firstName: 'Test', lastName: 'Client', email: uniqueEmail(`${RUN}-client`) },
  });
  clientId = client.id;
  ids.clientIds.push(clientId);

  // Mock getUser to always return the owner
  mockGetUser.mockResolvedValue({
    data: { user: { id: ownerAuthId, email: ownerEmail, user_metadata: {} } },
    error: null,
  });
});

afterAll(async () => {
  await cleanupTestData(ids);
});

describe('GET /api/appointments', () => {
  it('returns appointments list for valid businessId', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: ownerToken,
      params: { businessId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty('total');
  });

  it('supports status filter', async () => {
    const req = makeRequest('GET', '/api/appointments', {
      token: ownerToken,
      params: { businessId, status: 'SCHEDULED' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/appointments — conflict detection', () => {
  it('creates an appointment successfully within therapist hours', async () => {
    const start = nextWednesday(10); // 10:00 UTC on next Wednesday
    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: { businessId, clientId, therapistId, startTime: start.toISOString(), duration: 60 },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('SCHEDULED');
    ids.appointmentIds.push(body.data.id);
  });

  it('rejects a booking that conflicts with an existing appointment', async () => {
    // Same slot as the one just created — should conflict
    const start = nextWednesday(10);
    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: { businessId, clientId, therapistId, startTime: start.toISOString(), duration: 60 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/conflict/i);
  });

  it('rejects a booking outside therapist working hours', async () => {
    const start = nextWednesday(7); // 07:00 — before 09:00
    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: { businessId, clientId, therapistId, startTime: start.toISOString(), duration: 60 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/hours|outside/i);
  });

  it('rejects booking on a day with no availability (Monday = 1)', async () => {
    const monday = new Date();
    while (monday.getUTCDay() !== 1) monday.setUTCDate(monday.getUTCDate() + 1);
    monday.setUTCHours(10, 0, 0, 0);

    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: { businessId, clientId, therapistId, startTime: monday.toISOString(), duration: 60 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/availability/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: { businessId, clientId }, // missing therapistId, startTime, duration
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it('detects partial overlap — new booking overlaps end of existing', async () => {
    // Existing is 10:00–11:00; try to book 10:30–11:30 (overlaps the end)
    const start = nextWednesday(10, 30);
    const req = makeRequest('POST', '/api/appointments', {
      token: ownerToken,
      body: { businessId, clientId, therapistId, startTime: start.toISOString(), duration: 60 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
