// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

test.describe('Explore and search', () => {
  test('explore URL redirects to the homepage', async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/explore');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('explore nested path redirects to the homepage', async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/explore/ontario/toronto');
    await expect(page).toHaveURL('/');
  });
});
