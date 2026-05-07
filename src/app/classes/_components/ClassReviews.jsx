"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Fragment,
} from "react";
import { createPortal } from "react-dom"; // Added for Image Viewer Fix
import styled, { keyframes, css } from "styled-components";
import { Avatar, Modal } from "antd";
import { Drawer as VaulDrawer } from "vaul";
import Link from "next/link";
import {
  Star,
  MessageSquareText,
  User,
  X,
  ZoomIn,
  Globe,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, isValid } from "date-fns";
import { classService } from "@/services/apiService";
import { fetchReviewTranslation } from "@/lib/reviewTranslationClient";

// --- ANIMATIONS & SKELETONS ---

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const SkeletonPulse = css`
  background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
  background-size: 2000px 100%;
  animation: ${shimmer} 2s infinite linear;
`;

const SkeletonGrid = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 28px;
  width: 100%;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 0;
  }
`;

const SkeletonCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;

  &.skeleton-col-secondary {
    @media (max-width: 900px) {
      display: none;
    }
  }
`;

const SkeletonReviewCell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
`;

const SkeletonHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const SkeletonAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  ${SkeletonPulse}
  flex-shrink: 0;
`;

const SkeletonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const SkeletonName = styled.div`
  height: 15px;
  width: 140px;
  border-radius: 4px;
  ${SkeletonPulse}
`;

const SkeletonDate = styled.div`
  height: 13px;
  width: 90px;
  border-radius: 4px;
  ${SkeletonPulse}
`;

const SkeletonLine = styled.div`
  height: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  width: ${(props) => props.width || "100%"};
  ${SkeletonPulse}
`;

// --- VAUL STYLED COMPONENTS ---

const VaulOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 9999; /* Increased significantly to beat Header (100) */
`;

const VaulContent = styled(VaulDrawer.Content)`
  background-color: white;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  height: 85vh;
  max-height: 96%;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000; /* Strictly above Overlay */
  outline: none;
`;

const VaulHandle = styled.div`
  width: 40px;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 9999px;
  margin: 16px auto;
  flex-shrink: 0;
`;

const VaulBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 20px 16px;
`;

// --- MAIN UI STYLED COMPONENTS ---

const ReviewsContainer = styled(motion.div)`
  background: #ffffff;
  width: 100%;
  max-width: 1120px;
  padding: 0 0 1rem;

  @media (max-width: 768px) {
    padding: 0 1.25rem 1rem;
  }
`;

const SectionHead = styled.div`
  margin-bottom: 24px;
`;

const Header = styled.h2`
  font-size: clamp(20px, 0.95rem + 1.5vw, 23px);
  font-weight: 600;
  color: #111111;
  margin: 0;
  line-height: 1.25;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.35rem;
`;

const HeaderTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const ReviewsGrid = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 28px;
  width: 100%;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 0;
  }
`;

const ReviewsCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const PreviewReviewRoot = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`;

const PreviewTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const FlatAvatar = styled(Avatar)`
  flex-shrink: 0;
  && {
    border: none;
    box-shadow: none;
  }
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ReviewerNameLine = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111111;
  line-height: 1.3;
`;

const ReviewerLocationLine = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: #717171;
  line-height: 1.35;
`;

const StarsWhenRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-right: ${(p) => (p.$padSource ? "76px" : "0")};
`;

const StarRatingWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const BlackStarIcon = styled(Star)`
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  ${(p) =>
    p.$filled
      ? css`
          color: #111111;
          fill: #111111;
          stroke: none;
        `
      : css`
          color: #dddddd;
          fill: none;
          stroke: currentColor;
        `}
`;

const WhenText = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #717171;
`;

const DotSep = styled.span`
  color: #717171;
  font-size: 13px;
  user-select: none;
`;

const InlineSource = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #717171;
  margin-left: 4px;
`;

const ModalReviewBlock = styled.div`
  position: relative;
  padding: 20px 0;
  border-bottom: 1px solid #eeeeee;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 4px;
  }
`;

const ModalInnerTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ReviewSourceTag = styled.div`
  position: absolute;
  top: 12px;
  right: 0;
  background-color: ${(props) =>
    props.source === "google" ? "#e8f0fe" : "#f3f4f6"};
  color: ${(props) => (props.source === "google" ? "#1a73e8" : "#374151")};
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Comment = styled.p`
  margin: 6px 0 0;
  color: #111111;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const ShowMoreLink = styled.button`
  display: inline;
  background: none;
  border: none;
  padding: 0;
  margin: 0 0 0 0.25rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  color: #111111;
  text-decoration: underline;
  &:hover {
    opacity: 0.85;
  }
`;

const TranslationFootnote = styled.div`
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: #717171;
`;

const TranslationSpinner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #717171;
  margin-bottom: 8px;
`;

const spinKF = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinIcon = styled(Loader2)`
  animation: ${spinKF} 0.75s linear infinite;
`;

const ShowAllButton = styled(motion.button)`
  background-color:rgb(251, 251, 251);
  border: none;
  font-weight: 700;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #111111;
  width: 100%;
  margin: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: background 0.15s ease, box-shadow 0.15s ease;
`;

const ReviewFooter = styled.div`
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
`;

const LearnReviewsLink = styled(Link)`
  display: block;
  width: 100%;
  text-align: center;
  font-size: 14px;
  font-weight: 400;
  color: #111111;
  text-decoration: underline;

  &:hover {
    opacity: 0.75;
  }
`;

const BusinessResponse = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  margin-top: 0.75rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
`;

const ResponseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  margin-bottom: 0.5rem;
`;

const ResponseText = styled.div`
  color: #444444;
  font-size: 14px;
  line-height: 1.55;
`;

const ReviewImageContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 0.75rem;
`;

const ReviewImage = styled.img`
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  object-fit: cover;
  aspect-ratio: 16 / 9;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.02);
    filter: brightness(0.9);
  }
  @media (max-width: 768px) {
    max-width: 250px;
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  max-width: 300px;

  ${ReviewImageContainer}:hover & {
    opacity: 1;
  }
`;

const ZoomIcon = styled(ZoomIn)`
  color: white;
  size: 24px;
`;

const ImageModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10001; /* Strictly above Vaul (10000) and Header */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ImageModalContainer = styled(motion.div)`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FullScreenImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
`;

const ImageCloseButton = styled.button`
  position: absolute;
  top: -50px;
  right: -10px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }
`;

const ModalToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
`;

const SortLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #717171;
`;

const SortChip = styled.button`
  border: 1px solid #dddddd;
  background: #ffffff;
  color: #222222;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &[data-active="true"] {
    background: #111111;
    color: #ffffff;
    border-color: #111111;
  }

  &:hover {
    border-color: #bbbbbb;
  }
`;

const DrawerModalTitle = styled.div`
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eeeeee;
`;

const DrawerModalHeading = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111111;
  margin: 0 0 6px;
`;

const DrawerModalSub = styled.p`
  margin: 0;
  font-size: 14px;
  color: #717171;
  line-height: 1.45;
`;

/** Greedy multi-column balance so preview grids stay close in height. */
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

// --- Helpers ---
/** On the class page we only show positive reviews (4–5 stars); "See all reviews" shows everything. */
const isPositiveReview = (review) => (Number(review?.rating) || 0) >= 4;

const normalizeReview = (review, index = 0) => {
  const baseId =
    review.id ??
    review.reviewId ??
    review.google_review_id ??
    `${index}-${review?.reviewer_name || review?.user?.name || "anon"}-${
      review?.date || review?.createdAt || review?.review_date || ""
    }`;
  return {
    ...review,
    id: baseId,
    reviewer_avatar_url:
      review.reviewer_avatar_url || review.user?.avatar_thumb_url,
    reviewer_name: review.reviewer_name || review.user?.name,
    reviewer_location:
      (typeof review.reviewer_location === "string" && review.reviewer_location) ||
      (typeof review.reviewerLocation === "string" && review.reviewerLocation) ||
      (typeof review.location === "string" && review.location) ||
      null,
    image_urls:
      review.image_urls?.length > 0
        ? review.image_urls
        : review.image_medium_url
          ? [review.image_medium_url]
          : [],
    business_response: review.business_response || review.owner_response,
  };
};

