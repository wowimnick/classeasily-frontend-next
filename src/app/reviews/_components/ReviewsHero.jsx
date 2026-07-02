import { Star } from "lucide-react";
import { REVIEWS_HERO_IMAGES } from "./reviewsHeroImages";
import styles from "./ReviewsHero.module.css";

export default function ReviewsHero() {
  return (
    <section className={styles.heroSection} aria-labelledby="reviews-page-heading">
      <div className={styles.collage} aria-hidden="true">
        {REVIEWS_HERO_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={styles.collageItem}
            data-slot={i}
            style={{ backgroundImage: `url(${img.src})` }}
          />
        ))}
      </div>
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <Star size={14} fill="#4285f4" stroke="#4285f4" aria-hidden />
          Verified Google reviews
        </div>
        <h1 id="reviews-page-heading" className={styles.heroTitle}>
          Loved by thousands of class-goers
        </h1>
        <p className={styles.heroSubtitle}>
          Real feedback from people who booked experiences on ClassEasily —
          pulled from verified Google reviews of our host businesses.
        </p>
      </div>
    </section>
  );
}
