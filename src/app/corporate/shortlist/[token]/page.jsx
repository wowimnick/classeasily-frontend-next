import { Suspense } from "react";
import ShortlistPageClient from "./ShortlistPageClient";

export const metadata = {
  title: "Your team event options | ClassEasily",
  description: "Review your curated team-building options.",
  robots: { index: false, follow: false },
};

function ShortlistFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
      }}
    >
      Loading…
    </div>
  );
}

async function ShortlistWithParams({ params }) {
  const resolved = await params;
  const token = resolved?.token;
  if (!token) {
    return null;
  }
  return <ShortlistPageClient token={token} />;
}

export default function CorporateShortlistPage({ params }) {
  return (
    <Suspense fallback={<ShortlistFallback />}>
      <ShortlistWithParams params={params} />
    </Suspense>
  );
}
