// --- START OF FILE BannerSearch.jsx ---

import React, { Suspense } from "react";
import Image from "next/image";
import styles from "./BannerSearch.module.css";
import BannerSearchClient from "./BannerSearchClient";

// Static Base64 for blur
const BLACK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SearchBarFallback = () => (
  <div
    style={{
      height: "76px",
      width: "100%",
      maxWidth: "850px",
      background: "#fff",
      borderRadius: "100px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    }}
  />
);

export default function BannerSearch() {
  return (
    <section className={styles.bannerSection} aria-labelledby="banner-heading">
      <div className={styles.bgWrapper}>
        <div className={styles.filteredImage}>
          <Image
            src="https://media.istockphoto.com/id/643137108/photo/ecstatic-group-enjoying-the-party.jpg?s=612x612&w=0&k=20&c=saW_oIf8jjuJ_rPjCrQkKHLcJqYxvYEA7_CiwbTktcs="
            alt="Background"
            fill
            priority
            fetchPriority="high"
            quality={75}
            sizes="(max-width: 1920px) 100vw, 1920px"
            style={{ objectFit: "cover" }}
            placeholder="blur"
            blurDataURL={BLACK_PIXEL}
          />
        </div>

        <video
          className={styles.video}
          autoPlay
          loop
          muted
          playsInline
          poster="/videos/1.png"
          preload="none"
        >
          <source src="/videos/Classes.mp4" type="video/mp4" />
        </video>
      </div>

      <div className={styles.desktopContainer}>
        <div className={styles.mainWrapper}>
          <div className={styles.mainContent}>
            <h1 id="banner-heading" className={styles.heroText}>
              Experience locally.
            </h1>
            <p className={styles.subText}>
              Book fun experiences & classes near you. Instantly.
            </p>

            {/* ✅ FIXED: Suspense Boundary added here */}
            <Suspense fallback={<SearchBarFallback />}>
              <BannerSearchClient mode="desktop" />
            </Suspense>
          </div>
        </div>
      </div>

      <div className={styles.mobileContainer}>
        <h1 className={styles.heroTextMobile}>Experience locally.</h1>
        <p className={styles.subTextMobile}>
          Book fun experiences & classes near you. Instantly.
        </p>

        {/* ✅ FIXED: Suspense Boundary added here */}
        <Suspense
          fallback={
            <div
              style={{
                height: "56px",
                width: "100%",
                borderRadius: "100px",
                background: "#fff",
              }}
            />
          }
        >
          <BannerSearchClient mode="mobile" />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <BannerSearchClient mode="trust" />
      </Suspense>
    </section>
  );
}
