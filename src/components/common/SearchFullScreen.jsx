"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  X,
  Compass,
  Loader2,
} from "lucide-react";
import { collectionService } from "@/services/apiService";
import dayjs from "dayjs";
import posthog from "posthog-js";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  useSearch,
  GTA_PRESETS,
  formatCollectionDisplayName,
} from "@/context/SearchContext";
import CustomCalendar from "@/app/(homepage)/_components/CustomCalendarMobile";

// --- Styled Components ---

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #f7f7f7;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  flex-shrink: 0;
  min-height: 60px;
  background: #f7f7f7;
  z-index: 50;
`;

const TopBarCenter = styled(motion.div)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #222;
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
`;

const NavBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.05);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #222;
  flex-shrink: 0;
  z-index: 51;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
`;

const MainScroll = styled(motion.div)`
  flex: 1;
  min-height: 0;
  padding: ${(p) => (p.$expanded ? "0" : "12px 20px 32px")};
  display: flex;
  flex-direction: column;
  gap: 0; 
  background: #f7f7f7;
  overflow-y: auto;
  transition: padding 0.4s cubic-bezier(0.25, 1, 0.5, 1);
`;

// --- Card Logic ---
const CardShell = styled(motion.div)`
  background: #fff;
  border-radius: 13px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb !important;
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
  background: transparent;
  border: none;
  padding: 18px;
  cursor: pointer;
  text-align: left;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  background: #fff; 
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
  padding: 16px 18px;
  background: #f3f4f6;
  border: 1px solid transparent;
  border-radius: ${(p) => (p.$expanded ? "18px" : "16px")};
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: ${(p) => (p.$expanded ? "inset 0 0 0 1px #222" : "none")}; 
  background: ${(p) => (p.$expanded ? "#fff" : "#f3f4f6")};
`;

const RealInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 600;
  color: #222;
  background: transparent;
  width: 100%;
  &::placeholder {
    color: #9ca3af;
    font-weight: 500;
  }
`;

const FakeText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => (p.$hasValue ? "#222" : "#555")};
`;

const RowLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #717171;
  margin-bottom: 2px;
`;

const RowValue = styled.span`
  font-size: 17px;
  color: ${(p) => (p.$hasValue ? "#222" : "#9ca3af")};
  font-weight: 600;
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
  padding: 10px 24px; /* More compact vertical padding */
  cursor: pointer;
  border-bottom: 1px solid transparent; 
  transition: background 0.1s;
  &:hover {
    background: #f9fafb;
  }
`;

// Dynamic color box for icons
const IconBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
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
  font-weight: 600;
  font-size: 15px; /* Slightly tighter font size */
  color: #222;
`;

const DestDesc = styled.span`
  font-size: 13px;
  color: #717171;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  background: #fff;
  z-index: 50;
