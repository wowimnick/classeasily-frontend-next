"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  TrendingUp,
  ArrowDownUp,
  DollarSign,
  Star,
  Navigation,
  Clock,
  Users,
  Minus,
  Plus,
} from "lucide-react";
import { ConfigProvider, Modal } from "antd";
import Slider from "@/components/explore/Slider";
import styled from "styled-components";
import { Drawer } from "vaul";
import posthog from "posthog-js";
import { exploreTimePreferencesList as timePreferencesList } from "./exploreTimePreferences";
import {
  priceDistributionFromClasses,
  distanceDistributionFromClasses,
} from "./exploreFilterHistograms";
import ExploreResultsPrimaryLabel from "./ExploreResultsPrimaryLabel.jsx";

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
  z-index: 1100;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  height: 88vh;
  max-height: 88vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1101;
  outline: none;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 8px auto 6px;
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

  ${(p) =>
    p.$compact &&
    `
    padding: 10px 14px;
    border-bottom-color: #ebebeb;
  `}
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

  ${(p) => p.$compact && `font-size: 15px;`}
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

  ${(p) =>
    p.$compact &&
    `
    padding: 12px 14px;
    border-bottom: 1px solid #ebebeb;
  `}
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin: 0 0 20px 0;

  ${(p) =>
    p.$compact &&
    `
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 10px 0;
  `}
`;

// -- Filters --

const SortGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;

  ${(p) =>
    p.$compact &&
    `
    gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  `}
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

  ${(p) =>
    p.$compact &&
    `
    padding: 10px 8px;
    gap: 6px;
    border-radius: 10px;
    span { font-size: 13px; }
    svg { width: 18px !important; height: 18px !important; }
  `}
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

  &:last-child {
    margin-bottom: 0;
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

  ${(p) =>
    p.$compact &&
    `
    padding: 10px 12px;
    gap: 10px;
    margin-bottom: 8px;
    border-radius: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    .icon-box {
      width: 32px;
      height: 32px;
    }

    .label {
      font-size: 14px;
    }

    .sub-label {
      font-size: 12px;
    }
  `}
`;

const Footer = styled.div`
  padding: 22px 28px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  z-index: 10;
  flex-shrink: 0;
  gap: 16px;

  ${(p) =>
    p.$compact &&
    `
    padding: 18px 16px;
    padding-bottom: max(18px, env(safe-area-inset-bottom));
    border-top-color: #ebebeb;
    gap: 12px;
  `}
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  font-size: 17px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  color: #222;
  padding: 12px 14px;
  border-radius: 8px;

  &:hover {
    background: #f7f7f7;
  }

  ${(p) =>
    p.$compact &&
    `
    font-size: 16px;
    padding: 10px 10px;
  `}
`;

