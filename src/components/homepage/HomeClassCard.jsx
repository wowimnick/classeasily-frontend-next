"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import styled, { keyframes, useTheme } from "styled-components";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  Star,
  Navigation,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { message } from "antd";
import { useAuthUser } from "@/hooks/useAuthUser";
import confetti from "canvas-confetti";

import { classService } from "@/services/apiService.js";
import useIntersectionObserver from "@/hooks/useIntersectionObserver.js";

// --- OPTIMIZATIONS APPLIED ---
// 1. Reduced image quality from 75 to 60 for faster loading
// 2. Added proper image sizing with intrinsic dimensions
// 3. Lazy load images below the fold
// 4. Memoized expensive computations
// 5. Reduced animation complexity

const spinAnimation = keyframes`
  to { transform: rotate(360deg); }
`;

const ButtonSpinner = styled.div`
  border: 2px solid rgba(72, 72, 72, 0.2);
  border-left-color: #484848;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: ${spinAnimation} 0.8s linear infinite;
`;

const ImageLoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${(props) => props.theme.token.colorPrimary || "#007bff"};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spinAnimation} 1s linear infinite;
`;

const CardContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: min-content;
  flex-shrink: 0;
  scroll-snap-align: start;
  cursor: pointer;
  position: relative;
  padding: 12px;
  border: 1px solid
    ${(props) =>
      props.$isSelected ? props.theme.token.colorPrimary : "#efefef"};
  border-radius: 12px;
  background: ${(props) => props.theme.token.colorBgContainer};
  width: 100%;
  will-change: transform; // GPU acceleration hint
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3; // Better than padding-top hack
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
  background: ${(props) =>
    props.$isLoadingImage ? "#f0f0f0" : props.theme.token.colorBgContainer};
`;

const DetailsDivider = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const ImageSpinnerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 248, 248, 0.7);
  backdrop-filter: blur(1px);
  z-index: 2;
`;

const ImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0) 20%,
      rgba(0, 0, 0, 0) 50%,
      rgba(0, 0, 0, 0.05) 100%
    );
    pointer-events: none;
  }
`;

const StyledImage = styled(Image)`
  object-fit: cover;
  opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
  transition: opacity 0.4s ease;

  ${CardContainer}:hover & {
    transform: scale(1.05);
    transition: transform 0.3s ease;
  }
`;

const ImageErrorFallback = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #eee;
  color: #aaa;
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
  gap: 0.5rem;
  z-index: 1;
`;

const ImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  background-color: #f0f0f0;
  z-index: 0;
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0);
  border: none;
  cursor: pointer;
  z-index: 3;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    transform: ${(props) => (props.disabled ? "none" : "scale(1.1)")};
  }
`;

const ContentContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #222222;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  max-width: 100%;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff8e7;
  padding: 4px 10px;
  border-radius: 20px;
  color: #b17300;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  span {
    color: #b17300;
    font-weight: normal;
  }
  svg {
    color: #ffb400;
    fill: #ffb400;
    stroke-width: 0;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  color: #666666;
  font-size: 14px;
  gap: 6px;
  min-width: 0;
  overflow: hidden;

  svg {
    color: initial;
    flex-shrink: 0;
  }
`;

const CompanyText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const LocationInfo = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: #666666;
  font-size: 14px;
  min-height: 20px;
  gap: 8px;
  min-width: 0;
  overflow: hidden;

  svg {
    color: initial;
    flex-shrink: 0;
  }
`;

const LocationText = styled.span`
  color: #484848;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  margin-bottom: 4px;
`;

const LocationDistance = styled.span`
  color: #666666;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  white-space: nowrap;

  &::before {
    content: "•";
    color: #c2c2c2;
    margin-right: 4px;
  }
`;

const PricesContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
`;

const PriceBox = styled.div`
  display: inline-flex;
  flex-direction: column;
  background: ${(props) => (props.type === "course" ? "#E6F7FF" : "#FFF0F0")};
  border-radius: 8px;
  padding: 3px 8px;
  min-width: 60px;
  border: 1px solid
    ${(props) => (props.type === "course" ? "#91D5FF" : "#FFD6DB")};
  flex-shrink: 0;
`;

const PriceAmount = styled.div`
  color: ${(props) => (props.type === "course" ? "#0050B3" : "#D4380D")};
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
`;

const PriceLabel = styled.div`
  color: ${(props) => (props.type === "course" ? "#0050B3" : "#D4380D")};
  font-size: 11px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  white-space: nowrap;
`;

// Memoized utility function
const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Memoized distance formatter
const formatDistance = (distanceInKm) => {
  if (
    distanceInKm === null ||
    typeof distanceInKm !== "number" ||
    isNaN(distanceInKm)
  )
    return null;
  if (distanceInKm < 0.1) return "<100m";
  if (distanceInKm < 1) return `${Math.round(distanceInKm * 1000)}m`;
  if (distanceInKm < 10) return `${distanceInKm.toFixed(1)}km`;
  return `${Math.round(distanceInKm)}km`;
};

const HomeClassCard = ({
  classId,
  slug,
  images,
  title = "Loading...",
  city = "",
  state = "",
  rating = 0,
  min_session_price = null,
  min_course_price = null,
  totalReviews = 0,
  coordinates = null,
  business_name = "",
  is_favorited = false,
  distance = null,
  isSelected,
  onFavoriteChange,
  priority = false,
}) => {
  const searchParams = useSearchParams();

  const { user: currentUser } = useAuthUser();
  const isAuthenticated = !!currentUser;
  const [isFavorite, setIsFavorite] = useState(is_favorited);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [imageLoadState, setImageLoadState] = useState("idle");

  const cardRef = useRef(null);
  const favoriteButtonRef = useRef(null);
  const theme = useTheme();

  const isIntersecting = useIntersectionObserver(
    cardRef,
    { threshold: 0.1 },
    true
  );

  // Memoized values
  const prices = useMemo(
    () => ({
      course: min_course_price,
      singleSession: min_session_price,
    }),
    [min_course_price, min_session_price]
  );

  const company = useMemo(
    () => truncateText(business_name || "Business", 25),
    [business_name]
  );

  const imageUrl = useMemo(() => {
    if (images && images.length > 0) {
      return images[0].medium_url || images[0].original_url || null;
    }
    return null;
  }, [images]);

  const formattedDistance = useMemo(() => formatDistance(distance), [distance]);

  const displayLocation = useMemo(() => {
    const classCity = city || "";
    const classState = state || "";
    if (classCity && classState) {
      return truncateText(`${classCity}, ${classState}`, 40);
    }
    if (classCity) return truncateText(classCity, 40);
    if (classState) return truncateText(classState, 40);
    return "Location details unavailable";
  }, [city, state]);

  const fullLocationTitle = useMemo(() => {
    const classCity = city || "";
    const classState = state || "";
    if (classCity && classState) return `${classCity}, ${classState}`;
    return classCity || classState || "Location details unavailable";
  }, [city, state]);

  useEffect(() => setIsFavorite(is_favorited), [is_favorited]);

  useEffect(() => {
    if (isIntersecting && imageUrl && imageLoadState === "idle")
      setImageLoadState("loading");
    else if (isIntersecting && !imageUrl && imageLoadState === "idle")
      setImageLoadState("no_image_url");
  }, [isIntersecting, imageUrl, imageLoadState]);

  const handleImageLoad = useCallback(() => setImageLoadState("loaded"), []);
  const handleImageError = useCallback(() => setImageLoadState("error"), []);

  const handleNavigateToClass = useCallback(() => {
    if (!slug && !classId) {
      console.error("HomeClassCard: Both slug and classId are missing.");
      return;
    }
    const identifier = slug || classId;
    const currentParticipants = searchParams.get("participants");
    let navigationUrl = `/classes/${identifier}`;
    if (currentParticipants) {
      navigationUrl += `?participants=${currentParticipants}`;
    }
    window.open(navigationUrl, "_blank");
  }, [slug, classId, searchParams]);

  const handleFavoriteClick = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!isAuthenticated) {
        message.info("Please log in to save favorites.");
        return;
      }
      if (isTogglingFavorite) return;

      setIsTogglingFavorite(true);
      const originalState = isFavorite;
      const newState = !originalState;
      setIsFavorite(newState);

      try {
        const result = await classService.toggleFavoriteClass(classId);
        if (result.success) {
          if (onFavoriteChange) onFavoriteChange(newState);
          if (newState && favoriteButtonRef.current) {
            const rect = favoriteButtonRef.current.getBoundingClientRect();
            const origin = {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            };
            confetti({
              particleCount: 80,
              spread: 70,
              origin: origin,
              colors: ["#FF385C", "#FF7A9E", "#FFFFFF", "#FEDADD"],
              zIndex: 10000,
            });
          }
        } else {
          setIsFavorite(originalState);
          message.error(result.error || "Could not update favorite status.");
        }
      } catch (error) {
        setIsFavorite(originalState);
        message.error("An error occurred while updating favorite status.");
        console.error("Favorite toggle error:", error);
      } finally {
        setIsTogglingFavorite(false);
      }
    },
    [isAuthenticated, isTogglingFavorite, isFavorite, classId, onFavoriteChange]
  );

  return (
    <CardContainer
      ref={cardRef}
      onClick={handleNavigateToClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      $isSelected={isSelected}
      layout="position"
      theme={theme}
    >
      <ImageContainer
        $isLoadingImage={
          imageLoadState === "loading" ||
          (imageLoadState === "idle" && isIntersecting && !!imageUrl)
        }
        theme={theme}
      >
        <FavoriteButton
          ref={favoriteButtonRef}
          onClick={handleFavoriteClick}
          disabled={isTogglingFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isTogglingFavorite ? (
            <ButtonSpinner />
          ) : (
            <Heart
              size={24}
              color={isFavorite ? "#FF385C" : "#ffffffff"}
              fill={isFavorite ? "#FF385C" : "rgba(0, 0, 0, 0.36)"}
              style={{ transition: "all 0.2s ease" }}
            />
          )}
        </FavoriteButton>
        <ImageWrapper>
          {imageLoadState === "loading" && (
            <ImageSpinnerContainer>
              <ImageLoadingSpinner theme={theme} />
            </ImageSpinnerContainer>
          )}
          {imageLoadState === "error" && (
            <ImageErrorFallback>
              <AlertCircle size={32} /> Image unavailable
            </ImageErrorFallback>
          )}
          {imageLoadState === "no_image_url" && <ImagePlaceholder />}
          {imageUrl &&
            (imageLoadState === "loading" || imageLoadState === "loaded") && (
              <StyledImage
                key={imageUrl}
                src={imageUrl}
                alt={title || "Class image"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={60}
                onLoad={handleImageLoad}
                onError={handleImageError}
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                $isLoaded={imageLoadState === "loaded"}
              />
            )}
          {!imageUrl &&
            (imageLoadState === "idle" ||
              imageLoadState === "no_image_url") && <ImagePlaceholder />}
        </ImageWrapper>
      </ImageContainer>
      <DetailsDivider>
        <ContentContainer>
          <Title title={title}>{title || "Untitled Class"}</Title>
          <CompanyInfo>
            <Building2 size={14} />
            <CompanyText title={business_name || "Business"}>
              Hosted by {company}
            </CompanyText>
          </CompanyInfo>
          <LocationInfo>
            <LocationText title={fullLocationTitle}>
              {displayLocation}
            </LocationText>
            {formattedDistance && (
              <LocationDistance>
                <Navigation size={12} /> {formattedDistance}
              </LocationDistance>
            )}
          </LocationInfo>
          <PricesContainer>
            {prices.singleSession === null && prices.course === null ? (
              <PriceBox type="single">
                <PriceLabel type="single">Pricing</PriceLabel>
                <PriceAmount
                  type="single"
                  style={{ fontSize: "14px", opacity: 0.8 }}
                >
                  Unavailable
                </PriceAmount>
              </PriceBox>
            ) : (
              <>
                {prices.singleSession !== null && (
                  <PriceBox type="single">
                    <PriceLabel type="single">Class From</PriceLabel>
                    <PriceAmount type="single">
                      <Calendar size={12} />${prices.singleSession}
                    </PriceAmount>
                  </PriceBox>
                )}
                {prices.course !== null && (
                  <PriceBox type="course">
                    <PriceLabel type="course">Course From</PriceLabel>
                    <PriceAmount type="course">
                      <Calendar size={12} />${prices.course}
                    </PriceAmount>
                  </PriceBox>
                )}
              </>
            )}
          </PricesContainer>
        </ContentContainer>
        {rating > 0 && (
          <Rating>
            <Star size={16} /> {Number(rating).toFixed(1)}{" "}
            {totalReviews > 0 && <span>({totalReviews})</span>}
          </Rating>
        )}
      </DetailsDivider>
    </CardContainer>
  );
};

export default React.memo(HomeClassCard);
