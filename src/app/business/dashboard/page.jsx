"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canonical dashboard entry: `/business/dashboard` → `/business/dashboard/overview` */
export default function DashboardRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/overview");
  }, [router]);
  return null;
}
