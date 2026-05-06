import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import s from "./shortlist-loading.module.css";

export default function ShortlistSegmentLoading() {
  return (
    <div className={s.page}>
      <ExploreHeader showOptionsWrapper={false} />
      <div className={s.inner}>
        <div className={s.hero}>
          <div className={`ce-skel ${s.eyebrow}`} />
          <div className={`ce-skel ${s.title}`} />
          <div className={`ce-skel ${s.sub}`} style={{ marginTop: 8 }} />
        </div>
        <div className={s.grid}>
          <div className={`ce-skel ${s.card}`} />
          <div className={`ce-skel ${s.card}`} />
          <div className={`ce-skel ${s.card}`} />
        </div>
        <div className={`ce-skel ${s.aside}`} />
      </div>
      <Footer />
    </div>
  );
}
