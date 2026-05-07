import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";

export default function CheckoutLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <ExploreHeader showOptionsWrapper={false} />
      <div
        style={{
          width: "min(640px, 100% - 2rem)",
          margin: "0 auto",
          padding: "2rem 0 4rem",
        }}
      >
        <div className="ce-skel" style={{ height: 36, width: "55%", borderRadius: 8, marginBottom: 24 }} />
        <div className="ce-skel" style={{ height: 160, borderRadius: 16, marginBottom: 16 }} />
        <div className="ce-skel" style={{ height: 120, borderRadius: 12 }} />
        <div className="ce-skel" style={{ height: 48, borderRadius: 12, marginTop: 24, width: "100%" }} />
      </div>
      <FooterSmart />
    </div>
  );
}
