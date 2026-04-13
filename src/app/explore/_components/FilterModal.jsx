"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  ArrowDownUp,
  DollarSign,
  Star,
  Navigation,
  Clock,
  Sunrise,
  Sun,
  Moon,
} from "lucide-react";
import { ConfigProvider, Modal } from "antd";
import Slider from "@/components/explore/Slider";
import styled from "styled-components";
import { Drawer } from "vaul";
import posthog from "posthog-js";

// --- Theme & Styled Components ---

const PRIMARY_COLOR = "#f81e3e"; // Updated theme color

const themeToken = {
  colorPrimary: PRIMARY_COLOR,
  colorText: "#222222",
  colorTextSecondary: "#717171",
  bgSelected: "#fff0f0", // Light red tint for selected items
  borderDefault: "#dddddd",
  borderActive: PRIMARY_COLOR,
};

// Vaul Drawer (Mobile)
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 999;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  height: 85vh; /* Slightly shorter for better reachability */
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  outline: none;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 12px auto;
  flex-shrink: 0;
`;

// Desktop Components
const ModalHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  flex-shrink: 0;
`;

const CloseButton = styled.button`
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #222;
  transition: background 0.2s;

  &:hover {
    background: #f7f7f7;
  }
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0;
`;

const ModalBody = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;

  /* Custom Scrollbar for desktop consistency */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
`;

const Section = styled.div`
  padding: 32px 24px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin: 0 0 20px 0;
`;

// -- Filters --

const SortGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
`;

const SortCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid
    ${(props) => (props.$selected ? PRIMARY_COLOR : themeToken.borderDefault)};
  background: ${(props) => (props.$selected ? themeToken.bgSelected : "white")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${PRIMARY_COLOR};
  }

  span {
    font-size: 14px;
    font-weight: ${(props) => (props.$selected ? "600" : "500")};
    color: #222;
    text-align: center;
  }

  svg {
    color: ${(props) => (props.$selected ? PRIMARY_COLOR : "#717171")};
  }
`;

const TimeOption = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid
    ${(props) => (props.$selected ? PRIMARY_COLOR : themeToken.borderDefault)};
  border-radius: 12px;
  background: ${(props) => (props.$selected ? themeToken.bgSelected : "white")};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;

  &:hover {
    border-color: ${PRIMARY_COLOR};
  }

  .icon-box {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${PRIMARY_COLOR};
  }

  .text-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .label {
    font-size: 15px;
    font-weight: 600;
    color: #222;
  }

  .sub-label {
    font-size: 13px;
    color: #717171;
  }
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  z-index: 10;
  flex-shrink: 0;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  color: #222;
  padding: 8px 12px;
  border-radius: 8px;

  &:hover {
    background: #f7f7f7;
  }
`;

const ApplyButton = styled.button`
  background: ${PRIMARY_COLOR};
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;

  &:hover {
    background: ${PRIMARY_COLOR}; /* Keep primary color on hover */
    opacity: 0.9;
  }
  &:active {
    transform: scale(0.98);
  }
`;

// --- Configuration Lists ---

const sortOptionsList = [
  { key: "relevance", label: "Relevance", icon: <TrendingUp size={20} /> },
  { key: "distance", label: "Distance", icon: <Navigation size={20} /> },
  { key: "price", label: "Price", icon: <DollarSign size={20} /> },
  { key: "rating", label: "Top Rated", icon: <Star size={20} /> },
  { key: "reviews", label: "Popular", icon: <ArrowDownUp size={20} /> },
  { key: "newest", label: "Newest", icon: <Clock size={20} /> },
];

