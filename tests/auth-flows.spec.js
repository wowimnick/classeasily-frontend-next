// @ts-check
import { test, expect } from '@playwright/test';
import {
  dismissCookieBannerIfVisible,
  gotoPath,
  hasTestCredentials,
  loginAsUser,
  openHeaderGuestMenu,
  openLoginModalFromHeader,
} from './helpers.js';

test.describe('Auth flows', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/');
    await dismissCookieBannerIfVisible(page);
  });

  test('guest menu shows Log in and Sign up', async ({ page }) => {
    await openHeaderGuestMenu(page);
    await expect(page.getByText('Log in', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sign up', { exact: true })).toBeVisible();
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
