"use client";

import { Suspense } from "react";
import RegisterFlow from "./_components/RegisterFlow";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFlow />
    </Suspense>
  );
}
