"use client";

import { useEffect } from "react";
import { isChunkLoadError } from "@/lib/chunk-load-error";
import { tryReloadForStaleChunk } from "@/lib/reload-on-stale-chunk";

function handleStaleChunk(event) {
  const error =
    event?.reason ??
    event?.error ??
    (typeof event?.message === "string" ? event.message : null);
  if (!isChunkLoadError(error)) return;
  tryReloadForStaleChunk();
}

/**
 * Recover from deployment skew: old HTML referencing evicted JS chunks.
 */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    window.addEventListener("error", handleStaleChunk);
    window.addEventListener("unhandledrejection", handleStaleChunk);
    return () => {
      window.removeEventListener("error", handleStaleChunk);
      window.removeEventListener("unhandledrejection", handleStaleChunk);
    };
  }, []);

  return null;
}