function formatReviewWhen(review) {
  const raw = review.date || review.createdAt || review.review_date;
  const d = raw ? new Date(raw) : null;
  if (!d || !isValid(d)) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

function StarRatingBlack({ rating }) {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <StarRatingWrap>
      {[1, 2, 3, 4, 5].map((i) => (
        <BlackStarIcon key={i} size={12} $filled={i <= r} aria-hidden />
      ))}
    </StarRatingWrap>
  );
}

function TranslatedReviewText({
  text,
  isModal,
  expanded,
  onToggleExpand,
  variant = "comment",
}) {
  const [tr, setTr] = useState({
    status: "idle",
    translated: null,
    sourceLanguage: null,
  });

  useEffect(() => {
    if (!text?.trim()) {
      setTr({ status: "idle", translated: null, sourceLanguage: null });
      return;
    }
    let cancelled = false;
    setTr({ status: "loading", translated: null, sourceLanguage: null });
    fetchReviewTranslation(text).then((data) => {
      if (cancelled) return;
      if (data?.translated && data.text) {
        setTr({
          status: "done",
          translated: data.text,
          sourceLanguage: data.sourceLanguage || "another language",
        });
      } else {
        setTr({ status: "original", translated: null, sourceLanguage: null });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const TextEl = variant === "response" ? ResponseText : Comment;

  const displayText =
    tr.status === "done" && tr.translated ? tr.translated : text;

  const shouldTruncate =
    Boolean(displayText) &&
    displayText.length > 150 &&
    !isModal &&
    variant === "comment";

  const shown =
    shouldTruncate && !expanded
      ? `${displayText.slice(0, 150)}...`
      : displayText;

  const showSpinner = variant === "comment" && tr.status === "loading";
  const showFootnote =
    tr.status === "done" && tr.translated && tr.sourceLanguage;

  return (
    <>
      {showSpinner && (
        <TranslationSpinner>
          <SpinIcon size={14} aria-hidden />
          Translating…
        </TranslationSpinner>
      )}
      <TextEl>
        {shown}
        {variant === "comment" && shouldTruncate && (
          <ShowMoreLink type="button" onClick={onToggleExpand}>
            {expanded ? "Show less" : "Show more"}
          </ShowMoreLink>
        )}
      </TextEl>
      {showFootnote && (
        <TranslationFootnote>
          Translated from {tr.sourceLanguage}. Automatic translation may be
          inaccurate.
        </TranslationFootnote>
      )}
    </>
  );
}

const ReviewSkeletonLoader = () => (
  <SkeletonReviewCell>
    <SkeletonHeader>
      <SkeletonAvatar />
      <SkeletonInfo>
        <SkeletonName />
        <SkeletonDate />
      </SkeletonInfo>
    </SkeletonHeader>
    <div style={{ marginTop: 8 }}>
      <SkeletonLine width="100%" />
      <SkeletonLine width="92%" />
      <SkeletonLine width="60%" />
    </div>
  </SkeletonReviewCell>
);

const PreviewReviewsSkeletonGrid = () => (
  <SkeletonGrid>
    <SkeletonCol>
      {[1, 2, 3].map((k) => (
        <ReviewSkeletonLoader key={k} />
      ))}
    </SkeletonCol>
    <SkeletonCol className="skeleton-col-secondary">
      {[4, 5, 6].map((k) => (
        <ReviewSkeletonLoader key={k} />
      ))}
    </SkeletonCol>
  </SkeletonGrid>
);

// --- Main Component ---
const Reviews = ({
  slug,
  initialRating,
  initialReviewCount,
  platformReviewCount,
  serverReviews = null,
  mode = "class", // "class" | "business" - when "business", slug is business slug and we fetch business reviews
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false); // Track client-side mount

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const normalizedServerReviews = useMemo(() => {
    if (!serverReviews) return [];
    const reviewsArray = Array.isArray(serverReviews)
      ? serverReviews
      : serverReviews?.reviews || [];
    return reviewsArray.map((r, i) => normalizeReview(r, i));
  }, [serverReviews]);

  // State
  const [previewReviews, setPreviewReviews] = useState(normalizedServerReviews);
  const [modalReviews, setModalReviews] = useState([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(
    !normalizedServerReviews.length,
  );
  const [expandedReviews, setExpandedReviews] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalSort, setModalSort] = useState("recent");

  const sortedModalReviews = useMemo(() => {
    const list = [...modalReviews];
    const idKey = (r) => String(r.id ?? "");
    const time = (r) => {
      const d = new Date(r.date || r.createdAt || r.review_date || 0);
      const x = d.getTime();
      return Number.isFinite(x) ? x : 0;
    };
    const cmpRecent = (a, b) => {
      const dt = time(b) - time(a);
      if (dt !== 0) return dt;
      return idKey(a).localeCompare(idKey(b));
    };
    const cmpHigh = (a, b) => {
      const dr = (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (dr !== 0) return dr;
      return cmpRecent(a, b);
    };
    const cmpLow = (a, b) => {
      const dr = (Number(a.rating) || 0) - (Number(b.rating) || 0);
      if (dr !== 0) return dr;
      return cmpRecent(a, b);
    };

    if (modalSort === "high") list.sort(cmpHigh);
    else if (modalSort === "low") list.sort(cmpLow);
    else list.sort(cmpRecent);

    return list;
  }, [modalReviews, modalSort]);

  // On the class page only show positive reviews; modal "See all" shows every review.
  const displayPreviewReviews = useMemo(
    () => previewReviews.filter(isPositiveReview),
    [previewReviews],
  );

  const previewGridReviews = useMemo(
    () => displayPreviewReviews.slice(0, 6),
    [displayPreviewReviews],
  );

  const previewReviewColumns = useMemo(
    () => distributeReviewsToColumns(previewGridReviews, isMobile ? 1 : 2),
    [previewGridReviews, isMobile],
  );

  const reviewStats = useMemo(() => {
    const rating = Number(initialRating ?? 0);
    const safeRating = Number.isFinite(rating) ? rating.toFixed(1) : "0.0";
    const count = Number(initialReviewCount ?? 0);
    const safeCount = Number.isFinite(count) ? count : 0;
    return {
      safeRating,
      safeCount,
      reviewWord: safeCount === 1 ? "review" : "reviews",
    };
  }, [initialRating, initialReviewCount]);

  // --- CRITICAL FIX: SYNC STATE WITH PARENT COMPONENT ---
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("reviewsModalStateChange", {
        detail: { isOpen: isModalVisible },
      }),
    );
  }, [isModalVisible]);

  // --- Infinite scroll (modal): refs avoid stale closures when sorting / paginating ---
  const observer = useRef(null);
  const modalPageRef = useRef(1);
  const modalHasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadModalReviewsRef = useRef(async (_page) => {});

  useEffect(() => {
    modalPageRef.current = modalPage;
  }, [modalPage]);
  useEffect(() => {
    modalHasMoreRef.current = modalHasMore;
  }, [modalHasMore]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  const lastReviewElementRef = useCallback((node) => {
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        modalHasMoreRef.current &&
        !loadingMoreRef.current
      ) {
        const next = modalPageRef.current + 1;
        loadModalReviewsRef.current(next);
      }
    });
    observer.current.observe(node);
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchPreviewReviews = async () => {
      if (
        normalizedServerReviews.length > 0 ||
        !slug ||
        initialReviewCount === 0
      ) {
        setLoadingPreview(false);
        return;
      }
      try {
        setLoadingPreview(true);
        if (mode === "business") {
          const result = await classService.fetchBusinessReviews(slug, 1, 6);
          if (result.success && result.data) {
            setPreviewReviews((result.data || []).map((r, i) => normalizeReview(r, i)));
          }
        } else {
          const result = await classService.fetchClassReviewsPaginated(
            slug,
            1,
            6,
          );
          if (result.success) {
            setPreviewReviews((result.reviews || []).map((r, i) => normalizeReview(r, i)));
          }
        }
      } catch (error) {
        console.error("Error fetching preview reviews:", error);
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreviewReviews();
  }, [slug, initialReviewCount, normalizedServerReviews.length, mode]);

  const loadModalReviews = useCallback(
    async (page) => {
      if (!slug) return;

      try {
        setLoadingMore(true);
        if (mode === "business") {
          const result = await classService.fetchBusinessReviews(slug, page, 10);
          if (result.success && result.data) {
            setModalReviews((prev) => {
              const offset = page === 1 ? 0 : prev.length;
              const newReviews = (result.data || []).map((r, i) =>
                normalizeReview(r, offset + i),
              );
              return page === 1 ? newReviews : [...prev, ...newReviews];
            });
            setModalPage(page);
            setModalHasMore(result.hasMore || false);
          }
        } else {
          const result = await classService.fetchClassReviewsPaginated(
            slug,
            page,
            10,
          );
          if (result.success) {
            setModalReviews((prev) => {
              const offset = page === 1 ? 0 : prev.length;
              const newReviews = (result.reviews || []).map((r, i) =>
                normalizeReview(r, offset + i),
              );
              return page === 1 ? newReviews : [...prev, ...newReviews];
            });
            const pagination = result.pagination || {};
            setModalPage(page);
            setModalHasMore(pagination.has_more || false);
          }
        }
      } catch (error) {
        console.error("Error loading modal reviews:", error);
      } finally {
        setLoadingMore(false);
      }
    },
    [slug, mode],
  );

  loadModalReviewsRef.current = loadModalReviews;

  const handleOpenModal = () => {
    setIsModalVisible(true);
    if (modalReviews.length === 0) {
      loadModalReviews(1);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const toggleReviewExpansion = (reviewId) =>
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));

  const renderReviewContent = (review, index, isModal) => {
    const isExpanded = expandedReviews[review.id];
    const isLastElement = isModal && index === sortedModalReviews.length - 1;
    const refProp = isLastElement ? { ref: lastReviewElementRef } : {};

    const avatarUrl =
      review.reviewer_avatar_url || review.user?.avatar_thumb_url;
    const reviewerName =
      review.reviewer_name || review.user?.name || "Anonymous";
    const locationLine =
      typeof review.reviewer_location === "string"
        ? review.reviewer_location.trim()
        : "";
    const whenText = formatReviewWhen(review);
    const reviewImages =
      review.image_urls && review.image_urls.length > 0
        ? review.image_urls
        : review.image_medium_url
          ? [review.image_medium_url]
          : [];
    const hostReply = review.business_response || review.owner_response;

    const showSourceBadge =
      Boolean(review.source) &&
      (isModal || (platformReviewCount > 0 && platformReviewCount < 10));

    const inner = (
      <>
        {showSourceBadge && isModal ? (
          <ReviewSourceTag source={review.source}>
            {review.source === "google" ? (
              <Globe size={12} aria-hidden />
            ) : (
              <Star size={12} aria-hidden />
            )}
            {review.source === "google" ? "Google" : "ClassEasily"}
          </ReviewSourceTag>
        ) : null}

        <PreviewTopRow>
          <FlatAvatar size={48} src={avatarUrl} alt={reviewerName}>
            {reviewerName.charAt(0).toUpperCase() || <User size={18} />}
          </FlatAvatar>
          <NameBlock>
            <ReviewerNameLine>{reviewerName}</ReviewerNameLine>
            {locationLine ? (
              <ReviewerLocationLine>{locationLine}</ReviewerLocationLine>
            ) : null}
          </NameBlock>
        </PreviewTopRow>

        <StarsWhenRow $padSource={Boolean(showSourceBadge && isModal)}>
          <StarRatingBlack rating={review.rating} />
          {whenText ? (
            <>
              <DotSep aria-hidden>·</DotSep>
              <WhenText>{whenText}</WhenText>
            </>
          ) : null}
          {showSourceBadge && !isModal ? (
            <InlineSource>
              {review.source === "google" ? "Google" : "ClassEasily"}
            </InlineSource>
          ) : null}
        </StarsWhenRow>

        {review.comment ? (
          <TranslatedReviewText
            text={review.comment}
            isModal={isModal}
            expanded={isExpanded}
            onToggleExpand={() => toggleReviewExpansion(review.id)}
            variant="comment"
          />
        ) : null}

        {hostReply ? (
          <BusinessResponse>
            <ResponseHeader>
              <MessageSquareText size={16} aria-hidden /> Response from Host
            </ResponseHeader>
            <TranslatedReviewText
              text={hostReply}
              isModal={isModal}
              expanded={isExpanded}
              onToggleExpand={() => toggleReviewExpansion(review.id)}
              variant="response"
            />
          </BusinessResponse>
        ) : null}

        {reviewImages.length > 0 ? (
          <ReviewImageContainer>
            <ReviewImage
              src={reviewImages[0]}
              alt={`Review from ${reviewerName}`}
              onClick={() => setSelectedImage(reviewImages[0])}
            />
            <ImageOverlay onClick={() => setSelectedImage(reviewImages[0])}>
              <ZoomIcon size={24} />
            </ImageOverlay>
          </ReviewImageContainer>
        ) : null}
      </>
    );

    if (!isModal) {
      return <PreviewReviewRoot>{inner}</PreviewReviewRoot>;
    }

    return (
      <ModalReviewBlock {...refProp}>{inner}</ModalReviewBlock>
    );
  };

  const reviewsHeaderBlock = useMemo(
    () => (
      <SectionHead>
        <Header>
          <HeaderTitle>
            <Star
              size={18}
              fill="#111111"
              color="#111111"
              strokeWidth={0}
              aria-hidden
            />
            <span>
              {reviewStats.safeRating} ·{" "}
              {reviewStats.safeCount.toLocaleString("en-US")}{" "}
              {reviewStats.reviewWord}
            </span>
          </HeaderTitle>
        </Header>
      </SectionHead>
    ),
    [reviewStats],
  );

  if (loadingPreview) {
    return (
      <ReviewsContainer>
        {reviewsHeaderBlock}
        <PreviewReviewsSkeletonGrid />
      </ReviewsContainer>
    );
  }

  if (initialReviewCount === 0) {
    return (
      <ReviewsContainer>
        {reviewsHeaderBlock}
        <EmptyState>
          <h3>No reviews yet</h3>
          <p>Be the first to leave a review for this experience!</p>
        </EmptyState>
      </ReviewsContainer>
    );
  }

  // --- PORTALED IMAGE MODAL ---
  // This ensures the image modal renders at the body level, strictly above everything else
  const imageModal = mounted
    ? createPortal(
        <AnimatePresence>
          {selectedImage && (
            <ImageModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
            >
              <ImageModalContainer
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ImageCloseButton onClick={() => setSelectedImage(null)}>
                  <X size={20} />
                </ImageCloseButton>
                <FullScreenImage
                  src={selectedImage}
                  alt="Full screen review image"
                />
              </ImageModalContainer>
            </ImageModalOverlay>
          )}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <>
      <ReviewsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {reviewsHeaderBlock}

        <ReviewsGrid>
          {previewReviewColumns.map((col, colIdx) => (
            <ReviewsCol key={colIdx}>
              {col.map((review, index) => (
                <Fragment key={String(review.id)}>
                  {renderReviewContent(review, index, false)}
                </Fragment>
              ))}
            </ReviewsCol>
          ))}
        </ReviewsGrid>

        {(initialReviewCount > 6 || initialReviewCount > 0) && (
          <ReviewFooter>
            {initialReviewCount > 6 && (
              <ShowAllButton type="button" onClick={handleOpenModal}>
                Show all reviews
              </ShowAllButton>
            )}
            {initialReviewCount > 0 && (
              <LearnReviewsLink href="/terms-of-service">
                Learn how reviews work
              </LearnReviewsLink>
            )}
          </ReviewFooter>
        )}
      </ReviewsContainer>

      {/* --- DESKTOP: ANT DESIGN MODAL --- */}
      {!isMobile && (
        <Modal
          open={isModalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={720}
          centered
          destroyOnClose
          zIndex={9999}
          title={
            <div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#111111",
                  marginBottom: 4,
                }}
              >
                All reviews
              </div>
              <div style={{ fontSize: "14px", color: "#717171", fontWeight: 400 }}>
                {initialReviewCount} total · sort and read every comment
              </div>
            </div>
          }
          styles={{
            content: { borderRadius: 16, overflow: "hidden" },
            header: {
              borderBottom: "1px solid #eeeeee",
              padding: "16px 24px 14px",
              marginBottom: 0,
            },
            body: {
              padding: 0,
              maxHeight: "70vh",
              overflowY: "auto",
            },
          }}
        >
          <ModalToolbar style={{ padding: "0 24px 12px" }}>
            <SortLabel>Sort</SortLabel>
            <SortChip
              type="button"
              data-active={modalSort === "recent"}
              onClick={() => setModalSort("recent")}
            >
              Most recent
            </SortChip>
            <SortChip
              type="button"
              data-active={modalSort === "high"}
              onClick={() => setModalSort("high")}
            >
              Highest rated
            </SortChip>
            <SortChip
              type="button"
              data-active={modalSort === "low"}
              onClick={() => setModalSort("low")}
            >
              Lowest rated
            </SortChip>
          </ModalToolbar>
          <div style={{ padding: "0 24px 20px" }}>
            {sortedModalReviews.map((review, index) => (
              <Fragment key={`${String(review.id)}-${index}`}>
                {renderReviewContent(review, index, true)}
              </Fragment>
            ))}
            {loadingMore && (
              <div style={{ padding: "0 0 20px 0" }}>
                <ReviewSkeletonLoader />
                <ReviewSkeletonLoader />
              </div>
            )}
            {!loadingMore && modalHasMore && <div style={{ height: 20 }} />}
          </div>
        </Modal>
      )}

      {/* --- MOBILE: VAUL DRAWER --- */}
      {isMobile && (
        <VaulDrawer.Root open={isModalVisible} onOpenChange={setIsModalVisible}>
          <VaulDrawer.Portal>
            <VaulOverlay />
            <VaulContent>
              <VaulHandle />
              <VaulBody>
                <DrawerModalTitle>
                  <DrawerModalHeading>All reviews</DrawerModalHeading>
                  <DrawerModalSub>
                    {initialReviewCount} total · sort and read every comment
                  </DrawerModalSub>
                </DrawerModalTitle>
                <ModalToolbar style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <SortLabel>Sort</SortLabel>
                  <SortChip
                    type="button"
                    data-active={modalSort === "recent"}
                    onClick={() => setModalSort("recent")}
                  >
                    Most recent
                  </SortChip>
                  <SortChip
                    type="button"
                    data-active={modalSort === "high"}
                    onClick={() => setModalSort("high")}
                  >
                    Highest rated
                  </SortChip>
                  <SortChip
                    type="button"
                    data-active={modalSort === "low"}
                    onClick={() => setModalSort("low")}
                  >
                    Lowest rated
                  </SortChip>
                </ModalToolbar>
                {sortedModalReviews.map((review, index) => (
                  <Fragment key={`${String(review.id)}-${index}`}>
                    {renderReviewContent(review, index, true)}
                  </Fragment>
                ))}
                {loadingMore && (
                  <div style={{ padding: "0 0 20px 0" }}>
                    <ReviewSkeletonLoader />
                    <ReviewSkeletonLoader />
                  </div>
                )}
                {!loadingMore && modalHasMore && <div style={{ height: 50 }} />}
              </VaulBody>
            </VaulContent>
          </VaulDrawer.Portal>
        </VaulDrawer.Root>
      )}

      {/* Full Screen Image Viewer (Portaled) */}
      {imageModal}
    </>
  );
};

export default Reviews;
