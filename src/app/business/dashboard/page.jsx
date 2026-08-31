"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canonical dashboard entry: `/business/dashboard` → calendar */
export default function DashboardRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/business/dashboard/calendar");
  }, [router]);
  return null;
}
