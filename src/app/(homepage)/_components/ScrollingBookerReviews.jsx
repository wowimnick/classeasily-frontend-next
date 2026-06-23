import { Star } from "lucide-react";
import styles from "./ScrollingBookerReviews.module.css";

const PLATFORM_RATING = 4.9;
const PLATFORM_REVIEW_COUNT = "20k+";

export default function ScrollingBookerReviews() {
  return (
    <section className={styles.section} aria-label="Platform rating">
      <div className={styles.statsHeader}>
        <span className={styles.starRating} aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} fill="#f59e0b" stroke="#f59e0b" />
          ))}
        </span>
        <span className={styles.statsScore}>{PLATFORM_RATING.toFixed(1)}</span>
        <span className={styles.statsCount}>({PLATFORM_REVIEW_COUNT} reviews)</span>
      </div>
    </section>
  );
}
