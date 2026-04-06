// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible } from './helpers.js';

test.describe('Gift cards', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/giftcards', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfVisible(page);
  });

  test('page loads with main content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/gift/i).first()).toBeVisible({ timeout: 30000 });
  });
});
