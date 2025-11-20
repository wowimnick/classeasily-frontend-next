"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  TrendingUp,
  ArrowDownUp,
  DollarSign,
  Star,
  Navigation,
  Clock,
} from "lucide-react";
import { ConfigProvider, Tag } from "antd";
import SliderNumberFlow from "../../../components/explore/Slider";
import ReactGA from "react-ga4";
import styled from "styled-components";
import { Drawer } from "vaul";

const themeToken = {
  colorPrimary: "#ff385c",
  colorBgContainer: "#ffffff",
  borderRadius: 8,
  colorBorder: "#dddddd",
  colorText: "#222222",
  colorTextSecondary: "#717171",
};

// Vaul Drawer Styles
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 90%;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

// Desktop Modal Styles
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 100%;
  max-width: 780px;
  border-radius: 16px;
  position: relative;
  max-height: calc(100vh - 80px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
  flex-shrink: 0;
`;

const ModalBody = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  height: 32px;
  width: 32px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #484848;
  transition: all 0.2s;
  touch-action: manipulation;

  &:hover {
    background: #fff0f0;
    color: #ff385c;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #222222;
`;

const FilterSection = styled.div`
  padding: 28px 24px;
  border-bottom: 1px solid #ebebeb;
  overflow: hidden;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 20px 20px;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #222222;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 14px;
  }
`;

const SliderContainer = styled.div`
  padding: 0 12px;
  margin: 32px 0;

  @media (max-width: 768px) {
    padding: 0 8px;
    margin: 24px 0;
  }
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }
`;

const TimeOption = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid
    ${(props) => (props.$selected ? themeToken.colorPrimary : "#dddddd")};
  border-radius: 12px;
  background: ${(props) => (props.$selected ? "#fff0f0" : "white")};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: ${(props) => (props.$selected ? "600" : "500")};
  color: ${(props) => (props.$selected ? themeToken.colorPrimary : "#222222")};
  text-align: left;
  touch-action: manipulation;

  &:hover {
    border-color: ${themeToken.colorPrimary};
    background: #fff0f0;
  }

  @media (max-width: 768px) {
    padding: 12px 14px;
    font-size: 15px;
  }
`;

const Footer = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ebebeb;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 1;
  flex-shrink: 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 16px 20px;
    gap: 12px;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  color: #222222;
  touch-action: manipulation;

  &:hover {
    color: ${themeToken.colorPrimary};
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 8px 12px;
  }
`;

const ApplyButton = styled.button`
  background: ${themeToken.colorPrimary};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;

  &:hover {
    background: #ff1447;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
    flex: 1;
    max-width: 180px;
  }
`;

const SortOptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SortButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 10px;
  border: 1px solid
    ${(props) => (props.$selected ? themeToken.colorPrimary : "#dddddd")};
  background: ${(props) => (props.$selected ? "#fff0f0" : "white")};
  color: ${(props) => (props.$selected ? themeToken.colorPrimary : "#222222")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  min-height: 70px;
  touch-action: manipulation;

  svg {
    margin-bottom: 2px;
    width: 18px;
    height: 18px;
    color: ${(props) =>
      props.$selected ? themeToken.colorPrimary : "#717171"};
  }

  &:hover {
    border-color: ${themeToken.colorPrimary};
    background: ${(props) => (props.$selected ? "#fff0f0" : "#f7f7f7")};
  }

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 12px;
    min-height: 64px;
    gap: 4px;

    svg {
      width: 16px;
      height: 16px;
      margin-bottom: 1px;
    }
  }
`;

const sortOptionsList = [
  { key: "relevance", label: "Relevance", icon: <TrendingUp /> },
  { key: "distance", label: "Distance", icon: <Navigation /> },
  { key: "price", label: "Price", icon: <DollarSign /> },
  { key: "rating", label: "Rating", icon: <Star /> },
  { key: "reviews", label: "Most Reviewed", icon: <ArrowDownUp /> },
  { key: "newest", label: "Newest", icon: <Clock /> },
];

const timePreferencesList = [
  "Morning (6am-12pm)",
  "Afternoon (12pm-5pm)",
  "Evening (5pm-10pm)",
];

export default function FilterModal({
  isOpen,
  onClose,
  onOpen,
  filters,
  currentSortBy,
  onApplyChanges,
}) {
  const [tempFilters, setTempFilters] = useState(filters);
  const [tempSortBy, setTempSortBy] = useState(currentSortBy || "relevance");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
      if (typeof window !== "undefined") {
        document.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        document.addEventListener("gesturestart", handleGestureStart, {
          passive: false,
        });
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("gesturestart", handleGestureStart);
      }
    };
  }, [filters, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTempSortBy(currentSortBy || "relevance");
    }
  }, [currentSortBy, isOpen]);

  const handleTouchStart = (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  const handleGestureStart = (e) => {
    e.preventDefault();
  };

  const handleApply = () => {
    if (ReactGA.isInitialized) {
      const appliedFilterDetails = {
        sort_by: tempSortBy,
        price_max: tempFilters.pricePerClass[1],
        distance_max: tempFilters.distance[1],
        time_preferences: tempFilters.timePreference.join(", ") || "none",
      };

      ReactGA.event("apply_filters", {
        category: "Explore Page",
        action: "Apply Filters & Sort",
        label: `Sort: ${tempSortBy}`,
        ...appliedFilterDetails,
      });
    }
    onApplyChanges(tempFilters, tempSortBy);
    onClose();
  };

  const clearFiltersAndSort = () => {
    const defaultFilters = {
      pricePerClass: [0, 500],
      distance: [0, 0],
      timePreference: [],
      days: [],
      classType: "class",
      keyword: "",
      date: filters.date || "",
      participants: filters.participants || 0,
    };
    setTempFilters(defaultFilters);
    setTempSortBy("relevance");
  };

  const renderContent = () => (
    <>
      <FilterSection>
        <SectionTitle>Sort by</SectionTitle>
        <SortOptionGrid>
          {sortOptionsList.map((option) => {
            if (option.key === "price") {
              const isPriceSort = tempSortBy.startsWith("price");
              const isAsc = tempSortBy === "price_asc";

              return (
                <SortButton
                  key={option.key}
                  type="button"
                  $selected={isPriceSort}
                  onClick={() => {
                    const newSort = isAsc ? "price_desc" : "price_asc";
                    setTempSortBy(newSort);
                  }}
                  aria-pressed={isPriceSort}
                >
                  {option.icon}
                  {isPriceSort
                    ? isAsc
                      ? "Price: Low-High"
                      : "Price: High-Low"
                    : "Price"}
                </SortButton>
              );
            }

            return (
              <SortButton
                key={option.key}
                type="button"
                $selected={tempSortBy === option.key}
                onClick={() => setTempSortBy(option.key)}
                aria-pressed={tempSortBy === option.key}
              >
                {option.icon}
                {option.label}
              </SortButton>
            );
          })}
        </SortOptionGrid>
      </FilterSection>

      <FilterSection>
        <SectionTitle>Price per class</SectionTitle>
        <SliderContainer>
          <SliderNumberFlow
            min={0}
            max={500}
            suffix="max"
            value={tempFilters.pricePerClass[1]}
            onChange={(value) =>
              setTempFilters((prev) => ({
                ...prev,
                pricePerClass: [prev.pricePerClass[0], Math.round(value)],
              }))
            }
            format={{
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }}
          />
        </SliderContainer>
      </FilterSection>

      <FilterSection>
        <SectionTitle>Distance range</SectionTitle>
        <SliderContainer>
          <SliderNumberFlow
            min={0}
            max={50}
            suffix="km"
            value={tempFilters.distance[1]}
            onChange={(value) =>
              setTempFilters((prev) => ({
                ...prev,
                distance: [prev.distance[0], value],
              }))
            }
            format={{
              minimumFractionDigits: 0,
              maximumFractionDigits: 1,
            }}
          />
        </SliderContainer>
      </FilterSection>

      <FilterSection>
        <SectionTitle>Time Preference</SectionTitle>
        <TimeGrid>
          {timePreferencesList.map((time) => (
            <TimeOption
              key={time}
              $selected={tempFilters.timePreference.includes(time)}
              onClick={() =>
                setTempFilters((prev) => ({
                  ...prev,
                  timePreference: prev.timePreference.includes(time)
                    ? prev.timePreference.filter((t) => t !== time)
                    : [...prev.timePreference, time],
                }))
              }
            >
              {time}
            </TimeOption>
          ))}
        </TimeGrid>
      </FilterSection>
    </>
  );

  if (!isOpen) return null;

  // Mobile: Use Vaul Drawer
  if (isMobile) {
    return (
      <ConfigProvider theme={{ token: themeToken }}>
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} repositionInputs={false}>
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />

              <ModalHeader>
                <CloseButton onClick={onClose} aria-label="Close filters">
                  <X size={18} />
                </CloseButton>
                <Title>Filters & Sort</Title>
              </ModalHeader>

              <ModalBody>{renderContent()}</ModalBody>

              <Footer>
                <ClearButton onClick={clearFiltersAndSort}>
                  Clear all
                </ClearButton>
                <ApplyButton onClick={handleApply}>Show results</ApplyButton>
              </Footer>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      </ConfigProvider>
    );
  }

  // Desktop: Use Framer Motion Modal
  const desktopAnimation = {
    initial: { scale: 0.95, opacity: 0, y: -20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: -20 },
    transition: { type: "tween", ease: "anticipate", duration: 0.3 },
  };

  return (
    <ConfigProvider theme={{ token: themeToken }}>
      <AnimatePresence>
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <ModalContent
            initial={desktopAnimation.initial}
            animate={desktopAnimation.animate}
            exit={desktopAnimation.exit}
            transition={desktopAnimation.transition}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <CloseButton onClick={onClose} aria-label="Close filters">
                <X size={18} />
              </CloseButton>
              <Title>Filters & Sort</Title>
            </ModalHeader>

            <ModalBody>{renderContent()}</ModalBody>

            <Footer>
              <ClearButton onClick={clearFiltersAndSort}>Clear all</ClearButton>
              <ApplyButton onClick={handleApply}>Show results</ApplyButton>
            </Footer>
          </ModalContent>
        </ModalOverlay>
      </AnimatePresence>
    </ConfigProvider>
  );
}
