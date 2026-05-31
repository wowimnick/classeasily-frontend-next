"use client";

import React, { useRef } from "react";
import s from "./explore-skeleton.module.css";
import { useExploreSkeletonCardCount } from "./useExploreSkeletonCardCount";

export function SkeletonClassSingleCard() {
  return (
    <div className={s.card}>
      <div className={`ce-skel ${s.cardImg}`} />
      <div className={s.cardBody}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div className={`ce-skel ${s.lineTitle}`} />
          <div className="ce-skel" style={{ width: 40, height: 14, borderRadius: 4 }} />
        </div>
        <div className={`ce-skel ${s.lineSm}`} style={{ width: "60%" }} />
        <div className={`ce-skel ${s.lineSm}`} />
        <div className="ce-skel" style={{ width: 70, height: 16, borderRadius: 4, marginTop: 6 }} />
      </div>
    </div>
  );
}

function ExploreCardGridSkeletonInner({ gridClassName = s.cardGrid }) {
  const rootRef = useRef(null);
  const count = useExploreSkeletonCardCount(rootRef);

  return (
    <div ref={rootRef} className={s.skeletonMeasureRoot}>
      <div className={gridClassName}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonClassSingleCard key={i} />
        ))}
      </div>
    </div>
  );
}

/** Fills the explore card pane with a viewport-sized skeleton grid. */
export function ExploreCardGridSkeleton(props) {
  return <ExploreCardGridSkeletonInner {...props} />;
}

export function ClassesContentSkeleton() {
  return <ExploreCardGridSkeletonInner />;
}
