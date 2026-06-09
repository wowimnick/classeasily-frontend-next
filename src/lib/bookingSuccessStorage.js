const SUCCESS_SESSION_KEY = "classeasily_booking_success";
const SUCCESS_LOCAL_PREFIX = "classeasily_booking_success:";
const PURCHASE_TRACKED_KEY = "classeasily_purchase_tracked";
const SUCCESS_LOCAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hasMeaningfulBookingPayload(data) {
  if (!data) return false;
  if (data.bookingId != null || data.user_facing_reference) return true;
  const bookingData = data.bookingData;
  return Boolean(
    bookingData &&
      (bookingData.selectedSlots?.length > 0 ||
        bookingData.selectedOption ||
        bookingData.price != null),
  );
}

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

function isSparseBookingPayload(data) {
  const bookingData = data?.bookingData;
  return (
    !bookingData?.price ||
    !Array.isArray(bookingData?.selectedSlots) ||
    bookingData.selectedSlots.length === 0
  );
}

function withClassSlug(data, slug) {
  if (!data.classData && slug) {
    return { ...data, classData: { slug } };
  }
  return data;
}

export function loadBookingSuccessPayload({ slug, paymentIntentId } = {}) {
  if (typeof window === "undefined") return null;

  let sessionData = null;
  try {
    const raw = sessionStorage.getItem(SUCCESS_SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (hasMeaningfulBookingPayload(data)) {
        sessionData = withClassSlug(data, slug);
      }
    }
  } catch {
    // fall through to localStorage
  }

  const localData = readLocalBackup({ slug, paymentIntentId });
  if (!sessionData) {
    return localData ? withClassSlug(localData, slug) : null;
  }

  if (isSparseBookingPayload(sessionData) && localData?.bookingData?.price) {
    return withClassSlug(
      {
        ...localData,
        ...sessionData,
        bookingData: { ...localData.bookingData, ...sessionData.bookingData },
        classData: { ...localData.classData, ...sessionData.classData },
      },
      slug,
    );
  }

  return sessionData;
}

export function hasPurchaseBeenTracked(dedupeKey) {
  if (typeof window === "undefined" || !dedupeKey) return false;
  try {
    return sessionStorage.getItem(PURCHASE_TRACKED_KEY) === String(dedupeKey);
  } catch {
    return false;
  }
}

export function markPurchaseTracked(dedupeKey) {
  if (typeof window === "undefined" || !dedupeKey) return;
  try {
    sessionStorage.setItem(PURCHASE_TRACKED_KEY, String(dedupeKey));
  } catch {
    // sessionStorage may be unavailable
  }
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

export { SUCCESS_SESSION_KEY, PURCHASE_TRACKED_KEY };
