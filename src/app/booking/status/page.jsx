"use client";

import ExploreHeader from "@/components/explore/ExploreHeader";
import BookingStatusClient from "./BookingStatusClient";

export default function BookingStatusPage() {
  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <BookingStatusClient />
    </>
  );
}
