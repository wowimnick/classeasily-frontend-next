"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  Star,
  MessageSquare,
  Clock,
  Globe,
  User,
  X,
  ZoomIn,
  MessageSquareText,
  ChevronRight,
} from "lucide-react";
import { Avatar, Rate, Button } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { businessService } from "@/services/apiService";
import { fetchReviewsAction } from "@/app/business/actions";
import { ReviewsTabSkeleton } from "./BusinessSkeletons";

const REVIEWS_PER_PAGE = 10;
const MAIN_PAGE_REVIEW_COUNT = 9;

// Styled Components
const SectionBlock = styled.section`
  background: transparent;
  padding: 0;
  border: none;
`;

const SectionHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: #ff385c;
      width: 24px;
      height: 24px;
    }
  }

  .subtitle-wrapper {
    flex: 1;
  }

  .subtitle {
    color: #666;
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 1.5rem;
    }
  }
`;

const ReviewsColumnContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ReviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const TimeDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0 1rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  }

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
    margin: 1rem 0 0.75rem 0;
    font-size: 0.8rem;
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
  break-inside: avoid;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    border-color: #ff385c;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 10px;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
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
  z-index: 2;

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

const ViewAllButton = styled(motion.button)`
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
  margin: 2rem auto 0 auto;
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
    align-items: flex-start;
  }
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 1024px) {
    max-width: 900px;
  }

  @media (max-width: 768px) {
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
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
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const ModalReviewsColumnContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ModalReviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const ModalReviewCard = styled(motion.div)`
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  position: relative;
  break-inside: avoid;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-color: #ff385c;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #999;

  svg {
    margin-bottom: 1.5rem;
    opacity: 0.3;
  }

  h3 {
    font-size: 1.25rem;
    margin: 0;
    color: #666;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
  }
`;

// Utility Functions
function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);

  if (months >= 6) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

function getTimeCategory(dateString) {
  if (!dateString) return "older";
  const date = new Date(dateString);
  const now = new Date();
  const days = Math.round((now - date) / (1000 * 60 * 60 * 24));

  if (days <= 7) return "recent";
  if (days <= 30) return "month";
  if (days <= 90) return "quarter";
  return "older";
}

function getTimeCategoryLabel(category) {
  switch (category) {
    case "recent":
      return "This Week";
    case "month":
      return "This Month";
    case "quarter":
      return "Last 3 Months";
    case "older":
      return "Older Reviews";
    default:
      return "";
  }
}

