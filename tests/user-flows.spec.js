// @ts-check
/**
 * E2E: Critical user flows on the public SaaS site.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

test.describe('Critical user flows', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/');
    await dismissCookieBannerIfVisible(page);
  });

  test('flow: Home -> See pricing -> pricing page', async ({ page }) => {
    await page.getByRole('link', { name: /See pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { name: /Priced for small teams/i })).toBeVisible();
  });

  test('flow: Home -> Get started -> register', async ({ page }) => {
    await page.getByRole('link', { name: /Get started/i }).first().click();
    await expect(page).toHaveURL(/\/business\/register/);
    await expect(page.getByRole('heading', { name: /Start with your account/i })).toBeVisible({
      timeout: 30000,
    });
  });

  test('flow: Home -> Pricing in header', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('flow: /explore redirects to homepage', async ({ page }) => {
    await gotoPath(page, '/explore', { timeout: 45000 });
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('flow: /business exact redirects to homepage', async ({ page }) => {
    await gotoPath(page, '/business');
    await expect(page).not.toHaveURL(/\/business$/);
    await expect(page).toHaveURL('/');
  });

  test('flow: /giftcards redirects to homepage', async ({ page }) => {
    await gotoPath(page, '/giftcards');
    await expect(page).toHaveURL('/');
  });

  test('flow: /booking-widget redirects to pricing', async ({ page }) => {
    await gotoPath(page, '/booking-widget');
    await expect(page).toHaveURL(/\/pricing/);
  });
});
