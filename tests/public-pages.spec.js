// @ts-check
/**
 * E2E: Public pages load and navigation links work.
 * Covers footer and header links so all public buttons/routes are reachable.
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
    await expect(page).toHaveTitle(/ClassEasily|Find Local Classes/);
    await expect(page.getByRole('link', { name: /ClassEasily/i }).first()).toBeVisible();
  });

  test('header: logo navigates to home', async ({ page }) => {
    await page.getByRole('link', { name: /ClassEasily/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('header: Become a host navigates to business', async ({ page }) => {
    await page.getByRole('link', { name: /Become a host/i }).click();
    await expect(page).toHaveURL(/\/business/);
  });

  test('footer: Our Blog link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Our Blog' }).click();
    await expect(page).toHaveURL('/blog');
  });

  test('footer: Explore Classes link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Explore Classes' }).click();
    await expect(page).toHaveURL('/explore');
  });

  test('footer: Content Policy link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Content Policy' }).click();
    await expect(page).toHaveURL('/content-policy');
  });

  test('footer: Become a Host link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Become a Host' }).click();
    await expect(page).toHaveURL(/\/business/);
  });

  test('footer: Business Help link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Business Help' }).click();
    await expect(page).toHaveURL(/\/business\/help/);
  });

  test('footer: Registration link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Registration' }).click();
    await expect(page).toHaveURL(/\/business\/register/);
  });

  test('footer: Contact us link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Contact us' }).click();
    await expect(page).toHaveURL('/my-tickets');
  });

  test('footer: Fees & Charges link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Fees & Charges' }).click();
    await expect(page).toHaveURL('/fees');
  });

  test('footer: Trust & Safety link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Trust & Safety' }).click();
    await expect(page).toHaveURL('/terms-of-service');
  });

  test('footer: Copyright Policy link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Copyright Policy' }).click();
    await expect(page).toHaveURL('/copyright-policy');
  });

  test('footer: Terms of Service link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Terms of Service' }).first().click();
    await expect(page).toHaveURL('/terms-of-service');
  });

  test('footer: Privacy Policy link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Privacy Policy' }).first().click();
    await expect(page).toHaveURL('/privacy-policy');
  });

  test('footer: Cookie Policy link works', async ({ page }) => {
    await scrollFooterIntoView(page);
    await page.getByRole('link', { name: 'Cookie Policy' }).first().click();
    await expect(page).toHaveURL('/cookie-policy');
  });
});
