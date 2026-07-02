"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { Empty, Pagination, Spin } from "antd";
import { Star, ShieldCheck } from "lucide-react";
import { reviewsService } from "@/services/apiService";
import { useMediaQuery } from "@/styles/breakpoints-hooks";
import ReviewCard from "./ReviewCard";
import styles from "./ReviewsPage.module.css";

const PAGE_SIZE = 12;

const PageShell = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem 3rem;
`;

const StatsStripWrap = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin: -1.25rem 0 2rem;
  position: relative;
  z-index: 1;
`;

const StatsStrip = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 900px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px 18px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
`;

const DistributionBar = styled.div`
  display: flex;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #f3f4f6;
  margin-top: 10px;
`;

const DistSegment = styled.div`
  height: 100%;
  background: ${(p) => p.$color};
  width: ${(p) => p.$pct}%;
  min-width: ${(p) => (p.$pct > 0 ? "4px" : "0")};
`;

const Masonry = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const MasonryColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PaginationWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`;

/** Greedy multi-column balance so masonry columns stay close in height. */
function distributeReviewsToColumns(reviews, columnCount) {
  if (!reviews?.length) return [];
  if (columnCount <= 1) return [reviews];
  const cols = Array.from({ length: columnCount }, () => []);
  const sums = Array(columnCount).fill(0);
  const weight = (r) => {
    const text = String(r?.comment || r?.text || "").length;
    const imgs = Array.isArray(r?.image_urls) ? r.image_urls.length : 0;
    return 40 + Math.min(text, 1200) / 6 + imgs * 80;
  };
  reviews.forEach((r) => {
    let j = 0;
    for (let k = 1; k < columnCount; k += 1) {
      if (sums[k] < sums[j]) j = k;
    }
    cols[j].push(r);
    sums[j] += weight(r);
  });
  return cols;
}

function computeStats(reviews, totalCount) {
  if (!reviews?.length) {
    return {
      avgRating: 0,
      count: totalCount || 0,
      fivePct: 0,
      fourPct: 0,
    };
  }
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const five = reviews.filter((r) => Math.round(Number(r.rating)) >= 5).length;
  const four = reviews.filter((r) => Math.round(Number(r.rating)) === 4).length;
  const denom = reviews.length;
  return {
    avgRating: sum / denom,
    count: totalCount || denom,
    fivePct: Math.round((five / denom) * 100),
    fourPct: Math.round((four / denom) * 100),
  };
}

export default function ReviewsPageClient({ initialData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTabletUp = useMediaQuery("(min-width: 640px)");
  const isDesktopUp = useMediaQuery("(min-width: 1024px)");

  const columnCount = isDesktopUp ? 3 : isTabletUp ? 2 : 1;

  const initialPage = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialData);

  const fetchReviews = useCallback(async (nextPage) => {
    setLoading(true);
    const res = await reviewsService.fetchRecent(nextPage, PAGE_SIZE);
    setData(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (page === 1 && initialData?.success) {
      return;
    }
    fetchReviews(page);
  }, [page, fetchReviews, initialData?.success]);

  const updatePage = (nextPage) => {
    setPage(nextPage);
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const qs = params.toString();
    router.replace(qs ? `/reviews?${qs}` : "/reviews", { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reviews = data?.results ?? [];
  const total = data?.count ?? 0;
  const stats = useMemo(
    () => computeStats(reviews, total),
    [reviews, total],
  );

  const masonryColumns = useMemo(
    () => distributeReviewsToColumns(reviews, columnCount),
    [reviews, columnCount],
  );

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <Star size={14} fill="#4285f4" stroke="#4285f4" aria-hidden />
            Verified Google reviews
          </div>
          <h1 className={styles.heroTitle}>
            Loved by thousands of class-goers
          </h1>
          <p className={styles.heroSubtitle}>
            Real feedback from people who booked experiences on ClassEasily —
            pulled from verified Google reviews of our host businesses.
          </p>
        </div>
      </section>

      <PageShell>
        <StatsStripWrap>
          <StatsStrip aria-label="Review statistics">
            <StatCard>
              <StatValue>
                <Star size={20} fill="#f59e0b" stroke="#f59e0b" aria-hidden />
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
              </StatValue>
              <StatLabel>Average rating (this page)</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.count.toLocaleString()}</StatValue>
              <StatLabel>Google reviews shown</StatLabel>
              {reviews.length > 0 ? (
                <DistributionBar aria-hidden>
                  <DistSegment $pct={stats.fivePct} $color="#f59e0b" />
                  <DistSegment $pct={stats.fourPct} $color="#fcd34d" />
                </DistributionBar>
              ) : null}
            </StatCard>
            <StatCard>
              <StatValue>
                <ShieldCheck size={22} color="#16a34a" aria-hidden />
              </StatValue>
              <StatLabel>Verified Google reviews</StatLabel>
            </StatCard>
          </StatsStrip>
        </StatsStripWrap>

        <Spin spinning={loading}>
          {reviews.length === 0 && !loading ? (
            <Empty
              description="No reviews yet."
              style={{ padding: "3rem 0" }}
            >
              <Link href="/explore">Browse classes</Link>
            </Empty>
          ) : (
            <Masonry>
              {masonryColumns.map((column, colIndex) => (
                <MasonryColumn key={`col-${colIndex}`}>
                  {column.map((review, i) => {
                    const globalIndex =
                      colIndex === 0
                        ? i
                        : masonryColumns
                            .slice(0, colIndex)
                            .reduce((acc, c) => acc + c.length, 0) + i;
                    return (
                      <ReviewCard
                        key={review.id ?? `${review.reviewer_name}-${globalIndex}`}
                        review={review}
                        index={globalIndex}
                      />
                    );
                  })}
                </MasonryColumn>
              ))}
            </Masonry>
          )}
        </Spin>

        {total > PAGE_SIZE ? (
          <PaginationWrap>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={updatePage}
              showSizeChanger={false}
            />
          </PaginationWrap>
        ) : null}
      </PageShell>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Find your next experience</h2>
        <p className={styles.ctaSubtitle}>
          Discover workshops, classes, and activities near you.
        </p>
        <Link href="/" className={styles.ctaButton}>
          Book your next class
        </Link>
      </section>
    </>
  );
}
