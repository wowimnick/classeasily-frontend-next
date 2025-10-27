"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardContent from "../_components/DashboardContent";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();

  // Extract tab from params, similar to admin page
  const tabParam = params.tab
    ? Array.isArray(params.tab)
      ? params.tab.join("/")
      : params.tab
    : "overview";
  const [activeKey, setActiveKey] = useState(tabParam);

  // Update activeKey when params change
  useEffect(() => {
    console.log("📍 Page.jsx - params changed:", params, "tabParam:", tabParam);
    setActiveKey(tabParam);
  }, [tabParam, params]);

  // Redirect to overview if no tab specified
  useEffect(() => {
    if (!params.tab || (Array.isArray(params.tab) && params.tab.length === 0)) {
      router.replace("/business/dashboard/overview");
    }
  }, [params.tab, router]);

  return <DashboardContent activeKey={activeKey} />;
}
