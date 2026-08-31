"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canonical dashboard entry: `/business/dashboard` → reports home */
export default function DashboardRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/overview");
  }, [router]);
  return null;
}
