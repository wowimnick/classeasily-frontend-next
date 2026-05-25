const SUCCESS_SESSION_KEY = "classeasily_booking_success";
const SUCCESS_LOCAL_PREFIX = "classeasily_booking_success:";
const SUCCESS_LOCAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveBookingSuccessPayload(payload) {
  if (typeof window === "undefined" || !payload) return;
  const serialized = JSON.stringify(payload);
  try {
    sessionStorage.setItem(SUCCESS_SESSION_KEY, serialized);
  } catch {
    // sessionStorage may be unavailable in some embedded contexts
  }
  try {
    const slug =
      payload.classData?.slug ||
      payload.classData?.class_slug ||
      payload.classSlug;
    if (slug) {
      localStorage.setItem(
        `${SUCCESS_LOCAL_PREFIX}${slug}`,
        JSON.stringify({ savedAt: Date.now(), payload }),
      );
    }
    if (payload.payment_intent_id) {
      localStorage.setItem(
        `${SUCCESS_LOCAL_PREFIX}pi:${payload.payment_intent_id}`,
        JSON.stringify({ savedAt: Date.now(), payload }),
      );
    }
  } catch {
    // localStorage quota or privacy mode
  }
}

function readLocalBackup({ slug, paymentIntentId } = {}) {
  if (typeof window === "undefined") return null;
  const keys = [];
  if (paymentIntentId) keys.push(`${SUCCESS_LOCAL_PREFIX}pi:${paymentIntentId}`);
  if (slug) keys.push(`${SUCCESS_LOCAL_PREFIX}${slug}`);
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (
        parsed?.savedAt &&
        Date.now() - parsed.savedAt > SUCCESS_LOCAL_TTL_MS
      ) {
        localStorage.removeItem(key);
        continue;
      }
      if (parsed?.payload) return parsed.payload;
    } catch {
      // ignore corrupt entries
    }
  }
  return null;
}

export function loadBookingSuccessPayload({ slug, paymentIntentId } = {}) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SUCCESS_SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.bookingData && data?.classData) return data;
    }
  } catch {
    // fall through to localStorage
  }
  return readLocalBackup({ slug, paymentIntentId });
}

export function clearBookingSuccessPayload(slug) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SUCCESS_SESSION_KEY);
  } catch {
    // ignore
  }
  if (slug) {
    try {
      localStorage.removeItem(`${SUCCESS_LOCAL_PREFIX}${slug}`);
    } catch {
      // ignore
    }
  }
}

export { SUCCESS_SESSION_KEY };
