"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { homepageService } from "@/services/apiService";
import styles from "./ScrollingBookerReviews.module.css";

const FALLBACK_REVIEWS = [
  {
    reviewer_name: "Sarah M.",
    rating: 5,
    comment: "Booked a pottery class in minutes — so easy!",
    class_slug: null,
  },
  {
    reviewer_name: "James K.",
    rating: 5,
    comment: "Found the perfect date night experience nearby.",
    class_slug: null,
  },
  {
    reviewer_name: "Priya S.",
    rating: 5,
    comment: "Clear pricing and instant confirmation. Loved it.",
    class_slug: null,
  },
  {
    reviewer_name: "Marcus T.",
    rating: 5,
    comment: "Our group cooking class was flawless start to finish.",
    class_slug: null,
  },
  {
    reviewer_name: "Elena R.",
    rating: 5,
    comment: "Way better than scrolling for weekend ideas.",
    class_slug: null,
  },
  {
    reviewer_name: "David L.",
    rating: 5,
    comment: "Amazing host — booking took less than a minute.",
    class_slug: null,
  },
];

const PLATFORM_RATING = 4.9;
const PLATFORM_REVIEW_COUNT = "20k+";

function StatsHeader() {
  return (
    <div className={styles.statsHeader}>
      <span className={styles.starRating} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} fill="#f59e0b" stroke="#f59e0b" />
        ))}
      </span>
      <span className={styles.statsScore}>{PLATFORM_RATING.toFixed(1)}</span>
      <span className={styles.statsCount}>({PLATFORM_REVIEW_COUNT} reviews)</span>
    </div>
  );
}

function ReviewChip({ review }) {
  const rating = Number(review.rating) || 5;
  const href = review.class_slug ? `/classes/${review.class_slug}` : null;
  const Tag = href ? "a" : "div";
  const tagProps = href ? { href, prefetch: false } : { "aria-hidden": true };

  return (
    <Tag
      className={styles.chip}
      aria-label={href ? `Review from ${review.reviewer_name}` : undefined}
      {...tagProps}
    >
      <div className={styles.stars} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={9}
            fill={i < rating ? "#f59e0b" : "none"}
            stroke="#f59e0b"
          />
        ))}
      </div>
      <p className={styles.quote}>&ldquo;{review.comment}&rdquo;</p>
      <span className={styles.name}>{review.reviewer_name}</span>
    </Tag>
  );
}

export default function ScrollingBookerReviews() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [offsetPx, setOffsetPx] = useState(0);
  const [maxOffsetPx, setMaxOffsetPx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    homepageService.fetchFeaturedReviews().then((res) => {
      if (cancelled || !res?.success) return;
      const apiReviews = Array.isArray(res.reviews) ? res.reviews : [];
      if (apiReviews.length > 0) {
        setReviews(
          apiReviews.map((review) => ({
            reviewer_name: review.reviewer_name || "Guest",
            rating: Number(review.rating) || 5,
            comment: review.comment || "",
            class_slug: review.class_slug || null,
          })),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const measureBounds = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    setMaxOffsetPx(maxOffset);
    setOffsetPx((prev) => Math.min(prev, maxOffset));
  }, []);

  useEffect(() => {
    setOffsetPx(0);
    measureBounds();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resizeObserver = new ResizeObserver(measureBounds);
    resizeObserver.observe(viewport);
    if (trackRef.current) resizeObserver.observe(trackRef.current);

    return () => resizeObserver.disconnect();
  }, [reviews, measureBounds]);

  const getScrollStep = useCallback(() => {
    const track = trackRef.current;
    const firstChip = track?.firstElementChild;
    if (!firstChip) return 228;
    const trackStyles = track ? getComputedStyle(track) : null;
    const gap = trackStyles ? parseFloat(trackStyles.gap || "8") : 8;
    return firstChip.getBoundingClientRect().width + gap;
  }, []);

  const scrollByStep = useCallback(
    (direction) => {
      const step = getScrollStep();
      setOffsetPx((prev) => {
        const next = prev + direction * step;
        return Math.max(0, Math.min(maxOffsetPx, next));
      });
    },
    [getScrollStep, maxOffsetPx],
  );

  const canScrollPrev = offsetPx > 4;
  const canScrollNext = offsetPx < maxOffsetPx - 4;

  return (
    <section className={styles.section} aria-label="Recent booker reviews">
      <StatsHeader />

      <div className={styles.carouselShell}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Show previous reviews"
          disabled={!canScrollPrev}
          onClick={() => scrollByStep(-1)}
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className={styles.fadeWrap}>
          <div ref={viewportRef} className={styles.viewport}>
            <div
              ref={trackRef}
              className={styles.trackScroll}
              style={{ transform: `translateX(-${offsetPx}px)` }}
            >
              {reviews.map((review, index) => (
                <ReviewChip
                  key={`${review.reviewer_name}-${index}`}
                  review={review}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.navBtn}
          aria-label="Show more reviews"
          disabled={!canScrollNext}
          onClick={() => scrollByStep(1)}
        >
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
