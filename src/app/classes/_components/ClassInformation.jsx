"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Button, Typography, Tooltip } from "antd";
import {
  MessageSquare,
  Star,
  Award,
  BookOpen,
  Tag,
  Sparkles,
  User,
  Heart,
  Share2,
} from "lucide-react";
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

// --- Styled Components --- (No changes needed, but keeping for completeness)
const growAndShrink = keyframes` 0% { transform: scale(1); } 25% { transform: scale(1.5); } 50% { transform: scale(1); } 100% { transform: scale(1); }`;
const slideInAndFade = keyframes` 0% { opacity: 0; transform: translateX(-10px); } 100% { opacity: 1; transform: translateX(0); }`;
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
  gap: 1.5rem;
  padding: 0 1rem;
  background: white;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  @media (max-width: 1024px) {
    padding-top: 1.5rem;
  }
  @media (max-width: 768px) {
    padding: 1.5rem 0 0 0;
    gap: 1rem;
  }
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;
const BusinessSection = styled.div`
  padding: 0 0 1.5rem 0;
  border-bottom: 1px solid #eaeaea;
  @media (max-width: 768px) {
    padding: 0 0.75rem 1.25rem 0.75rem;
  }
  @media (max-width: 480px) {
    padding: 1rem 0.5rem 1rem 0.5rem;
    border-top: 1px solid #f0f0f0;
  }
`;
const BusinessInfo = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  transition: background-color 0.2s ease;
  border: none;
  background-color: transparent;
  text-align: left;
  margin-left: -0.75rem;
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
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    margin-left: -0.6rem;
  }
`;
const BusinessAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #eaeaea;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #767676;
`;
const HostImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const BusinessName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  @media (max-width: 480px) {
    font-size: 0.95rem;
    max-width: 200px;
  }
`;
const BusinessSubtext = styled.div`
  font-size: 0.875rem;
  color: #717171;
  margin-top: 0.25rem;
`;
const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
  @media (max-width: 768px) {
    padding: 0 0.75rem 1.5rem 0.75rem;
  }
  @media (max-width: 480px) {
    padding: 0 0.5rem 1.5rem 0.5rem;
  }
`;
const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    gap: 1rem;
  }
  @media (max-width: 600px) {
    gap: 0.75rem;
  }
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;
const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000;
  font-size: 0.95rem;
  flex-shrink: 0;
  svg {
    color: #ff385c;
    flex-shrink: 0;
  }
  lord-icon {
    animation: ${growAndShrink} 2s ease-in-out;
    width: 14px;
    height: 14px;
  }
  span {
    animation: ${slideInAndFade} 1s ease-in-out;
  }
  &:not(:last-child) {
    padding-right: 1.5rem;
    position: relative;
    &::after {
      content: "•";
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      color: #858585;
      pointer-events: none;
    }
  }
  @media (max-width: 768px) {
    font-size: 0.9rem;
    gap: 0.375rem;
    &:not(:last-child) {
      padding-right: 1rem;
    }
  }
  @media (max-width: 600px) {
    font-size: 0.85rem;
    &:not(:last-child) {
      padding-right: 0.75rem;
    }
  }
  @media (max-width: 480px) {
    font-size: 0.8rem;
    gap: 0.25rem;
    &:not(:last-child) {
      padding-right: 0.5rem;
      &::after {
        font-size: 0.75rem;
      }
    }
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;
const FoundationalPartnerBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #b45309;
  font-weight: 500;
  overflow: visible;
  lord-icon {
    animation: ${growAndShrink} 3s ease-in-out;
    width: 14px;
    height: 14px;
  }
  span {
    animation: ${slideInAndFade} 1s ease-in-out;
  }
  @media (max-width: 480px) {
    padding: 0.15rem 0.5rem;
    font-size: 0.8rem;
    gap: 0.25rem;
    border-radius: 10px;
    lord-icon {
      width: 12px;
      height: 12px;
    }
  }
`;
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
            <div>
              <BusinessName>Hosted by {displayBusinessName}</BusinessName>
              <BusinessSubtext>
                Class Host{hostingDuration && ` · ${hostingDuration} hosting`}
              </BusinessSubtext>
            </div>
          </BusinessInfo>
        </BusinessSection>

        <HeaderSection>
          <StatsRow>
            {partnerBadgeText && (
              <StatItem>
                <FoundationalPartnerBadge>
                  <lord-icon
                    src="https://cdn.lordicon.com/zopdjjjs.json"
                    trigger="in"
                    state="in-reveal"
                    style={{ width: "30px", height: "30px" }}
                  />
                  <span>{partnerBadgeText}</span>
                </FoundationalPartnerBadge>
              </StatItem>
            )}
            {categoryName && (
              <StatItem>
                <LordIcon
                  src={categoryIcon.src}
                  trigger={categoryIcon.trigger}
                  state={categoryIcon.state}
                  delay={categoryIcon.delay || 0}
                  style={{ width: "30px", height: "30px" }}
                />{" "}
                {categoryName}
              </StatItem>
            )}
            {subcategoryName && (
              <StatItem>
                <LordIcon
                  src={subcategoryIcon.src}
                  trigger={subcategoryIcon.trigger}
                  state={subcategoryIcon.state}
                  delay={subcategoryIcon.delay || 0}
                  style={{ width: "30px", height: "30px" }}
                />{" "}
                {subcategoryName}
              </StatItem>
            )}
            <StatItem>
              <LordIcon
                src="https://cdn.lordicon.com/fmdwwfgs.json"
                trigger="in"
                delay="1500"
                state="in-chat"
                colors="primary:#e4e4e4,secondary:#ee6d66,tertiary:#ffc738,quaternary:#e4e4e4"
                style={{ width: "30px", height: "30px" }}
              />
              {reviewCount} review{reviewCount !== 1 ? "s" : ""}
            </StatItem>
            {shouldShowTopRated && (
              <StatItem>
                <Award size={18} aria-hidden="true" />
                <span style={{ color: "#ff385c", fontWeight: "500" }}>
                  Top Rated
                </span>
              </StatItem>
            )}
          </StatsRow>
        </HeaderSection>

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
