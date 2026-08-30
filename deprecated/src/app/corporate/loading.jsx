import { ExploreHeaderSkeleton } from "@/app/explore/_components/ExplorePageSkeleton";

export default function CorporateLoading() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ExploreHeaderSkeleton />
      <main style={{ minHeight: "70vh" }} aria-busy="true" />
    </div>
  );
}
