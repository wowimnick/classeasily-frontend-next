// app/my-tickets/page.jsx
"use client";

import dynamic from "next/dynamic";
import { TicketsListLoadingSkeleton } from "./_components/TicketsLoadingSkeleton";

// Dynamically import the entire page content to avoid prerendering issues
const MyTicketsContent = dynamic(
  () => import("./_components/MyTicketsContent"),
  {
    ssr: false,
    loading: () => <TicketsListLoadingSkeleton />,
  }
);

export default function MyTicketsPage() {
  return <MyTicketsContent />;
}
