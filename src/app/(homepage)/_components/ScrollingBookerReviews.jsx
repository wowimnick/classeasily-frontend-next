"use client";

import { Star } from "lucide-react";
import styles from "./ScrollingBookerReviews.module.css";

const BOOKER_REVIEWS = [
  {
    id: 1,
    quote: "Booked a pottery class in minutes — so easy!",
    name: "Sarah M.",
  },
  {
    id: 2,
    quote: "Found the perfect date night experience nearby.",
    name: "James K.",
  },
  {
    id: 3,
    quote: "Clear pricing and instant confirmation. Loved it.",
    name: "Priya S.",
  },
  {
    id: 4,
    quote: "Our group cooking class was flawless start to finish.",
    name: "Marcus T.",
  },
  {
    id: 5,
    quote: "Way better than scrolling for weekend ideas.",
    name: "Elena R.",
  },
  {
    id: 6,
    quote: "Amazing host — booking took less than a minute.",
    name: "David L.",
  },
  {
    id: 7,
    quote: "Surprised my partner with a wine tasting. Huge hit!",
    name: "Amelia C.",
  },
  {
    id: 8,
    quote: "Simple checkout and helpful reminders before class.",
    name: "Noah P.",
  },
];

function ReviewChip({ review }) {
  return (
    <article className={styles.chip} aria-label={`Review from ${review.name}`}>
      <div className={styles.stars} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} fill="#f59e0b" stroke="#f59e0b" />
        ))}
      </div>
      <p className={styles.quote}>&ldquo;{review.quote}&rdquo;</p>
      <span className={styles.name}>{review.name}</span>
    </article>
  );
}

export default function ScrollingBookerReviews() {
  const loop = [...BOOKER_REVIEWS, ...BOOKER_REVIEWS];

  return (
    <section
      className={styles.section}
      aria-label="Recent booker reviews"
    >
      <div className={styles.viewport}>
        <div className={styles.track}>
          {loop.map((review, index) => (
            <ReviewChip
              key={`${review.id}-${index}`}
              review={review}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
