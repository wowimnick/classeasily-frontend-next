import React, { useMemo, useRef, useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Minus, ChevronRight, ChevronLeft } from "lucide-react";

// --- Styles ---

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    padding-bottom: 64px;
  }
`;

const ScrollOuterWrapper = styled.div`
  position: relative;
  width: fit-content;
  max-width: 100%;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ScrollInnerContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  scroll-behavior: smooth;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const MasterGrid = styled.div`
  display: grid;
  width: max-content; /* Only as wide as needed */
  /* If content is smaller than screen, center it via margin auto in parent if desired, 
     but here we let it align left inside the scroll view for consistency */

  /* 
     COMPACT GRID CONFIGURATION:
     Mobile: Label col 85px, Options min 110px.
     Desktop: Label col 120px, Options min 140px.
     Using minmax(..., 1fr) ensures uniformity without squishing too much.
  */
  grid-template-columns: 85px repeat(
      ${(props) => props.$count},
      minmax(110px, 1fr)
    );

  @media (min-width: 768px) {
    grid-template-columns: 120px repeat(
        ${(props) => props.$count},
        minmax(140px, 1fr)
      );
  }

  background: #fff;
  isolation: isolate;
`;

const Cell = styled.div`
  padding: 10px 4px;
  border-right: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 2;
  font-size: 11px;

  white-space: normal;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.3;

  @media (min-width: 768px) {
    padding: 14px 10px;
    font-size: 13px;
    line-height: 1.4;
  }

  &:last-child {
    border-right: none;
  }

  ${(props) =>
    props.$isHeader &&
    css`
      align-items: center;
      flex-direction: column;
      justify-content: flex-start;
      padding-top: 24px;
      padding-bottom: 16px;
      gap: 6px;

      @media (min-width: 768px) {
        padding-top: 28px;
        padding-bottom: 20px;
        gap: 8px;
      }
    `}

  ${(props) =>
    props.$isLabel &&
    css`
      position: sticky;
      left: 0;
      z-index: 20; /* Higher z-index to stay above scroll content */
      justify-content: flex-start;
      text-align: left;

      padding-left: 8px;
      padding-right: 4px;
      font-weight: 700;
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      background: #f9fafb;
      border-right: 1px solid #e5e7eb;

      /* Aggressive hyphenation for compact column */
      hyphens: auto;

      @media (min-width: 768px) {
        padding-left: 16px;
        padding-right: 12px;
        font-size: 11px;
      }
    `}
    
   ${(props) =>
    props.$highlighted &&
    css`
      background: #eff6ff;
    `}
`;

const OptionTitle = styled.h3`
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: #111827;
  margin: 0;
  line-height: 1.1;
  max-width: 100%;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const PriceWrapper = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
`;

const Price = styled.span`
  font-size: 16px;
  font-weight: 800;
  color: #111827;

  @media (min-width: 768px) {
    font-size: 19px;
  }
`;

const Period = styled.span`
  font-size: 10px;
  color: #6b7280;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 11px;
  }
`;

const SelectButton = styled.button`
  width: 100%;
  max-width: 120px;
  padding: 6px 0;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;

  @media (min-width: 768px) {
    padding: 8px 0;
    font-size: 11px;
    max-width: 130px;
  }

  ${(props) =>
    props.$selected
      ? css`
          background: #111827;
          color: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          &:hover {
            background: #000;
          }
        `
      : css`
          background: #fff;
          border-color: #d1d5db;
          color: #111827;
          &:hover {
            border-color: #111827;
            background: #f9fafb;
          }
        `}
`;

// Fixed Badge Centering
const Badge = styled(motion.div)`
  position: absolute;
  top: 0;
  /* Centering Technique without Transform */
  left: 0;
  right: 0;
  margin: 0 auto;
  width: max-content;

  background: #111827;
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  z-index: 20;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 9px;
    padding: 3px 8px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
  }
`;

// --- Fade & Arrow Styles ---

const FadeOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 60px;
  pointer-events: none;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 1)
  );
  z-index: 30;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
`;

const ScrollButton = styled(motion.button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 12px;
  z-index: 40;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #111827;

  &:hover {
    background: #f9fafb;
    transform: translateY(-50%) scale(1.05);
  }
`;

// --- Helpers ---

const getLowestPrice = (option) => {
  if (option.price && parseFloat(option.price) > 0)
    return parseFloat(option.price);
  if (option.schedules && option.schedules.length > 0) {
    const prices = option.schedules
      .map((s) => parseFloat(s.price))
      .filter((p) => !isNaN(p));
    if (prices.length > 0) return Math.min(...prices);
  }
  return 0;
};

