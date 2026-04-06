// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, navigateToDashboardTab } from './helpers.js';

test.describe('Business dashboard navigation', () => {
  test('overview route responds without server error', async ({ page }) => {
    const res = await page.goto('/business/dashboard', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await dismissCookieBannerIfVisible(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('email-campaigns tab route loads', async ({ page }) => {
    await navigateToDashboardTab(page, 'email-campaigns');
    await expect(page.locator('body')).toBeVisible({ timeout: 20000 });
  });

  test('settings billing path loads', async ({ page }) => {
    await navigateToDashboardTab(page, 'settings');
    await expect(page.locator('body')).toBeVisible({ timeout: 20000 });
  });
});
