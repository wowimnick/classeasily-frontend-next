const PRODUCTION_HOSTS = ["classeasily.com", "www.classeasily.com"];

export function isClassEasilyProductionHost() {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location?.hostname?.toLowerCase?.() || "";
    return PRODUCTION_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/** Staging, preview, localhost, and any non-production host. */
export function isNonProductionHost() {
  return !isClassEasilyProductionHost();
}

export const BOOKING_DEMO_STORAGE_KEY = "ce.bookings.demoData";
export const DEMO_CHANGE_EVENT = "ce-demo-data-change";

function emitDemoChange() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(DEMO_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function isBookingDemoEnabled() {
  if (!isNonProductionHost()) return false;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(BOOKING_DEMO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setBookingDemoEnabled(on) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(BOOKING_DEMO_STORAGE_KEY, "1");
    else window.localStorage.removeItem(BOOKING_DEMO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emitDemoChange();
}

/** Non-prod: if the live request failed, turn demo on and return fixtures. */
export function fallbackToDemo(result, loadFixtures) {
  if (result?.success && result.data != null) return result;
  if (!isNonProductionHost()) return result;
  setBookingDemoEnabled(true);
  try {
    return loadFixtures();
  } catch {
    return result;
  }
}
