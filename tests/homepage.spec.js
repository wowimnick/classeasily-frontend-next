// @ts-check
/**
 * E2E: Homepage UI elements and public CTAs.
 * Ensures main sections and buttons are present and visible.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath, openHeaderGuestMenu } from './helpers.js';

test.describe('Homepage UI and public buttons', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/');
    await dismissCookieBannerIfVisible(page);
  });

  test('banner and search area are visible', async ({ page }) => {
    await expect(page.getByRole('banner').or(page.locator('header')).first()).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('How it works section and toggles are visible', async ({ page }) => {
    const howItWorks = page.getByRole('heading', { name: /How does ClassEasily work/i });
    await howItWorks.scrollIntoViewIfNeeded();
    await expect(howItWorks).toBeVisible();
    await expect(page.getByRole('button', { name: /for Adventurers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /for Hosts/i })).toBeVisible();
  });

  test('How it works toggle switches content', async ({ page }) => {
    const forHosts = page.getByRole('button', { name: /for Hosts/i });
    await forHosts.scrollIntoViewIfNeeded();
    await forHosts.click();
    await expect(forHosts).toHaveAttribute('aria-pressed', 'true');
    const forAdventurers = page.getByRole('button', { name: /for Adventurers/i });
    await forAdventurers.click();
    await expect(forAdventurers).toHaveAttribute('aria-pressed', 'true');
  });

  test('Gift Cards CTA section and purchase link are visible', async ({ page }) => {
    const giftHeading = page.getByRole('heading', { name: /Gift a fun experience/i });
    await giftHeading.scrollIntoViewIfNeeded();
    await expect(giftHeading).toBeVisible();
    await expect(page.getByRole('link', { name: /Purchase Gift Card/i })).toBeVisible();
  });

  test('For Hosts section and Start Hosting button are visible', async ({ page }) => {
    // Start Hosting is a button inside a link (legacyBehavior); match by href + text
    const startHosting = page.locator('a[href="/business"]').filter({ hasText: 'Start Hosting' });
    await startHosting.first().scrollIntoViewIfNeeded();
    await expect(startHosting.first()).toBeVisible();
    // Desktop heading has id for-hosts-title; mobile heading is hidden on desktop so we target the visible one
    await expect(page.locator('#for-hosts-title')).toBeVisible();
  });

  test('Guest menu shows Log in and Sign up when opened', async ({ page }) => {
    await openHeaderGuestMenu(page);
    await expect(page.getByText('Log in', { exact: true })).toBeVisible();
    await expect(page.getByText('Sign up', { exact: true })).toBeVisible();
  });

  test('mobile viewport still shows main content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('main')).toBeVisible();
  });
});
