"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { debounce } from "lodash";
import useEmblaCarousel from "embla-carousel-react";
import CategoryCard from "./CategoryCard";
import styles from "./HomepageCategories.module.css";

// --- STATIC SKELETON (Lightweight) ---
const CategorySkeleton = () => (
  <div className={styles.emblaContainer}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton.Node
        key={`skeleton-${index}`}
        active
        style={{ width: 280, height: 380, borderRadius: "1rem", flexShrink: 0 }}
      >
        <div />
      </Skeleton.Node>
    ))}
  </div>
);

// --- STATIC FALLBACK (For Server/Suspense) ---
export const HomepageCategoriesFallback = ({ categories = [] }) => {
  return (
    <section
      className={styles.section}
      aria-labelledby="categories-title-static"
    >
      <div className={styles.headerContainer}>
        <div>
          <h2 id="categories-title-static" className={styles.title}>
            Find an activity
          </h2>
          <p className={styles.subtitle}>Browse experiences by category.</p>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <div className={styles.emblaContainer} style={{ width: "100%" }}>
          {categories.slice(0, 6).map((category, index) => (
            <div key={`static-${category.key}`} className={styles.slide}>
              <CategoryCard
                category={category.name}
                description={category.description}
                image={category.image_medium_url}
                onClick={() => {}}
                alt={`${category.name} category`}
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sort collections by admin sort_order (homepage respects reorder from admin)
const sortBySortOrder = (list) =>
  [...(list || [])].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

// --- MAIN COMPONENT ---
const HomepageCategories = ({ initialCategories = [] }) => {
  const router = useRouter();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  });

  const categories = useMemo(
    () => sortBySortOrder(initialCategories),
    [initialCategories]
  );
  const isLoading = !categories || categories.length === 0;

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [showButtons, setShowButtons] = useState(false);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const updateButtonStates = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  const checkScrollabilityAndVisibility = useCallback(() => {
    if (!emblaApi) {
      setShowButtons(false);
      return;
    }
    const isScrollable = emblaApi.canScrollNext() || emblaApi.canScrollPrev();
    setShowButtons(isScrollable);
    updateButtonStates();
  }, [emblaApi, updateButtonStates]);

  useEffect(() => {
    if (!emblaApi) return;

    checkScrollabilityAndVisibility();
    emblaApi.on("select", updateButtonStates);
    emblaApi.on("reInit", checkScrollabilityAndVisibility);
    emblaApi.on("resize", checkScrollabilityAndVisibility);

    updateButtonStates();

    const debouncedCheck = debounce(checkScrollabilityAndVisibility, 250);
    window.addEventListener("resize", debouncedCheck);

    return () => {
      emblaApi.off("select", updateButtonStates);
      emblaApi.off("reInit", checkScrollabilityAndVisibility);
      emblaApi.off("resize", checkScrollabilityAndVisibility);
      window.removeEventListener("resize", debouncedCheck);
      debouncedCheck.cancel();
    };
  }, [emblaApi, checkScrollabilityAndVisibility, updateButtonStates]);

  const handleCategoryClick = (categorySlug) => {
    const params = new URLSearchParams({
      collection: categorySlug,
      participants: "1",
      location: "Toronto, ON",
      lat: "43.6532",
      lng: "-79.3832",
    });
    router.push(`/explore?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.headerContainer}>
          <div>
            <h2 className={styles.title}>Find an activity</h2>
            <p className={styles.subtitle}>Browse experiences by category.</p>
          </div>
        </div>
        <CategorySkeleton />
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="categories-title-h">
      <div className={styles.headerContainer}>
        <div>
          <h2 id="categories-title-h" className={styles.title}>
            Find an activity
          </h2>
          <p className={styles.subtitle}>Browse experiences by category.</p>
        </div>

        {showButtons && (
          <div className={styles.buttonContainer}>
            <button
              className={styles.navButton}
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              aria-label="Previous categories"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={styles.navButton}
              onClick={scrollNext}
              disabled={nextBtnDisabled}
              aria-label="Next categories"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.carouselWrapper}>
        <div className={styles.emblaViewport} ref={emblaRef}>
          <div className={styles.emblaContainer}>
            {categories.map((category, index) => (
              <div className={styles.slide} key={category.key}>
                <CategoryCard
                  category={category.name}
                  description={category.description}
                  image={category.image_medium_url}
                  onClick={() => handleCategoryClick(category.key)}
                  alt={`${category.name} category`}
                  priority={index < 4}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(HomepageCategories);
