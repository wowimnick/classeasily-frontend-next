"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ExploreHeader from "@/components/explore/ExploreHeader";

const WidgetLandingClient = dynamic(
  () => import("./_components/WidgetLandingClient"),
  { ssr: false }
);

const HeaderFallback = () => (
  <div style={{ height: "80px", width: "100%", background: "#fafafa" }} />
);

export default function WidgetLandingPage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <ExploreHeader showOptionsWrapper={false} />
      </Suspense>
      <WidgetLandingClient />
    </>
  );
}
