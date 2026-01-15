"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Button, Typography, Tooltip, Divider } from "antd";
import { Star, Award, User, Heart, Share2 } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";

const { Paragraph, Title } = Typography;

const CLASSEASILY_RED = "#FF385C";
const COLLAPSED_MAX_HEIGHT_PX = 200;

// --- Icon Mapping ---
const iconMap = {
  Crafts: {
    icon: {
      src: "https://cdn.lordicon.com/rpgzzvoy.json",
      trigger: "in",
      state: "in-reveal",
    },
    subcategories: {
      Pottery: {
        src: "https://cdn.lordicon.com/pmilflvu.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Candle Making": {
        src: "https://cdn.lordicon.com/pqabvgco.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Soap Making": {
        src: "https://cdn.lordicon.com/ksnofsjl.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Jewellery Making": {
        src: "https://cdn.lordicon.com/zlrssaft.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Glass & Mosaic": {
        src: "https://cdn.lordicon.com/eimnwynu.json",
        trigger: "in",
        state: "in-reveal",
        colors: "primary:#92140c,secondary:#eeca66,tertiary:#b26836",
      },
      Sculpting: {
        src: "https://cdn.lordicon.com/asqbehym.json",
        trigger: "in",
        state: "in-reveal",
        colors: "primary:#92140c,secondary:#eeca66,tertiary:#b26836",
      },
      Print: {
        src: "https://cdn.lordicon.com/rhmcciby.json",
        trigger: "in",
        state: "in-reveal",
        colors: "primary:#92140c,secondary:#eeca66,tertiary:#b26836",
      },
    },
  },
  Culinary: {
    icon: {
      src: "https://cdn.lordicon.com/tlhmniwg.json",
      trigger: "in",
      state: "in-reveal",
    },
    subcategories: {
      Cooking: {
        src: "https://cdn.lordicon.com/qetumhhk.json",
        trigger: "in",
        state: "in-reveal",
      },
      Baking: {
        src: "https://cdn.lordicon.com/helqkcwb.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Cocktail Making": {
        src: "https://cdn.lordicon.com/ldbrwnqj.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Chocolate Making": {
        src: "https://cdn.lordicon.com/fffxglnq.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
  Art: {
    icon: {
      src: "https://cdn.lordicon.com/usohfczy.json",
      trigger: "in",
      state: "in-reveal",
      colors:
        "primary:#ffc738,secondary:#b26836,tertiary:#3a3347,quaternary:#ebe6ef,quinary:#f24c00,senary:#eeca66,septenary:#2ca58d,octonary:#4bb3fd",
    },
    subcategories: {
      Painting: {
        src: "https://cdn.lordicon.com/spjlvfgs.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Paint & Sip": {
        src: "https://cdn.lordicon.com/bibkaawz.json",
        trigger: "in",
        state: "in-reveal",
      },
      Drawing: {
        src: "https://cdn.lordicon.com/odgpwhdt.json",
        trigger: "in",
        state: "in-reveal",
      },
      Photography: {
        src: "https://cdn.lordicon.com/rhrmfnhf.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
  "Flowers & Plants": {
    icon: {
      src: "https://cdn.lordicon.com/vkzbxtxh.json",
      trigger: "in",
      delay: "1500",
      state: "in-reveal",
      colors: "primary:#2ca58d,secondary:#f24c00,tertiary:#eeca66",
    },
    subcategories: {
      "Bouquet Making": {
        src: "https://cdn.lordicon.com/cjxamcdp.json",
        trigger: "in",
        delay: "1500",
        state: "in-reveal",
        colors:
          "primary:#eeca66,secondary:#ebe6ef,tertiary:#f24c00,quaternary:#2ca58d",
      },
      "Terrarium Making": {
        src: "https://cdn.lordicon.com/bydazpwu.json",
        trigger: "in",
        state: "in-reveal",
      },
      Gardening: {
        src: "https://cdn.lordicon.com/tpvhyxrn.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
  "Fabric & Fibre": {
    icon: {
      src: "https://cdn.lordicon.com/nvwaqgmm.json",
      trigger: "in",
      state: "in-reveal",
    },
    subcategories: {
      "Sewing & Embroidery": {
        src: "https://cdn.lordicon.com/xyyhygfz.json",
        trigger: "in",
        state: "in-reveal",
      },
      "Crochet & Knitting": {
        src: "https://cdn.lordicon.com/yzsefhtg.json",
        trigger: "in",
        state: "in-reveal",
      },
      Tufting: {
        src: "https://cdn.lordicon.com/hefvnfun.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
  Music: {
    icon: {
      src: "https://cdn.lordicon.com/nnnotppf.json",
      trigger: "in",
      state: "in-dynamic",
    },
    subcategories: {
      Piano: {
        src: "https://cdn.lordicon.com/vcmojjzv.json",
        trigger: "in",
        state: "in-reveal",
      },
      Violin: {
        src: "https://cdn.lordicon.com/rdhvtwkd.json",
        trigger: "in",
        state: "in-reveal",
      },
      Guitar: {
        src: "https://cdn.lordicon.com/xhvajdug.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
  "Performing Arts": {
    icon: {
      src: "https://cdn.lordicon.com/acrqbwgj.json",
      trigger: "in",
      state: "in-reveal",
    },
    subcategories: {
      Dance: {
        src: "https://cdn.lordicon.com/zqfgromc.json",
        trigger: "in",
        state: "in-reveal",
      },
      Acting: {
        src: "https://cdn.lordicon.com/friydaec.json",
        trigger: "in",
        state: "in-reveal",
      },
      Singing: {
        src: "https://cdn.lordicon.com/rqnukbqw.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
  Academics: {
    icon: {
      src: "https://cdn.lordicon.com/mwgvvcwn.json",
      trigger: "in",
      state: "in-reveal",
    },
    subcategories: {
      Math: {
        src: "https://cdn.lordicon.com/fxksqiaz.json",
        trigger: "in",
        state: "in-reveal",
      },
      Writing: {
        src: "https://cdn.lordicon.com/tqldjjaa.json",
        trigger: "in",
        state: "in-reveal",
      },
      Science: {
        src: "https://cdn.lordicon.com/zhxbbeaf.json",
        trigger: "in",
        state: "in-reveal",
      },
    },
  },
};
const defaultCategoryIcon = {
  src: "https://cdn.lordicon.com/xodeitpr.json",
  trigger: "in",
  state: "in-reveal",
};
const defaultSubcategoryIcon = {
  src: "https://cdn.lordicon.com/xodeitpr.json",
  trigger: "in",
  state: "in-reveal",
};

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
  justify-content: space-between;
  align-items: center;
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
  padding: 0 1rem;
  background: white;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  /* Removed gap to allow Divider to control spacing */
  @media (max-width: 1024px) {
    padding-top: 1.5rem;
  }
  @media (max-width: 768px) {
    padding: 1.5rem 0 0 0;
  }
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;
const BusinessSection = styled.div`
  /* Removed border-bottom and large padding */
  padding: 0;
  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
  @media (max-width: 480px) {
    padding: 0 0.5rem;
    /* Removed border-top */
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

// --- New Categories/Pills Section ---
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
    Math.floor((now - startDate) / (1000 * 3600 * 24))
  );
  return `${totalDays} day${totalDays > 1 ? "s" : ""}`;
};

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
            descriptionRef.current.scrollHeight > COLLAPSED_MAX_HEIGHT_PX
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

    const categoryIcon =
      (categoryName && iconMap[categoryName]?.icon) || defaultCategoryIcon;
    const subcategoryIcon =
      (categoryName &&
        subcategoryName &&
        iconMap[categoryName]?.subcategories[subcategoryName]) ||
      defaultSubcategoryIcon;

    return (
      <InfoWrapper>
        <MobileHeaderSection>
          <MobileTitleRow>
            <MobileStyledTitle level={1}>{title}</MobileStyledTitle>
            <MobileActionsWrapper>
              <Tooltip title="Share this class">
                <MobileActionButton onClick={onShareClick}>
                  <Share2 size={20} />
                </MobileActionButton>
              </Tooltip>
              <MobileActionButton
                onClick={onFavoriteClick}
                disabled={isTogglingFavorite}
              >
                <Heart
                  size={20}
                  fill={isFavorite ? CLASSEASILY_RED : "none"}
                  color={isFavorite ? CLASSEASILY_RED : "#333"}
                />
              </MobileActionButton>
            </MobileActionsWrapper>
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
                <User size={22} />
              )}
            </BusinessAvatar>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <BusinessName>Hosted by {displayBusinessName}</BusinessName>
              <BusinessMetaWrapper>
                <MetaItem>
                  {hostingDuration && ` · ${hostingDuration} hosting`}
                </MetaItem>

                {reviewCount > 0 && (
                  <>
                    <MetaSeparator>•</MetaSeparator>
                    <MetaItem style={{ fontWeight: "500", color: "#000" }}>
                      <Star size={12} fill="#000" strokeWidth={0} />
                      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </MetaItem>
                  </>
                )}

                {shouldShowTopRated && (
                  <>
                    <MetaSeparator>•</MetaSeparator>
                    <MetaItem style={{ fontWeight: "500", color: "#FF385C" }}>
                      <Award size={14} /> Top Rated
                    </MetaItem>
                  </>
                )}
              </BusinessMetaWrapper>
            </div>
          </BusinessInfo>
        </BusinessSection>

        <Divider style={{ margin: "12px 0" }} />

        <HeaderSection>
          <CategoriesGrid>
            {partnerBadgeText && (
              <CategoryPill>
                <AnimatedIconWrapper $delay="0ms">
                  <lord-icon
                    src="https://cdn.lordicon.com/zopdjjjs.json"
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
                    src={categoryIcon.src}
                    trigger={categoryIcon.trigger}
                    state={categoryIcon.state}
                    delay={categoryIcon.delay || 0}
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
                    src={subcategoryIcon.src}
                    trigger={subcategoryIcon.trigger}
                    state={subcategoryIcon.state}
                    delay={subcategoryIcon.delay || 0}
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
  }
);

ClassInformation.displayName = "ClassInformation";
export default ClassInformation;