// Main Component
const ReviewsTab = ({ slug, totalReviews, ratingAsNumber }) => {
  const [mainPageReviews, setMainPageReviews] = useState([]);
  const [mainPageReviewsLoading, setMainPageReviewsLoading] = useState(false);
  const [reviewsForModal, setReviewsForModal] = useState([]);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (isModalVisible || selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalVisible, selectedImage]);

  useEffect(() => {
    const fetchMainPageReviews = async () => {
      if (totalReviews > 0 && mainPageReviews.length === 0) {
        setMainPageReviewsLoading(true);
        try {
          // Use server action instead of direct API call for cached data
          const result = await fetchReviewsAction(
            slug,
            1,
            MAIN_PAGE_REVIEW_COUNT
          );
          if (result.success) {
            setMainPageReviews(result.data);
          }
        } catch (err) {
          console.error("Failed to fetch main page reviews:", err);
        } finally {
          setMainPageReviewsLoading(false);
        }
      }
    };

    fetchMainPageReviews();
  }, [totalReviews, slug, mainPageReviews.length]);

  const loadModalReviews = useCallback(
    async (page) => {
      setLoadingMore(true);
      try {
        // Use server action for cached reviews
        const result = await fetchReviewsAction(slug, page, REVIEWS_PER_PAGE);
        if (result.success) {
          setReviewsForModal((prev) =>
            page === 1 ? result.data : [...prev, ...result.data]
          );
          setModalCurrentPage(page);
          setModalHasMore(result.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch modal reviews:", err);
      } finally {
        setLoadingMore(false);
      }
    },
    [slug]
  );

  const handleOpenModal = useCallback(() => {
    loadModalReviews(1);
    setIsModalVisible(true);
  }, [loadModalReviews]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setReviewsForModal([]);
    setModalCurrentPage(1);
    setExpandedReviews({});
    setModalHasMore(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && modalHasMore) {
      loadModalReviews(modalCurrentPage + 1);
    }
  }, [loadingMore, modalHasMore, modalCurrentPage, loadModalReviews]);

  const toggleReviewExpansion = useCallback((reviewId) => {
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  }, []);

  const openImageModal = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === "Escape") {
        if (selectedImage) closeImageModal();
        else if (isModalVisible) handleCloseModal();
      }
    },
    [selectedImage, isModalVisible, closeImageModal, handleCloseModal]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const organizeReviewsIntoColumns = useCallback((reviews, numColumns) => {
    const columns = Array.from({ length: numColumns }, () => []);
    const reviewsByCategory = { recent: [], month: [], quarter: [], older: [] };

    reviews.forEach((review) => {
      const category = getTimeCategory(review.review_date);
      reviewsByCategory[category].push(review);
    });

    let currentColumn = 0;
    const categories = ["recent", "month", "quarter", "older"];

    categories.forEach((category) => {
      const categoryReviews = reviewsByCategory[category];
      if (categoryReviews.length > 0) {
        columns[currentColumn].push({
          type: "divider",
          category,
          label: getTimeCategoryLabel(category),
        });

        categoryReviews.forEach((review) => {
          columns[currentColumn].push({ type: "review", data: review });
          currentColumn = (currentColumn + 1) % numColumns;
        });
      }
    });

    return columns;
  }, []);

  const renderReview = useCallback(
    (review, index, isModal = false) => {
      const CardComponent = isModal ? ModalReviewCard : ReviewCard;
      const shouldTruncate =
        review.comment && review.comment.length > 200 && !isModal;
      const isExpanded = expandedReviews[review.id];

      return (
        <CardComponent
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          {review.source && (
            <ReviewSourceTag source={review.source.toLowerCase()}>
              {review.source === "Google" ? <Globe /> : <Star />}
              {review.source === "Google" ? "From Google" : "On Classeasily"}
            </ReviewSourceTag>
          )}
          <ReviewHeader>
            <StyledAvatar
              size={isModal ? 44 : 40}
              src={review.reviewer_avatar_url}
              alt={`${review.reviewer_name || "Anonymous"} avatar`}
            >
              {review.user?.name ? (
                review.user.name.charAt(0).toUpperCase()
              ) : (
                <User size={18} />
              )}
            </StyledAvatar>
            <ReviewerInfo>
              <ReviewerName>{review.reviewer_name || "Anonymous"}</ReviewerName>
              <ReviewMeta>
                <StyledRate disabled value={review.rating} />
                <ReviewDate>
                  {formatRelativeTime(review.review_date)}
                </ReviewDate>
              </ReviewMeta>
            </ReviewerInfo>
          </ReviewHeader>

          {review.comment && (
            <Comment>
              {shouldTruncate && !isExpanded
                ? `${review.comment.slice(0, 200)}...`
                : review.comment}
              {shouldTruncate && (
                <ShowMoreButton
                  onClick={() => toggleReviewExpansion(review.id)}
                  aria-label={isExpanded ? "Show less" : "Show more"}
                >
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

          {(review.image_medium_url ||
            (review.image_urls && review.image_urls.length > 0)) && (
            <ReviewImageContainer>
              <ReviewImage
                src={review.image_medium_url || review.image_urls[0]}
                alt={`Review image from ${review.user?.name || "reviewer"}`}
                loading="lazy"
                onClick={() =>
                  openImageModal(
                    review.image_medium_url || review.image_urls[0]
                  )
                }
              />
              <ImageOverlay
                onClick={() =>
                  openImageModal(
                    review.image_medium_url || review.image_urls[0]
                  )
                }
              >
                <ZoomIn size={24} />
              </ImageOverlay>
            </ReviewImageContainer>
          )}
        </CardComponent>
      );
    },
    [expandedReviews, toggleReviewExpansion, openImageModal]
  );

  const mainPageReviewColumns = useMemo(() => {
    return organizeReviewsIntoColumns(mainPageReviews, 3);
  }, [mainPageReviews, organizeReviewsIntoColumns]);

  const modalReviewColumns = useMemo(() => {
    return organizeReviewsIntoColumns(reviewsForModal, 2);
  }, [reviewsForModal, organizeReviewsIntoColumns]);

  if (totalReviews === 0) {
    return (
      <SectionBlock>
        <EmptyState>
          <Star size={64} />
          <h3>No Reviews Yet</h3>
          <p>Be the first to leave a review for this business!</p>
        </EmptyState>
      </SectionBlock>
    );
  }

  return (
    <>
      <SectionBlock>
        <SectionHeader>
          <div className="subtitle-wrapper">
            <h2>
              <MessageSquare /> Customer Reviews
            </h2>
            <div className="subtitle">
              {ratingAsNumber > 0 && (
                <>
                  <Star
                    size={16}
                    fill="#FFB800"
                    color="#FFB800"
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: "0.25rem",
                    }}
                  />
                  <strong>{ratingAsNumber.toFixed(1)}</strong> ·{" "}
                </>
              )}
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>
        </SectionHeader>

        {mainPageReviewsLoading ? (
          <ReviewsTabSkeleton />
        ) : (
          <>
            <ReviewsColumnContainer>
              {mainPageReviewColumns.map((column, columnIndex) => (
                <ReviewColumn key={columnIndex}>
                  {column.map((item, itemIndex) =>
                    item.type === "divider" ? (
                      <TimeDivider key={`divider-${item.category}`}>
                        <Clock size={14} />
                        {item.label}
                      </TimeDivider>
                    ) : (
                      renderReview(item.data, itemIndex, false)
                    )
                  )}
                </ReviewColumn>
              ))}
            </ReviewsColumnContainer>

            {totalReviews > MAIN_PAGE_REVIEW_COUNT && (
              <ViewAllButton
                onClick={handleOpenModal}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Show all reviews"
              >
                Show all {totalReviews} reviews <ChevronRight size={16} />
              </ViewAllButton>
            )}
          </>
        )}
      </SectionBlock>

      <AnimatePresence>
        {isModalVisible && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reviews-modal-title"
          >
            <ModalContainer
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <ModalHeader>
                <h3 id="reviews-modal-title">All reviews ({totalReviews})</h3>
                <CloseButton
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <ModalContent>
                <ModalReviewsColumnContainer>
                  {modalReviewColumns.map((column, columnIndex) => (
                    <ModalReviewColumn key={columnIndex}>
                      {column.map((item, itemIndex) =>
                        item.type === "divider" ? (
                          <TimeDivider key={`divider-${item.category}`}>
                            <Clock size={14} />
                            {item.label}
                          </TimeDivider>
                        ) : (
                          renderReview(item.data, itemIndex, true)
                        )
                      )}
                    </ModalReviewColumn>
                  ))}
                </ModalReviewsColumnContainer>
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
            onClick={(e) => {
              if (e.target === e.currentTarget) closeImageModal();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Full screen image viewer"
          >
            <ImageModalContainer
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <ImageCloseButton
                onClick={closeImageModal}
                aria-label="Close image"
              >
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

export default ReviewsTab;
