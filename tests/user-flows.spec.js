// @ts-check
/**
 * E2E: Critical user flows (navigation from homepage to key pages and back).
 * Ensures main public flows work end-to-end.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath, scrollFooterIntoView } from './helpers.js';

test.describe('Critical user flows', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/');
    await dismissCookieBannerIfVisible(page);
  });

  test('flow: Home -> Explore Classes -> back to Home', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Explore Classes' }).click();
    await expect(page).toHaveURL('/explore');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
    await gotoPath(page, '/');
    await expect(page).toHaveURL('/');
  });

  test('flow: Home -> Purchase Gift Card link -> gift cards page', async ({ page }) => {
    const purchase = page.getByRole('link', { name: /Purchase Gift Card/i });
    await purchase.scrollIntoViewIfNeeded();
    await purchase.click();
    await expect(page).toHaveURL(/\/giftcards/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('flow: Home -> Become a host -> business page', async ({ page }) => {
    await page.getByRole('link', { name: /Become a host/i }).click();
    await expect(page).toHaveURL(/\/business/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('flow: Home -> Start Hosting (For Hosts section) -> business page', async ({ page }) => {
    const startHosting = page.locator('a[href="/business"]').filter({ hasText: 'Start Hosting' });
    await startHosting.first().scrollIntoViewIfNeeded();
    await startHosting.first().click();
    await expect(page).toHaveURL(/\/business/);
  });

  test('flow: Explore page has search/filter UI', async ({ page }) => {
    test.setTimeout(60000);
    await gotoPath(page, '/explore', { timeout: 45000 });
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/explore');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('flow: Business page has main content', async ({ page }) => {
    await gotoPath(page, '/business');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL(/\/business/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('flow: Gift cards page loads', async ({ page }) => {
    await gotoPath(page, '/giftcards');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL(/\/giftcards/);
    await expect(page.locator('body')).toBeVisible();
  });
});
