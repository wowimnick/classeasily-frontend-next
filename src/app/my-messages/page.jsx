"use client";

import dynamic from "next/dynamic";

const MyMessagesContent = dynamic(
  () => import("./_components/MyMessagesContent"),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#717171" }}>
        Loading messages…
      </div>
    ),
  }
);

export default function MyMessagesPage() {
  return <MyMessagesContent />;
}
