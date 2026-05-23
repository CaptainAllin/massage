import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Expect error message to appear
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('sign-in page has link to sign-up', async ({ page }) => {
    await page.goto('/sign-in');
    const signUpLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await expect(signUpLink).toBeVisible();
  });

  test('sign-up page renders correctly', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test('unauthenticated user is redirected from appointments to sign-in', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

test.describe('Mobile Auth Layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('sign-in form is usable on mobile', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    // Ensure no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
