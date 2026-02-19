"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const MyMessagesContent = dynamic(
  () => import("../_components/MyMessagesContent"),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#717171" }}>
        Loading…
      </div>
    ),
  }
);

const loadingFallback = (
  <div style={{ padding: "48px 24px", textAlign: "center", color: "#717171" }}>
    Loading…
  </div>
);

function MyMessagesIdInner() {
  const params = useParams();
  const id = params?.id ?? null;
  return <MyMessagesContent initialConversationId={id} />;
}

/**
 * /my-messages/[id] – list + overlay with this conversation open (e.g. from email link).
 * No redirect; email links use this URL directly.
 */
export default function MyMessagesIdPage() {
  return (
    <Suspense fallback={loadingFallback}>
      <MyMessagesIdInner />
    </Suspense>
  );
}
