"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardContent from "../_components/DashboardContent";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();

  // Extract tab from params
  const activeKey = params.tab
    ? Array.isArray(params.tab)
      ? params.tab.join("/")
      : params.tab
    : "overview";

  // Only redirect on initial load if no tab specified
  useEffect(() => {
    if (!params.tab || (Array.isArray(params.tab) && params.tab.length === 0)) {
      router.replace("/business/dashboard/overview");
    }
  }, [params.tab, router]);

  console.log("📄 Page.jsx - Rendering with activeKey:", activeKey);

  return <DashboardContent activeKey={activeKey} />;
}