const parseDescription = (desc) => {
  try {
    const parsed = JSON.parse(desc);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch (e) {
    if (desc && typeof desc === "string") return { Summary: desc };
  }
  return {};
};

/** API may return optionId as number or string depending on source / legacy tiers. */
const optionIdsMatch = (a, b) =>
  a != null && b != null && String(a) === String(b);

// --- Component ---

const OptionSelectionStep = ({ options, selectedOptionId, onSelect }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sorting Logic
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      const priceA = getLowestPrice(a);
      const priceB = getLowestPrice(b);
      if (priceA !== priceB) return priceA - priceB;
      const titleA = a.title || "";
      const titleB = b.title || "";
      return titleA.localeCompare(titleB);
    });
  }, [options]);

  const featureKeys = useMemo(() => {
    const keys = new Set();
    sortedOptions.forEach((opt) => {
      const d = parseDescription(opt.description);
      Object.keys(d).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [sortedOptions]);

  // Scroll Detection Logic
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      // Show arrow if we are not at the end
      // Use a small threshold (5px) for browser zoom inconsistencies
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [sortedOptions]);

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const renderValue = (val) => {
    if (val === true || val === "true" || val === "Yes")
      return <Check size={14} color="#16a34a" strokeWidth={3} />;
    if (val === false || val === "false" || val === "No")
      return <X size={14} color="#ef4444" strokeWidth={3} />;
    if (val === null || val === undefined)
      return <Minus size={12} color="#e5e7eb" />;
    return (
      <span style={{ fontWeight: 600, color: "#111827", fontSize: "inherit" }}>
        {val}
      </span>
    );
  };

  return (
    <Container>
      <ScrollOuterWrapper>
        <ScrollInnerContainer ref={scrollContainerRef} onScroll={checkScroll}>
          <MasterGrid $count={sortedOptions.length}>
            {/* Header Label Cell */}
            <Cell $isLabel style={{ borderBottom: "1px solid #e5e7eb" }}>
              Options
            </Cell>

            {/* Header Option Cells */}
            {sortedOptions.map((option, i) => {
              const price = getLowestPrice(option);
              const isSelected = optionIdsMatch(selectedOptionId, option.optionId);
              const isBaseTier = i === 0;

              return (
                <Cell
                  key={`head-${option.optionId}`}
                  $isHeader
                  $highlighted={isSelected}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  {isBaseTier && (
                    <Badge
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      Regular Admission
                    </Badge>
                  )}
                  <OptionTitle>{option.title}</OptionTitle>
                  <PriceWrapper>
                    <Price>${price.toFixed(0)}</Price>
                    <Period>
                      /{option.booking_type === "Full Course" ? "course" : "pp"}
                    </Period>
                  </PriceWrapper>
                </Cell>
              );
            })}

            {/* Feature Rows */}
            {featureKeys.map((key) => (
              <React.Fragment key={key}>
                <Cell $isLabel title={key}>
                  {key}
                </Cell>

                {sortedOptions.map((option) => {
                  const features = parseDescription(option.description);
                  const isSelected = optionIdsMatch(
                    selectedOptionId,
                    option.optionId,
                  );

                  return (
                    <Cell
                      key={`${key}-${option.optionId}`}
                      $highlighted={isSelected}
                    >
                      {renderValue(features[key])}
                    </Cell>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Button Row */}
            <Cell
              $isLabel
              style={{ borderBottom: "none", background: "#f9fafb" }}
            />

            {sortedOptions.map((option) => {
              const isSelected = optionIdsMatch(
                selectedOptionId,
                option.optionId,
              );
              return (
                <Cell
                  key={`btn-${option.optionId}`}
                  $highlighted={isSelected}
                  style={{
                    borderBottom: "none",
                    paddingTop: "16px",
                    paddingBottom: "16px",
                  }}
                >
                  <SelectButton
                    $selected={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(option);
                    }}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </SelectButton>
                </Cell>
              );
            })}
          </MasterGrid>
        </ScrollInnerContainer>

        {/* Scroll Indicators */}
        <AnimatePresence>
          {canScrollRight && (
            <>
              <FadeOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <ScrollButton
                onClick={handleScrollRight}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight size={18} />
              </ScrollButton>
            </>
          )}
        </AnimatePresence>
      </ScrollOuterWrapper>
    </Container>
  );
};

export default OptionSelectionStep;
