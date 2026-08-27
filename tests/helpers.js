// @ts-check
/**
 * Shared helpers for E2E tests.
 * Optional auth: set PLAYWRIGHT_TEST_USER_EMAIL and PLAYWRIGHT_TEST_USER_PASSWORD for login flows.
 */

/**
 * `commit` resolves as soon as the navigation is committed (before DOMContentLoaded).
 * Under parallel load, `domcontentloaded` can still exceed timeouts on heavy pages.
 */
export const DEFAULT_GOTO_OPTIONS = {
  waitUntil: 'commit',
  timeout: 120_000,
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 * @param {Record<string, unknown>} [extra] merged into goto options
 */
export async function gotoPath(page, path, extra = {}) {
  await page.goto(path, { ...DEFAULT_GOTO_OPTIONS, ...extra });
  await page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => {});
}

/**
 * Guest header: "Log in" / "Sign up" live in a dropdown opened by the first header button
 * (menu + avatar), not as standalone buttons — see Header.jsx GuestMenuItem.
 * Header Suspense fallback (HeaderFallback) has no button until hydrated — wait for it.
 * @param {import('@playwright/test').Page} page
 */
export async function openHeaderGuestMenu(page) {
  const header = page.locator('header').first();
  await header.waitFor({ state: 'visible', timeout: 60_000 });
  const menuBtn = header.getByRole('button').first();
  await menuBtn.waitFor({ state: 'visible', timeout: 45_000 });
  await menuBtn.click();
}

/**
 * Opens the auth modal via header guest menu.
 * @param {import('@playwright/test').Page} page
 */
export async function openLoginModalFromHeader(page) {
  const header = page.locator('header').first();
  await header.waitFor({ state: 'visible', timeout: 60_000 });
  const loginBtn = header.getByRole('button', { name: /^Log in$/i });
  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click({ timeout: 15_000 });
    return;
  }
  await openHeaderGuestMenu(page);
  await page.getByText('Log in', { exact: true }).click({ timeout: 15_000 });
}

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
 * @param {import('@playwright/test').Page} page
 */
export async function scrollFooterIntoView(page) {
  const footer = page.getByText('© 2026').or(page.getByRole('contentinfo'));
  await footer.first().scrollIntoViewIfNeeded();
}

/** @returns {boolean} */
export function hasTestCredentials() {
  return !!(process.env.PLAYWRIGHT_TEST_USER_EMAIL && process.env.PLAYWRIGHT_TEST_USER_PASSWORD);
}

/**
 * Log in via header "Log in" and email/password fields (adjust selectors if AuthModal changes).
 * Requires PLAYWRIGHT_TEST_USER_EMAIL / PLAYWRIGHT_TEST_USER_PASSWORD.
 * @param {import('@playwright/test').Page} page
 * @param {string} [email]
 * @param {string} [password]
 */
export async function loginAsUser(page, email, password) {
  const em = email || process.env.PLAYWRIGHT_TEST_USER_EMAIL;
  const pw = password || process.env.PLAYWRIGHT_TEST_USER_PASSWORD;
  if (!em || !pw) {
    throw new Error('Set PLAYWRIGHT_TEST_USER_EMAIL and PLAYWRIGHT_TEST_USER_PASSWORD');
  }
  await gotoPath(page, '/');
  await dismissCookieBannerIfVisible(page);
  await openLoginModalFromHeader(page);
  const emailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"]')).first();
  await emailInput.fill(em);
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(pw);
  await page.getByRole('button', { name: /^(Log in|Sign in|Continue)$/i }).click();
}

export async function loginAsBusinessOwner(page) {
  return loginAsUser(page);
}

export async function loginAsAdmin(page) {
  const em = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL;
  const pw = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD;
  if (!em || !pw) {
    throw new Error('Set PLAYWRIGHT_TEST_ADMIN_EMAIL and PLAYWRIGHT_TEST_ADMIN_PASSWORD');
  }
  return loginAsUser(page, em, pw);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} tabSegment e.g. "overview", "email-campaigns", "settings"
 */
export async function navigateToDashboardTab(page, tabSegment) {
  const path = tabSegment === 'overview' ? '/business/dashboard' : `/business/dashboard/${tabSegment}`;
  await gotoPath(page, path);
  await dismissCookieBannerIfVisible(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} tabKey e.g. "overview", "users"
 */
export async function navigateToAdminTab(page, tabKey) {
  await gotoPath(page, `/admin/${tabKey}`);
  await dismissCookieBannerIfVisible(page);
}

/**
 * Wait until a response matching URL substring is received (or timeout).
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} urlPattern
 * @param {number} [timeoutMs]
 */
export async function waitForApiResponse(page, urlPattern, timeoutMs = 30000) {
  return page.waitForResponse(
    (res) => {
      const u = res.url();
      return typeof urlPattern === 'string' ? u.includes(urlPattern) : urlPattern.test(u);
    },
    { timeout: timeoutMs }
  );
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} [designIndex]
 */
export async function navigateToGiftCardCheckout(page, designIndex = 0) {
  const q = Number.isFinite(designIndex) ? `?designIndex=${designIndex}` : '';
  await gotoPath(page, `/giftcards/checkout${q}`);
  await dismissCookieBannerIfVisible(page);
}

/**
 * Fills the gift card config step (Ant Design form). Assumes preset amount is used unless customAmount is set.
 * @param {import('@playwright/test').Page} page
 * @param {{
 *   amountPreset?: number,
 *   customAmount?: string,
 *   recipientName?: string,
 *   recipientEmail?: string,
 *   senderName?: string,
 *   senderEmail?: string,
 *   message?: string,
 * }} opts
 */
export async function fillGiftCardConfigForm(page, opts = {}) {
  const {
    amountPreset = 50,
    customAmount,
    recipientName = 'Playwright Recipient',
    recipientEmail = 'recipient-e2e@example.com',
    senderName = 'Playwright Sender',
    senderEmail = 'sender-e2e@example.com',
    message = 'Enjoy your class!',
  } = opts;

  if (customAmount != null && customAmount !== '') {
    await page.getByRole('button', { name: 'Custom' }).click();
    await page.getByLabel('Custom Amount').fill(String(customAmount));
  } else {
    await page.getByRole('button', { name: `$${amountPreset}`, exact: true }).click();
  }

  await page.locator('#recipientName').fill(recipientName);
  const recEmail = page.locator('#recipientEmail');
  if (await recEmail.isVisible().catch(() => false)) {
    await recEmail.fill(recipientEmail);
  }
  await page.getByPlaceholder('e.g. Jane Smith').fill(senderName);
  const senderEmailInput = page.getByPlaceholder('e.g. you@example.com');
  if (await senderEmailInput.isVisible().catch(() => false)) {
    await senderEmailInput.fill(senderEmail);
  }
  const note = page.getByPlaceholder('Write a personal note...');
  if (await note.isVisible().catch(() => false)) {
    await note.fill(message);
  }
}
