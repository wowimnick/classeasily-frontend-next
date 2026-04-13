import { redirect } from "next/navigation";

/**
 * Single server redirect: /guest-inbox?token=... → homepage with inbox overlay.
 * Avoids an extra client-side navigation hop.
 */
export default async function GuestInboxPage({ searchParams }) {
  const sp = await searchParams;
  const token = sp?.token;
  if (typeof token === "string" && token.length > 0) {
    redirect(`/?guest_inbox_token=${encodeURIComponent(token)}`);
  }
  redirect("/");
}
