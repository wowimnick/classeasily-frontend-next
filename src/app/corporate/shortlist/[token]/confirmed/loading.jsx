import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";

export default function ConfirmedLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
      }}
    >
      <ExploreHeader showOptionsWrapper={false} />
      <div
        style={{
          width: "min(640px, 100% - 2rem)",
          margin: "0 auto",
          padding: "2.5rem 0 4rem",
          textAlign: "center",
        }}
      >
        <div
          className="ce-skel"
          style={{ height: 40, width: "60%", borderRadius: 8, margin: "0 auto 1.5rem" }}
        />
        <div
          className="ce-skel"
          style={{ height: 100, borderRadius: 16, margin: "0 auto 1rem", maxWidth: 400 }}
        />
        <div
          className="ce-skel"
          style={{ height: 20, width: "40%", borderRadius: 6, margin: "0 auto" }}
        />
      </div>
      <Footer />
    </div>
  );
}
