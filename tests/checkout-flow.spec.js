// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible } from './helpers.js';

test.describe('Checkout flow (smoke)', () => {
  test('gift cards checkout redirects home', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/giftcards/checkout', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/');
  });

  test('leftover class checkout URL is not redirected to home', async ({ page }) => {
    test.setTimeout(60000);
    const res = await page.goto('/classes/does-not-exist-slug-xyz/checkout', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status() ?? 0).toBeLessThan(500);
    expect(page.url()).toContain('/classes/');
    expect(page.url()).toContain('/checkout');
  });

  test('booking status page loads as shell', async ({ page }) => {
    const res = await page.goto('/booking/status', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
