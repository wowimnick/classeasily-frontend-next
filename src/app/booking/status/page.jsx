import dynamic from "next/dynamic";
import ExploreHeader from "@/components/explore/ExploreHeader";

const BookingStatusClient = dynamic(
  () => import("./BookingStatusClient"),
  { ssr: false }
);

export default function BookingStatusPage() {
  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <BookingStatusClient />
    </>
  );
}
