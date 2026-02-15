"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom"; // Added for Image Viewer Fix
import styled, { keyframes, css } from "styled-components";
import { Avatar, Rate, Modal } from "antd";
import { Drawer as VaulDrawer } from "vaul";
import {
  Star,
  MessageSquareText,
  ChevronRight,
  User,
  X,
  ZoomIn,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { classService } from "@/services/apiService";

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

const SkeletonCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const SkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;
`;

const SkeletonAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  ${SkeletonPulse}
  flex-shrink: 0;
`;

const SkeletonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const SkeletonName = styled.div`
  height: 14px;
  width: 140px;
  border-radius: 4px;
  ${SkeletonPulse}
`;

const SkeletonDate = styled.div`
  height: 12px;
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
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 12px;
  }
`;

const Header = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  svg {
    color: #ff385c;
  }

  @media (max-width: 768px) {
    margin-bottom: 0.75rem;
  }
`;

const HeaderTitle = styled.span`
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const HeaderRating = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
`;

const ReviewsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const CardBaseStyles = `
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.2s ease;
`;

const ReviewCard = styled(motion.div)`
  ${CardBaseStyles}

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #ff385c;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    &:hover {
      transform: none;
    }
  }
`;

const ModalReviewItem = styled.div`
  ${CardBaseStyles}
  margin-bottom: 1rem;

  &:hover {
    border-color: #ff385c;
  }
`;

const ReviewSourceTag = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: ${(props) =>
    props.source === "google" ? "#e8f0fe" : "#fff0f3"};
  color: ${(props) => (props.source === "google" ? "#1a73e8" : "#ff385c")};
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
`;

const ReviewerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ReviewerName = styled.div`
  font-weight: 600;
  color: #000;
  font-size: 0.95rem;
  line-height: 1.3;
`;

const ReviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const ReviewDate = styled.div`
  color: #767676;
  font-size: 0.8rem;
`;

const StyledAvatar = styled(Avatar)`
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
`;

const StyledRate = styled(Rate)`
  font-size: 14px;
  .ant-rate-star-full .ant-rate-star-first,
  .ant-rate-star-full .ant-rate-star-second,
  .ant-rate-star-full {
    color: #ff385c;
  }
`;

const Comment = styled.p`
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const ShowMoreButton = styled.button`
  background: none;
  border: none;
  color: #ff385c;
  padding: 0;
  margin-left: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  &:hover {
    text-decoration: underline;
  }
`;

const BusinessResponse = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 1rem;
    width: 12px;
    height: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-bottom: none;
    border-right: none;
    transform: rotate(45deg);
  }
`;

const ResponseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #334155;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
`;

const ResponseText = styled.div`
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.4;
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

