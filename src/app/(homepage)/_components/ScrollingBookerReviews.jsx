"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: false,
    watchDrag: false,
    duration: 28,
  });
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);

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

  const scrollToInitialSlide = useCallback(
    (api) => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile && reviews.length > 1) {
        api.scrollTo(1, false);
      }
    },
    [reviews.length],
  );

  const onSelect = useCallback((api) => {
    setPrevDisabled(!api.canScrollPrev());
    setNextDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    scrollToInitialSlide(emblaApi);
    onSelect(emblaApi);
  }, [emblaApi, reviews, scrollToInitialSlide, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return (
    <section className={styles.section} aria-label="Recent booker reviews">
      <StatsHeader />

      <div className={styles.carouselShell}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Show previous reviews"
          disabled={prevDisabled}
          onClick={scrollPrev}
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className={styles.fadeWrap}>
          <div ref={emblaRef} className={styles.viewport}>
            <div className={styles.trackScroll}>
              {reviews.map((review, index) => (
                <div className={styles.slide} key={`${review.reviewer_name}-${index}`}>
                  <ReviewChip review={review} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.navBtn}
          aria-label="Show more reviews"
          disabled={nextDisabled}
          onClick={scrollNext}
        >
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
