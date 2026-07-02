"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { Empty, Pagination, Radio, Select, Spin } from "antd";
import { Star, ShieldCheck } from "lucide-react";
import { reviewsService } from "@/services/apiService";
import ReviewCard from "./ReviewCard";
import styles from "./ReviewsPage.module.css";

const PAGE_SIZE = 12;

const PageShell = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem 3rem;
`;

const StatsStrip = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: -1.25rem auto 2rem;
  max-width: 900px;
  position: relative;
  z-index: 1;

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

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding: 14px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PaginationWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`;

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

  const initialPage = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(initialPage);
  const [ratingMin, setRatingMin] = useState(4);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialData);

  const fetchReviews = useCallback(async (nextPage, nextRatingMin, nextSort) => {
    setLoading(true);
    const res = await reviewsService.fetchRecent(nextPage, PAGE_SIZE, {
      ratingMin: nextRatingMin,
      sort: nextSort,
    });
    setData(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (
      page === 1 &&
      ratingMin === 4 &&
      sort === "newest" &&
      initialData?.success
    ) {
      return;
    }
    fetchReviews(page, ratingMin, sort);
  }, [page, ratingMin, sort, fetchReviews, initialData?.success]);

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

  const handleRatingFilter = (value) => {
    const min = value === "5" ? 5 : 4;
    setRatingMin(min);
    setPage(1);
    router.replace("/reviews", { scroll: false });
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
    router.replace("/reviews", { scroll: false });
  };

  const reviews = data?.results ?? [];
  const total = data?.count ?? 0;
  const stats = useMemo(
    () => computeStats(reviews, total),
    [reviews, total],
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

        <FilterBar>
          <Radio.Group
            value={ratingMin === 5 ? "5" : "4"}
            onChange={(e) => handleRatingFilter(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="4">All good (4★+)</Radio.Button>
            <Radio.Button value="5">5★ only</Radio.Button>
          </Radio.Group>

          <Select
            value={sort}
            onChange={handleSortChange}
            style={{ minWidth: 160 }}
            options={[
              { value: "newest", label: "Newest" },
              { value: "highest", label: "Highest rated" },
            ]}
          />
        </FilterBar>

        <Spin spinning={loading}>
          {reviews.length === 0 && !loading ? (
            <Empty
              description="No reviews match these filters yet."
              style={{ padding: "3rem 0" }}
            >
              <Link href="/explore">Browse classes</Link>
            </Empty>
          ) : (
            <Grid>
              {reviews.map((review, i) => (
                <ReviewCard
                  key={review.id ?? `${review.reviewer_name}-${i}`}
                  review={review}
                  index={i}
                />
              ))}
            </Grid>
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
