import { Suspense } from "react";
import { redirect } from "next/navigation";

/**
 * Single server redirect: /guest-inbox?token=... → homepage with inbox overlay.
 * Avoids an extra client-side navigation hop.
 *
 * Inner async component + Suspense: required with cacheComponents so awaiting
 * searchParams does not block the route shell (see blocking-route docs).
 */
async function GuestInboxRedirect({ searchParams }) {
  const sp = await searchParams;
  const token = sp?.token;
  if (typeof token === "string" && token.length > 0) {
    redirect(`/?guest_inbox_token=${encodeURIComponent(token)}`);
  }
  redirect("/");
}

export default function GuestInboxPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <GuestInboxRedirect searchParams={searchParams} />
    </Suspense>
  );
}
