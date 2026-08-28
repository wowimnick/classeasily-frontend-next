"use client";

import { useEffect } from "react";
import { captureRouteError } from "@/lib/capture-route-error";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    captureRouteError(error, "Registration page error:");
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Something went wrong</h1>
      <p style={{ margin: 0, maxWidth: 480, color: "#000" }}>
        We encountered an error loading the registration page. Please try again.
      </p>
      <button type="button" onClick={reset}>
        Try again
      </button>
      <Link href="/">Back to home</Link>
    </div>
  );
}
