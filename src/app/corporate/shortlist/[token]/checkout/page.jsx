import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Pay deposit | ClassEasily Corporate",
  robots: { index: false, follow: false },
};

function CheckoutFallback() {
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

async function CheckoutWithParams({ params }) {
  const resolved = await params;
  return <CheckoutClient token={resolved?.token} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutWithParams params={params} />
    </Suspense>
  );
}
