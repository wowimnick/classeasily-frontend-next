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
  Minus,
  Plus,
  Check,
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
import { ExploreShowResultsButton } from "@/components/explore/ExploreShowResultsButton";

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
  padding: 22px 24px 18px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  flex-shrink: 0;

  ${(p) =>
    p.$compact &&
    `
    padding: 24px;
    padding-top: 22px;
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
    padding: ${p.$groupTight ? "8px 14px" : "12px 14px"};
    border-bottom: 1px solid #ebebeb;
  `}
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin: 0;

  ${(p) =>
    p.$compact &&
    `
    font-size: 15px;
    font-weight: 600;
  `}
`;

/** Shared supporting line under every section title */
const SectionSub = styled.p`
  margin: 0;
  margin-top: ${(p) => (p.$compact ? "4px" : "6px")};
  margin-bottom: ${(p) => (p.$compact ? "10px" : "14px")};
  font-size: ${(p) => (p.$compact ? "12px" : "13px")};
  line-height: 1.45;
  color: #717171;
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

/** Compact variant of explore bar time dropdown (label + range + square checkbox). */
const FilterTimeOptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => (p.$compact ? "10px" : "12px")};
`;

const FilterTimeOptionRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  min-height: ${(p) => (p.$compact ? "42px" : "46px")};
`;

const FilterTimeOptionText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const FilterTimeOptionLabel = styled.span`
  font-size: ${(p) => (p.$compact ? "15px" : "16px")};
  font-weight: 500;
  color: #000000;
  line-height: 1.25;
`;

const FilterTimeOptionSub = styled.span`
  font-size: ${(p) => (p.$compact ? "13px" : "14px")};
  font-weight: 300;
  color: #000000;
  line-height: 1.35;
`;

const FilterTimeRowCheckbox = styled.span`
  flex-shrink: 0;
  width: ${(p) => (p.$compact ? "20px" : "22px")};
  height: ${(p) => (p.$compact ? "20px" : "22px")};
  border-radius: 5px;
  border: 1px solid #0a0a0a;
  background: ${({ $checked }) => ($checked ? "#000000" : "#ffffff")};
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.07);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;

  ${({ $checked }) =>
    $checked
      ? `
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.14),
      0 4px 10px rgba(0, 0, 0, 0.16);
  `
      : ""}
`;

const GroupSizeHint = styled(SectionSub)`
  margin-top: ${(p) => (p.$compact ? "2px" : "4px")};
  margin-bottom: ${(p) => (p.$compact ? "6px" : "10px")};
`;

const GroupSizeStepper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(p) => (p.$compact ? "8px" : "14px")};
`;

const GroupSizeStepBtn = styled.button`
  width: ${(p) => (p.$compact ? 30 : 36)}px;
  height: ${(p) => (p.$compact ? 30 : 36)}px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  color: #222;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }
`;

const GroupSizeValue = styled.span`
  font-size: ${(p) => (p.$compact ? "15px" : "18px")};
  font-weight: 700;
  color: #222;
  min-width: 24px;
  text-align: center;
  line-height: 1;
`;

const Footer = styled.div`
  padding: 20px 22px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  border-top: 1px solid #ebebeb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  z-index: 10;
  flex-shrink: 0;
  gap: 16px;
