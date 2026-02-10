// @ts-check
/**
 * E2E: Critical user flows (navigation from homepage to key pages and back).
 * Ensures main public flows work end-to-end.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, scrollFooterIntoView } from './helpers.js';

test.describe('Critical user flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissCookieBannerIfVisible(page);
  });

  test('flow: Home -> Explore Classes -> back to Home', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Explore Classes' }).click();
    await expect(page).toHaveURL('/explore');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('flow: Home -> Shop Gift Cards -> gift cards page', async ({ page }) => {
    const shopGiftCards = page.getByRole('link', { name: /Shop Gift Cards/i });
    await shopGiftCards.first().scrollIntoViewIfNeeded();
    await shopGiftCards.first().click();
    await expect(page).toHaveURL(/\/giftcards/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('flow: Home -> Purchase Gift Card (Gift CTA section) -> gift cards page', async ({ page }) => {
    const purchaseBtn = page.getByRole('button', { name: /Purchase Gift Card/i });
    await purchaseBtn.scrollIntoViewIfNeeded();
    await purchaseBtn.click();
    await expect(page).toHaveURL(/\/giftcards/);
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
    await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL('/explore');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('flow: Business page has main content', async ({ page }) => {
    await page.goto('/business');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL(/\/business/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('flow: Gift cards page loads', async ({ page }) => {
    await page.goto('/giftcards');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL(/\/giftcards/);
    await expect(page.locator('body')).toBeVisible();
  });
});
