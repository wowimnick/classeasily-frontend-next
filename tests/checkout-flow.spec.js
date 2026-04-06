// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible } from './helpers.js';

test.describe('Checkout flow (smoke)', () => {
  test('gift cards checkout route loads', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/giftcards/checkout', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfVisible(page);
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('giftcards');
  });

  test('booking status page loads as shell', async ({ page }) => {
    const res = await page.goto('/booking/status', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
