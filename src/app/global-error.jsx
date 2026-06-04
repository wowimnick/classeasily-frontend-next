"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import {
  attemptChunkLoadRecovery,
  isChunkLoadError,
} from "@/lib/chunk-load-recovery";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (isChunkLoadError(error) && attemptChunkLoadRecovery()) {
      return;
    }
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