const ApplyButton = styled.button`
  background: ${PRIMARY_COLOR};
  color: white;
  border: none;
  padding: 16px 36px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;

  &:hover:not(:disabled) {
    background: ${PRIMARY_COLOR}; /* Keep primary color on hover */
    opacity: 0.9;
  }
  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.88;
    cursor: wait;
  }

  ${(p) =>
    p.$compact &&
    `
    padding: 14px 20px;
    font-size: 15px;
    border-radius: 12px;
    flex: 1;
    min-width: 0;
    min-height: 48px;
  `}
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

function formatShowResultsLabel(totalCount) {
  if (typeof totalCount !== "number" || Number.isNaN(totalCount)) {
    return "Show results";
  }
  return `Show ${totalCount.toLocaleString()} results`;
}

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  currentSortBy,
  onApplyChanges,
  classesForDistribution = [],
  totalClassesCount,
  previewFilterModalCount,
}) {
  const [tempFilters, setTempFilters] = useState(filters);
  const [tempSortBy, setTempSortBy] = useState(currentSortBy || "relevance");
  const [isMobile, setIsMobile] = useState(false);
  const [modalPreviewCount, setModalPreviewCount] = useState(null);
  const [modalPreviewLoading, setModalPreviewLoading] = useState(false);

  const compact = isMobile;

  const priceDistribution = useMemo(
    () => priceDistributionFromClasses(classesForDistribution, 500),
    [classesForDistribution],
  );

  const distanceDistribution = useMemo(
    () => distanceDistributionFromClasses(classesForDistribution, 80),
    [classesForDistribution],
  );

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

  useEffect(() => {
    if (!isOpen) {
      setModalPreviewCount(null);
      setModalPreviewLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !previewFilterModalCount) return;

    setModalPreviewLoading(true);
    const ac = new AbortController();
    const t = setTimeout(() => {
      (async () => {
        try {
          const c = await previewFilterModalCount(
            tempFilters,
            tempSortBy,
            ac.signal,
          );
          if (!ac.signal.aborted) setModalPreviewCount(c);
        } catch (e) {
          if (e?.name === "AbortError" || e?.name === "CanceledError") return;
          if (!ac.signal.aborted) setModalPreviewCount(null);
        } finally {
          if (!ac.signal.aborted) setModalPreviewLoading(false);
        }
      })();
    }, 320);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [
    isOpen,
    tempFilters,
    tempSortBy,
    previewFilterModalCount,
  ]);

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
      date: "",
      startDate: "",
      endDate: "",
      participants: 1,
    });
    setTempSortBy("relevance");
  };

  const renderContent = () => (
    <>
      <Section $compact={compact}>
        <SectionTitle $compact={compact}>Sort by</SectionTitle>
        <SortGrid $compact={compact}>
          {sortOptionsList.map((option) => {
            const isPriceKey = option.key === "price";
            const isSelected = isPriceKey
              ? tempSortBy.startsWith("price")
              : tempSortBy === option.key;

            let label = option.label;
            if (isPriceKey && isSelected) {
              label =
                tempSortBy === "price_asc" ? "Low to High" : "High to Low";
            }

            return (
              <SortCard
                key={option.key}
                $compact={compact}
                $selected={isSelected}
                onClick={() => {
                  if (isPriceKey) {
                    setTempSortBy(
                      tempSortBy === "price_asc" ? "price_desc" : "price_asc",
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

      <Section $compact={compact}>
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
          distribution={priceDistribution}
          compact={compact}
        />
      </Section>

      <Section $compact={compact}>
        <Slider
          label="Max Distance"
          min={1}
          max={80}
          value={tempFilters.distance[1] > 0 ? tempFilters.distance[1] : 50}
          onChange={(val) =>
            setTempFilters((prev) => ({ ...prev, distance: [0, val] }))
          }
          suffix=" km"
          distribution={distanceDistribution}
          compact={compact}
        />
      </Section>

      <Section $compact={compact}>
        <SectionTitle
          $compact={compact}
          style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 8 }}
        >
          <Users size={compact ? 18 : 20} aria-hidden />
          Group size
        </SectionTitle>
        <p
          style={{
            fontSize: compact ? 13 : 14,
            color: "#717171",
            marginTop: compact ? -4 : -8,
            marginBottom: compact ? 12 : 16,
            lineHeight: 1.45,
          }}
        >
          How many people are attending?
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: compact ? 18 : 24,
          }}
        >
          <button
            type="button"
            aria-label="Decrease group size"
            onClick={() =>
              setTempFilters((prev) => ({
                ...prev,
                participants: Math.max(
                  1,
                  (prev.participants ?? 1) - 1,
                ),
              }))
            }
            disabled={(tempFilters.participants ?? 1) <= 1}
            style={{
              width: compact ? 40 : 44,
              height: compact ? 40 : 44,
              borderRadius: "50%",
              border: "1px solid #e5e7eb",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (tempFilters.participants ?? 1) <= 1 ? "not-allowed" : "pointer",
              opacity: (tempFilters.participants ?? 1) <= 1 ? 0.35 : 1,
            }}
          >
            <Minus size={compact ? 16 : 18} />
          </button>
          <span
            style={{
              fontSize: compact ? 20 : 22,
              fontWeight: 700,
              color: "#222",
              minWidth: 36,
              textAlign: "center",
            }}
          >
            {tempFilters.participants ?? 1}
          </span>
          <button
            type="button"
            aria-label="Increase group size"
            onClick={() =>
              setTempFilters((prev) => ({
                ...prev,
                participants: Math.min(20, (prev.participants ?? 1) + 1),
              }))
            }
            disabled={(tempFilters.participants ?? 1) >= 20}
            style={{
              width: compact ? 40 : 44,
              height: compact ? 40 : 44,
              borderRadius: "50%",
              border: "1px solid #e5e7eb",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (tempFilters.participants ?? 1) >= 20 ? "not-allowed" : "pointer",
              opacity: (tempFilters.participants ?? 1) >= 20 ? 0.35 : 1,
            }}
          >
            <Plus size={compact ? 16 : 18} />
          </button>
        </div>
      </Section>

      <Section $compact={compact}>
        <SectionTitle $compact={compact}>Time of day</SectionTitle>
        <div>
          {timePreferencesList.map((time) => {
            const isSelected = tempFilters.timePreference.includes(time.id);
            return (
              <TimeOption
                key={time.id}
                $compact={compact}
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
              <ModalHeader $compact={compact}>
                <Title $compact={compact}>Filters</Title>
                <CloseButton
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  style={{ right: 20, left: "auto" }}
                >
                  <X size={compact ? 18 : 20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>{renderContent()}</ModalBody>

              <Footer $compact={compact}>
                <ClearButton $compact={compact} onClick={clearFiltersAndSort}>
                  Clear all
                </ClearButton>
                <ApplyButton
                  $compact={compact}
                  onClick={handleApply}
                  disabled={modalPreviewLoading}
                  aria-busy={modalPreviewLoading}
                >
                  <ExploreResultsPrimaryLabel
                    loading={modalPreviewLoading}
                    label={formatShowResultsLabel(
                      modalPreviewCount ?? totalClassesCount,
                    )}
                  />
                </ApplyButton>
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
          <ApplyButton
            onClick={handleApply}
            disabled={modalPreviewLoading}
            aria-busy={modalPreviewLoading}
          >
            <ExploreResultsPrimaryLabel
              loading={modalPreviewLoading}
              label={formatShowResultsLabel(
                modalPreviewCount ?? totalClassesCount,
              )}
            />
          </ApplyButton>
        </Footer>
      </Modal>
    </ConfigProvider>
  );
}
