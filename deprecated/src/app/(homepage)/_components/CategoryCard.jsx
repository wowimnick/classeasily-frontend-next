import React, { useMemo } from "react";
import Image from "next/image";
import styles from "./HomepageCategories.module.css";

// Presigned S3 URLs (backend fallback when CloudFront resized isn't available) are very long;
// passing them through /_next/image causes 502 (URL/proxy limits). Use unoptimized so the browser loads directly.
function isPresignedOrLongUrl(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("X-Amz-") ||
    url.includes("X-Amz-Algorithm") ||
    url.length > 1800
  );
}

const CategoryCard = ({
  category,
  description,
  image,
  onClick,
  alt,
  priority = false,
}) => {
  // Use placeholder when API returns no image (e.g. collection has no image or backend fallback unavailable)
  const imageSrc = image || "/placeholder.webp";
  const unoptimized = useMemo(
    () => isPresignedOrLongUrl(image),
    [image],
  );
  return (
    <div
      className={styles.cardWrapper}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${category} experiences`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.imageContainer}>
        <Image
          src={imageSrc}
          alt={alt || `${category} category`}
          fill
          sizes="(max-width: 768px) 220px, (max-width: 992px) 240px, 280px"
          style={{ objectFit: "cover" }}
          priority={priority}
          unoptimized={unoptimized}
        />
      </div>

      <div className={styles.cardContent}>
        <h2 className={styles.cardTitle}>{category}</h2>
        {description && <p className={styles.cardDesc}>{description}</p>}
      </div>
    </div>
  );
};

export default React.memo(CategoryCard);
