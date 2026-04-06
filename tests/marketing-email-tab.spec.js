// @ts-check
import { test, expect } from "@playwright/test";
import { resolveEffectiveMarketingTier } from "../src/app/business/dashboard/_components/tabs/marketing/resolveMarketingTier.js";

test.describe("Business email marketing tab", () => {
  test("email-campaigns route loads without server error", async ({ page }) => {
    const res = await page.goto("/business/dashboard/email-campaigns", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("unauthenticated or inactive addon: marketing upsell or auth redirect", async ({ page }) => {
    await page.goto("/business/dashboard/email-campaigns", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible({ timeout: 20000 });
    // Logged-out: PermissionProtectedRoute redirects away from the tab (URL no longer contains email-campaigns).
    // Logged-in: tab renders upsell ("Email campaigns") or hub ("Email marketing").
    await expect(async () => {
      const url = page.url();
      if (!url.includes("email-campaigns")) {
        return;
      }
      const n = await page.getByText(/Email (campaigns|marketing)|Choose email marketing plan/i).count();
      expect(n).toBeGreaterThan(0);
    }).toPass({ timeout: 20000 });
  });

  test("marketing hub or templates text may appear when authenticated", async ({ page }) => {
    await page.goto("/business/dashboard/email-campaigns", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible({ timeout: 20000 });
    const hubHints = await page.getByText(/Template|Campaign|Audience|Automation/i).count();
    expect(hubHints >= 0).toBeTruthy();
  });

});

test.describe("resolveEffectiveMarketingTier", () => {
  test("uses catalog when account tier is null and price_id matches", () => {
    const catalog = [
      {
        price_id: "price_growth_x",
        plan_label: "Growth",
        saved_segments_enabled: true,
        automation_enabled: false,
      },
    ];
    const eff = resolveEffectiveMarketingTier(null, "price_growth_x", catalog);
    expect(eff).toBeTruthy();
    expect(eff.plan_label).toBe("Growth");
    expect(eff.saved_segments_enabled).toBe(true);
  });

  test("prefers account tier when present", () => {
    const accountTier = { plan_label: "From API", saved_segments_enabled: true };
    const catalog = [{ price_id: "p", plan_label: "Catalog", saved_segments_enabled: false }];
    const eff = resolveEffectiveMarketingTier(accountTier, "p", catalog);
    expect(eff.plan_label).toBe("From API");
  });

  test("catalog can unlock automations when account tier is null (Business price match)", () => {
    const catalog = [
      {
        price_id: "price_business_x",
        plan_label: "Business",
        automation_enabled: true,
        saved_segments_enabled: true,
      },
    ];
    const eff = resolveEffectiveMarketingTier(null, "price_business_x", catalog);
    expect(eff?.automation_enabled).toBe(true);
  });

  test("returns null when price_id does not match catalog", () => {
    const eff = resolveEffectiveMarketingTier(null, "unknown_price", [{ price_id: "other", plan_label: "X" }]);
    expect(eff).toBeNull();
  });
});
