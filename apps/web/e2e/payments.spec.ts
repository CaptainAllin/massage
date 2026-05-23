import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for the payments dashboard.
 * Requires an authenticated session — use PLAYWRIGHT_TEST_EMAIL and
 * PLAYWRIGHT_TEST_PASSWORD env vars to provide credentials.
 *
 * These tests cover the critical payment UI flow without making real Stripe calls.
 */

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(TEST_EMAIL!);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/dashboard|appointments|payments/, { timeout: 15000 });
}

test.describe('Payments Dashboard', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('payments page loads and shows list', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible({ timeout: 10000 });
  });

  test('payments page has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('mobile: payments page scrolls without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/payments');
    await page.waitForLoadState('domcontentloaded');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});

test.describe('Invoice Pages', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('invoices page renders', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: /invoice/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Unauthenticated payment routes', () => {
  test('redirects /payments to sign-in when not logged in', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test('redirects /invoices to sign-in when not logged in', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});
