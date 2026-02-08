"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Heart, Star, Navigation } from "lucide-react";
import styles from "./HomeClassCard.module.css";
// NOTE: Assuming these utility hooks/services exist in your project
import message from "@/lib/message";
import { useAuthUser } from "@/hooks/useAuthUser";
import { classService } from "@/services/apiService.js";

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
}) => {
  const { user: currentUser } = useAuthUser();
  const isAuthenticated = !!currentUser;

  const [isFavorite, setIsFavorite] = useState(is_favorited);
  const [isToggling, setIsToggling] = useState(false);

  const imageUrl = useMemo(() => {
    return images?.[0]?.medium_url || images?.[0]?.original_url || null;
  }, [images]);

  const displayLocation = useMemo(() => {
    if (location) return location;
    if (city && state) return `${city}, ${state}`;
    return city || state || "";
  }, [city, state, location]);

  const formatDistance = (d) => {
    if (d === null || typeof d !== "number") return null;
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  const handleNavigate = () => {
    const identifier = slug || classId;
    if (!identifier) return;
    window.open(`/classes/${identifier}`, "_blank");
  };

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

  return (
    <div className={styles.cardContainer} onClick={handleNavigate}>
      <div className={styles.imageContainer}>
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

        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.cardImage} // Changed from "object-cover" to CSS module class
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.topRow}>
          <div className={styles.title}>{title}</div>
          {rating > 0 && (
            <div className={styles.rating}>
              <Star size={12} fill="#222" />
              <span>{Number(rating).toFixed(1)}</span>
              <span className={styles.reviewCount}>({totalReviews})</span>
            </div>
          )}
        </div>

        <div className={styles.companyInfo}>{business_name}</div>

        <div className={styles.locationRow}>
          <span className={styles.locationText}>{displayLocation}</span>
          {distance !== null && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.distanceWrapper}>
                <Navigation size={10} /> {formatDistance(distance)}
              </span>
            </>
          )}
        </div>

        <div className={styles.priceRow}>
          {min_session_price
            ? `$${min_session_price}`
            : min_course_price
              ? `$${min_course_price}`
              : "Price varies"}
          <span className={styles.priceLabel}>
            {min_session_price ? "/person" : min_course_price ? "/course" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HomeClassCard);
