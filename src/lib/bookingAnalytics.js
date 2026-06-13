import posthog from "posthog-js";
import { trackPurchaseIfProduction } from "@/lib/metaPixel";
import {
  hasPurchaseBeenTracked,
  markPurchaseTracked,
} from "@/lib/bookingSuccessStorage";

export const isNumericBookingId = (v) =>
  v != null && /^\d+$/.test(String(v));

/**
 * Stable dedupe key for a checkout: payment intent is fixed for the whole flow,
 * so we do not fire again when a numeric booking id arrives from polling.
 */
export function getBookingPurchaseDedupeId({
  paymentIntentId,
  bookingId,
  reference,
} = {}) {
  if (paymentIntentId) return `pi:${paymentIntentId}`;
  if (isNumericBookingId(bookingId)) return `bid:${bookingId}`;
  if (reference) return `ref:${reference}`;
  return null;
}

function sendServerBackup(payload) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/booking-completed",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }
    fetch("/api/analytics/booking-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // non-critical backup path
  }
}

/**
 * Fire PostHog booking_completed + purchase and (when appropriate) Meta Purchase.
 * Returns true when events were captured this call.
 */
export function captureBookingPurchase({
  bookingData,
  classData,
  bookingId,
  reference,
  paymentIntentId,
}) {
  const actualBookingId = bookingId ?? bookingData?.bookingId;
  const dedupeId = getBookingPurchaseDedupeId({
    paymentIntentId,
    bookingId: actualBookingId,
    reference,
  });
  if (!dedupeId || hasPurchaseBeenTracked(dedupeId)) return false;

  const revenue = (bookingData?.price || 0) * (bookingData?.participants || 1);
  const currency = classData?.currency_code || "CAD";
  const properties = {
    class_id: classData?.classId || classData?.id,
    class_title: classData?.title,
    business_name: classData?.business_name,
    booking_id: actualBookingId || undefined,
    revenue,
    currency,
    $value: revenue,
    participants: bookingData?.participants ?? 1,
    payment_intent_id: paymentIntentId || undefined,
    product_type: "class_booking",
  };

  const captureOptions = { $insert_id: dedupeId };

  posthog.capture("booking_completed", properties, captureOptions);
  // Alias for PostHog revenue analytics dashboards
  posthog.capture(
    "purchase",
    { ...properties, $value: revenue },
    { $insert_id: `purchase-${dedupeId}` },
  );

  const orderIdForPixel = isNumericBookingId(actualBookingId)
    ? actualBookingId
    : reference || paymentIntentId;

  const userEmail = bookingData?.email || bookingData?.userEmail;
  const fullName = bookingData?.fullName || bookingData?.userName || "";
  const nameParts = fullName.trim().split(" ");

  if (orderIdForPixel) {
    trackPurchaseIfProduction(
      {
        value: revenue,
        currency,
        content_name: classData?.title,
        content_ids: [classData?.classId || classData?.id].filter(Boolean),
        content_type: "product",
        num_items: bookingData?.participants ?? 1,
        order_id: orderIdForPixel,
      },
      {
        em: userEmail,
        ph: bookingData?.phone || bookingData?.userPhone,
        fn: nameParts[0] || "",
        ln: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
        ct: bookingData?.city,
        st: bookingData?.state,
        zp: bookingData?.zipCode,
        country: "ca",
      },
    );
  }

  markPurchaseTracked(dedupeId);

  sendServerBackup({
    dedupe_id: dedupeId,
    distinct_id:
      typeof posthog.get_distinct_id === "function"
        ? posthog.get_distinct_id()
        : undefined,
    ...properties,
  });

  return true;
}
