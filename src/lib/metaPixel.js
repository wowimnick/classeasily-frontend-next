/**
 * Meta (Facebook) Pixel helpers.
 * - Production: pixel runs normally (classeasily.com, www.classeasily.com).
 * - Staging: pixel runs ONLY when NEXT_PUBLIC_META_PIXEL_TEST_EVENT_CODE is set;
 *   events then go to Test Events so we never litter prod data.
 */

const PRODUCTION_HOSTS = ["classeasily.com", "www.classeasily.com"];
const STAGING_HOSTS = ["staging.classeasily.com"];

/**
 * Read a cookie value by name (for _fbc, _fbp used by Meta CAPI).
 * @param {string} name - Cookie name
 * @returns {string|null}
 */
function getCookie(name) {
  if (typeof document === "undefined" || !document.cookie) return null;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === name + "=") {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Get Meta Pixel cookie params for CAPI (fbc, fbp). Pass these in booking/payment API
 * requests so the server can send them to Meta Conversions API (Parameter Builder best practice).
 * Do not normalize or change case; _fbc is case-sensitive.
 * @returns {{ meta_fbc?: string, meta_fbp?: string }}
 */
export function getMetaPixelParams() {
  const meta_fbc = getCookie("_fbc");
  const meta_fbp = getCookie("_fbp");
  const out = {};
  if (meta_fbc) out.meta_fbc = meta_fbc;
  if (meta_fbp) out.meta_fbp = meta_fbp;
  return out;
}

export function isClasseasilyProduction() {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location?.hostname?.toLowerCase?.() || "";
    return PRODUCTION_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/** Only set on staging; never on prod. Used so staging events go to Test Events. */
export function getMetaPixelTestEventCode() {
  if (typeof window === "undefined") return null;
  try {
    const host = window.location?.hostname?.toLowerCase() || "";
    if (!STAGING_HOSTS.includes(host)) return null;
    const code = (process.env.NEXT_PUBLIC_META_PIXEL_TEST_EVENT_CODE || "").trim();
    return code || null;
  } catch {
    return null;
  }
}

/** Run pixel on production always; on staging only when test code is set (never litter prod). */
export function shouldRunPixel() {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location?.hostname?.toLowerCase() || "";
    const isProd = PRODUCTION_HOSTS.includes(host);
    const isStaging = STAGING_HOSTS.includes(host);
    const testCode = isStaging ? getMetaPixelTestEventCode() : null;
    const run = isProd || (isStaging && !!testCode);
    if (isStaging) {
      console.warn("[Meta Pixel] shouldRunPixel: host=", host, "isStaging=true testCode=", testCode ? "set" : "NOT SET", "-> run=", run);
    }
    if (isProd) return true;
    if (isStaging && testCode) return true;
    return false;
  } catch {
    return false;
  }
}

/** Options to pass to fbq('track', ..., {}, options) so staging events appear in Test Events. */
export function getMetaPixelTestEventOptions() {
  const code = getMetaPixelTestEventCode();
  if (!code) return undefined;
  return { test_event_code: code };
}

/**
 * Fire Meta Pixel Purchase event on production, or on staging only when test code is set.
 * Uses eventID (from order_id) for CAPI deduplication: same value must be sent as event_id server-side.
 *
 * @param {Object} params - Purchase params (value, currency, content_name, content_ids, content_type, num_items, order_id)
 * @param {Object} [advancedMatch] - Advanced matching (em, ph, fn, ln, ct, st, zp, country)
 */
export function trackPurchaseIfProduction(params, advancedMatch = {}) {
  if (!shouldRunPixel()) return;
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

  const options = { ...match, ...getMetaPixelTestEventOptions() };
  window.fbq("track", "Purchase", eventParams, Object.keys(options).length ? options : undefined);
}

/**
 * Track a pixel event (ViewContent, AddToCart, etc.). Runs only on prod or staging with test code.
 * Staging events include test_event_code so they appear in Test Events.
 */
export function trackPixelEvent(eventName, eventParams = {}, options = {}) {
  if (!shouldRunPixel()) return;
  if (typeof window === "undefined" || !window.fbq) return;
  const opts = { ...options, ...getMetaPixelTestEventOptions() };
  window.fbq("track", eventName, eventParams, Object.keys(opts).length ? opts : undefined);
}
