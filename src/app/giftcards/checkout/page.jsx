import { Suspense } from "react";
import GiftcardCheckoutPage from "./_components/GiftcardCheckoutPage";

export default function GiftcardCheckout() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <GiftcardCheckoutPage />
    </Suspense>
  );
}
