// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, navigateToAdminTab } from './helpers.js';

test.describe('Admin panel', () => {
  test('admin overview route responds without 5xx', async ({ page }) => {
    const res = await page.goto('/admin/overview', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await dismissCookieBannerIfVisible(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin users tab shell loads', async ({ page }) => {
    await navigateToAdminTab(page, 'users');
    await expect(page.locator('body')).toBeVisible({ timeout: 20000 });
  });
});