`;

const ClearButton = styled.button`
  border: none;
  background: none;
  padding: 12px 4px;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1.2;
  border-radius: 8px;

  &:hover {
    background: #f7f7f7;
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

/** Values align with backend normalize_booking_type_query (?class_type=). */
const CLASS_TYPE_OPTIONS = [
  {
    id: "class",
    label: "All types",
    sub: "Drop-in sessions and multi-session courses",
  },
  {
    id: "single_session",
    label: "Drop-in session",
    sub: "Workshops and pay-per-class options",
  },
  {
    id: "full_course",
    label: "Multi-session course",
    sub: "Series and multi-day courses",
  },
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
    () => distanceDistributionFromClasses(classesForDistribution, 100),
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
      distance: [0, 100],
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
        <SectionTitle $compact={compact} id="filter-sort-heading">
          Sort by
        </SectionTitle>
        <SectionSub $compact={compact}>
          Choose how results are ordered.
        </SectionSub>
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
        <SectionTitle $compact={compact} id="filter-price-heading">
          Price range
        </SectionTitle>
        <SectionSub $compact={compact}>
          Cap the typical price shown for each experience.
        </SectionSub>
        <Slider
          hideLabel
          aria-labelledby="filter-price-heading"
          label=""
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
        <SectionTitle $compact={compact} id="filter-experience-type-heading">
          Experience type
        </SectionTitle>
        <SectionSub $compact={compact}>
          Filter by how the listing is structured.
        </SectionSub>
        <FilterTimeOptionList $compact={compact}>
          {CLASS_TYPE_OPTIONS.map((opt) => {
            const isSelected = (tempFilters.classType || "class") === opt.id;
            return (
              <FilterTimeOptionRow
                key={opt.id}
                type="button"
                $compact={compact}
                aria-pressed={isSelected}
                onClick={() =>
                  setTempFilters((prev) => ({ ...prev, classType: opt.id }))
                }
              >
                <FilterTimeOptionText>
                  <FilterTimeOptionLabel $compact={compact}>
                    {opt.label}
                  </FilterTimeOptionLabel>
                  <FilterTimeOptionSub $compact={compact}>
                    {opt.sub}
                  </FilterTimeOptionSub>
                </FilterTimeOptionText>
                <FilterTimeRowCheckbox
                  $compact={compact}
                  $checked={isSelected}
                  aria-hidden
                >
                  {isSelected ? (
                    <Check size={compact ? 12 : 14} strokeWidth={3} aria-hidden />
                  ) : null}
                </FilterTimeRowCheckbox>
              </FilterTimeOptionRow>
            );
          })}
        </FilterTimeOptionList>
      </Section>

      <Section $compact={compact}>
        <SectionTitle $compact={compact} id="filter-distance-heading">
          Max distance
        </SectionTitle>
        <SectionSub $compact={compact}>
          Show classes within this driving distance.
        </SectionSub>
        <Slider
          hideLabel
          aria-labelledby="filter-distance-heading"
          label=""
          min={1}
          max={100}
          value={tempFilters.distance[1] > 0 ? tempFilters.distance[1] : 100}
          onChange={(val) =>
            setTempFilters((prev) => ({ ...prev, distance: [0, val] }))
          }
          suffix=" km"
          distribution={distanceDistribution}
          compact={compact}
        />
      </Section>

      <Section $compact={compact} $groupTight={compact}>
        <SectionTitle $compact={compact} id="filter-group-heading">
          Group size
        </SectionTitle>
        <GroupSizeHint $compact={compact}>
          Number of seats or tickets you need.
        </GroupSizeHint>
        <GroupSizeStepper $compact={compact}>
          <GroupSizeStepBtn
            type="button"
            aria-label="Decrease group size"
            $compact={compact}
            onClick={() =>
              setTempFilters((prev) => ({
                ...prev,
                participants: Math.max(1, (prev.participants ?? 1) - 1),
              }))
            }
            disabled={(tempFilters.participants ?? 1) <= 1}
          >
            <Minus size={compact ? 14 : 16} />
          </GroupSizeStepBtn>
          <GroupSizeValue $compact={compact}>
            {tempFilters.participants ?? 1}
          </GroupSizeValue>
          <GroupSizeStepBtn
            type="button"
            aria-label="Increase group size"
            $compact={compact}
            onClick={() =>
              setTempFilters((prev) => ({
                ...prev,
                participants: Math.min(20, (prev.participants ?? 1) + 1),
              }))
            }
            disabled={(tempFilters.participants ?? 1) >= 20}
          >
            <Plus size={compact ? 14 : 16} />
          </GroupSizeStepBtn>
        </GroupSizeStepper>
      </Section>

      <Section $compact={compact}>
        <SectionTitle $compact={compact} id="filter-time-heading">
          Time of day
        </SectionTitle>
        <SectionSub $compact={compact}>
          Choose when you&apos;d like to take a class. You can pick more than
          one.
        </SectionSub>
        <FilterTimeOptionList $compact={compact}>
          {timePreferencesList.map((time) => {
            const isSelected = tempFilters.timePreference.includes(time.id);
            return (
              <FilterTimeOptionRow
                key={time.id}
                type="button"
                $compact={compact}
                onClick={() => {
                  setTempFilters((prev) => {
                    const newPrefs = prev.timePreference.includes(time.id)
                      ? prev.timePreference.filter((t) => t !== time.id)
                      : [...prev.timePreference, time.id];
                    return { ...prev, timePreference: newPrefs };
                  });
                }}
              >
                <FilterTimeOptionText>
                  <FilterTimeOptionLabel $compact={compact}>
                    {time.label}
                  </FilterTimeOptionLabel>
                  <FilterTimeOptionSub $compact={compact}>{time.sub}</FilterTimeOptionSub>
                </FilterTimeOptionText>
                <FilterTimeRowCheckbox $compact={compact} $checked={isSelected} aria-hidden>
                  {isSelected ? (
                    <Check size={compact ? 12 : 14} strokeWidth={3} aria-hidden />
                  ) : null}
                </FilterTimeRowCheckbox>
              </FilterTimeOptionRow>
            );
          })}
        </FilterTimeOptionList>
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

              <Footer>
                <ClearButton type="button" onClick={clearFiltersAndSort}>
                  Clear all
                </ClearButton>
                <ExploreShowResultsButton
                  type="button"
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
                </ExploreShowResultsButton>
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
          <ClearButton type="button" onClick={clearFiltersAndSort}>
            Clear all
          </ClearButton>
          <ExploreShowResultsButton
            type="button"
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
          </ExploreShowResultsButton>
        </Footer>
      </Modal>
    </ConfigProvider>
  );
}
