"use client";

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { Avatar, Card } from "antd";
import { Star, Globe, User } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow, isValid } from "date-fns";

const ReviewCardWrap = styled(motion.div)`
  width: 100%;
`;

const CardLink = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #c81e1e;
    outline-offset: 2px;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  ${CardLink}:hover & {
    border-color: #d1d5db !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 20px !important;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ReviewerMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const ReviewerName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #111827;
  line-height: 1.3;
`;

const ReviewDate = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const StarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const CommentText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
`;

const ReadMoreBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #c81e1e;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
  padding-top: 4px;
`;

const ClassLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #111827;
`;

const GoogleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #4285f4;
  background: #f0f6ff;
  border-radius: 999px;
  padding: 3px 8px;
`;

function formatReviewDate(raw) {
  const d = raw ? new Date(raw) : null;
  if (!d || !isValid(d)) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

function StarRating({ rating }) {
  const r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <StarRow aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= r ? "#f59e0b" : "transparent"}
          stroke={i <= r ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </StarRow>
  );
}

const CLAMP_CHARS = 220;

function ReviewCardContent({ review, expanded, setExpanded }) {
  const name =
    review.reviewer_name || review.reviewerName || "Google reviewer";
  const avatar =
    review.reviewer_avatar_url || review.reviewerAvatarUrl || null;
  const comment = review.comment || "";
  const shouldClamp = comment.length > CLAMP_CHARS;
  const shown =
    shouldClamp && !expanded
      ? `${comment.slice(0, CLAMP_CHARS).trim()}…`
      : comment;
  const businessName = review.business_name || review.businessName;
  const reviewDate = formatReviewDate(
    review.review_date || review.reviewDate || review.created_at,
  );

  return (
    <StyledCard>
      <HeaderRow>
        <Avatar
          size={44}
          src={avatar || undefined}
          icon={!avatar ? <User size={20} /> : undefined}
          alt={name}
        />
        <ReviewerMeta>
          <ReviewerName>{name}</ReviewerName>
          {reviewDate ? <ReviewDate>{reviewDate}</ReviewDate> : null}
        </ReviewerMeta>
      </HeaderRow>

      <StarRating rating={review.rating} />

      {comment ? (
        <div>
          <CommentText>{shown}</CommentText>
          {shouldClamp ? (
            <ReadMoreBtn
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </ReadMoreBtn>
          ) : null}
        </div>
      ) : null}

      <FooterRow>
        {businessName ? (
          <ClassLabel>{businessName}</ClassLabel>
        ) : (
          <span />
        )}
        <GoogleBadge>
          <Globe size={11} aria-hidden />
          Google
        </GoogleBadge>
      </FooterRow>
    </StyledCard>
  );
}

export default function ReviewCard({ review, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const classSlug = review.class_slug || review.classSlug;
  const businessName = review.business_name || review.businessName;
  const classHref = classSlug ? `/classes/${classSlug}` : null;

  const card = (
    <ReviewCardContent
      review={review}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );

  return (
    <ReviewCardWrap
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
    >
      {classHref ? (
        <CardLink
          href={classHref}
          aria-label={
            businessName
              ? `View class: ${businessName}`
              : "View class for this review"
          }
        >
          {card}
        </CardLink>
      ) : (
        card
      )}
    </ReviewCardWrap>
  );
}
