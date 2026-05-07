"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Navigation } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./HomeClassCard.module.css";
import message from "@/lib/message";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService.js";
import { saveBeforeNavigate } from "@/lib/scrollRestoration";
import { formatCityForExploreListing, formatDurationHoursForListing } from "@/lib/formatClassLocationForListing";

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
  /** Explore page: horizontal list (mobile) + full-width card in grid (desktop) */
  exploreLayout = false,
  /** When user filters by collection, show as category in meta line */
  categoryLabel = null,
  showPopularBadge = false,
  /** Shortest schedule duration in minutes (public API); explore meta shows as hours */
  listing_duration_minutes = null,
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

  const exploreCityOnly = useMemo(
    () => formatCityForExploreListing({ city, state, location }),
    [city, state, location],
  );

  const exploreMetaLine = useMemo(() => {
    const parts = [];
    if (categoryLabel) parts.push(categoryLabel);
    if (exploreCityOnly) parts.push(exploreCityOnly);
    if (distance != null && typeof distance === "number") {
      const d = formatDistance(distance);
      if (d) parts.push(`${d} away`);
    }
    const dur = formatDurationHoursForListing(listing_duration_minutes);
    if (dur) parts.push(dur);
    return parts.join(" · ");
  }, [categoryLabel, exploreCityOnly, listing_duration_minutes, distance]);

  const explorePrice = useMemo(() => {
    const session =
      min_session_price != null && min_session_price !== ""
        ? Number(min_session_price)
        : null;
    const course =
      min_course_price != null && min_course_price !== ""
        ? Number(min_course_price)
        : null;
    if (session != null && !Number.isNaN(session) && course != null && !Number.isNaN(course)) {
      if (session <= course) {
        return { amount: session, suffix: " / guest" };
      }
      return { amount: course, suffix: " / course" };
    }
    if (session != null && !Number.isNaN(session)) {
      return { amount: session, suffix: " / guest" };
    }
    if (course != null && !Number.isNaN(course)) {
      return { amount: course, suffix: " / course" };
    }
    return null;
  }, [min_session_price, min_course_price]);

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
    e.preventDefault();
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

  const exploreCardContent = (
    <>
      <div className={styles.exploreImageWrap}>
        {showPopularBadge && (
          <span className={styles.explorePopularBadge}>Popular</span>
        )}
        <button
          type="button"
          className={styles.exploreFavoriteBtn}
          onClick={toggleFavorite}
          disabled={isToggling}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        >
          {isToggling ? (
            <div className={styles.spinner} />
          ) : (
            <Heart
              size={20}
              fill={isFavorite ? "#ff385c" : "none"}
              color={isFavorite ? "#ff385c" : "#ffffff"}
              strokeWidth={isFavorite ? 0 : 2}
            />
          )}
        </button>

        {imageUrl && !imageError ? (
          <>
            <div
              className={`${styles.imageSkeleton} ${styles.exploreThumbSkeleton} ${imageLoaded ? styles.imageSkeletonHidden : ""}`}
              aria-hidden="true"
            />
            <Image
              src={imageUrl}
              alt={title || "Class experience"}
              fill
              sizes="(max-width: 1048px) min(100vw, 520px), (max-width: 1600px) 32vw, min(400px, 28vw)"
              priority={priority}
              className={`${styles.cardImage} ${styles.exploreThumbImage} ${imageLoaded ? styles.cardImageLoaded : ""}`}
              onLoadingComplete={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : imageUrl && imageError ? (
          <div
            className={`${styles.imageSkeleton} ${styles.exploreThumbSkeleton}`}
            aria-hidden="true"
          />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
      </div>

      <div className={styles.exploreCopy}>
        <div className={styles.exploreTitleRow}>
          <div className={styles.exploreTitle}>{title}</div>
          {rating > 0 && (
            <div className={styles.exploreRatingInline}>
              <Star size={12} fill="#111111" color="#111111" />
              <span>{Number(rating).toFixed(2)}</span>
            </div>
          )}
        </div>

        {exploreMetaLine ? (
          <p className={styles.exploreMeta}>{exploreMetaLine}</p>
        ) : null}

        {rating > 0 && (
          <div className={styles.exploreRatingBlock}>
            <Star size={11} fill="#111111" color="#111111" aria-hidden />
            <span className={styles.exploreRatingNum}>
              {Number(rating).toFixed(2)}
            </span>
            <span className={styles.exploreRatingSep}> · </span>
            <span className={styles.exploreReviewCount}>
              {Number(totalReviews).toLocaleString("en-US")} reviews
            </span>
          </div>
        )}

        <div className={styles.explorePriceRow}>
          {explorePrice ? (
            <>
              <span className={styles.exploreFrom}>From </span>
              <span className={styles.explorePriceAmount}>
                $
                {explorePrice.amount % 1 === 0
                  ? Math.round(explorePrice.amount)
                  : explorePrice.amount.toFixed(2)}
              </span>
              <span className={styles.explorePriceSuffix}>{explorePrice.suffix}</span>
            </>
          ) : (
            <span className={styles.exploreFrom}>Price varies</span>
          )}
        </div>
      </div>
    </>
  );

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
            <Image
              src={imageUrl}
              alt={title || "Class experience"}
              fill
              sizes="(max-width: 640px) 45vw, 230px"
              priority={priority}
              className={`${styles.cardImage} ${imageLoaded ? styles.cardImageLoaded : ""}`}
              onLoadingComplete={() => setImageLoaded(true)}
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

  const containerClass = `${styles.cardContainer}${exploreLayout ? ` ${styles.cardContainerExplore}` : ""}`;

  if (!identifier) {
    return (
      <div className={containerClass}>
        {exploreLayout ? exploreCardContent : cardContent}
      </div>
    );
  }

  return (
    <Link
      ref={cardRef}
      href={`/classes/${identifier}`}
      className={containerClass}
      onClick={(e) => {
        if (e.target.closest("button")) {
          e.preventDefault();
          return;
        }
        handleLinkClick();
      }}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      prefetch={true}
    >
      {exploreLayout ? exploreCardContent : cardContent}
    </Link>
  );
};

export default React.memo(HomeClassCard);
