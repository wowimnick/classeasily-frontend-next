// components/explore/ExploreHeader.jsx
import React, { Suspense } from "react";
import ClientHeader from "../layout/ClientHeader";
import { ExploreHeaderSkeleton } from "@/app/explore/_components/ExplorePageSkeleton";

export default function ExploreHeader(props) {
  return (
    <Suspense fallback={<ExploreHeaderSkeleton />}>
      <ClientHeader {...props} />
    </Suspense>
  );
}