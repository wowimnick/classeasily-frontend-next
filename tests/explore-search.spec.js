// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

test.describe('Explore and search', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/explore');
    await dismissCookieBannerIfVisible(page);
  });

  test('explore page has search or filter UI', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    const filter = page.getByRole('button', { name: /filter|category|location/i }).first();
    await expect(search.or(filter)).toBeVisible({ timeout: 60000 });
  });

  test('main landmark visible', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });
});
