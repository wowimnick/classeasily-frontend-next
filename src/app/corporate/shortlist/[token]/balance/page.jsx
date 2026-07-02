import { Suspense } from "react";
import BalanceClient from "./BalanceClient";

export const metadata = {
  title: "Pay balance | ClassEasily Corporate",
  robots: { index: false, follow: false },
};

function BalanceFallback() {
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

async function BalanceWithParams({ params }) {
  const resolved = await params;
  return <BalanceClient token={resolved?.token} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<BalanceFallback />}>
      <BalanceWithParams params={params} />
    </Suspense>
  );
}
