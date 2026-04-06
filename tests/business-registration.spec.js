// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

test.describe('Business registration', () => {
  test('registration page loads', async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/business/register');
    await dismissCookieBannerIfVisible(page);
    await expect(page.locator('body')).toBeVisible();
    const landing = page.getByRole('heading', { name: /Share Some Fun on ClassEasily/i });
    const already = page.getByRole('heading', { name: /Already Have a Business Registered/i });
    await expect(landing.or(already)).toBeVisible({ timeout: 30000 });
  });
});
