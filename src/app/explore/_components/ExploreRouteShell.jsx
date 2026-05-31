import React from "react";
import s from "./explore-skeleton.module.css";
import { ExploreCardGridSkeleton } from "./ExploreCardsSkeletonClient";

function FallbackLogoIcon({ color = "#ff3562" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64.81 105.86"
      fill={color}
      role="img"
      aria-label="ClassEasily Logo"
      style={{ width: "100%", height: "100%", flexShrink: 0 }}
    >
      <circle cx="64" cy="30" r="4" fill={color} />
      <circle cx="36" cy="30" r="4" fill={color} />
      <path
        d="M55,64c0-3.3,2.7-6,6-6v10c0,10.5,8.5,19,19,19V10c0,0-10-9-30.1-9C29.9,1,20,10,20,10v47c0,23.2,18.8,42,42,42h18v-6 c-13.8,0-25-11.2-25-25V64z M49.9,51C35.1,51,26,43,26,38V14c23,0,23,25,24,28c1-3,1-28,24-28v24C74,42.1,64.8,51,49.9,51z"
        fill={color}
      />
    </svg>
  );
}

export function ExploreHeaderSkeleton() {
  return (
    <header className={s.header}>
      <div className={s.leadCell}>
        <div className={`ce-skel ${s.backCell}`} aria-hidden />
        <a href="/" className={s.logoCell} aria-label="ClassEasily home">
          <div className={s.logo}>
            <FallbackLogoIcon color="#ff3562" />
          </div>
        </a>
      </div>
      <div className={s.pillCell}>
        <div className={`ce-skel ${s.searchPill}`} aria-hidden />
      </div>
      <div className={`ce-skel ${s.userCell}`} aria-hidden />
    </header>
  );
}

export default function ExplorePageSkeleton() {
  return (
    <div className={s.wrap}>
      <ExploreHeaderSkeleton />
      <div className={s.grid}>
        <div className={s.left}>
          <div className={s.categoriesBar}>
            <div className={s.categoriesCluster}>
              <div
                className={`ce-skel ${s.catPill} ${s.catPillOriginals}`}
                aria-hidden
              />
              <div
                className={`ce-skel ${s.catPill} ${s.catPillType}`}
                aria-hidden
              />
              <div
                className={`ce-skel ${s.catPill} ${s.catPillTime}`}
                aria-hidden
              />
              <span className={s.catDivider} aria-hidden />
              <div
                className={`ce-skel ${s.catPill} ${s.catPillFilters}`}
                aria-hidden
              />
              <span
                className={`${s.catDivider} ${s.catDividerBeforeMap}`}
                aria-hidden
              />
              <div
                className={`ce-skel ${s.catPill} ${s.catPillMap}`}
                aria-hidden
              />
            </div>
          </div>
          <div className={s.cardArea}>
            <ExploreCardGridSkeleton />
          </div>
        </div>
        <div className={s.mapPane}>
          <div className={`ce-skel ${s.mapFab}`} />
          <div className={`ce-skel ${s.mapSkel}`} />
        </div>
      </div>
    </div>
  );
}
