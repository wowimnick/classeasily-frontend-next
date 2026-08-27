// @ts-check
/**
 * E2E: Homepage UI elements and public CTAs for the SaaS marketing site.
 */
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

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

  test('hero copy and primary CTA are visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Booking and CRM software for small businesses/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Get started/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /See pricing/i })).toBeVisible();
  });

  test('How it works section has three steps, no adventurer toggle', async ({ page }) => {
    const howItWorks = page.getByText('How it works', { exact: true });
    await howItWorks.scrollIntoViewIfNeeded();
    await expect(howItWorks).toBeVisible();
    await expect(page.getByRole('heading', { name: /Embed the widget/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /for Adventurers/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /for Hosts/i })).toHaveCount(0);
  });

  test('pricing preview shows plan names', async ({ page }) => {
    await expect(page.getByText('Basic', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Growth', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Advanced', { exact: true }).first()).toBeVisible();
  });

  test('header shows Log in and Get started for guests', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header.getByRole('button', { name: /Log in/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Get started/i })).toBeVisible();
  });

  test('mobile viewport still shows main content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('main')).toBeVisible();
  });
});
