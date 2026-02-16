/**
 * Meta (Facebook) Pixel helpers. Purchase events are only sent on classeasily.com
 * so we don't fire on staging or other domains.
 */

const ALLOWED_HOSTS = ["classeasily.com", "www.classeasily.com"];

export function isClasseasilyProduction() {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location?.hostname?.toLowerCase?.() || "";
    return ALLOWED_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/**
 * Fire Meta Pixel Purchase event only on classeasily.com.
 * Sends required parameters: value, currency; and recommended: content_ids, content_type, num_items, order_id.
 * Uses eventID (from order_id) for CAPI deduplication: same value must be sent as event_id server-side.
 *
 * @param {Object} params - Purchase params (value, currency, content_name, content_ids, content_type, num_items, order_id)
 * @param {Object} [advancedMatch] - Advanced matching (em, ph, fn, ln, ct, st, zp, country)
 */
export function trackPurchaseIfProduction(params, advancedMatch = {}) {
  if (!isClasseasilyProduction()) return;
  if (typeof window === "undefined" || !window.fbq) return;

  const value = Number(params?.value);
  const currency = params?.currency || "CAD";
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return;

  const eventParams = {
    value,
    currency,
    content_name: params?.content_name,
    content_ids: Array.isArray(params?.content_ids) ? params.content_ids : [params?.content_id].filter(Boolean),
    content_type: params?.content_type || "product",
    num_items: typeof params?.num_items === "number" ? params.num_items : 1,
    order_id: params?.order_id,
  };

  const match = {
    ...(advancedMatch?.em && { em: advancedMatch.em }),
    ...(advancedMatch?.ph && { ph: advancedMatch.ph }),
    ...(advancedMatch?.fn && { fn: advancedMatch.fn }),
    ...(advancedMatch?.ln && { ln: advancedMatch.ln }),
    ...(advancedMatch?.ct && { ct: advancedMatch.ct }),
    ...(advancedMatch?.st && { st: advancedMatch.st }),
    ...(advancedMatch?.zp && { zp: advancedMatch.zp }),
    country: advancedMatch?.country || "ca",
  };

  // Deduplication: same eventID as CAPI event_id (e.g. booking_id) so Meta counts one conversion
  if (params?.order_id != null) {
    match.eventID = String(params.order_id);
  }

  window.fbq("track", "Purchase", eventParams, Object.keys(match).length ? match : undefined);
}
