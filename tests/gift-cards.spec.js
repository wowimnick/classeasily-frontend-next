// @ts-check
/**
 * Gift cards were a consumer marketplace flow. Public URLs now 301/308 to home.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

test.describe('Gift cards — retired marketplace URLs', () => {
  test('landing redirects home', async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/giftcards');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: /Booking and CRM software for small businesses/i }),
    ).toBeVisible();
  });

  test('checkout redirects home', async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/giftcards/checkout');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/');
  });
});
