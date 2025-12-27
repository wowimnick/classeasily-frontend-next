// --- START OF FILE HomepageCategories.jsx ---
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

const { Title: AntTitle } = Typography;

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
    margin: 3rem auto;
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
  margin-bottom: 1.5rem; /* Increased margin for better separation */
  gap: 1rem;
`;

const SectionHeader = styled.div``;

const StyledTitle = styled(AntTitle)`
  &.ant-typography {
    font-size: 1.75rem; /* Slightly larger heading */
    font-weight: 700;
    color: #222222;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    &.ant-typography {
      font-size: 1.5rem;
    }
  }
`;

const StyledSubtitle = styled.p`
  font-size: 1rem;
  color: #717171;
  margin: 0;
  line-height: 1.5;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
`;

const EmblaViewport = styled.div`
  overflow: hidden;
  width: 100%;
  /* Optional: adds a fade effect to the right edge if needed */
  /* mask-image: linear-gradient(to right, black 95%, transparent 100%); */
`;

const EmblaContainer = styled.div`
  display: flex;
  gap: 24px; /* Slightly wider gap for modern feel */
  padding: 0.5rem 0.25rem 1.5rem 0.25rem; /* Bottom padding for hover shadows */
  margin: 0 -0.25rem;

  /* Flex settings ensure slides don't shrink */
  .embla__slide {
    flex: 0 0 auto;
    position: relative;
    /* Width is handled by the Card itself, but we can enforce min-width here if needed */
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 0.75rem;
  padding-bottom: 8px; /* Align with text baseline */

  @media (max-width: 768px) {
    display: none;
  }
`;

const ScrollButton = styled(motion.button)`
  width: 40px; /* Larger buttons */
  height: 40px;
  background-color: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  color: #222;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover:not(:disabled) {
    background-color: #fff;
    border-color: #222;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  &:disabled {
    opacity: 0.3;
    cursor: default;
    border-color: #f0f0f0;
    box-shadow: none;
  }

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 2px;
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

  const handleCategoryClick = (categorySlug) => {
    const params = new URLSearchParams({
      collection: categorySlug,
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
          <StyledSubtitle>Browse experiences by category.</StyledSubtitle>
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
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div className="embla__slide" key={`skeleton-${index}`}>
                    {/* Updated Skeleton to match new Card dimensions */}
                    <Skeleton.Node
                      active
                      style={{
                        width: 280,
                        height: 380,
                        borderRadius: "1rem",
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
