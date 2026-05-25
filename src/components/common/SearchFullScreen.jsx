"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import {
  Search,
  MapPin,
  ChevronDown,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { useIWantCollections } from "@/hooks/useIWantCollections";
import { formatSearchLocationCityName } from "@/lib/formatSearchLocationDisplay";
import dayjs from "dayjs";
import posthog from "posthog-js";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  useSearch,
  GTA_PRESETS,
  summarizeCollectionsForPill,
  formatCollectionDisplayName,
} from "@/context/SearchContext";
import { ExploreShowResultsButton } from "@/components/explore/ExploreShowResultsButton";
import {
  ExploreDropdownTypeChipFlow,
  ExploreDropdownTypeChip,
} from "@/components/explore/ExploreDropdownTypeChips";
import { ExploreBarLazyLucideIcon } from "@/app/explore/_components/exploreBarLazyIcon.jsx";
import CustomCalendar from "@/app/(homepage)/_components/CustomCalendarMobile";

// --- Styled Components ---

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #fafafa;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 10px 8px;
  padding-right: max(12px, env(safe-area-inset-right, 0px));
  padding-left: max(8px, env(safe-area-inset-left, 0px));
  flex-shrink: 0;
  min-height: 56px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 50;
`;

const TopBarCenter = styled(motion.div)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  font-size: 15px;
  color: #000000;
  letter-spacing: -0.01em;
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
`;

/** Matches explore mobile header: no chrome, 44px tap target, black icons */
const TopIconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #000000;
  cursor: pointer;
  flex-shrink: 0;
  z-index: 51;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
`;

const TopBarSpacer = styled.div`
  width: 44px;
  height: 44px;
  flex-shrink: 0;
`;

const MainScroll = styled(motion.div)`
  flex: 1;
  min-height: 0;
  padding: ${(p) => (p.$expanded ? "0" : "12px 16px 28px")};
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #fafafa;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: padding 0.4s cubic-bezier(0.25, 1, 0.5, 1);
`;

// --- Card Logic ---
const cardShadowRest =
  "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 14px rgba(0, 0, 0, 0.07)";
const cardShadowLifted = "0 -4px 24px rgba(0, 0, 0, 0.08)";

const CardShell = styled(motion.div)`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: ${cardShadowRest};
  border: 1px solid #f3f3f3;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  transform-origin: top center;
`;

const CardHeader = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  padding: 16px 18px;
  cursor: pointer;
  text-align: left;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  background: #ffffff;
  -webkit-tap-highlight-color: transparent;
`;

const WhereHeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
`;

const MorphingInputBox = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  width: 100%;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  background: ${(p) => (p.$expanded ? "#ffffff" : "#fafafa")};
  border: 1px solid ${(p) => (p.$expanded ? "rgba(0, 0, 0, 0.1)" : "#f0f0f0")};
  box-shadow: ${(p) =>
    p.$expanded
      ? "0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.06)"
      : "none"};
`;

const RealInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  background: transparent;
  width: 100%;
  &::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
`;

const FakeText = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: ${(p) => (p.$hasValue ? "#000000" : "#717171")};
`;

const RowLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #717171;
  margin-bottom: 2px;
`;

const RowValue = styled.span`
  font-size: 16px;
  color: ${(p) => (p.$hasValue ? "#000000" : "#9ca3af")};
  font-weight: 500;
  letter-spacing: -0.01em;
`;

// --- Expanded Body Content ---
const ExpandedBody = styled(motion.div)`
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  width: 100%;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  height: 100%; 
`;

// --- Redesigned Location Item ---
const DestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.12s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f5f5f5;
  }
`;

// Dynamic color box for icons
const IconBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  /* Dynamic colors passed via props */
  background: ${(p) => p.$bgColor || "#f3f4f6"};
  color: ${(p) => p.$iconColor || "#374151"};
`;

const DestText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const DestName = styled.span`
  font-weight: 500;
  font-size: 15px;
  color: #000000;
`;

const DestDesc = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #717171;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(260px, 72vw);
`;

const SectionHeading = styled.h3`
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin: 14px 18px 8px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Footer = styled.div`
  padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-shrink: 0;
  background: #ffffff;
  z-index: 50;
`;

const ClearLink = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #717171;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  padding: 8px 4px;
  -webkit-tap-highlight-color: transparent;
  &:hover {
    color: #000000;
  }
`;

// --- Animation Config ---
const layoutTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 1
};

const contentTransition = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1]
};

