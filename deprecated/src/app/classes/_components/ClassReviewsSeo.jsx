/**
 * Server-rendered review excerpts for crawlers (complements client ClassReviews).
 */
export default function ClassReviewsSeo({ classTitle, reviews }) {
  if (!reviews?.length) return null;

  const visuallyHidden = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  return (
    <section aria-label="Guest reviews" style={visuallyHidden}>
      <h2>Guest reviews for {classTitle}</h2>
      <ul>
        {reviews.map((review, i) => (
          <li key={review.id ?? review.review_id ?? i}>
            {review.rating != null ? (
              <span>{String(review.rating)} stars. </span>
            ) : null}
            {review.comment ? String(review.comment) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
