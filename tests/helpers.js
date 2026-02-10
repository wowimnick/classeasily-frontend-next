// @ts-check
/**
 * Shared helpers for E2E tests.
 * Use these to avoid duplication and handle common UI (e.g. cookie banner).
 */

/**
 * Dismiss cookie consent banner if it is visible (clicks "Accept All").
 * Safe to call on any page; no-op if banner is not present.
 * @param {import('@playwright/test').Page} page
 */
export async function dismissCookieBannerIfVisible(page) {
  const acceptBtn = page.getByRole('button', { name: /Accept All/i });
  try {
    await acceptBtn.click({ timeout: 2000 });
  } catch {
    // Banner not visible or already dismissed
  }
}

/**
 * Scroll the footer into view so footer links are clickable.
 * Use before clicking footer links (especially on smaller viewports).
 * @param {import('@playwright/test').Page} page
 */
export async function scrollFooterIntoView(page) {
  const footer = page.getByText('© 2026').or(page.getByRole('contentinfo'));
  await footer.first().scrollIntoViewIfNeeded();
}
