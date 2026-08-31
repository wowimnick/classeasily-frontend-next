import { Suspense } from "react";
import ConfirmedClient from "./ConfirmedClient";

export const metadata = {
  title: "Deposit confirmed | ClassEasily",
  robots: { index: false, follow: false },
};

function ConfirmedFallback() {
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

async function ConfirmedWithParams({ params }) {
  const resolved = await params;
  return <ConfirmedClient token={resolved?.token} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<ConfirmedFallback />}>
      <ConfirmedWithParams params={params} />
    </Suspense>
  );
}
