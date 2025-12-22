"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Typography, Skeleton } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { debounce } from "lodash";
import useEmblaCarousel from "embla-carousel-react";
import CategoryCard from "./CategoryCard";

const { Title: AntTitle, Paragraph } = Typography;

// --- Styled Components ---
const MainWrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0 4rem;
  margin: 4rem auto;
  color: ${(props) => props.theme.token.colorText};
  z-index: 1;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 1425px) {
    padding: 0 3rem;
  }
  @media (max-width: 768px) {
    padding: 0 1.5rem;
    margin: 0 auto;
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
  gap: 1rem;
`;

const SectionHeader = styled.div``;

const StyledTitle = styled(AntTitle)`
  &.ant-typography {
    font-size: clamp(1.8rem, 4vw, 2.2rem);
    font-weight: 700;
    margin-bottom: 0.5rem !important;
    color: #000;
    line-height: 1.3;
  }
`;

const StyledSubtitle = styled(Paragraph)`
  &.ant-typography {
    padding-left: 2px;
    font-size: clamp(1rem, 2.5vw, 1.1rem);
    font-weight: 400;
    color: ${(props) => props.theme.token.colorTextSecondary};
    margin-bottom: 0 !important;
    max-width: 70ch;
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 0.5rem 0;
`;

const EmblaViewport = styled.div`
  overflow: hidden;
  width: 100%;
`;

const EmblaContainer = styled.div`
  display: flex;
  gap: 20px;
  padding: 1rem 0.5rem;
  margin: 0 -0.5rem;
  min-height: 280px;
  scroll-padding: 0.5rem;

  .embla__slide {
    flex: 0 0 auto;
    position: relative;
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 0.5rem;
  @media (max-width: 768px) {
    display: none;
  }
`;

const ScrollButton = styled(motion.button)`
  width: 32px;
  height: 32px;
  background-color: ${(props) => props.theme.token.colorBgElevated};
  border: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease-in-out;
  color: ${(props) => props.theme.token.colorTextSecondary};

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.token.colorBgContainer};
    color: ${(props) => props.theme.token.colorPrimary};
    border-color: ${(props) => props.theme.token.colorBorder};
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
    background-color: ${(props) => props.theme.token.colorBgSpotlight};
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const HomepageCategories = ({ initialCategories = [] }) => {
  const router = useRouter();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  });

  // Logic simplified: We trust the server props.
  // If initialCategories is empty, we consider it "loading" or empty state depending on context.
  // However, usually with SSR, empty array means no categories found.
  // For smoother UX, we can show skeleton if array is empty to prevent layout shift,
  // or just render nothing if we are sure data should be there.
  const categories = initialCategories;
  const isLoading = !categories || categories.length === 0;

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
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  const checkScrollabilityAndVisibility = useCallback(() => {
    if (!emblaApi) {
      setShowButtons(false);
      return;
    }
    const isScrollable = emblaApi.canScrollNext() || emblaApi.canScrollPrev();
    setShowButtons(isScrollable);
    updateButtonStates();
  }, [emblaApi, updateButtonStates]);

  useEffect(() => {
    if (!emblaApi) return;

    checkScrollabilityAndVisibility();
    emblaApi.on("select", updateButtonStates);
    emblaApi.on("reInit", checkScrollabilityAndVisibility);
    emblaApi.on("resize", checkScrollabilityAndVisibility);

    const debouncedCheck = debounce(checkScrollabilityAndVisibility, 250);
    window.addEventListener("resize", debouncedCheck);

    return () => {
      emblaApi.off("select", updateButtonStates);
      emblaApi.off("reInit", checkScrollabilityAndVisibility);
      emblaApi.off("resize", checkScrollabilityAndVisibility);
      window.removeEventListener("resize", debouncedCheck);
      debouncedCheck.cancel();
    };
  }, [emblaApi, checkScrollabilityAndVisibility, updateButtonStates]);

  const handleCategoryClick = (categoryKey) => {
    const params = new URLSearchParams({
      category: categoryKey,
      participants: "1",
      location: "Toronto, ON",
      lat: "43.6532",
      lng: "-79.3832",
    });
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <MainWrapper aria-labelledby="categories-title-h">
      <HeaderContainer>
        <SectionHeader>
          <StyledTitle id="categories-title-h" level={2}>
            Find an activity
          </StyledTitle>
          <StyledSubtitle>
            Browse fun experiences to do with friends and family.
          </StyledSubtitle>
        </SectionHeader>
        <AnimatePresence>
          {showButtons && !isLoading && (
            <ButtonContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScrollButton
                onClick={scrollPrev}
                disabled={prevBtnDisabled}
                aria-label="Previous categories"
              >
                <ChevronLeft />
              </ScrollButton>
              <ScrollButton
                onClick={scrollNext}
                disabled={nextBtnDisabled}
                aria-label="Next categories"
              >
                <ChevronRight />
              </ScrollButton>
            </ButtonContainer>
          )}
        </AnimatePresence>
      </HeaderContainer>

      <CarouselContainer>
        <EmblaViewport ref={emblaRef}>
          <EmblaContainer>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div className="embla__slide" key={`skeleton-${index}`}>
                    <Skeleton.Node
                      active
                      style={{
                        width: 250,
                        height: 250,
                        borderRadius: "0.75rem",
                      }}
                    >
                      <div />
                    </Skeleton.Node>
                  </div>
                ))
              : categories.map((category) => (
                  <div className="embla__slide" key={category.key}>
                    <CategoryCard
                      category={category.name}
                      description={category.description}
                      image={category.image_medium_url}
                      onClick={() => handleCategoryClick(category.key)}
                      alt={`${category.name} category`}
                    />
                  </div>
                ))}
          </EmblaContainer>
        </EmblaViewport>
      </CarouselContainer>
    </MainWrapper>
  );
};

export default HomepageCategories;
