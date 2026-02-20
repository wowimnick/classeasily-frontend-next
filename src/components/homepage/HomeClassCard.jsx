"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { Heart, Star, Navigation } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./HomeClassCard.module.css";
import message from "@/lib/message";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService.js";
import { saveBeforeNavigate } from "@/lib/scrollRestoration";

const HomeClassCard = ({
  classId,
  slug,
  images,
  title = "Untitled Class",
  city = "",
  state = "",
  location = "",
  rating = 0,
  min_session_price = null,
  min_course_price = null,
  totalReviews = 0,
  business_name = "",
  is_favorited = false,
  distance = null,
  onFavoriteChange,
  priority = false,
  soonest_next_week = null,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const isAuthenticated = !!currentUser;

  const [isFavorite, setIsFavorite] = useState(is_favorited);
  const [isToggling, setIsToggling] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => {
    if (!images?.length) return null;
    const coverImage =
      images.find((img) => img.is_cover || img.isCover) || images[0];
    return coverImage?.medium_url || coverImage?.original_url || null;
  }, [images]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  const displayLocation = useMemo(() => {
    if (location) return location;
    if (city && state) return `${city}, ${state}`;
    return city || state || "";
  }, [city, state, location]);

  const formatDistance = (d) => {
    if (d === null || typeof d !== "number") return null;
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  const identifier = slug || classId;
  const handleLinkClick = () => {
    if (!identifier) return;
    const pathnameWithSearch =
      pathname + (typeof window !== "undefined" ? window.location.search : "");
    saveBeforeNavigate(pathnameWithSearch);
  };

  // Prefetch class page on hover so navigation is instant on click (RSC payload ready before click)
  const handlePrefetch = useCallback(() => {
    if (identifier) router.prefetch(`/classes/${identifier}`);
  }, [identifier, router]);

  const cardRef = useRef(null);
  const imgRef = useRef(null);

  // Cached or already-loaded images may not fire onLoad; check complete when img mounts or url changes
  useEffect(() => {
    if (!imageUrl || imageError) return;
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
      return;
    }
    const handleLoad = () => setImageLoaded(true);
    img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [imageUrl, imageError]);

  // Fallback: if load never fires (e.g. cross-origin/cache quirk), stop showing skeleton after a short delay
  useEffect(() => {
    if (!imageUrl || imageError || imageLoaded) return;
    const t = setTimeout(() => setImageLoaded(true), 1500);
    return () => clearTimeout(t);
  }, [imageUrl, imageError, imageLoaded]);

  // Prefetch when card is near viewport (industry standard: Airbnb-style instant nav on mobile tap / quick click)
  useEffect(() => {
    if (!identifier || !cardRef.current) return;
    const el = cardRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          router.prefetch(`/classes/${identifier}`);
        }
      },
      { rootMargin: "100px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [identifier, router]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return message.info("Log in to save favorites.");
    if (isToggling) return;

    setIsToggling(true);
    const newState = !isFavorite;
    setIsFavorite(newState);

    try {
      const result = await classService.toggleFavoriteClass(classId);
      if (result.success) {
        if (onFavoriteChange) onFavoriteChange(newState);

        if (newState) {
          import("canvas-confetti").then((confetti) => {
            const btn = e.target.closest("button");
            if (btn) {
              const rect = btn.getBoundingClientRect();
              confetti.default({
                particleCount: 40,
                spread: 50,
                origin: {
                  x: (rect.left + 14) / window.innerWidth,
                  y: (rect.top + 14) / window.innerHeight,
                },
              });
            }
          });
        }
      } else {
        setIsFavorite(!newState);
      }
    } catch {
      setIsFavorite(!newState);
    } finally {
      setIsToggling(false);
    }
  };

  const cardContent = (
    <>
      <div className={styles.imageContainer}>
        {soonest_next_week && (
          <span
            className={styles.soonestTag}
            title={`Next: ${soonest_next_week}`}
          >
            {soonest_next_week}
          </span>
        )}
        <button
          className={styles.favoriteBtn}
          onClick={toggleFavorite}
          disabled={isToggling}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        >
          {isToggling ? (
            <div className={styles.spinner} />
          ) : (
            <Heart
              size={22}
              // Removed Tailwind classes; styling is handled by fill/color props
              fill={isFavorite ? "#ff385c" : "rgba(0,0,0,0.3)"}
              color={isFavorite ? "#ff385c" : "#fff"}
            />
          )}
        </button>

        {imageUrl && !imageError ? (
          <>
            <div
              className={`${styles.imageSkeleton} ${imageLoaded ? styles.imageSkeletonHidden : ""}`}
              aria-hidden="true"
            />
            <img
              ref={imgRef}
              src={imageUrl}
              alt={title || "Class experience"}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={`${styles.cardImage} ${imageLoaded ? styles.cardImageLoaded : ""}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : imageUrl && imageError ? (
          <div className={styles.imageSkeleton} aria-hidden="true" />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.topRow}>
          <div className={styles.title}>{title}</div>
          {rating > 0 && (
            <div className={styles.ratingBlock}>
              <Star size={12} fill="#222" />
              <span>{Number(rating).toFixed(1)}</span>
              <span className={styles.reviewCount}>({totalReviews})</span>
            </div>
          )}
        </div>

        <div className={styles.locationRow}>
          <span className={styles.locationText}>{displayLocation}</span>
          {distance != null && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.distanceWrapper}>
                <Navigation size={10} /> {formatDistance(distance)}
              </span>
            </>
          )}
        </div>

        <div className={styles.priceRow}>
          <span className={styles.priceBlock}>
            {min_session_price
              ? `$${min_session_price}`
              : min_course_price
                ? `$${min_course_price}`
                : "Price varies"}
            <span className={styles.priceLabel}>
              {min_session_price
                ? "/ person"
                : min_course_price
                  ? "/ course"
                  : ""}
            </span>
          </span>
        </div>
      </div>
    </>
  );

  if (!identifier) {
    return <div className={styles.cardContainer}>{cardContent}</div>;
  }

  return (
    <Link
      ref={cardRef}
      href={`/classes/${identifier}`}
      className={styles.cardContainer}
      onClick={handleLinkClick}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      prefetch={true}
    >
      {cardContent}
    </Link>
  );
};

export default React.memo(HomeClassCard);
