import posthog from "posthog-js";

const PENDING_KEY = "classeasily_giftcard_pending_analytics";
const TRACKED_PREFIX = "classeasily_giftcard_tracked:";

export function paymentIntentIdFromClientSecret(clientSecret) {
  if (!clientSecret) return null;
  const match = String(clientSecret).match(/^(pi_[^_]+)/);
  return match?.[1] || null;
}

export function savePendingGiftCardAnalytics(payload) {
  if (typeof window === "undefined" || !payload) return;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function readPendingGiftCardAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingGiftCardAnalytics() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

function hasGiftCardPurchaseBeenTracked(dedupeId) {
  if (typeof window === "undefined" || !dedupeId) return false;
  try {
    return sessionStorage.getItem(`${TRACKED_PREFIX}${dedupeId}`) === "1";
  } catch {
    return false;
  }
}

function markGiftCardPurchaseTracked(dedupeId) {
  if (typeof window === "undefined" || !dedupeId) return;
  try {
    sessionStorage.setItem(`${TRACKED_PREFIX}${dedupeId}`, "1");
  } catch {
    // ignore
  }
}

/**
 * Fire giftcard_purchase_completed + purchase (for PostHog revenue).
 * Returns true when events were captured this call.
 */
export function captureGiftCardPurchase({
  amount,
  paymentIntentId,
  recipientEmail,
  sendToSelf,
  deliveryMethod,
}) {
  const revenue = Number(amount);
  if (!Number.isFinite(revenue) || revenue <= 0) return false;

  const dedupeId = paymentIntentId ? `gc:${paymentIntentId}` : null;
  if (!dedupeId || hasGiftCardPurchaseBeenTracked(dedupeId)) return false;

  const properties = {
    amount: revenue,
    revenue,
    currency: "CAD",
    recipient_email: recipientEmail || undefined,
    send_to_self: Boolean(sendToSelf),
    delivery_method: deliveryMethod || undefined,
    payment_intent_id: paymentIntentId || undefined,
  };

  posthog.capture("giftcard_purchase_completed", properties, {
    $insert_id: dedupeId,
  });
  posthog.capture(
    "purchase",
    {
      ...properties,
      $value: revenue,
      product_type: "gift_card",
    },
    { $insert_id: `purchase-${dedupeId}` },
  );

  markGiftCardPurchaseTracked(dedupeId);
  clearPendingGiftCardAnalytics();
  return true;
}