const timePreferencesList = [
  {
    id: "Morning (6am-12pm)",
    label: "Morning",
    sub: "6:00 AM - 12:00 PM",
    icon: <Sunrise size={18} />,
  },
  {
    id: "Afternoon (12pm-5pm)",
    label: "Afternoon",
    sub: "12:00 PM - 5:00 PM",
    icon: <Sun size={18} />,
  },
  {
    id: "Evening (5pm-10pm)",
    label: "Evening",
    sub: "5:00 PM - 10:00 PM",
    icon: <Moon size={18} />,
  },
];

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  currentSortBy,
  onApplyChanges,
}) {
  const [tempFilters, setTempFilters] = useState(filters);
  const [tempSortBy, setTempSortBy] = useState(currentSortBy || "relevance");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = () => window.innerWidth < 1048;
    setIsMobile(mq());
    const handleResize = () => setIsMobile(mq());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
      setTempSortBy(currentSortBy || "relevance");
    }
  }, [filters, currentSortBy, isOpen]);

  const handleApply = () => {
    posthog.capture("apply_filters", {
      category: "Explore Page",
      sort: tempSortBy,
    });
    onApplyChanges(tempFilters, tempSortBy);
    onClose();
  };

  const clearFiltersAndSort = () => {
    setTempFilters({
      pricePerClass: [0, 500],
      distance: [0, 50],
      timePreference: [],
      days: [],
      classType: "class",
      keyword: "",
      date: "",
      startDate: "",
      endDate: "",
      participants: filters.participants ?? 1,
    });
    setTempSortBy("relevance");
  };

  const renderContent = () => (
    <>
      <Section>
        <SectionTitle>Sort by</SectionTitle>
        <SortGrid>
          {sortOptionsList.map((option) => {
            const isPriceKey = option.key === "price";
            const isSelected = isPriceKey
              ? tempSortBy.startsWith("price")
              : tempSortBy === option.key;

            // Determine display label for price toggle
            let label = option.label;
            if (isPriceKey && isSelected) {
              label =
                tempSortBy === "price_asc" ? "Low to High" : "High to Low";
            }

            return (
              <SortCard
                key={option.key}
                $selected={isSelected}
                onClick={() => {
                  if (isPriceKey) {
                    setTempSortBy(
                      tempSortBy === "price_asc" ? "price_desc" : "price_asc"
                    );
                  } else {
                    setTempSortBy(option.key);
                  }
                }}
              >
                {option.icon}
                <span>{label}</span>
              </SortCard>
            );
          })}
        </SortGrid>
      </Section>

      <Section>
        <Slider
          label="Price Range"
          min={0}
          max={500}
          value={tempFilters.pricePerClass[1]}
          onChange={(val) =>
            setTempFilters((prev) => ({ ...prev, pricePerClass: [0, val] }))
          }
          format={{
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }}
          prefix="Up to "
          suffix={tempFilters.pricePerClass[1] >= 500 ? "+" : ""}
        />
      </Section>

      <Section>
        <Slider
          label="Max Distance"
          min={1}
          max={80}
          value={tempFilters.distance[1] > 0 ? tempFilters.distance[1] : 50}
          onChange={(val) =>
            setTempFilters((prev) => ({ ...prev, distance: [0, val] }))
          }
          suffix=" km"
        />
      </Section>

      <Section>
        <SectionTitle>Time of day</SectionTitle>
        <div>
          {timePreferencesList.map((time) => {
            const isSelected = tempFilters.timePreference.includes(time.id);
            return (
              <TimeOption
                key={time.id}
                $selected={isSelected}
                onClick={() => {
                  setTempFilters((prev) => {
                    const newPrefs = prev.timePreference.includes(time.id)
                      ? prev.timePreference.filter((t) => t !== time.id)
                      : [...prev.timePreference, time.id];
                    return { ...prev, timePreference: newPrefs };
                  });
                }}
              >
                <div className="icon-box">{time.icon}</div>
                <div className="text-content">
                  <span className="label">{time.label}</span>
                  <span className="sub-label">{time.sub}</span>
                </div>
              </TimeOption>
            );
          })}
        </div>
      </Section>
    </>
  );

  // --- Mobile Drawer (Vaul) ---
  if (isMobile) {
    return (
      <ConfigProvider theme={{ token: themeToken }}>
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <ModalHeader>
                <Title>Filters</Title>
                <CloseButton
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  style={{ right: 20, left: "auto" }}
                >
                  <X size={20} />
                </CloseButton>
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

  // --- Desktop Modal (Ant Design) ---
  return (
    <ConfigProvider theme={{ token: themeToken }}>
      <Modal
        open={isOpen}
        onCancel={onClose}
        width={680}
        centered
        footer={null} // We use our custom Footer
        title={null} // We use our custom Header
        closable={false} // We use our custom CloseButton
        styles={{
          mask: {
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
          },
          content: {
            padding: 0,
            borderRadius: "24px",
            overflow: "hidden", // Ensures children don't overflow border-radius
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            padding: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Prevents double scrollbar
          },
        }}
      >
        <ModalHeader>
          <CloseButton onClick={onClose} aria-label="Close">
            <X size={18} />
          </CloseButton>
          <Title>Filters & Sort</Title>
        </ModalHeader>

        <ModalBody>{renderContent()}</ModalBody>

        <Footer>
          <ClearButton onClick={clearFiltersAndSort}>Clear all</ClearButton>
          <ApplyButton onClick={handleApply}>Show results</ApplyButton>
        </Footer>
      </Modal>
    </ConfigProvider>
  );
}
