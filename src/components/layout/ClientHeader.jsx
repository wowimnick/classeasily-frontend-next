"use client";

import dynamic from "next/dynamic";

// The ExploreHeader is now dynamically imported here, inside a client component
const ExploreHeader = dynamic(
  () => import("@/components/explore/ExploreHeader"),
  { ssr: false }
);

export default function ClientHeader(props) {
  // Render the dynamically loaded header and pass through any props
  return <ExploreHeader {...props} />;
}
