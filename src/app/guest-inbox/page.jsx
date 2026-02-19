"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Redirect /guest-inbox?token=... → /?guest_inbox_token=... (homepage with overlay).
 * No dedicated page; conversation opens as overlay on homepage.
 */
function GuestInboxRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }
    router.replace(`/?guest_inbox_token=${encodeURIComponent(token)}`, { scroll: false });
  }, [token, router]);

  return null;
}

export default function GuestInboxRedirect() {
  return (
    <Suspense fallback={null}>
      <GuestInboxRedirectInner />
    </Suspense>
  );
}
