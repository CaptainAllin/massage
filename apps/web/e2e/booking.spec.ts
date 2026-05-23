import { test, expect } from '@playwright/test';

/**
 * E2E tests for the public online booking flow (/book/[businessId]).
 * These tests use a placeholder businessId — set PLAYWRIGHT_BUSINESS_ID env var
 * to a real seeded businessId for full flow testing.
 */

const BUSINESS_ID = process.env.PLAYWRIGHT_BUSINESS_ID || 'test-business-id';

test.describe('Public Booking Page', () => {
  test('booking page renders without crashing', async ({ page }) => {
    const response = await page.goto(`/book/${BUSINESS_ID}`);
    // Should return 200 (or show a business-not-found page — not a 500)
    expect(response?.status()).not.toBe(500);
  });

  test('booking page has correct title / heading', async ({ page }) => {
    await page.goto(`/book/${BUSINESS_ID}`);
    // Page should render something — either booking UI or a handled "not found"
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).not.toBe('');
  });
});

test.describe('Mobile Booking Layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('booking page is accessible on mobile without horizontal scroll', async ({ page }) => {
    await page.goto(`/book/${BUSINESS_ID}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});

test.describe('Booking Form Validation', () => {
  test('form does not submit without required fields selected', async ({ page }) => {
    await page.goto(`/book/${BUSINESS_ID}`);

    // Try to find and click a submit/book button without filling the form
    const submitButton = page.getByRole('button', { name: /book|confirm|schedule/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should show validation errors, not proceed to confirmation
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('confirmation');
      expect(currentUrl).not.toContain('success');
    }
  });
});
