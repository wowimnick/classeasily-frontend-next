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
      page.getByRole('heading', { name: /The same tools/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Get started/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /See pricing/i })).toBeVisible();
  });

  test('homepage has no adventurer / host marketplace toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: /for Adventurers/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /for Hosts/i })).toHaveCount(0);
  });

  test('pricing preview shows plan names', async ({ page }) => {
    await expect(page.getByText('Basic', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Growth', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Advanced', { exact: true }).first()).toBeVisible();
  });

  test('header shows Get started and account menu for guests', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: /Get started/i })).toBeVisible();
    await header.getByRole('button', { name: /Account menu/i }).click();
    await expect(page.getByRole('button', { name: /^Log in$/i })).toBeVisible();
  });

  test('mobile viewport still shows main content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('main')).toBeVisible();
  });
});
