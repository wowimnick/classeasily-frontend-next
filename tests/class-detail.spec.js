// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible } from './helpers.js';

test.describe('Class detail (public)', () => {
  test('class listing URLs redirect home', async ({ page }) => {
    test.setTimeout(90000);
    const res = await page.goto('/classes/does-not-exist-slug-xyz', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
