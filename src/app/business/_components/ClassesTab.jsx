"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Star, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import HomeClassCard from "@/components/homepage/HomeClassCard.jsx";
import NumberFlow from "@number-flow/react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";

const SectionBlock = styled.section`
  background: transparent;
  padding: 0;
  border: none;
`;

const SectionHeader = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 0.75rem;
    gap: 0.75rem;
  }
`;

const TitleGroup = styled.div`
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: #111;
    letter-spacing: -0.01em;
  }

  .subtitle {
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 1.35rem;
    }

    .subtitle {
      font-size: 0.85rem;
    }
  }
`;

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileCarouselWrapper = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
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
  gap: 10px;
  padding: 0.25rem 0;

  .embla__slide {
    flex: 0 0 auto;
    position: relative;
    width: 290px;
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 0.75rem;
`;

const ScrollButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  background-color: white;
  border: 1px solid #e8e8e8;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  color: #666;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

  &:hover:not(:disabled) {
    color: #ff385c;
    border-color: #ff385c;
    box-shadow: 0 4px 12px rgba(255, 56, 92, 0.15);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 5rem 2rem;
  color: #999;
  background: #fafafa;
  border-radius: 16px;

  svg {
    margin-bottom: 1.5rem;
    opacity: 0.25;
  }

  h3 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #666;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    color: #888;
  }
`;

const useCarousel = (emblaApi) => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [showButtons, setShowButtons] = useState(false);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const updateButtonStates = useCallback(() => {
    if (emblaApi) {
      setPrevBtnDisabled(!emblaApi.canScrollPrev());
      setNextBtnDisabled(!emblaApi.canScrollNext());
    }
  }, [emblaApi]);

  const checkScrollability = useCallback(() => {
    if (emblaApi) {
      const isScrollable = emblaApi.canScrollNext() || emblaApi.canScrollPrev();
      setShowButtons(isScrollable);
      updateButtonStates();
    } else {
      setShowButtons(false);
    }
  }, [emblaApi, updateButtonStates]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", updateButtonStates);
    emblaApi.on("reInit", checkScrollability);

    checkScrollability();

    return () => {
      emblaApi.off("select", updateButtonStates);
      emblaApi.off("reInit", checkScrollability);
    };
  }, [emblaApi, updateButtonStates, checkScrollability]);

  useEffect(() => {
    if (!emblaApi) return;

    const debouncedCheck = setTimeout(() => checkScrollability(), 100);

    window.addEventListener("resize", checkScrollability);

    return () => {
      clearTimeout(debouncedCheck);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [emblaApi, checkScrollability]);

  return {
    scrollPrev,
    scrollNext,
    prevBtnDisabled,
    nextBtnDisabled,
    showButtons,
  };
};

const ClassesTab = ({ classes, businessName, handleFavoriteChange }) => {
  const emblaOptions = {
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  };
  const [classEmblaRef, classEmblaApi] = useEmblaCarousel(emblaOptions);
  const classControls = useCarousel(classEmblaApi);

  const classCards = classes.map((cls) => (
    <HomeClassCard
      key={cls.classId}
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
      instagramFollowerCount={cls.business_instagram_follower_count ?? null}
      business_name={businessName}
      is_favorited={cls.is_favorited}
      onFavoriteChange={(isNowFavorite) =>
        handleFavoriteChange(cls.classId, isNowFavorite)
      }
    />
  ));

  return (
    <SectionBlock>
      <SectionHeader>
        <TitleGroup>
          <h2>Available Classes</h2>
          {classes.length > 0 && (
            <div className="subtitle">
              <NumberFlow value={classes.length} />{" "}
              {classes.length === 1 ? "class" : "classes"} offered by{" "}
              {businessName}
            </div>
          )}
        </TitleGroup>
        <AnimatePresence>
          {classControls.showButtons && (
            <ButtonContainer>
              <ScrollButton
                onClick={classControls.scrollPrev}
                disabled={classControls.prevBtnDisabled}
                aria-label="Scroll to previous classes"
              >
                <ChevronLeft />
              </ScrollButton>
              <ScrollButton
                onClick={classControls.scrollNext}
                disabled={classControls.nextBtnDisabled}
                aria-label="Scroll to next classes"
              >
                <ChevronRight />
              </ScrollButton>
            </ButtonContainer>
          )}
        </AnimatePresence>
      </SectionHeader>
      {classes.length > 0 ? (
        <>
          <ClassGrid>{classCards}</ClassGrid>
          <MobileCarouselWrapper>
            <CarouselContainer>
              <EmblaViewport ref={classEmblaRef}>
                <EmblaContainer>
                  {classes.map((cls) => (
                    <div className="embla__slide" key={cls.classId}>
                      <HomeClassCard
                        {...cls}
                        rating={parseFloat(cls.average_rating) || 0}
                        totalReviews={cls.review_count}
                        instagramFollowerCount={
                          cls.business_instagram_follower_count ?? null
                        }
                        business_name={businessName}
                        onFavoriteChange={(isNowFavorite) =>
                          handleFavoriteChange(cls.classId, isNowFavorite)
                        }
                      />
                    </div>
                  ))}
                </EmblaContainer>
              </EmblaViewport>
            </CarouselContainer>
          </MobileCarouselWrapper>
        </>
      ) : (
        <EmptyState>
          <MessageSquare size={56} />
          <h3>No Classes Yet</h3>
          <p>{businessName} hasn't listed any public classes.</p>
        </EmptyState>
      )}
    </SectionBlock>
  );
};

export default ClassesTab;