`;

const ClearLink = styled.button`
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #717171;
  text-decoration: underline;
  cursor: pointer;
  &:hover { color: #222; }
`;

const SearchBtn = styled.button`
  flex: 1;
  min-width: 0;
  max-width: 220px;
  height: 52px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff385c 0%, #e11d48 100%);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(236, 236, 236, 0.25);
  transition: transform 0.1s ease;
  &:active { transform: scale(0.98); }
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
    selectedCollection,
    setSelectedCollection,
    geocodedAddressResults,
    geocoding,
    handleLocationChange,
    handleLocationSelect,
    clearAll,
    performSearch,
  } = useSearch();

  const [expandedSection, setExpandedSection] = useState(null);
  const [iWantCollections, setIWantCollections] = useState([]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await collectionService.listByPlacement("i_want");
        if (!cancelled) setIWantCollections(rows);
      } catch {
        if (!cancelled) setIWantCollections([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      collection: selectedCollection?.slug || null,
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", color: "#717171" }}>
          <LoadingSpinnerWrap>
            <Loader2 size={22} strokeWidth={2.5} />
          </LoadingSpinnerWrap>
          <span style={{ fontSize: 15 }}>Finding locations nearby…</span>
        </div>
      );
    }
    if (hasTerm && !isPresetTerm && (!list || list.length === 0)) {
      return <p style={{ color: "#717171", margin: "16px 24px" }}>No experiences found.</p>;
    }

    return (list || []).map((item, idx) => {
      const name = usePresets ? (item.displayName || item.name) : (item.displayName || "").split(",")[0];
      const desc = usePresets ? item.description : item.displayName;
      
      // Cycle through palette based on index
      const colorTheme = ICON_PALETTE[idx % ICON_PALETTE.length];

      return (
        <DestItem key={idx} onClick={() => onSelectLocation(item)}>
          <IconBox $bgColor={colorTheme.bg} $iconColor={colorTheme.icon}>
            {/* Use MapPin or maybe Compass for 'experience' feel */}
            <MapPin size={18} strokeWidth={2.5} />
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
                <NavBtn onClick={() => setExpandedSection(null)}>
                  <ChevronLeft size={22} />
                </NavBtn>
              ) : (
                <div style={{ width: 40 }} />
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
                    ? "Where to?"
                    : expandedSection === "date"
                      ? "When are you free?"
                      : expandedSection === "iwant"
                        ? "What experience?"
                        : "Search experiences"}
              </TopBarCenter>
              
              <NavBtn onClick={() => setIsDrawerOpen(false)}>
                <X size={22} />
              </NavBtn>
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
                    marginTop: expandedSection === "location" ? 20 : 0,
                    marginBottom: expandedSection ? 0 : 16,
                    borderRadius: expandedSection === "location" ? "24px 24px 0 0" : "24px",
                    boxShadow: expandedSection === "location" 
                      ? "0 -4px 30px rgba(0,0,0,0.08)" 
                      : "0 4px 24px rgba(0, 0, 0, 0.04)",
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
                        {!expandedSection && <ChevronDown size={20} color="#717171" />}
                      </div>

                      <MorphingInputBox
                        layoutId="location-input-box"
                        $expanded={expandedSection === "location"}
                      >
                         <Search size={20} color={expandedSection === "location" ? "#222" : "#555"} style={{ flexShrink: 0 }} />
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
                          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", margin: "16px 24px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Explore nearby
                          </h3>
                          <div style={{ paddingBottom: 16 }}>{renderLocationList()}</div>
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
                    marginTop: expandedSection === "date" ? 20 : 0,
                    marginBottom: expandedSection ? 0 : 16,
                    borderRadius: expandedSection === "date" ? "24px 24px 0 0" : "24px",
                    boxShadow: expandedSection === "date" ? "0 -4px 30px rgba(0,0,0,0.08)" : "0 4px 24px rgba(0, 0, 0, 0.04)",
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <CardHeader onClick={() => setExpandedSection("date")}>
                     <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <RowLabel>When</RowLabel>
                        <RowValue $hasValue={!!datePickerValue}>{getDateDisplay()}</RowValue>
                     </div>
                     {!expandedSection && <ChevronDown size={20} color="#717171" />}
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
                        <ScrollableContent style={{ padding: "0 20px" }}>
                           <CustomCalendar
                             value={datePickerValue}
                             onChange={setDatePickerValue}
                             onClose={() => setExpandedSection(null)}
                           />
                           <div style={{ textAlign: "center", padding: 24 }}>
                             <ClearLink onClick={(e) => { e.stopPropagation(); setDatePickerValue(null); }}>
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
                    marginTop: expandedSection === "iwant" ? 20 : 0,
                    marginBottom: expandedSection ? 0 : 16,
                    borderRadius:
                      expandedSection === "iwant" ? "24px 24px 0 0" : "24px",
                    boxShadow:
                      expandedSection === "iwant"
                        ? "0 -4px 30px rgba(0,0,0,0.08)"
                        : "0 4px 24px rgba(0, 0, 0, 0.04)",
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <CardHeader onClick={() => setExpandedSection("iwant")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <RowLabel>I want…</RowLabel>
                      <RowValue $hasValue={!!selectedCollection}>
                        {selectedCollection
                          ? formatCollectionDisplayName(
                              selectedCollection.name ||
                                selectedCollection.slug,
                            )
                          : "Anything"}
                      </RowValue>
                    </div>
                    {!expandedSection && <ChevronDown size={20} color="#717171" />}
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
                        <ScrollableContent style={{ padding: "16px 18px 24px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCollection(null);
                              setExpandedSection(null);
                            }}
                            style={{
                              alignSelf: "flex-start",
                              padding: "8px 14px",
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#374151",
                              marginBottom: 12,
                            }}
                          >
                            Any experience
                          </button>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            {iWantCollections.map((c) => {
                              const active = selectedCollection?.slug === c.slug;
                              const title = formatCollectionDisplayName(
                                c.name || c.slug,
                              );
                              return (
                                <button
                                  key={c.id ?? c.slug}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCollection({
                                      slug: c.slug,
                                      name: c.name || title,
                                    });
                                    setExpandedSection(null);
                                  }}
                                  style={{
                                    padding: "8px 14px",
                                    borderRadius: 999,
                                    border: active
                                      ? "2px solid #f81e3e"
                                      : "1px solid #e5e7eb",
                                    background: active ? "#fff0f0" : "#fff",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#111",
                                  }}
                                >
                                  {title}
                                </button>
                              );
                            })}
                          </div>
                        </ScrollableContent>
                      </ExpandedBody>
                    )}
                  </AnimatePresence>
                </CardShell>

              </MainScroll>
            </LayoutGroup>

            <Footer>
              <ClearLink onClick={handleClearAllClick}>Clear all</ClearLink>
              <SearchBtn onClick={handleSearchClick}>
                <Search size={20} strokeWidth={2.5} /> Search
              </SearchBtn>
            </Footer>
          </Overlay>
        </AnimatePresence>,
        document.body
      )
    : null;
}