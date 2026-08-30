"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomeClassCard from "@/components/homepage/HomeClassCard.jsx";

const MainWrapper = styled.section`
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 1400px;
  min-width: 0;
  box-sizing: border-box;
  background: transparent;
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
  gap: 0.1rem;
`;

const StyledTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #000;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const StyledSubtitle = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  line-height: 1;
  font-weight: 400;
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 4px;
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

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

const EmblaViewportInner = styled.div`
  overflow: hidden;
  width: 100%;
  min-width: 0;
`;

const EmblaViewport = React.forwardRef((props, ref) => (
  <EmblaViewportInner ref={ref} {...props} />
));
EmblaViewport.displayName = "EmblaViewport";

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

const BusinessUpcomingClasses = ({ classes = [], businessName, handleFavoriteChange }) => {
  const upcoming = classes.filter((c) => c.soonest_next_week);
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

  useEffect(() => {
    if (emblaApi && upcoming.length > 0) {
      emblaApi.reInit();
      onSelect(emblaApi);
    }
  }, [upcoming.length, emblaApi, onSelect]);

  if (!upcoming.length) return null;

  return (
    <MainWrapper>
      <HeaderContainer>
        <HeaderLeft>
          <StyledTitle>Upcoming classes</StyledTitle>
          <StyledSubtitle>Book your next session.</StyledSubtitle>
        </HeaderLeft>
        <HeaderRight>
          <ScrollButton onClick={scrollPrev} disabled={prevBtnDisabled} aria-label="Previous">
            <ChevronLeft size={14} color="#222" />
          </ScrollButton>
          <ScrollButton onClick={scrollNext} disabled={nextBtnDisabled} aria-label="Next">
            <ChevronRight size={14} color="#222" />
          </ScrollButton>
        </HeaderRight>
      </HeaderContainer>
      <CarouselContainer>
        <EmblaViewport ref={emblaRef}>
          <EmblaContainer>
            {upcoming.map((cls, index) => (
              <div className="embla__slide" key={cls.classId}>
                <HomeClassCard
                  classId={cls.classId}
                  slug={cls.slug}
                  images={cls.images}
                  title={cls.title}
                  city={cls.city}
                  state={cls.state}
                  rating={parseFloat(cls.average_rating) || 0}
                  min_session_price={cls.min_session_price}
                  min_course_price={cls.min_course_price}
                  totalReviews={cls.review_count}
                  instagramFollowerCount={
                    cls.business_instagram_follower_count ?? null
                  }
                  business_name={businessName}
                  is_favorited={cls.is_favorited}
                  soonest_next_week={cls.soonest_next_week}
                  onFavoriteChange={(isNowFavorite) => handleFavoriteChange(cls.classId, isNowFavorite)}
                  priority={index < 4}
                />
              </div>
            ))}
          </EmblaContainer>
        </EmblaViewport>
      </CarouselContainer>
    </MainWrapper>
  );
};

export default BusinessUpcomingClasses;
