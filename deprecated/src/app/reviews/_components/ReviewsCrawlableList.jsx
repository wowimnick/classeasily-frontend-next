/**
 * Server-rendered review excerpts for crawlers and no-JS users.
 * Primary UI is in ReviewsPageClient; this ensures indexable text in initial HTML.
 */
export default function ReviewsCrawlableList({ reviews = [] }) {
  if (!reviews.length) return null;

  return (
    <section
      className="reviews-crawlable-list"
      aria-label="Recent Google reviews"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      <h2>Recent verified Google reviews</h2>
      <ul>
        {reviews.map((review) => {
          const slug = review.class_slug || review.classSlug;
          const href = slug ? `/classes/${slug}` : undefined;
          return (
            <li key={review.id ?? review.reviewer_name}>
              {href ? (
                <a href={href}>
                  {review.reviewer_name}: {review.comment?.slice(0, 200)}
                </a>
              ) : (
                <span>
                  {review.reviewer_name}: {review.comment?.slice(0, 200)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
