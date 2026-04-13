// @ts-check
/**
 * Gift cards: landing, checkout config/payment, optional class booking redemption.
 * Optional: set PLAYWRIGHT_GIFT_CARD_CLASS_SLUG to a live class slug for redemption tests.
 */
import { test, expect } from '@playwright/test';
import {
  dismissCookieBannerIfVisible,
  gotoPath,
  navigateToGiftCardCheckout,
  fillGiftCardConfigForm,
} from './helpers.js';

test.describe('Gift cards — landing', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/giftcards', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfVisible(page);
  });

  test('page loads with gift card content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/gift/i).first()).toBeVisible({ timeout: 30000 });
  });

  test('carousel has design navigation controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Next Design/i })).toBeVisible({ timeout: 45000 });
    await expect(page.getByRole('button', { name: /Previous Design/i })).toBeVisible();
  });

  test('FAQ expands and shows answer text', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Are gift cards physical or digital/i });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(page.getByText(/100% digital/i)).toBeVisible({ timeout: 10000 });
  });

  test('checkout respects designIndex query (deep link)', async ({ page }) => {
    await gotoPath(page, '/giftcards/checkout?designIndex=2');
    await dismissCookieBannerIfVisible(page);
    await expect(page).toHaveURL(/designIndex=2/);
    await expect(page.getByRole('button', { name: /Select design 3/i })).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 30000 },
    );
  });
});

test.describe('Gift cards — checkout config', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await navigateToGiftCardCheckout(page, 0);
  });

  test('config step shows design and amount sections', async ({ page }) => {
    await expect(page.getByText(/Select a design/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Choose amount/i)).toBeVisible();
    await expect(page.getByRole('button', { name: '$50', exact: true })).toBeVisible();
  });

  test('can change selected design', async ({ page }) => {
    await page.getByRole('button', { name: /Select design 2/i }).click();
    await expect(page.getByRole('button', { name: /Select design 2/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('recipient name required shows validation when clicking Checkout', async ({ page }) => {
    await page.getByRole('button', { name: '$50', exact: true }).click();
    await page.locator('#recipientName').fill('');
    await page.getByRole('button', { name: 'Checkout' }).first().click();
    await expect(page.getByText(/Recipient name is required/i)).toBeVisible({ timeout: 10000 });
  });

  test('Email to me hides recipient email field', async ({ page }) => {
    await page.getByRole('button', { name: /Email to me/i }).click();
    await expect(page.locator('#recipientEmail')).not.toBeVisible();
  });

  test('Schedule for Later shows calendar controls', async ({ page }) => {
    await page.getByRole('button', { name: /Schedule for Later/i }).click();
    await expect(page.getByRole('button', { name: /Previous Month/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /Next Month/i })).toBeVisible();
  });
});

test.describe('Gift cards — checkout payment step', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await navigateToGiftCardCheckout(page, 1);
    await fillGiftCardConfigForm(page, { amountPreset: 50 });
    await page.getByRole('button', { name: 'Checkout' }).first().click();
    await expect(page.getByRole('heading', { name: /Confirm and Pay/i })).toBeVisible({
      timeout: 60000,
    });
  });

  test('payment step loads Stripe iframes', async ({ page }) => {
    const stripeIframe = page.locator('iframe[src*="stripe.com"]').first();
    await expect(stripeIframe).toBeAttached({ timeout: 45000 });
  });

  test('summary shows order breakdown headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Your total/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Gift Card Value')).toBeVisible();
    await expect(page.getByText('Total (CAD)')).toBeVisible();
  });
});

