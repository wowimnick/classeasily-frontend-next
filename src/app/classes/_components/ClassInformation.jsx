"use client";

import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Button, Typography, Tooltip, Divider } from "antd";
import { Share2, Heart, Star, MessageCircle } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";

const { Paragraph, Title } = Typography;

const CLASSEASILY_RED = "#FF385C";
const COLLAPSED_MAX_HEIGHT_PX = 200;

// LordIcon config (same as before) – rendered only after requestIdleCallback to avoid TBT
const lordIconMap = {
  "Creative & Makers": {
    icon: {
      src: "https://cdn.lordicon.com/usohfczy.json",
      trigger: "in",
      state: "in-reveal",
      colors:
        "primary:#ffc738,secondary:#b26836,tertiary:#3a3347,quaternary:#ebe6ef,quinary:#f24c00,senary:#eeca66,septenary:#2ca58d,octonary:#4bb3fd",
    },
    subcategories: {
      "Visual Arts": { src: "https://cdn.lordicon.com/spjlvfgs.json", trigger: "in", state: "in-reveal" },
      "Crafts & DIY": { src: "https://cdn.lordicon.com/rpgzzvoy.json", trigger: "in", state: "in-reveal" },
    },
  },
  "Food & Drink": {
    icon: { src: "https://cdn.lordicon.com/tlhmniwg.json", trigger: "in", state: "in-reveal" },
    subcategories: {
      "Cooking & Baking": { src: "https://cdn.lordicon.com/qetumhhk.json", trigger: "in", state: "in-reveal" },
      "Tastings & Mixology": { src: "https://cdn.lordicon.com/ldbrwnqj.json", trigger: "in", state: "in-reveal" },
    },
  },
  "Active & Social": {
    icon: { src: "https://cdn.lordicon.com/hhqqenci.json", trigger: "in", state: "in-reveal" },
    subcategories: {
      "Movement & Games": { src: "https://cdn.lordicon.com/iujnhzgo.json", trigger: "in", state: "in-reveal" },
      "Performance & Culture": { src: "https://cdn.lordicon.com/nnnotppf.json", trigger: "in", state: "in-dynamic" },
    },
  },
};
const defaultLordIcon = { src: "https://cdn.lordicon.com/xodeitpr.json", trigger: "in", state: "in-reveal" };
const partnerLordIcon = "https://cdn.lordicon.com/zopdjjjs.json";

// --- Animations ---

// Slower, smoother pop without z-index thrashing.
// We use translateZ to pop it visually on top without changing stacking context context abruptly.
const popAndSettle = keyframes`
  0% { transform: scale(0) translateZ(0); opacity: 0; }
  40% { transform: scale(2.5) translateZ(0); opacity: 1; } 
  75% { transform: scale(1) translateZ(0); }
  100% { transform: scale(1) translateZ(0); opacity: 1; }
`;

// Delayed text slide-out
const slideReveal = keyframes`
  0% { opacity: 0; transform: translateX(-20px); max-width: 0; margin-left: 0; }
  50% { opacity: 0; transform: translateX(-20px); max-width: 0; margin-left: 0; }
  100% { opacity: 1; transform: translateX(0); max-width: 200px; margin-left: 8px; }
`;

// --- Styled Components ---

const MobileHeaderSection = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 0.75rem;
    order: -1;
  }
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
`;
const MobileTitleRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
`;
const MobileStyledTitle = styled(Title)`
  &.ant-typography {
    font-size: clamp(1.2rem, 6vw, 1.3rem);
    font-weight: 700;
    color: #000;
    margin-bottom: 0 !important;
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    min-width: 0;
    flex-grow: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const MobileActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;
const MobileActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
  min-width: 48px;
  &:hover:not(:disabled) {
    background: #f7f7f7;
    transform: translateY(-1px);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  svg {
    flex-shrink: 0;
  }
`;
const InfoWrapper = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 1rem;
  padding-top: 0;
  background: white;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  /* Removed gap to allow Divider to control spacing */

  @media (max-width: 768px) {
    padding-top: 1rem;
  }
`;
const BusinessSection = styled.div`
  padding: 0;
  @media (max-width: 768px) {
    padding: 0 1rem;
    display: flex;
    justify-content: center;
  }
  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;
