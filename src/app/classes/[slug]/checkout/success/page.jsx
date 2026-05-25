import { Suspense } from "react";
import ClassCheckoutSuccessClient from "../_components/ClassCheckoutSuccessClient";

function SuccessFallback() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>Loading…</div>
  );
}

export default function ClassCheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <ClassCheckoutSuccessClient />
    </Suspense>
  );
}
