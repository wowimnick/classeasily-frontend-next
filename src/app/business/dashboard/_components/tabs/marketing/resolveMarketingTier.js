/**
 * Merge marketing tier from account API with addons catalog when price_id matches.
 * Fixes false "locked" tabs when /marketing/account returns tier: null but getAddons has current_price_id + tiers[].
 *
 * @param {object | null | undefined} accountTier - from getMarketingAccount().tier
 * @param {string | null | undefined} currentPriceId - addons.email_marketing.current_price_id
 * @param {Array<object> | undefined} catalogTiers - addons.email_marketing.tiers
 * @returns {object | null}
 */
export function resolveEffectiveMarketingTier(accountTier, currentPriceId, catalogTiers) {
  if (accountTier && typeof accountTier === "object") return accountTier;
  if (!currentPriceId || !Array.isArray(catalogTiers)) return null;
  const hit = catalogTiers.find((t) => t && t.price_id === currentPriceId);
  return hit || null;
}