const BusinessInfo = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 16px;
  transition: background-color 0.2s ease;
  border: none;
  background-color: transparent;
  text-align: left;
  margin-left: -0.75rem;
  width: calc(100% + 1.5rem);

  &:hover:not(:disabled) {
    background-color: #f5f5f5;
  }
  &:focus-visible {
    outline: 2px solid ${CLASSEASILY_RED};
    outline-offset: 2px;
  }
  &:disabled {
    cursor: default;
    background-color: transparent;
    opacity: 0.7;
  }
  @media (max-width: 768px) {
    justify-content: center;
  }
  @media (max-width: 480px) {
    gap: 0.6rem;
    padding: 0.4rem 0.6rem;
    margin-left: -0.6rem;
    width: calc(100% + 1.2rem);
  }
`;
const BusinessAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #eaeaea;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #767676;
  @media (max-width: 480px) {
    width: 42px;
    height: 42px;
  }
`;
const HostImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const BusinessName = styled.span`
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;
const BusinessMetaWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #717171;
  line-height: 1.4;
`;
const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
`;
const MetaSeparator = styled.span`
  margin: 0 2px;
  color: #717171;
  font-size: 0.6rem;
  opacity: 0.7;
`;
const HostingMeta = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

// --- New Categories/Pills Section (hidden on mobile to reduce lag) ---
const CategoriesBlock = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;
const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* Removed border-bottom and padding-bottom */
  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
`;

const CategoriesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const CategoryPill = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 14px 6px 10px;
  background: #fdfdfd;
  border: 1px solid #e8e8e8;
  border-radius: 100px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  overflow: visible;

  @media (max-width: 480px) {
    padding: 5px 12px 5px 8px;
  }
`;

const AnimatedIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;

  /* Use fill-mode: both so the 0% keyframe applies immediately before animation starts. */
  /* will-change and backface-visibility prevents the snap/flicker at end of animation */
  will-change: transform;
  backface-visibility: hidden;

  /* Slower Duration: 1.4s */
  animation: ${popAndSettle} 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  animation-delay: ${(props) => props.$delay || "0ms"};

  svg,
  lord-icon {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
  }
`;

const AnimatedTextWrapper = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;

  /* Use fill-mode: both to prevent Flash of Unstyled Content */
  will-change: transform, opacity;
  backface-visibility: hidden;

  /* Slower Duration: 1.6s */
  animation: ${slideReveal} 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) both;
  animation-delay: ${(props) => props.$delay || "0ms"};

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

// --- Description Section ---
const DescriptionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
`;
const Description = styled(Paragraph)`
  &.ant-typography {
    font-size: 1rem;
    line-height: 1.6;
    color: #222;
    margin-bottom: 0 !important;
    word-wrap: break-word;
    white-space: pre-line;
    max-height: ${(props) =>
      props.$canBeTruncated && !props.$expanded
        ? `${COLLAPSED_MAX_HEIGHT_PX}px`
        : "none"};
    overflow: hidden;
    position: relative;
    transition: max-height 0.3s ease-in-out;
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: linear-gradient(transparent, white);
      opacity: ${(props) =>
        props.$canBeTruncated && !props.$expanded ? "1" : "0"};
      transition: opacity 0.3s ease-out;
      pointer-events: none;
    }
    @media (max-width: 768px) {
      font-size: 0.95rem;
      max-height: ${(props) =>
        props.$canBeTruncated && !props.$expanded ? "180px" : "none"};
      &::after {
        height: 60px;
      }
    }
    @media (max-width: 480px) {
      font-size: 0.9rem;
      max-height: ${(props) =>
        props.$canBeTruncated && !props.$expanded ? "150px" : "none"};
      &::after {
        height: 50px;
      }
    }
  }
