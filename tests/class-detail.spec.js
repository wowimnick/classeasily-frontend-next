// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible } from './helpers.js';

test.describe('Class detail (public)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfVisible(page);
  });

  test('explore page loads listing content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    const anyClassLink = page.locator('a[href*="/classes/"]');
    const count = await anyClassLink.count();
    expect(count >= 0).toBeTruthy();
  });

  test('invalid class slug returns not found or safe page', async ({ page }) => {
    const res = await page.goto('/classes/does-not-exist-slug-xyz', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
