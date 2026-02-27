"use client";

import { SubscriptionProvider } from "@/context/SubscriptionContext";

export default function BookingWidgetLayout({ children }) {
  return <SubscriptionProvider>{children}</SubscriptionProvider>;
}
