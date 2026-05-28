import { NextRequest } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'MassageBook API',
    version: '1.0.0',
    description: 'Public API for MassageBook. Authenticate using an API key generated in Settings → Developer → API Keys.',
    contact: { name: 'MassageBook Support', email: 'support@massagebook.com' },
  },
  servers: [{ url: '/api', description: 'Production' }],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'Authorization', description: 'Format: `ApiKey <your_key>`' },
    },
    schemas: {
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string' }, businessId: { type: 'string' }, clientId: { type: 'string' },
          therapistId: { type: 'string' }, startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' }, duration: { type: 'integer' },
          status: { type: 'string', enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' }, businessId: { type: 'string' }, firstName: { type: 'string' },
          lastName: { type: 'string' }, email: { type: 'string' }, phoneNumber: { type: 'string' },
          isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' }, businessId: { type: 'string' }, clientId: { type: 'string' },
          invoiceNumber: { type: 'string' }, total: { type: 'number' }, amountDue: { type: 'number' },
          status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  paths: {
    '/appointments': {
      get: {
        summary: 'List appointments',
        tags: ['Appointments'],
        parameters: [
          { in: 'query', name: 'businessId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'therapistId', schema: { type: 'string' } },
          { in: 'query', name: 'clientId', schema: { type: 'string' } },
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'List of appointments', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        summary: 'Create appointment',
        tags: ['Appointments'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['businessId', 'clientId', 'therapistId', 'startTime', 'duration'], properties: { businessId: { type: 'string' }, clientId: { type: 'string' }, therapistId: { type: 'string' }, startTime: { type: 'string', format: 'date-time' }, duration: { type: 'integer', description: 'Duration in minutes' } } } } } },
        responses: {
          201: { description: 'Created appointment', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Appointment' } } } } } },
        },
      },
    },
    '/clients': {
      get: {
        summary: 'List clients',
        tags: ['Clients'],
        parameters: [
          { in: 'query', name: 'businessId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'List of clients', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } } } } } },
      },
      post: {
        summary: 'Create client',
        tags: ['Clients'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['businessId', 'firstName', 'lastName'], properties: { businessId: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phoneNumber: { type: 'string' } } } } } },
        responses: { 201: { description: 'Created client', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Client' } } } } } } },
      },
    },
    '/invoices': {
      get: {
        summary: 'List invoices',
        tags: ['Invoices'],
        parameters: [
          { in: 'query', name: 'businessId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'List of invoices', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } } } } } } } },
      },
    },
    '/developer/webhooks': {
      get: {
        summary: 'List webhooks',
        tags: ['Webhooks'],
        parameters: [{ in: 'query', name: 'businessId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'List of webhooks' } },
      },
      post: {
        summary: 'Create webhook',
        tags: ['Webhooks'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['businessId', 'url', 'events'], properties: { businessId: { type: 'string' }, url: { type: 'string', format: 'uri' }, events: { type: 'array', items: { type: 'string' } } } } } } },
        responses: { 201: { description: 'Created webhook with secret (only shown once)' } },
      },
    },
  },
};

export function GET(_req: NextRequest) {
  return new Response(JSON.stringify(spec, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
