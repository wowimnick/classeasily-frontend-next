import React from "react";
import Image from "next/image";
import styles from "./HomepageCategories.module.css";

const CategoryCard = ({
  category,
  description,
  image,
  onClick,
  alt,
  priority = false,
}) => {
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
          src={image}
          alt={alt || `${category} category`}
          fill
          sizes="(max-width: 768px) 220px, (max-width: 992px) 240px, 280px"
          style={{ objectFit: "cover" }}
          priority={priority}
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
