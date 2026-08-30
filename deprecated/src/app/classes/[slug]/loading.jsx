import React from "react";
import s from "./loading.module.css";

export default function ClassPageLoading() {
  return (
    <div className={s.page}>
      <div className={s.header} />
      <div className={s.content}>
        <div className={s.titleDesktop}>
          <div className={s.titleRow}>
            <div className="ce-skel" style={{ height: 48, width: "60%", borderRadius: 8 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <div className="ce-skel" style={{ width: 100, height: 40, borderRadius: 8 }} />
              <div className="ce-skel" style={{ width: 100, height: 40, borderRadius: 8 }} />
            </div>
          </div>
        </div>

        <div className={s.heroDesktop}>
          <div className="ce-skel" style={{ flex: "0 0 60%", borderRadius: "12px 0 0 12px" }} />
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 8,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ce-skel" style={{ borderRadius: 8 }} />
            ))}
          </div>
        </div>
        <div className={`ce-skel ${s.heroMobile}`} />

        <div className={s.mainGrid}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className={s.mobileTitle}>
              <div className={s.titleRow}>
                <div className="ce-skel" style={{ height: 32, flex: 1, borderRadius: 8 }} />
                <div className="ce-skel" style={{ width: 48, height: 48, borderRadius: 8 }} />
                <div className="ce-skel" style={{ width: 48, height: 48, borderRadius: 8 }} />
              </div>
            </div>

            <div className={s.section}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="ce-skel" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="ce-skel" style={{ height: 20, width: 200, borderRadius: 6 }} />
                  <div className="ce-skel" style={{ height: 16, width: 150, borderRadius: 6 }} />
                </div>
              </div>
            </div>

            <div className={s.section}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div className="ce-skel" style={{ height: 20, width: 120, borderRadius: 6 }} />
                <div className="ce-skel" style={{ height: 20, width: 120, borderRadius: 6 }} />
                <div className="ce-skel" style={{ height: 20, width: 120, borderRadius: 6 }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["100%", "95%", "90%", "85%"].map((w) => (
                <div key={w} className="ce-skel" style={{ height: 16, width: w, borderRadius: 6 }} />
              ))}
            </div>

            <div className={s.map}>
              <div className="ce-skel" style={{ width: "100%", height: "100%", borderRadius: 16 }} />
            </div>

            <div className="ce-skel" style={{ padding: "2rem", borderRadius: 16, minHeight: 200 }} />
            <div className="ce-skel" style={{ padding: "2rem", borderRadius: 16, minHeight: 280 }} />
            <div className="ce-skel" style={{ padding: "2rem", borderRadius: 16, minHeight: 220 }} />
          </div>

          <aside className={s.sidebar}>
            <div className={s.bookingCard}>
              <div className="ce-skel" style={{ height: 48, borderRadius: 8, marginBottom: 16 }} />
              <div className="ce-skel" style={{ height: 36, width: 120, borderRadius: 8, marginBottom: 16 }} />
              <div className="ce-skel" style={{ height: 40, borderRadius: 8, marginBottom: 16 }} />
              <div className="ce-skel" style={{ height: 120, borderRadius: 8, marginBottom: 16 }} />
              <div className="ce-skel" style={{ height: 48, borderRadius: 14 }} />
            </div>
          </aside>
        </div>
      </div>

      <div className={s.peek} aria-hidden>
        <div className="ce-skel" style={{ height: 28, width: 100, borderRadius: 8 }} />
        <div className="ce-skel" style={{ height: 44, width: 120, borderRadius: 9999 }} />
      </div>
    </div>
  );
}
