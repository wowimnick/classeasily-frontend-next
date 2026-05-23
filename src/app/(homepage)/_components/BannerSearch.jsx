// --- START OF FILE BannerSearch.jsx ---

import React, { Suspense } from "react";
import styles from "./BannerSearch.module.css";
import BannerSearchClient from "./BannerSearchClient";
import ContinueSearchingCard from "./ContinueSearchingCard";
import ScrollingBookerReviews from "./ScrollingBookerReviews";

const SearchBarFallback = () => (
  <div
    style={{
      height: "76px",
      width: "100%",
      maxWidth: "920px",
      background: "#fff",
      borderRadius: "100px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.16)",
    }}
  />
);

export default function BannerSearch() {
  return (
    <section className={styles.bannerSection} aria-labelledby="banner-heading">
      <div className={styles.desktopContainer}>
        <div className={styles.mainWrapper}>
          <div className={styles.mainContent}>
            <h1 id="banner-heading" className={styles.heroText}>
              Experience locally.
            </h1>
            <p className={styles.subText}>
              Book fun experiences & classes near you. Instantly.
            </p>

            <div className={styles.heroSearchSlot}>
              <Suspense fallback={<SearchBarFallback />}>
                <BannerSearchClient mode="desktop" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileContainer}>
        <h1 className={styles.heroTextMobile}>Experience locally.</h1>
        <p className={styles.subTextMobile}>
          Book fun experiences & classes near you. Instantly.
        </p>

        <div className={styles.heroSearchSlot}>
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: "52px",
                  width: "100%",
                  borderRadius: "9999px",
                  background: "#fff",
                  border: "1px solid rgb(219, 219, 219)",
                  boxShadow:
                    "0 1px 2px rgba(0, 0, 0, 0.1), 0 4px 14px rgba(0, 0, 0, 0.05)",
                }}
              />
            }
          >
            <BannerSearchClient mode="mobile" />
          </Suspense>
        </div>
      </div>

      <div className={styles.continueSearchSlot}>
        <ContinueSearchingCard />
      </div>

      <ScrollingBookerReviews />
    </section>
  );
}
