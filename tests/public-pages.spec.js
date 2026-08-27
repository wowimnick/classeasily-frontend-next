// @ts-check
/**
 * E2E: Public pages load and navigation links work.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath, scrollFooterIntoView } from './helpers.js';

test.describe('Public pages and navigation', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/');
    await dismissCookieBannerIfVisible(page);
  });

  test('homepage loads with correct title and key elements', async ({ page }) => {
    await expect(page).toHaveTitle(/ClassEasily|Booking and CRM/);
    await expect(page.getByRole('link', { name: /ClassEasily/i }).first()).toBeVisible();
  });

  test('header: logo navigates to home', async ({ page }) => {
    await page.getByRole('link', { name: /ClassEasily/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('header: Get started navigates to register', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: /Get started/i }).click();
    await expect(page).toHaveURL(/\/business\/register/);
  });

  test('footer: Blog link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL('/blog');
  });

  test('footer: Pricing link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL('/pricing');
  });

  test('footer: Help link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Help' }).click();
    await expect(page).toHaveURL(/\/business\/help/);
  });

  test('footer: Get started link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL(/\/business\/register/);
  });

  test('footer: Fees link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Fees' }).click();
    await expect(page).toHaveURL('/fees');
  });

  test('footer: Terms of Service link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL('/terms-of-service');
  });

  test('footer: Privacy Policy link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL('/privacy-policy');
  });

  test('footer: Cookie Policy link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Cookies' }).click();
    await expect(page).toHaveURL('/cookie-policy');
  });

  test('pricing page shows plans, comparison, and FAQ', async ({ page }) => {
    await gotoPath(page, '/pricing');
    await dismissCookieBannerIfVisible(page);
    await expect(page.getByRole('heading', { name: /Priced for small teams/i })).toBeVisible();
    await expect(page.getByText('$29').first()).toBeVisible();
    await expect(page.getByText('$49').first()).toBeVisible();
    await expect(page.getByText('$89').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Compare plans/i })).toBeVisible();
    await expect(page.getByText(/Can I embed/i).first()).toBeVisible();
  });
});
