#!/usr/bin/env node
/**
 * Analytics endpoint load test
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 AUTH_TOKEN=<bearer> BUSINESS_ID=<id> node scripts/load-test-analytics.js
 *
 * Optional env vars:
 *   CONCURRENCY   (default 10) — simultaneous requests per wave
 *   WAVES         (default 5)  — number of sequential waves
 *   DATE_RANGE    (default 30) — days of history to query
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const BUSINESS_ID = process.env.BUSINESS_ID;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);
const WAVES = parseInt(process.env.WAVES || '5', 10);
const DATE_RANGE = parseInt(process.env.DATE_RANGE || '30', 10);

if (!AUTH_TOKEN || !BUSINESS_ID) {
  console.error('ERROR: AUTH_TOKEN and BUSINESS_ID env vars are required');
  process.exit(1);
}

const endDate = new Date().toISOString();
const startDate = new Date(Date.now() - DATE_RANGE * 86400 * 1000).toISOString();

const ENDPOINTS = [
  `/api/analytics/overview?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/analytics/revenue?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/analytics/appointments?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/analytics/clients?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/analytics/therapists?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/reports/revenue?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/reports/clients?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/reports/appointments?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
  `/api/reports/financial-summary?businessId=${BUSINESS_ID}&startDate=${startDate}&endDate=${endDate}`,
];

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

async function fetchOne(url) {
  const start = Date.now();
  try {
    const res = await fetch(BASE_URL + url, { headers });
    const ms = Date.now() - start;
    return { url, status: res.status, ms, ok: res.ok };
  } catch (err) {
    const ms = Date.now() - start;
    return { url, status: 0, ms, ok: false, error: err.message };
  }
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function printStats(label, times) {
  const sorted = [...times].sort((a, b) => a - b);
  const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
  console.log(
    `  ${label.padEnd(20)} count=${sorted.length} avg=${avg}ms p50=${percentile(sorted, 50)}ms p95=${percentile(sorted, 95)}ms p99=${percentile(sorted, 99)}ms max=${sorted[sorted.length - 1]}ms`
  );
}

async function runWave(wave) {
  const tasks = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length];
    tasks.push(fetchOne(endpoint));
  }
  const results = await Promise.all(tasks);
  const failures = results.filter(r => !r.ok);
  console.log(`Wave ${wave}: ${results.length} requests, ${failures.length} failures`);
  if (failures.length > 0) {
    failures.forEach(f => console.log(`  FAIL ${f.status} ${f.url.split('?')[0]} ${f.error || ''}`));
  }
  return results;
}

async function main() {
  console.log(`\nAnalytics Load Test`);
  console.log(`  Base URL:    ${BASE_URL}`);
  console.log(`  Business ID: ${BUSINESS_ID}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Waves:       ${WAVES}`);
  console.log(`  Date range:  last ${DATE_RANGE} days`);
  console.log(`  Endpoints:   ${ENDPOINTS.length}\n`);

  const allResults = [];

  for (let w = 1; w <= WAVES; w++) {
    const results = await runWave(w);
    allResults.push(...results);
    if (w < WAVES) await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n--- Results by endpoint ---');
  const byEndpoint = {};
  for (const r of allResults) {
    const key = r.url.split('?')[0];
    (byEndpoint[key] = byEndpoint[key] || []).push(r.ms);
  }
  for (const [ep, times] of Object.entries(byEndpoint)) {
    printStats(ep.replace('/api/', ''), times);
  }

  console.log('\n--- Overall ---');
  printStats('all endpoints', allResults.map(r => r.ms));

  const failures = allResults.filter(r => !r.ok);
  if (failures.length > 0) {
    console.log(`\nFailed: ${failures.length}/${allResults.length} requests`);
    process.exit(1);
  } else {
    console.log(`\nAll ${allResults.length} requests succeeded.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