`;
const ShowMoreButton = styled(Button)`
  align-self: flex-start;
  color: #ff385c !important;
  font-weight: 600;
  padding: 0 !important;
  border: none !important;
  background: none !important;
  box-shadow: none !important;
  height: auto !important;
  line-height: normal !important;
  &:hover,
  &:focus {
    color: #e03253 !important;
    background: none !important;
    text-decoration: underline;
  }
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const calculateHostingDuration = (dateString) => {
  if (!dateString) return "";
  const startDate = new Date(dateString);
  const now = new Date();
  if (isNaN(startDate.getTime()) || startDate > now) return "";
  const years = now.getFullYear() - startDate.getFullYear();
  const months = now.getMonth() - startDate.getMonth();
  const totalMonths =
    years * 12 + months + (now.getDate() < startDate.getDate() ? -1 : 0);
  if (totalMonths >= 12) {
    const totalYears = Math.floor(totalMonths / 12);
    return `${totalYears} year${totalYears > 1 ? "s" : ""}`;
  }
  if (totalMonths > 0)
    return `${totalMonths} month${totalMonths > 1 ? "s" : ""}`;
  const totalDays = Math.max(
    1,
    Math.floor((now - startDate) / (1000 * 3600 * 24)),
  );
  return `${totalDays} day${totalDays > 1 ? "s" : ""}`;
};

const AskQuestionRow = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 0 0.25rem;
  @media (max-width: 768px) {
    padding: 0 0.75rem;
    justify-content: stretch;
  }
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
`;

const AskQuestionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${CLASSEASILY_RED};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
  transition: color 0.2s, background 0.2s;
  border-radius: 12px;
  &:hover {
    color: #e03253;
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${CLASSEASILY_RED};
    outline-offset: 2px;
  }
  @media (max-width: 768px) {
    width: 100%;
    padding: 14px 1rem;
    font-size: 15px;
    color: #222;
    background: #f7f7f7;
    border: 1px solid #ebebeb;
    text-decoration: none;
    &:hover {
      background: #f0f0f0;
      color: #222;
      text-decoration: none;
    }
  }
  @media (max-width: 480px) {
    padding: 12px 1rem;
    font-size: 13px;
    min-height: 48px;
  }
`;

