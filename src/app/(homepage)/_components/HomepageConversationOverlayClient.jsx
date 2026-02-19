"use client";

import dynamic from "next/dynamic";

const HomepageConversationOverlay = dynamic(
  () => import("./HomepageConversationOverlay"),
  { ssr: false },
);

export default function HomepageConversationOverlayClient() {
  return <HomepageConversationOverlay />;
}
