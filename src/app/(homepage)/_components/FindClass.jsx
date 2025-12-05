"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Typography } from "antd";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomeClassCard from "@/components/homepage/HomeClassCard";

const { Title: AntTitle } = Typography;

const MainWrapper = styled.section`
  display: flex;
  flex-direction: column;
  padding: 0 14rem;
  margin: 1rem auto; 
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 1425px) { padding: 0 3rem; }
  @media (max-width: 768px) { padding: 0 1.5rem; margin: 1.5rem auto; }
  @media (max-width: 616px) { padding: 0 1rem; }
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
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 4px;
`;

const StyledTitle = styled(AntTitle)`
  &.ant-typography {
    font-size: 1.5rem; 
    font-weight: 600;
    margin-bottom: 0.2rem !important;
    color: #222222;
    line-height: 1.25;
  }
    
  @media (max-width: 768px) {
    &.ant-typography {
      font-size: 1.25rem;
    }
  }
`;

const StyledSubtitle = styled.p`
  font-size: 0.95rem;
  color: #717171;
  margin: 0;
  line-height: 1.4;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 0.85rem;
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
  gap: 24px;
  padding: 4px; 
  margin: -4px; 

  .embla__slide {
    flex: 0 0 auto;
    width: 250px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  @media (max-width: 768px) { display: none; }
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
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  &:disabled { 
    opacity: 0.3; 
    cursor: default; 
    border-color: #eee;
  }
  
  svg {
    stroke-width: 2.5px; 
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

// Helper to calculate distance (Client side only)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(coord => coord == null)) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ClassRow = ({ 
  title, 
  subtitle, 
  classes = [], 
  seeAllLink = "/explore",
  userLocation = null,
  style = {} // New prop for custom styling
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

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
          <StyledTitle level={3}>
             <Link href={seeAllLink} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
               {title}
             </Link>
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
              if (userLocation && cls.coordinates) {
                const [lat, lng] = cls.coordinates.split(',').map(Number);
                dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng);
              }

              return (
                <div className="embla__slide" key={cls.classId || index}>
                  <HomeClassCard 
                    {...cls} 
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

export default ClassRow;