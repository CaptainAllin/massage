/**
 * Load test for analytics and report generation endpoints.
 * Run with k6: k6 run analytics-load.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Usage:
 *   k6 run analytics-load.js                      # default 10 VUs for 30s
 *   k6 run --vus 50 --duration 60s analytics-load.js
 *
 * Required env vars:
 *   K6_BASE_URL     - e.g. http://localhost:3000
 *   K6_AUTH_TOKEN   - valid Supabase Bearer token
 *   K6_BUSINESS_ID  - target businessId
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const options = {
  scenarios: {
    // Steady load — analytics dashboard query
    analytics_steady: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      tags: { scenario: 'analytics_steady' },
    },
    // Spike — report generation
    report_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      tags: { scenario: 'report_spike' },
      startTime: '30s', // starts after steady load
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],        // <1% error rate
    http_req_duration: ['p(95)<3000'],     // 95th percentile < 3s
    'http_req_duration{scenario:analytics_steady}': ['p(99)<2000'],
    'http_req_duration{scenario:report_spike}': ['p(95)<5000'],
  },
};

const errorRate = new Rate('errors');
const analyticsLatency = new Trend('analytics_latency', true);
const reportLatency = new Trend('report_latency', true);

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.K6_AUTH_TOKEN || '';
const BUSINESS_ID = __ENV.K6_BUSINESS_ID || '';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

export default function () {
  const scenario = __ENV.K6_SCENARIO || 'analytics';

  if (scenario === 'report_spike') {
    // Report generation (heavier query)
    const reportPayload = JSON.stringify({
      businessId: BUSINESS_ID,
      reportType: 'REVENUE',
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    });

    const res = http.post(`${BASE_URL}/api/reports/export`, reportPayload, { headers });

    const ok = check(res, {
      'report: status 200 or 201': (r) => r.status === 200 || r.status === 201,
      'report: response has data': (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!ok);
    reportLatency.add(res.timings.duration);
  } else {
    // Analytics dashboard queries (lighter)
    const endpoints = [
      `/api/analytics?businessId=${BUSINESS_ID}&metric=revenue&period=month`,
      `/api/analytics?businessId=${BUSINESS_ID}&metric=appointments&period=week`,
      `/api/analytics?businessId=${BUSINESS_ID}&metric=clients&period=month`,
    ];

    const url = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(`${BASE_URL}${url}`, { headers });

    const ok = check(res, {
      'analytics: status 200': (r) => r.status === 200,
      'analytics: has success field': (r) => {
        try {
          return 'success' in JSON.parse(r.body);
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!ok);
    analyticsLatency.add(res.timings.duration);
  }

  sleep(0.5 + Math.random() * 0.5); // 0.5–1.0s think time
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-results.json': JSON.stringify(data),
  };
}

// k6's built-in textSummary is imported automatically when referenced
function textSummary(data, opts) {
  // k6 provides this via the `k6/x/summary` extension or built-in
  return JSON.stringify(data.metrics, null, 2);
}