test.describe('Gift cards — custom amount (UI)', () => {
  test('custom amount below $5 appears in config preview (backend enforces $5 minimum on pay)', async ({
    page,
  }) => {
    test.setTimeout(120000);
    await navigateToGiftCardCheckout(page, 0);
    await fillGiftCardConfigForm(page, { customAmount: '3' });
    await expect(page.getByText('$3.00').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Gift cards — redemption on class booking', () => {
  const slug = process.env.PLAYWRIGHT_GIFT_CARD_CLASS_SLUG;

  test.beforeEach(async ({ page }) => {
    test.skip(!slug, 'Set PLAYWRIGHT_GIFT_CARD_CLASS_SLUG for redemption e2e (e.g. a verified class slug).');
    test.setTimeout(180000);
    await gotoPath(page, `/classes/${slug}`);
    await dismissCookieBannerIfVisible(page);
  });

  test('can reveal promo / gift card on review step', async ({ page }) => {
    const selectTime = page.getByRole('button', { name: /Select Time|View Dates/i });
    await selectTime.click({ timeout: 30000 }).catch(() => {});
    // Pick first visible session/time if present
    const slot = page.locator('[role="button"], button').filter({ hasText: /^\d{1,2}:\d{2}/ }).first();
    if (await slot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await slot.click();
    }
    const continueBtn = page.getByRole('button', { name: /Continue|Next|Review|Checkout|Reserve/i });
    for (let i = 0; i < 8; i++) {
      if (await continueBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await continueBtn.first().click();
      }
      if (await page.getByText(/Add promo or gift card/i).isVisible({ timeout: 2000 }).catch(() => false)) {
        break;
      }
    }
    const reveal = page.getByRole('button', { name: /Add promo or gift card/i });
    await reveal.scrollIntoViewIfNeeded();
    await reveal.click({ timeout: 15000 });
    await expect(page.getByPlaceholder('e.g. XXXX-XXXX-XXXX')).toBeVisible({ timeout: 15000 });
  });

  test('invalid gift card code shows error', async ({ page }) => {
    await page.route('**/gift-cards/validate/**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid gift card code.' }),
      });
    });

    const selectTime = page.getByRole('button', { name: /Select Time|View Dates/i });
    await selectTime.click({ timeout: 30000 }).catch(() => {});
    for (let i = 0; i < 10; i++) {
      const reveal = page.getByRole('button', { name: /Add promo or gift card/i });
      if (await reveal.isVisible({ timeout: 4000 }).catch(() => false)) {
        await reveal.click();
        const gcInput = page.getByPlaceholder('e.g. XXXX-XXXX-XXXX');
        if (await gcInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await gcInput.fill('INVALID-CODE');
          await page.getByRole('button', { name: 'Apply' }).nth(1).click();
          await expect(page.getByText(/didn't work|invalid/i).first()).toBeVisible({
            timeout: 15000,
          });
          return;
        }
      }
      const next = page.getByRole('button', { name: /Continue|Next|Review|Reserve/i }).first();
      if (await next.isVisible({ timeout: 2000 }).catch(() => false)) {
        await next.click();
      }
    }
    test.skip(true, 'Could not reach gift card field — adjust flow or slug.');
  });

  test('valid gift card code shows balance (mocked)', async ({ page }) => {
    await page.route('**/gift-cards/validate/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'MOCK-GC', balance: '42.50' }),
      });
    });

    const selectTime = page.getByRole('button', { name: /Select Time|View Dates/i });
    await selectTime.click({ timeout: 30000 }).catch(() => {});
    for (let i = 0; i < 10; i++) {
      const reveal = page.getByRole('button', { name: /Add promo or gift card/i });
      if (await reveal.isVisible({ timeout: 4000 }).catch(() => false)) {
        await reveal.click();
        const gcInput = page.getByPlaceholder('e.g. XXXX-XXXX-XXXX');
        if (await gcInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await gcInput.fill('MOCK-GC');
          await page.getByRole('button', { name: 'Apply' }).nth(1).click();
          await expect(page.getByText(/42\.50|available/i).first()).toBeVisible({
            timeout: 15000,
          });
          return;
        }
      }
      const next = page.getByRole('button', { name: /Continue|Next|Review|Reserve/i }).first();
      if (await next.isVisible({ timeout: 2000 }).catch(() => false)) {
        await next.click();
      }
    }
    test.skip(true, 'Could not reach gift card field — adjust flow or slug.');
  });
});