// Loading spinner rotation
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
const LoadingSpinnerWrap = styled.span`
  display: inline-flex;
  animation: ${spin} 0.8s linear infinite;
`;

// --- Preset Icon Colors ---
// A palette of warm/friendly colors for the location icons
const ICON_PALETTE = [
  { bg: "#fff1f2", icon: "#e11d48" }, // Rose
  { bg: "#fff7ed", icon: "#ea580c" }, // Orange
  { bg: "#eff6ff", icon: "#2563eb" }, // Blue
  { bg: "#f0fdf4", icon: "#16a34a" }, // Green
  { bg: "#faf5ff", icon: "#9333ea" }, // Purple
];

export default function SearchFullScreen() {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    searchTerm,
    datePickerValue,
    setDatePickerValue,
    selectedCollections,
    setSelectedCollections,
    geocodedAddressResults,
    geocoding,
    geocodingError,
    handleLocationChange,
    handleLocationSelect,
    clearAll,
    performSearch,
  } = useSearch();

  const [expandedSection, setExpandedSection] = useState(null);
  const iWantCollections = useIWantCollections();
  const locationInputRef = useRef(null);
  const mainScrollRef = useRef(null);

  useEffect(() => {
    if (!isDrawerOpen) setExpandedSection(null);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (expandedSection === "location") {
      const t = setTimeout(() => {
        locationInputRef.current?.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [expandedSection]);

  const getDateDisplay = () => {
    if (!datePickerValue) return "Whenever";
    if (datePickerValue.start && datePickerValue.end) {
      const s = dayjs(datePickerValue.start);
      const e = dayjs(datePickerValue.end);
      if (s.month() === e.month()) return `${s.format("MMM D")} - ${e.format("D")}`;
      return `${s.format("MMM D")} - ${e.format("MMM D")}`;
    }
    return dayjs(datePickerValue).format("MMM D");
  };

  const onSelectLocation = (item) => {
    const name = item.displayName || item.name;
    const coords = item.coordinates || item.coords;
    handleLocationSelect(name, {
      coordinates: coords,
      citySlug: item.citySlug,
      provinceSlug: item.provinceSlug,
      city: item.city,
      state: item.state,
    });
    setExpandedSection(null);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchClick = () => {
    posthog.capture("search_performed", {
      search_term: searchTerm || null,
      has_date_filter: !!datePickerValue,
      collection_slugs: (selectedCollections || []).map((c) => c.slug).filter(Boolean),
    });
    performSearch();
    setIsDrawerOpen(false);
  };

  const handleClearAllClick = () => {
    clearAll();
  };

  const renderLocationList = () => {
    const hasTerm = searchTerm && searchTerm.trim().length > 0;
    const trimmed = (searchTerm || "").trim().toLowerCase();
    const isPresetTerm =
      trimmed &&
      GTA_PRESETS.some(
        (p) =>
          p.name.toLowerCase() === trimmed ||
          (p.displayName && p.displayName.toLowerCase() === trimmed)
      );
    // When selected location is a preset (e.g. Toronto, Vaughan), still show presets under "Explore nearby"
    const usePresets = !hasTerm || isPresetTerm;
    const list = usePresets ? GTA_PRESETS : geocodedAddressResults;

    if (hasTerm && !isPresetTerm && geocoding) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 18px",
            color: "#717171",
          }}
        >
          <LoadingSpinnerWrap>
            <Loader2 size={20} strokeWidth={2} aria-hidden />
          </LoadingSpinnerWrap>
          <span style={{ fontSize: 14, fontWeight: 400 }}>Finding locations nearby…</span>
        </div>
      );
    }
    if (hasTerm && !isPresetTerm && geocodingError) {
      return (
        <p
          role="alert"
          style={{ color: "#991b1b", margin: "14px 18px", fontSize: 14, fontWeight: 400, lineHeight: 1.45 }}
        >
          {geocodingError}
        </p>
      );
    }
    if (hasTerm && !isPresetTerm && (!list || list.length === 0)) {
      return (
        <p style={{ color: "#717171", margin: "14px 18px", fontSize: 14, fontWeight: 400 }}>
          No experiences found.
        </p>
      );
    }

    return (list || []).map((item, idx) => {
      const name = usePresets
        ? (item.displayName || item.name)
        : formatSearchLocationCityName({
            displayName: item.displayName,
            city: item.city,
            state: item.state,
          }) || (item.displayName || "").split(",")[0];
      const desc = usePresets ? item.description : item.displayName;
      
      // Cycle through palette based on index
      const colorTheme = ICON_PALETTE[idx % ICON_PALETTE.length];

      return (
        <DestItem key={idx} onClick={() => onSelectLocation(item)}>
          <IconBox $bgColor={colorTheme.bg} $iconColor={colorTheme.icon}>
            {/* Use MapPin or maybe Compass for 'experience' feel */}
            <MapPin size={18} strokeWidth={2} aria-hidden />
          </IconBox>
          <DestText>
            <DestName>{name}</DestName>
            <DestDesc>{desc}</DestDesc>
          </DestText>
        </DestItem>
      );
    });
  };

  if (!isDrawerOpen) return null;

  return typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TopBar>
              {expandedSection !== null ? (
                <TopIconBtn type="button" onClick={() => setExpandedSection(null)} aria-label="Back">
                  <ArrowLeft size={22} strokeWidth={1.5} aria-hidden />
                </TopIconBtn>
              ) : (
                <TopBarSpacer aria-hidden />
              )}

              <TopBarCenter
                 layoutId="topbar-title"
                 key={expandedSection || "default"}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
              >
                {expandedSection === null
                  ? "Search experiences"
                  : expandedSection === "location"
                    ? "Where?"
                    : expandedSection === "date"
                      ? "When are you free?"
                      : expandedSection === "iwant"
                        ? "What experience?"
                        : "Search experiences"}
              </TopBarCenter>

              <TopIconBtn type="button" onClick={() => setIsDrawerOpen(false)} aria-label="Close search">
                <X size={22} strokeWidth={1.75} aria-hidden />
              </TopIconBtn>
            </TopBar>

            <LayoutGroup>
              <MainScroll
                ref={mainScrollRef}
                $expanded={!!expandedSection}
              >
                {/* --- LOCATION CARD --- */}
                <CardShell
                  layout="position"
                  layoutId="card-location"
                  transition={layoutTransition}
                  animate={{
                    flexGrow: expandedSection === "location" ? 1 : 0,
                    flexBasis: "auto",
                    height: expandedSection && expandedSection !== "location" ? 0 : "auto",
                    opacity: expandedSection && expandedSection !== "location" ? 0 : 1,
                    marginTop: expandedSection === "location" ? 12 : 0,
                    marginBottom: expandedSection ? 0 : 12,
                    borderRadius: expandedSection === "location" ? "16px 16px 0 0" : "16px",
                    boxShadow:
                      expandedSection === "location" ? cardShadowLifted : cardShadowRest,
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <CardHeader
                    type="button"
                    onClick={() => {
                      if (expandedSection !== "location") {
                        setExpandedSection("location");
                      }
                    }}
                  >
                    <WhereHeaderContainer>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <RowLabel>Where</RowLabel>
                        {!expandedSection && <ChevronDown size={18} strokeWidth={2} color="#717171" aria-hidden />}
                      </div>

                      <MorphingInputBox
                        layoutId="location-input-box"
                        $expanded={expandedSection === "location"}
                      >
                         <Search size={20} color={expandedSection === "location" ? "#000000" : "#717171"} strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden />
                         {expandedSection === "location" ? (
                           <RealInput
                             ref={locationInputRef}
                             value={searchTerm}
                             onChange={(e) => handleLocationChange(e.target.value)}
                             placeholder="Search destinations"
                             onClick={(e) => e.stopPropagation()}
                           />
                         ) : (
                           <FakeText $hasValue={!!searchTerm}>
                             {searchTerm || "I'm flexible"}
                           </FakeText>
                         )}
                      </MorphingInputBox>
                    </WhereHeaderContainer>
                  </CardHeader>

                  <AnimatePresence>
                    {expandedSection === "location" && (
                      <ExpandedBody
                        key="location-body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={contentTransition}
                      >
                        <ScrollableContent>
                          <SectionHeading>Explore nearby</SectionHeading>
                          <div style={{ paddingBottom: 12 }}>{renderLocationList()}</div>
                        </ScrollableContent>
                      </ExpandedBody>
                    )}
                  </AnimatePresence>
                </CardShell>

                {/* --- DATE CARD --- */}
                <CardShell
                  layout="position"
                  layoutId="card-date"
                  transition={layoutTransition}
                  animate={{
                    flexGrow: expandedSection === "date" ? 1 : 0,
                    flexBasis: "auto",
                    height: expandedSection && expandedSection !== "date" ? 0 : "auto",
                    opacity: expandedSection && expandedSection !== "date" ? 0 : 1,
                    marginTop: expandedSection === "date" ? 12 : 0,
                    marginBottom: expandedSection ? 0 : 12,
                    borderRadius: expandedSection === "date" ? "16px 16px 0 0" : "16px",
                    boxShadow:
                      expandedSection === "date" ? cardShadowLifted : cardShadowRest,
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <CardHeader type="button" onClick={() => setExpandedSection("date")}>
                     <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <RowLabel>When</RowLabel>
                        <RowValue $hasValue={!!datePickerValue}>{getDateDisplay()}</RowValue>
                     </div>
                     {!expandedSection && <ChevronDown size={18} strokeWidth={2} color="#717171" aria-hidden />}
                  </CardHeader>
                  
                  <AnimatePresence>
                    {expandedSection === "date" && (
                      <ExpandedBody
                        key="date-body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={contentTransition}
                      >
                        <ScrollableContent style={{ padding: "0 16px" }}>
                           <CustomCalendar
                             value={datePickerValue}
                             onChange={setDatePickerValue}
                             onClose={() => setExpandedSection(null)}
                           />
                           <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
                             <ClearLink type="button" onClick={(e) => { e.stopPropagation(); setDatePickerValue(null); }}>
                               Clear dates
                             </ClearLink>
                           </div>
                        </ScrollableContent>
                      </ExpandedBody>
                    )}
                  </AnimatePresence>
                </CardShell>

                {/* --- I WANT CARD --- */}
                <CardShell
                  layout="position"
                  layoutId="card-iwant"
                  transition={layoutTransition}
                  animate={{
                    flexGrow: expandedSection === "iwant" ? 1 : 0,
                    flexBasis: "auto",
                    height:
                      expandedSection && expandedSection !== "iwant"
                        ? 0
                        : "auto",
                    opacity:
                      expandedSection && expandedSection !== "iwant" ? 0 : 1,
                    marginTop: expandedSection === "iwant" ? 12 : 0,
                    marginBottom: expandedSection ? 0 : 12,
                    borderRadius:
                      expandedSection === "iwant" ? "16px 16px 0 0" : "16px",
                    boxShadow:
                      expandedSection === "iwant"
                        ? cardShadowLifted
                        : cardShadowRest,
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <CardHeader type="button" onClick={() => setExpandedSection("iwant")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <RowLabel>I want…</RowLabel>
                      <RowValue $hasValue={(selectedCollections || []).length > 0}>
                        {summarizeCollectionsForPill(selectedCollections)}
                      </RowValue>
                    </div>
                    {!expandedSection && <ChevronDown size={18} strokeWidth={2} color="#717171" aria-hidden />}
                  </CardHeader>

                  <AnimatePresence>
                    {expandedSection === "iwant" && (
                      <ExpandedBody
                        key="iwant-body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={contentTransition}
                      >
                        <ScrollableContent style={{ padding: 0 }}>
                          <ExploreDropdownTypeChipFlow>
                            {iWantCollections.map((c) => {
                              const active = (selectedCollections || []).some(
                                (x) => x.slug === c.slug,
                              );
                              const title = formatCollectionDisplayName(
                                c.name || c.slug,
                              );
                              return (
                                <ExploreDropdownTypeChip
                                  key={c.id ?? c.slug}
                                  type="button"
                                  $selected={active}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCollections((prev) => {
                                      const exists = prev.some((x) => x.slug === c.slug);
                                      if (exists) {
                                        return prev.filter((x) => x.slug !== c.slug);
                                      }
                                      return [
                                        ...prev,
                                        { slug: c.slug, name: c.name || title },
                                      ];
                                    });
                                  }}
                                >
                                  {c.icon_name ? (
                                    <ExploreBarLazyLucideIcon
                                      iconName={c.icon_name}
                                      size={16}
                                      strokeWidth={1.5}
                                    />
                                  ) : null}
                                  <span>{title}</span>
                                </ExploreDropdownTypeChip>
                              );
                            })}
                          </ExploreDropdownTypeChipFlow>
                        </ScrollableContent>
                      </ExpandedBody>
                    )}
                  </AnimatePresence>
                </CardShell>

              </MainScroll>
            </LayoutGroup>

            <Footer>
              <ClearLink type="button" onClick={handleClearAllClick}>
                Clear all
              </ClearLink>
              <ExploreShowResultsButton
                type="button"
                $footerFlex
                onClick={handleSearchClick}
              >
                <Search size={18} strokeWidth={2} aria-hidden /> Search
              </ExploreShowResultsButton>
            </Footer>
          </Overlay>
        </AnimatePresence>,
        document.body
      )
    : null;
}