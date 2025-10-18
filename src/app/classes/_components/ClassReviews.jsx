"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import { Avatar, Button, Rate } from "antd";
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
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

// --- Styled Components (keeping all original styles) ---
const ReviewsContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
`;

const Header = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1.375rem;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    gap: 0.5rem;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  svg {
    color: #ff385c;
  }
`;

const ReviewsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
`;

const ReviewCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #ff385c;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 10px;

    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  @media (max-width: 480px) {
    padding: 0.875rem;
    border-radius: 8px;
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

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-bottom: 0.625rem;
  }
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

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const ReviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;

  @media (max-width: 480px) {
    gap: 0.375rem;
    margin-top: 0.125rem;
  }
`;

const ReviewDate = styled.div`
  color: #767676;
  font-size: 0.8rem;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const StyledAvatar = styled(Avatar)`
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 36px !important;
    height: 36px !important;
    font-size: 14px !important;
  }
`;

const StyledRate = styled(Rate)`
  font-size: 14px;

  .ant-rate-star-full .ant-rate-star-first,
  .ant-rate-star-full .ant-rate-star-second,
  .ant-rate-star-full {
    color: #ff385c;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const Comment = styled.p`
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    line-height: 1.4;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-bottom: 0.625rem;
  }
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

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const BusinessResponse = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  position: relative;

  @media (max-width: 480px) {
    padding: 0.625rem;
    border-radius: 6px;
    margin-top: 0.625rem;
  }

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

    @media (max-width: 480px) {
      left: 0.75rem;
    }
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

  svg {
    color: #64748b;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    gap: 0.375rem;
    margin-bottom: 0.375rem;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const ResponseText = styled.div`
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const ReviewImageContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 0.75rem;

  @media (max-width: 768px) {
    margin-top: 0.625rem;
  }
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
    border-radius: 6px;

    &:hover {
      transform: none;
      filter: brightness(0.95);
    }
  }

  @media (max-width: 480px) {
    max-width: 200px;
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

  @media (max-width: 768px) {
    border-radius: 6px;
    max-width: 250px;
  }

  @media (max-width: 480px) {
    max-width: 200px;
  }
`;

const ZoomIcon = styled(ZoomIn)`
  color: white;
  size: 24px;

  @media (max-width: 480px) {
    size: 20px;
  }
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    max-width: 100%;
    padding: 0.875rem 1.25rem;
    font-size: 0.875rem;
    border-radius: 10px;

    &:hover:not(:disabled) {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    gap: 0.375rem;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.4);
  }
`;

const DragHandle = styled(motion.div)`
  display: none;
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 24px 24px 0 0;
    max-height: 85vh;
    height: 85vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #000;
  }

  @media (max-width: 480px) {
    padding: 1rem;

    h3 {
      font-size: 1.125rem;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    color: #000;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
  }
`;

const ModalReviewCard = styled(motion.div)`
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-color: #ff385c;
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    padding: 0.875rem;
    border-radius: 8px;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.25rem;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
  }
`;

const ImageModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    top: -60px;
    right: 0;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: #666;

  @media (max-width: 480px) {
    padding: 2rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #666;

  h3 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 2rem 1rem;
  }
`;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const mobileModalVariants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};

// Helper function to normalize review data structure
const normalizeReview = (review) => {
  return {
    ...review,
    // Ensure consistent property names
    reviewer_avatar_url:
      review.reviewer_avatar_url || review.user?.avatar_thumb_url,
    reviewer_name: review.reviewer_name || review.user?.name,
    image_urls: review.image_urls || [],
    business_response: review.business_response || review.owner_response,
  };
};

// Main Component
const Reviews = ({
  slug,
  initialRating,
  initialReviewCount,
  platformReviewCount,
  serverReviews = null,
}) => {
  // Normalize server reviews on initial load
  const normalizedServerReviews = useMemo(() => {
    if (!serverReviews) return [];
    // Handle both array and object with reviews property
    const reviewsArray = Array.isArray(serverReviews)
      ? serverReviews
      : serverReviews?.reviews || [];
    return reviewsArray.map(normalizeReview);
  }, [serverReviews]);

  const [previewReviews, setPreviewReviews] = useState(normalizedServerReviews);
  const [modalReviews, setModalReviews] = useState([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(
    !normalizedServerReviews.length
  );
  const [expandedReviews, setExpandedReviews] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchPreviewReviews = async () => {
      // Skip if we already have server reviews or no reviews exist
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
        const result = await classService.fetchClassReviewsPaginated(
          slug,
          1,
          6
        );
        if (result.success) {
          const normalizedReviews = (result.reviews || []).map(normalizeReview);
          setPreviewReviews(normalizedReviews);
        }
      } catch (error) {
        console.error("Error fetching preview reviews:", error);
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreviewReviews();
  }, [slug, initialReviewCount, normalizedServerReviews.length]);

  useEffect(() => {
    document.body.style.overflow =
      isModalVisible || selectedImage ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalVisible, selectedImage]);

  useEffect(() => {
    const event = new CustomEvent("reviewsModalStateChange", {
      detail: { isOpen: isModalVisible },
    });
    window.dispatchEvent(event);
  }, [isModalVisible]);

  const loadModalReviews = async (page) => {
    if (!slug) {
      console.error("Cannot load reviews: slug is missing");
      return;
    }

    try {
      setLoadingMore(true);
      console.log(`Fetching reviews for slug: ${slug}, page: ${page}`);

      const result = await classService.fetchClassReviewsPaginated(
        slug,
        page,
        10
      );

      console.log("API response:", result);

      if (result.success) {
        const newReviews = (result.reviews || []).map(normalizeReview);
        const pagination = result.pagination || {};

        setModalReviews((prev) =>
          page === 1 ? newReviews : [...prev, ...newReviews]
        );
        setModalPage(page);
        setModalHasMore(pagination.has_more || false);

        console.log(
          `Loaded ${newReviews.length} reviews, has more: ${pagination.has_more}`
        );
      } else {
        console.error("API returned success: false", result);
      }
    } catch (error) {
      console.error("Error loading modal reviews:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenModal = () => {
    console.log("Opening modal for slug:", slug);
    setIsModalVisible(true);
    loadModalReviews(1);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && modalHasMore) {
      console.log("Loading more reviews, next page:", modalPage + 1);
      loadModalReviews(modalPage + 1);
    }
  };

  const toggleReviewExpansion = (reviewId) =>
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));

  const openImageModal = (imageUrl) => setSelectedImage(imageUrl);
  const closeImageModal = () => setSelectedImage(null);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === "Escape") {
        if (selectedImage) closeImageModal();
        else if (isModalVisible) handleCloseModal();
      }
    },
    [selectedImage, isModalVisible]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const renderReview = (review, index, isModal = false) => {
    const CardComponent = isModal ? ModalReviewCard : ReviewCard;
    const shouldTruncate =
      review.comment && review.comment.length > 150 && !isModal;
    const isExpanded = expandedReviews[review.id];

    // Get avatar URL - prioritize reviewer_avatar_url
    const avatarUrl =
      review.reviewer_avatar_url || review.user?.avatar_thumb_url;

    // Get reviewer name
    const reviewerName =
      review.reviewer_name || review.user?.name || "Anonymous";

    // Get review images - handle both image_urls array and single image properties
    const reviewImages =
      review.image_urls && review.image_urls.length > 0
        ? review.image_urls
        : review.image_medium_url
        ? [review.image_medium_url]
        : [];

    return (
      <CardComponent
        key={review.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
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
            alt={`Profile picture of ${reviewerName}`}
          >
            {reviewerName.charAt(0).toUpperCase() || <User size={18} />}
          </StyledAvatar>
          <ReviewerInfo>
            <ReviewerName>{reviewerName}</ReviewerName>
            <ReviewMeta>
              <StyledRate disabled value={review.rating} />
              <ReviewDate>
                {new Date(
                  review.date || review.createdAt || review.review_date
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
              loading="lazy"
              decoding="async"
              onClick={() => openImageModal(reviewImages[0])}
            />
            <ImageOverlay onClick={() => openImageModal(reviewImages[0])}>
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
        <LoadingSpinner>
          <GlobalLoaderWithoutInlineStyles />
        </LoadingSpinner>
      </ReviewsContainer>
    );
  }

  if (initialReviewCount === 0) {
    return (
      <ReviewsContainer>
        <Header>
          <Star size={24} /> New Class
        </Header>
        <EmptyState>
          <h3>No reviews yet</h3>
          <p>Be the first to leave a review for this class!</p>
        </EmptyState>
      </ReviewsContainer>
    );
  }

  return (
    <>
      <ReviewsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Header>
          <Star size={24} />
          {initialRating.toFixed(1)} · {initialReviewCount} review
          {initialReviewCount !== 1 ? "s" : ""}
        </Header>
        <ReviewsColumn>
          <AnimatePresence>
            {previewReviews.map((review, index) => renderReview(review, index))}
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
      <AnimatePresence>
        {isModalVisible && (
          <ModalOverlay
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleCloseModal}
          >
            <ModalContainer
              variants={isMobile ? mobileModalVariants : modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {isMobile && (
                <DragHandle
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (offset.y > 100 || (offset.y > 50 && velocity.y > 100))
                      handleCloseModal();
                  }}
                />
              )}
              <ModalHeader>
                <h3>All reviews ({initialReviewCount})</h3>
                <CloseButton onClick={handleCloseModal}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <ModalContent>
                <AnimatePresence>
                  {modalReviews.map((review, index) =>
                    renderReview(review, index, true)
                  )}
                </AnimatePresence>
                {loadingMore && (
                  <LoadingSpinner>
                    <GlobalLoaderWithoutInlineStyles />
                  </LoadingSpinner>
                )}
              </ModalContent>
              {modalHasMore && (
                <ModalFooter>
                  <Button
                    onClick={handleLoadMore}
                    loading={loadingMore}
                    style={{ borderColor: "#ff385c", color: "#ff385c" }}
                  >
                    {loadingMore ? "Loading..." : "Load More Reviews"}
                  </Button>
                </ModalFooter>
              )}
            </ModalContainer>
          </ModalOverlay>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedImage && (
          <ImageModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
          >
            <ImageModalContainer
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <ImageCloseButton onClick={closeImageModal}>
                <X size={20} />
              </ImageCloseButton>
              <FullScreenImage
                src={selectedImage}
                alt="Full screen review image"
              />
            </ImageModalContainer>
          </ImageModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default Reviews;
