const CHUNK_RELOAD_SESSION_KEY = "ce:deployment-chunk-reload";

const CHUNK_LOAD_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /dynamically imported module/i,
];

export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export function isDeploymentChunkLoadError(error) {
  const message = getErrorMessage(error);
  if (!message) return false;
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

export function shouldDropDeploymentChunkSentryEvent(event) {
  const exceptionValues = event?.exception?.values;
  if (!Array.isArray(exceptionValues)) {
    return isDeploymentChunkLoadError(event?.message);
  }
  return exceptionValues.some((entry) =>
    isDeploymentChunkLoadError(entry?.value || entry?.type)
  );
}

export function attemptDeploymentChunkRecovery() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

export function registerDeploymentChunkRecovery() {
  if (typeof window === "undefined") return;

  const handleFailure = (error) => {
    if (!isDeploymentChunkLoadError(error)) return;
    attemptDeploymentChunkRecovery();
  };

  window.addEventListener(
    "error",
    (event) => {
      handleFailure(event.error || event.message);
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    handleFailure(event.reason);
  });
}
