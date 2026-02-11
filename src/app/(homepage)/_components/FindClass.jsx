"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomeClassCard from "@/components/homepage/HomeClassCard";
// Import geolocation hook to calculate distances on client side
import { useIpGeolocation } from "@/hooks/useIpGeolocation";

// --- STYLED COMPONENTS (FROM ORIGINAL) ---
const MainWrapper = styled.section`
  display: flex;
  flex-direction: column;
  padding: 0 4rem;
  margin: 1rem auto;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 1425px) {
    padding: 0 3rem;
  }
  @media (max-width: 768px) {
    padding: 0 1.5rem;
    margin: 1rem auto;
  }
  @media (max-width: 616px) {
    padding: 0 1rem;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  margin-bottom: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: baseline;
  gap: 0.05rem;
  margin-bottom: 0;

  @media (max-width: 768px) {
    
    gap: 0.05rem;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 4px;
`;

const StyledTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #000;
  line-height: 1;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;

  a {
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    &:hover {
      color: #000;
      text-decoration: none;
    }
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const StyledSubtitle = styled.p`
  font-size: 0.9rem;
  color: #000;
  margin: 0;
  line-height: 1;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 0.85rem;
    font-weight: 300;
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
`;

const EmblaViewport = styled.div`
  overflow: hidden;
  width: 100%;
`;

const EmblaContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 4px;
  margin: -4px;

  .embla__slide {
    flex: 0 0 auto;
    width: 230px;
  }

  @media (max-width: 768px) {
    gap: 12px;
    .embla__slide {
      width: 160px;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  @media (max-width: 768px) {
    display: none;
  }
`;

const ScrollButton = styled.button`
  width: 32px;
  height: 32px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #000;
    transform: scale(1.04);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
    border-color: #eee;
  }
`;

const SeeAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #000;
  text-decoration: underline;
  white-space: nowrap;

  &:hover {
    color: #555;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

// Helper for client-side distance calc
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((coord) => coord == null)) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const FindClass = ({
  title,
  subtitle,
  classes = [],
  seeAllLink = "/explore",
  userLocation = null,
  style = {},
}) => {
  // Client side geolocation check for distances
  const { location: ipLocation } = useIpGeolocation();
  const finalLocation = userLocation || ipLocation;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback((api) => {
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  if (!classes || classes.length === 0) return null;

  return (
    <MainWrapper style={style}>
      <HeaderContainer>
        <HeaderLeft>
          <StyledTitle>
            <Link href={seeAllLink}>{title}</Link>
          </StyledTitle>
          {subtitle && <StyledSubtitle>{subtitle}</StyledSubtitle>}
        </HeaderLeft>

        <HeaderRight>
          <SeeAllLink href={seeAllLink}>See all</SeeAllLink>
          <ButtonContainer>
            <ScrollButton onClick={scrollPrev} disabled={prevBtnDisabled}>
              <ChevronLeft size={14} color="#222" />
            </ScrollButton>
            <ScrollButton onClick={scrollNext} disabled={nextBtnDisabled}>
              <ChevronRight size={14} color="#222" />
            </ScrollButton>
          </ButtonContainer>
        </HeaderRight>
      </HeaderContainer>

      <CarouselContainer>
        <EmblaViewport ref={emblaRef}>
          <EmblaContainer>
            {classes.map((cls, index) => {
              let dist = null;
              if (finalLocation && cls.coordinates) {
                const [lat, lng] = cls.coordinates.split(",").map(Number);
                dist = getDistanceFromLatLonInKm(
                  finalLocation.lat,
                  finalLocation.lng,
                  lat,
                  lng,
                );
              }

              return (
                <div className="embla__slide" key={cls.classId || index}>
                  <HomeClassCard
                    {...cls}
                    location={cls.location || cls.business_city}
                    rating={cls.average_rating}
                    totalReviews={cls.review_count}
                    distance={dist}
                    priority={index < 4}
                  />
                </div>
              );
            })}
          </EmblaContainer>
        </EmblaViewport>
      </CarouselContainer>
    </MainWrapper>
  );
};

export default React.memo(FindClass);