const ClassInformation = React.memo(
  ({
    title,
    description,
    reviewCount = 0,
    averageRating = 0,
    categoryName,
    subcategoryName,
    businessData,
    onBusinessClick,
    onContactHost,
    partnerTierName,
    isFavorite,
    isTogglingFavorite,
    onFavoriteClick,
    onShareClick,
  }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [canBeTruncated, setCanBeTruncated] = useState(false);
    const descriptionRef = useRef(null);

    useLayoutEffect(() => {
      const checkTruncation = () => {
        if (descriptionRef.current) {
          setCanBeTruncated(
            descriptionRef.current.scrollHeight > COLLAPSED_MAX_HEIGHT_PX,
          );
        }
      };
      checkTruncation();
      window.addEventListener("resize", checkTruncation);
      return () => window.removeEventListener("resize", checkTruncation);
    }, [description]);

    const toggleDescription = () =>
      setIsDescriptionExpanded(!isDescriptionExpanded);

    const shouldShowTopRated = averageRating >= 4.5 && reviewCount >= 5;
    const displayBusinessName = businessData?.businessName || "Business";
    const displayBusinessImage =
      businessData?.business_image_medium_url || null;
    const hostingDuration = calculateHostingDuration(businessData?.createdAt);

    let partnerBadgeText = null;
    if (partnerTierName === "Founding Partner") partnerBadgeText = "Partner";
    else if (partnerTierName === "Premium Partner")
      partnerBadgeText = "Premium";

    const categoryLordIcon =
      (categoryName && lordIconMap[categoryName]?.icon) || defaultLordIcon;
    const subcategoryLordIcon =
      (categoryName &&
        subcategoryName &&
        lordIconMap[categoryName]?.subcategories?.[subcategoryName]) ||
      defaultLordIcon;

    return (
      <InfoWrapper>
        <MobileHeaderSection>
          <MobileTitleRow>
            <MobileStyledTitle level={1}>{title}</MobileStyledTitle>
          </MobileTitleRow>
        </MobileHeaderSection>

        <BusinessSection>
          <BusinessInfo
            onClick={onBusinessClick}
            disabled={!businessData}
            aria-label={
              businessData
                ? `View details for ${displayBusinessName}`
                : "Business information unavailable"
            }
            title={
              businessData
                ? `View details for ${displayBusinessName}`
                : "Business information unavailable"
            }
          >
            <BusinessAvatar aria-hidden="true">
              {displayBusinessImage ? (
                <HostImg src={displayBusinessImage} alt="" />
              ) : (
                <LordIcon
                  src="https://cdn.lordicon.com/bhfjfgqz.json"
                  trigger="in"
                  state="in-reveal"
                  colors="primary:#767676"
                  style={{ width: 22, height: 22 }}
                />
              )}
            </BusinessAvatar>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <BusinessName>Hosted by {displayBusinessName}</BusinessName>
              <BusinessMetaWrapper>
                <HostingMeta>
                  <MetaItem>
                    {hostingDuration && `${hostingDuration} hosting`}
                  </MetaItem>
                  {reviewCount > 0 && <MetaSeparator>•</MetaSeparator>}
                </HostingMeta>

                {reviewCount > 0 && (
                  <MetaItem style={{ fontWeight: "500", color: "#000" }}>
                    <Star size={12} fill="#000" strokeWidth={0} />
                    {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </MetaItem>
                )}

                {shouldShowTopRated && (
                  <>
                    <MetaSeparator>•</MetaSeparator>
                    <MetaItem style={{ fontWeight: "500", color: "#FF385C" }}>
                      <LordIcon
                        src="https://cdn.lordicon.com/abgykmtd.json"
                        trigger="in"
                        colors="primary:#FF385C"
                        style={{ width: 14, height: 14, flexShrink: 0 }}
                      />
                      {" "}Top Rated
                    </MetaItem>
                  </>
                )}
              </BusinessMetaWrapper>
            </div>
          </BusinessInfo>
        </BusinessSection>

        {onContactHost && (
          <AskQuestionRow>
            <AskQuestionButton
              type="button"
              onClick={onContactHost}
              aria-label="Ask the host a question"
            >
              <MessageCircle size={18} aria-hidden />
              Ask a question
            </AskQuestionButton>
          </AskQuestionRow>
        )}

        <Divider style={{ margin: "12px 0" }} />

        <CategoriesBlock>
          <HeaderSection>
            <CategoriesGrid>
              {partnerBadgeText && (
                <CategoryPill>
                  <AnimatedIconWrapper $delay="0ms">
                    <LordIcon
                      src={partnerLordIcon}
                      trigger="in"
                      state="in-reveal"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </AnimatedIconWrapper>
                  <AnimatedTextWrapper $delay="0ms" style={{ color: "#b45309" }}>
                    {partnerBadgeText}
                  </AnimatedTextWrapper>
                </CategoryPill>
              )}

              {categoryName && (
                <CategoryPill>
                  <AnimatedIconWrapper $delay="200ms">
                    <LordIcon
                      src={categoryLordIcon.src}
                      trigger={categoryLordIcon.trigger}
                      state={categoryLordIcon.state}
                      delay={categoryLordIcon.delay || 0}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </AnimatedIconWrapper>
                  <AnimatedTextWrapper $delay="200ms">
                    {categoryName}
                  </AnimatedTextWrapper>
                </CategoryPill>
              )}

              {subcategoryName && (
                <CategoryPill>
                  <AnimatedIconWrapper $delay="400ms">
                    <LordIcon
                      src={subcategoryLordIcon.src}
                      trigger={subcategoryLordIcon.trigger}
                      state={subcategoryLordIcon.state}
                      delay={subcategoryLordIcon.delay || 0}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </AnimatedIconWrapper>
                  <AnimatedTextWrapper $delay="400ms">
                    {subcategoryName}
                  </AnimatedTextWrapper>
                </CategoryPill>
              )}
            </CategoriesGrid>
          </HeaderSection>

          <Divider style={{ margin: "12px 0" }} />
        </CategoriesBlock>

        <DescriptionSection>
          <Description
            ref={descriptionRef}
            $expanded={isDescriptionExpanded}
            $canBeTruncated={canBeTruncated}
            id="class-description"
          >
            {description}
          </Description>
          {canBeTruncated && (
            <ShowMoreButton
              type="link"
              onClick={toggleDescription}
              aria-expanded={isDescriptionExpanded}
              aria-controls="class-description"
            >
              {isDescriptionExpanded ? "Show less" : "Show more"}
            </ShowMoreButton>
          )}
        </DescriptionSection>
      </InfoWrapper>
    );
  },
);

ClassInformation.displayName = "ClassInformation";
export default ClassInformation;
