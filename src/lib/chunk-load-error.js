/** Session guard: at most one auto-reload per minute for stale chunk failures. */
export const CHUNK_RELOAD_STORAGE_KEY = "__ce_chunk_reload_ts__";
export const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

const CHUNK_LOAD_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
];

export function getChunkLoadErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const parts = [error.message, error.name];
    if (error.cause instanceof Error) {
      parts.push(error.cause.message);
    }
    return parts.filter(Boolean).join(" ");
  }
  return String(error);
}

export function isChunkLoadError(error) {
  const message = getChunkLoadErrorMessage(error);
  if (!message) return false;
  return CHUNK_LOAD_PATTERNS.some((re) => re.test(message));
}

export function shouldReloadForChunkError(storage) {
  const store =
    storage ??
    (typeof window !== "undefined" ? window.sessionStorage : null);
  if (!store) return false;
  try {
    const raw = store.getItem(CHUNK_RELOAD_STORAGE_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts > CHUNK_RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markChunkReloadAttempted(storage) {
  if (typeof window === "undefined") return;
  const store = storage ?? window.sessionStorage;
  try {
    store.setItem(CHUNK_RELOAD_STORAGE_KEY, String(Date.now()));
  } catch {
    // sessionStorage may be unavailable (private mode, bots)
  }
}

/** Reload once when a stale deployment chunk fails; returns true if reload was triggered. */
export function handleClientChunkLoadFailure(storage) {
  if (typeof window === "undefined") return false;
  if (!shouldReloadForChunkError(storage)) return false;
  markChunkReloadAttempted(storage);
  window.location.reload();
  return true;
}

/** Drop transient chunk-load noise from Sentry (common during Vercel deploys). */
export function shouldDropChunkLoadFromSentry(event, error) {
  if (isChunkLoadError(error)) return true;
  const title =
    event?.exception?.values?.[0]?.value ??
    event?.exception?.values?.[0]?.type ??
    event?.message ??
    "";
  return isChunkLoadError(title);
}
