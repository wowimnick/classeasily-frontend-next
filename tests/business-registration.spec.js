// @ts-check
import { test, expect } from '@playwright/test';
import { dismissCookieBannerIfVisible, gotoPath } from './helpers.js';

const DASHBOARD_PERM = 'quickstart.access_business_dashboard';

/** @param {Record<string, unknown>} extra */
function mockUser(extra = {}) {
  return {
    userId: 4242,
    id: 4242,
    email: 'saas-e2e@example.com',
    first_name: 'Maya',
    has_business: false,
    permissions: [DASHBOARD_PERM],
    ...extra,
  };
}

/**
 * @param {import('@playwright/test').Route} route
 * @param {unknown} data
 * @param {number} [status]
 */
async function fulfillJson(route, data, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

function apiIncludes(path) {
  return (url) => {
    const href = typeof url === 'string' ? url : url.href;
    return href.includes(path);
  };
}

test.describe('Business registration', () => {
  test('registration page loads the account step', async ({ page }) => {
    test.setTimeout(90000);
    await gotoPath(page, '/business/register');
    await dismissCookieBannerIfVisible(page);
    await expect(page.getByRole('heading', { name: /Start with your account/i })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole('button', { name: /Sign up/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible();
  });

  test('plan query is honored on the plan step after a mocked account', async ({ page }) => {
    test.setTimeout(90000);
    const user = mockUser();
    let onboarding = {
      has_business: true,
      has_paid_subscription: false,
      is_active: false,
      onboarding_completed: false,
      business_name: 'Clay Studio',
      timezone: 'America/Toronto',
    };

    await page.route(apiIncludes('/token/refresh'), (route) => fulfillJson(route, { user }));
    await page.route(apiIncludes('/my-business/onboarding-state'), (route) =>
      fulfillJson(route, onboarding),
    );

    await page.addInitScript((storedUser) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user: storedUser, isAuthenticated: true },
          version: 0,
        }),
      );
    }, user);

    await gotoPath(page, '/business/register?plan=advanced');
    await dismissCookieBannerIfVisible(page);
    await expect(page.getByRole('heading', { name: /Pick a plan/i })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText('Advanced', { exact: true })).toBeVisible();
    await expect(page.getByText(/\$89/)).toBeVisible();
  });

  test('happy path: account → business → plan → mocked Stripe pay → skippable onboarding', async ({
    page,
  }) => {
    test.setTimeout(180000);
    const user = mockUser();
    /** @type {Record<string, unknown>} */
    let onboarding = {
      has_business: false,
      has_paid_subscription: false,
      is_active: false,
      onboarding_completed: false,
      business_name: '',
      timezone: 'America/Toronto',
    };

    await page.route(apiIncludes('/auth/registration'), (route) => fulfillJson(route, { user }));
    await page.route(apiIncludes('/api/login'), (route) => fulfillJson(route, { user }));
    await page.route(apiIncludes('/token/refresh'), (route) => fulfillJson(route, { user }));
    await page.route(apiIncludes('/my-business/onboarding-state'), async (route) => {
      if (route.request().method() === 'POST') {
        onboarding = { ...onboarding, onboarding_completed: true };
        await fulfillJson(route, onboarding);
        return;
      }
      await fulfillJson(route, onboarding);
    });
    await page.route(apiIncludes('/api/business/register'), async (route) => {
      onboarding = {
        ...onboarding,
        has_business: true,
        business_name: 'Clay Studio',
      };
      await fulfillJson(route, { id: 1, businessName: 'Clay Studio' });
    });
    await page.route(apiIncludes('/widget-subscription/checkout'), (route) =>
      fulfillJson(route, { client_secret: 'cs_test_mocked_embedded_checkout' }),
    );
    await page.route(apiIncludes('/my-business/profile'), (route) =>
      fulfillJson(route, { ok: true }),
    );

    await gotoPath(page, '/business/register?plan=growth');
    await dismissCookieBannerIfVisible(page);
    await expect(page.getByRole('heading', { name: /Start with your account/i })).toBeVisible({
      timeout: 30000,
    });

    await page.getByLabel('First name').fill('Maya');
    await page.getByLabel('Email').fill('saas-e2e@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(page.getByRole('heading', { name: /Tell us about the business/i })).toBeVisible({
      timeout: 30000,
    });
    await page.getByLabel('Business name').fill('Clay Studio');
    await page.getByLabel('Website').fill('https://claystudio.example');
    await page.getByLabel('Phone').fill('+15551234567');
    await page.getByRole('checkbox').nth(0).check();
    await page.getByRole('checkbox').nth(1).check();
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await expect(page.getByRole('heading', { name: /Pick a plan/i })).toBeVisible({
      timeout: 20000,
    });
    await page.getByRole('button', { name: /Continue with Growth/i }).click();

    await expect(page.getByRole('heading', { name: /Activate ClassEasily/i })).toBeVisible();
    const checkoutWait = page.waitForRequest((req) =>
      req.url().includes('/widget-subscription/checkout/'),
    );
    await page.getByRole('button', { name: /Continue to payment/i }).click();
    await checkoutWait;

    onboarding = {
      ...onboarding,
      has_paid_subscription: true,
      is_active: true,
    };
    await gotoPath(page, '/business/register?step=timezone');
    await expect(page.getByRole('heading', { name: /Set your timezone/i })).toBeVisible({
      timeout: 20000,
    });
    await page.getByRole('button', { name: /^Skip$/i }).click();
    await expect(page.getByRole('heading', { name: /Get paid for bookings/i })).toBeVisible();
    await page.getByRole('button', { name: /Skip for now/i }).click();
    await expect(page.getByText(/is ready to embed/i)).toBeVisible();
    await page.getByRole('button', { name: /Go to dashboard/i }).click();
    await expect(page).toHaveURL(/\/business\/dashboard/, { timeout: 30000 });
  });

  test('unpaid new business is redirected from dashboard to register pay step', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const user = mockUser({ has_business: true });
    const onboarding = {
      has_business: true,
      has_paid_subscription: false,
      is_active: false,
      onboarding_completed: false,
      business_name: 'Clay Studio',
    };

    await page.addInitScript((storedUser) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user: storedUser, isAuthenticated: true },
          version: 0,
        }),
      );
    }, user);

    await page.route(apiIncludes('/token/refresh'), (route) => fulfillJson(route, { user }));
    await page.route(apiIncludes('/my-business/onboarding-state'), (route) =>
      fulfillJson(route, onboarding),
    );

    await gotoPath(page, '/business/dashboard');
    await expect(page).toHaveURL(/\/business\/register\?step=pay/, { timeout: 30000 });
  });
});
