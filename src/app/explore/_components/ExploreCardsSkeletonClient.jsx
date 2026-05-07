"use client";

import React from "react";
import s from "./explore-skeleton.module.css";

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

export function ClassesContentSkeleton() {
  return (
    <div className={s.cardGrid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonClassSingleCard key={i} />
      ))}
    </div>
  );
}