const ShowAllButton = styled(motion.button)`
  background-color: white;
  border: 1px solid #eaeaea;
  font-weight: 600;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #000;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #fff8f8;
    border-color: #ff385c;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
  }
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

// --- Helpers ---
const normalizeReview = (review) => ({
  ...review,
  id: review.id ?? review.reviewId ?? review.google_review_id,
  reviewer_avatar_url:
    review.reviewer_avatar_url || review.user?.avatar_thumb_url,
  reviewer_name: review.reviewer_name || review.user?.name,
  image_urls:
    review.image_urls?.length > 0
      ? review.image_urls
      : review.image_medium_url
        ? [review.image_medium_url]
        : [],
  business_response: review.business_response || review.owner_response,
});

const ReviewSkeletonLoader = () => (
  <SkeletonCard>
    <SkeletonHeader>
      <SkeletonAvatar />
      <SkeletonInfo>
        <SkeletonName />
        <SkeletonDate />
      </SkeletonInfo>
    </SkeletonHeader>
    <div style={{ marginTop: "10px" }}>
      <SkeletonLine width="100%" />
      <SkeletonLine width="92%" />
      <SkeletonLine width="96%" />
      <SkeletonLine width="60%" />
    </div>
  </SkeletonCard>
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
    return reviewsArray.map(normalizeReview);
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

  // --- CRITICAL FIX: SYNC STATE WITH PARENT COMPONENT ---
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("reviewsModalStateChange", {
        detail: { isOpen: isModalVisible },
      }),
    );
  }, [isModalVisible]);

  // --- Infinite Scroll Logic ---
  const observer = useRef();

  const lastReviewElementRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && modalHasMore) {
          loadModalReviews(modalPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, modalHasMore, modalPage],
  );

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
            setPreviewReviews((result.data || []).map(normalizeReview));
          }
        } else {
          const result = await classService.fetchClassReviewsPaginated(
            slug,
            1,
            6,
          );
          if (result.success) {
            setPreviewReviews((result.reviews || []).map(normalizeReview));
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

  const loadModalReviews = async (page) => {
    if (!slug) return;

    try {
      setLoadingMore(true);
      if (mode === "business") {
        const result = await classService.fetchBusinessReviews(slug, page, 10);
        if (result.success && result.data) {
          const newReviews = (result.data || []).map(normalizeReview);
          setModalReviews((prev) =>
            page === 1 ? newReviews : [...prev, ...newReviews],
          );
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
          const newReviews = (result.reviews || []).map(normalizeReview);
          const pagination = result.pagination || {};
          setModalReviews((prev) =>
            page === 1 ? newReviews : [...prev, ...newReviews],
          );
          setModalPage(page);
          setModalHasMore(pagination.has_more || false);
        }
      }
    } catch (error) {
      console.error("Error loading modal reviews:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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

  // --- Render Helpers ---
  const renderReviewContent = (review, index, isModal) => {
    const CardComponent = isModal ? ModalReviewItem : ReviewCard;
    const shouldTruncate =
      review.comment && review.comment.length > 150 && !isModal;
    const isExpanded = expandedReviews[review.id];

    const isLastElement = isModal && index === modalReviews.length - 1;
    const refProp = isLastElement ? { ref: lastReviewElementRef } : {};

    const avatarUrl =
      review.reviewer_avatar_url || review.user?.avatar_thumb_url;
    const reviewerName =
      review.reviewer_name || review.user?.name || "Anonymous";
    const reviewImages =
      review.image_urls && review.image_urls.length > 0
        ? review.image_urls
        : review.image_medium_url
          ? [review.image_medium_url]
          : [];

    return (
      <CardComponent
        key={`${review.id}-${isModal ? "modal" : "preview"}`}
        {...refProp}
        initial={!isModal ? { opacity: 0, y: 10 } : undefined}
        animate={!isModal ? { opacity: 1, y: 0 } : undefined}
        transition={!isModal ? { delay: index * 0.05 } : undefined}
      >
        {(isModal || (platformReviewCount > 0 && platformReviewCount < 10)) &&
          review.source && (
            <ReviewSourceTag source={review.source}>
              {review.source === "google" ? (
                <Globe size={12} />
              ) : (
                <Star size={12} />
              )}
              {review.source === "google" ? "From Google" : "On Classeasily"}
            </ReviewSourceTag>
          )}

        <ReviewHeader>
          <StyledAvatar
            size={isModal ? 44 : 40}
            src={avatarUrl}
            alt={reviewerName}
          >
            {reviewerName.charAt(0).toUpperCase() || <User size={18} />}
          </StyledAvatar>
          <ReviewerInfo>
            <ReviewerName>{reviewerName}</ReviewerName>
            <ReviewMeta>
              <StyledRate disabled value={review.rating} />
              <ReviewDate>
                {new Date(
                  review.date || review.createdAt || review.review_date,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </ReviewDate>
            </ReviewMeta>
          </ReviewerInfo>
        </ReviewHeader>

        {review.comment && (
          <Comment>
            {shouldTruncate && !isExpanded
              ? `${review.comment.slice(0, 150)}...`
              : review.comment}
            {shouldTruncate && (
              <ShowMoreButton onClick={() => toggleReviewExpansion(review.id)}>
                {isExpanded ? "Show less" : "Show more"}
              </ShowMoreButton>
            )}
          </Comment>
        )}

        {(review.business_response || review.owner_response) && (
          <BusinessResponse>
            <ResponseHeader>
              <MessageSquareText size={16} /> Response from Host
            </ResponseHeader>
            <ResponseText>
              {review.business_response || review.owner_response}
            </ResponseText>
          </BusinessResponse>
        )}

        {reviewImages.length > 0 && (
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
        )}
      </CardComponent>
    );
  };

  if (loadingPreview) {
    return (
      <ReviewsContainer>
        <Header>
          <HeaderTitle>What guests are saying</HeaderTitle>
          <HeaderRating>
            <Star size={20} /> {initialRating.toFixed(1)} · {initialReviewCount} reviews
          </HeaderRating>
        </Header>
        <ReviewsColumn>
          <ReviewSkeletonLoader />
          <ReviewSkeletonLoader />
          <ReviewSkeletonLoader />
        </ReviewsColumn>
      </ReviewsContainer>
    );
  }

  if (initialReviewCount === 0) {
    return (
      <ReviewsContainer>
        <Header>
          <Star size={24} />
          <HeaderTitle>What guests are saying</HeaderTitle>
        </Header>
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
        <Header>
          <HeaderTitle>What guests are saying</HeaderTitle>
          <HeaderRating>
            <Star size={20} /> {initialRating.toFixed(1)} · {initialReviewCount} review
            {initialReviewCount !== 1 ? "s" : ""}
          </HeaderRating>
        </Header>

        <ReviewsColumn>
          <AnimatePresence>
            {previewReviews.map((review, index) =>
              renderReviewContent(review, index, false),
            )}
          </AnimatePresence>
        </ReviewsColumn>

        {initialReviewCount > 6 && (
          <ShowAllButton
            onClick={handleOpenModal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Show all {initialReviewCount} reviews <ChevronRight size={16} />
          </ShowAllButton>
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
          zIndex={9999} // High Z-Index to stay above Header
          title={
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                paddingBottom: "10px",
              }}
            >
              All reviews ({initialReviewCount})
            </div>
          }
          styles={{
            body: {
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: "8px",
            },
          }}
        >
          <div style={{ paddingTop: "10px" }}>
            {modalReviews.map((review, index) =>
              renderReviewContent(review, index, true),
            )}
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
                <div
                  style={{
                    paddingBottom: "16px",
                    borderBottom: "1px solid #eee",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}
                  >
                    All reviews ({initialReviewCount})
                  </h3>
                </div>
                {modalReviews.map((review, index) =>
                  renderReviewContent(review, index, true),
                )}
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
