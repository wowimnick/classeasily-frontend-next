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
import message from '@/lib/message';
import { useAuthUser } from "@/hooks/useAuthUser";
import confetti from "canvas-confetti";

import { classService } from "@/services/apiService.js";
import useIntersectionObserver from "@/hooks/useIntersectionObserver.js";

const spinAnimation = keyframes`
  to { transform: rotate(360deg); }
`;

const ButtonSpinner = styled.div`
  border: 2px solid rgba(72, 72, 72, 0.2);
  border-left-color: #484848;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  animation: ${spinAnimation} 0.8s linear infinite;
`;

const ImageLoadingSpinner = styled.div`
  border: 3px solid rgba(0, 0, 0, 0.08);
  border-left-color: #ff385c;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: ${spinAnimation} 1s linear infinite;
`;

const CardContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: min-content;
  cursor: pointer;
  position: relative;
  width: 100%;
  padding: ${(props) => (props.$isSelected ? "2px" : "0")};
  transition: padding 0.2s ease;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 6px;
  background: #f7f7f7;
`;

const ImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const StyledImage = styled(Image)`
  object-fit: cover;
  opacity: ${(props) => (props.$isLoaded ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

const ImageErrorFallback = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #bbb;
  font-size: 0.7rem;
  text-align: center;
  padding: 0.5rem;
  gap: 0.4rem;
`;

const ImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  background-color: #f7f7f7;
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
  background: rgba(247, 247, 247, 0.8);
  z-index: 2;
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0);
  border: none;
  cursor: pointer;
  z-index: 3;
  width: 28px;
  height: 28px;
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
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 1px;
`;

const TitleText = styled.div`
  color: #222;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  color: #222;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  flex-shrink: 0;

  svg {
    color: #222;
    fill: #222;
    stroke-width: 0;
  }
`;

const ReviewCount = styled.span`
  color: #717171;
  font-size: 13px;
  font-weight: 400;
`;

const CompanyInfo = styled.div`
  color: #717171;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LocationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  color: #717171;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DistanceBadge = styled.span`
  color: #717171;
  font-size: 13px;
  font-weight: 400;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
  flex-wrap: wrap;
`;

const Price = styled.div`
  color: #222;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
`;

const PriceLabel = styled.span`
  color: #717171;
  font-size: 13px;
  font-weight: 400;
`;

const PriceSeparator = styled.span`
  color: #717171;
  font-size: 12px;
  margin: 0 1px;
`;

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

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

  const prices = useMemo(
    () => ({
      course: min_course_price,
      singleSession: min_session_price,
    }),
    [min_course_price, min_session_price]
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
    if (classCity) return truncateText(classCity, 25);
    if (classState) return truncateText(classState, 25);
    return "Location unavailable";
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
      transition={{ duration: 0.25 }}
      $isSelected={isSelected}
      theme={theme}
    >
      <ImageContainer>
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
              size={22}
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
              <AlertCircle size={24} /> Image unavailable
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
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
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

      <ContentContainer>
        <TopRow>
          <TitleText title={title}>{title || "Untitled Class"}</TitleText>
          {rating > 0 && (
            <Rating>
              <Star size={12} />
              {Number(rating).toFixed(1)}
              {totalReviews > 0 && <ReviewCount>({totalReviews})</ReviewCount>}
            </Rating>
          )}
        </TopRow>

        <CompanyInfo title={business_name}>
          {truncateText(business_name || "Business", 30)}
        </CompanyInfo>

        <LocationRow>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayLocation}
          </span>
          {formattedDistance && (
            <>
              <span style={{ color: "#c0c0c0", margin: "0 2px" }}>•</span>
              <DistanceBadge>
                <Navigation size={10} strokeWidth={2.5} />
                {formattedDistance}
              </DistanceBadge>
            </>
          )}
        </LocationRow>

        <PriceRow>
          {prices.singleSession === null && prices.course === null ? (
            <Price>
              <PriceLabel>Pricing unavailable</PriceLabel>
            </Price>
          ) : (
            <>
              {prices.singleSession !== null && (
                <Price>
                  <span>${prices.singleSession}</span>
                  <PriceLabel>/ class</PriceLabel>
                </Price>
              )}
              {prices.singleSession !== null && prices.course !== null && (
                <PriceSeparator>•</PriceSeparator>
              )}
              {prices.course !== null && (
                <Price>
                  <span>${prices.course}</span>
                  <PriceLabel>/ course</PriceLabel>
                </Price>
              )}
            </>
          )}
        </PriceRow>
      </ContentContainer>
    </CardContainer>
  );
};

export default React.memo(HomeClassCard);
