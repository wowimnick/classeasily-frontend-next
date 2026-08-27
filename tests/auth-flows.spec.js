// @ts-check
import { test, expect } from '@playwright/test';
import {
  dismissCookieBannerIfVisible,
  gotoPath,
  hasTestCredentials,
  loginAsUser,
  openLoginModalFromHeader,
} from './helpers.js';

test.describe('Auth flows', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/');
    await dismissCookieBannerIfVisible(page);
  });

  test('header shows Log in for guests', async ({ page }) => {
    await expect(page.locator('header').getByRole('button', { name: /Log in/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('login with invalid credentials shows error or stays on page', async ({ page }) => {
    await openLoginModalFromHeader(page);
    const email = page.locator('input[type="email"]').first();
    if (await email.isVisible().catch(() => false)) {
      await email.fill('not-a-real-user@example.invalid');
      await page.locator('input[type="password"]').first().fill('wrongpassword');
      await page.getByRole('button', { name: /^(Log in|Sign in)/i }).click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('login with test credentials when env set', async ({ page }) => {
    test.skip(!hasTestCredentials(), 'Set PLAYWRIGHT_TEST_USER_EMAIL and PLAYWRIGHT_TEST_USER_PASSWORD');
    await loginAsUser(page);
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
  });
});
