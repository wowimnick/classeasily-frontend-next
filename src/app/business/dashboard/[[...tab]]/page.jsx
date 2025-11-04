"use client";

import { useParams } from "next/navigation";
import DashboardContent from "../_components/DashboardContent";

export default function DashboardPage() {
  const params = useParams();

  // Extract tab from params - default to overview if no tab
  const activeKey = params.tab
    ? Array.isArray(params.tab)
      ? params.tab.join("/")
      : params.tab
    : "overview";

  console.log("📄 Page.jsx - Rendering with activeKey:", activeKey);

  return <DashboardContent activeKey={activeKey} />;
}
