"use client";

import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Search,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useSearch,
  SUGGESTED_AREAS,
  formatCollectionDisplayName,
  summarizeCollectionsForPill,
} from "@/context/SearchContext";
import { useIWantCollections } from "@/hooks/useIWantCollections";
import { formatSearchLocationCityName } from "@/lib/formatSearchLocationDisplay";
import {
  exploreSearchDropdownPanelCss,
  ExploreDropdownTypeChipFlow,
  ExploreDropdownTypeChip,
} from "@/components/explore/ExploreDropdownTypeChips";
import { ExploreBarLazyLucideIcon } from "@/app/explore/_components/exploreBarLazyIcon.jsx";
import CustomCalendar from "./CustomCalendar";

// --- HELPER HOOKS ---
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// --- GLOBAL OVERRIDES ---
const GlobalOverrides = createGlobalStyle`
  .banner-search-container {
    --primary: ${(props) => props.theme?.token?.colorPrimary || "#e11d48"};
  }
`;

// --- STYLED COMPONENTS ---
const HowItWorksButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  padding: 0;
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.3s ease;
  text-decoration: underline;
  text-underline-offset: 5px;
  &:hover {
    opacity: 0.8;
  }
`;

const SearchFormWrapper = styled(motion.form)`
  position: relative;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 100px;
  padding: 0;
  height: 76px;
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.14);
  border: 1px solid rgb(213, 213, 213);
  /* Wider than sum of segment min-widths + search button so the button stays inside the pill */
  max-width: min(820px, calc(100vw - 48px));
  /* Popup sits below the pill — must not clip it (overflow hidden lives on SearchPillRow only). */
  overflow: visible;
  z-index: 50;

  @media (max-width: 768px) {
    max-width: min(320px, calc(100vw - 48px));
  }
`;

/** Clips the rounded pill chrome only; dropdown is a sibling outside this box. */
const SearchPillRow = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 100px;
  overflow: hidden;
`;

const ActivePill = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 64px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  z-index: 0;
`;

const Divider = styled.div`
  width: 1px;
  height: 32px;
  background-color: #e5e7eb;
  margin: 0;
  flex-shrink: 0;
  transition: opacity 0.2s;
  opacity: ${(props) => (props.$isHidden ? 0 : 1)};
`;

const SectionButton = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  height: 100%;
  padding: 0 24px;
  border-radius: 32px;
  cursor: pointer;
  background-color: transparent;
  isolation: isolate;
  &:hover {
    background-color: ${(props) =>
      props.$isActive ? "transparent" : "#f3f4f6"};
    border-radius: 64px;
  }
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 2px;
  position: relative;
  z-index: 1;
`;

const ValueDisplay = styled.div`
  font-size: 15px;
  color: ${(props) => (props.$hasValue ? "#111" : "#9ca3af")};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  position: relative;
  z-index: 1;
`;

const SearchButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff385c 0%, #e11d48 100%);
  color: white;
  border: none;
  border-radius: 50px;
  width: 56px;
  height: 56px;
  margin-right: 10px;
  margin-left: 4px;
  cursor: pointer;
  flex-shrink: 0;
  align-self: center;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
  overflow: hidden;
  z-index: 2;
`;

const UnifiedPopupContainer = styled(motion.div)`
  position: absolute;
  top: 115%;
  z-index: 200;
  padding: 0;
  ${exploreSearchDropdownPanelCss}
`;

const SearchModeStage = styled.div`
  width: 100%;
  max-width: 920px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const SearchModeHeightAnimator = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: visible;
`;


const POPUP_CONTENT_PADDING = 16;

const LocationInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 500;
  background: transparent;
  color: #111;
  padding: 0;
  position: relative;
  z-index: 2;
  &::placeholder {
    color: #9ca3af;
  }
`;

const LocationList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
`;

const LocationOption = styled.div`
  display: flex;
  align-items: center;
  padding: 9px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  background: ${(p) => (p.$isActive ? "#fff0f0" : "transparent")};
  box-shadow: ${(p) =>
    p.$isActive ? "inset 0 0 0 2px #f81e3e" : "none"};
  &:hover {
    background: ${(p) => (p.$isActive ? "#fff0f0" : "#f3f4f6")};
  }
`;

const PopupSectionLabel = styled(Label)`
  padding-bottom: 6px;
  color: #999;
  text-align: left;
  font-size: 11px;
`;

const IconBox = styled.div`
  width: 40px;
  height: 40px;
  background: ${(props) => props.$bgColor ?? "#f3f4f6"};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: ${(props) => props.$iconColor ?? "#374151"};
  flex-shrink: 0;
`;

// --- MOBILE COMPONENTS (match explore ClientHeader MobileExploreSearchPill) ---
const MobileHeroSearchPill = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 10px 36px;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid rgb(219, 219, 219);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.08),
    0 10px 28px rgba(0, 0, 0, 0.14);
  color: #000000;
  cursor: pointer;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.1),
      0 12px 32px rgba(0, 0, 0, 0.16);
  }
`;

const MobileHeroPillLine1 = styled.span`
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #000000;
  line-height: 1.25;
  text-align: center;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileHeroPillMetaRow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 1px;
  font-size: 13px;
  font-weight: 400;
  color: #000000;
  line-height: 1.25;
  text-align: center;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .meta-sep {
    color: #000000;
    font-weight: 400;
    user-select: none;
    flex-shrink: 0;
  }
`;

// --- ANNOUNCEMENT STYLES ---
const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  background: linear-gradient(90deg, #f92346 0%, #ff3d5c 50%, #f92346 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  padding: 18px 24px 14px;
  min-height: 76px;
  box-shadow:
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.12);

  @media (max-width: 768px) {
    display: none;
  }
`;
const BannerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  /* Sheet overlaps ~22px; shift up ~half so copy centers in the visible band above the curve */
  transform: translate3d(0, -11px, 0);
`;
const LeftContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: center;
  font-family: "ProximaSoft", sans-serif;
`;
const NewBadge = styled.span`
  background: #ffffff;
  color: #f92346;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-transform: uppercase;
`;
const TextContent = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  /* Fluid size, capped at 14px */
  font-size: clamp(12px, 0.75vw + 10px, 14px);
  line-height: 1.35;
  justify-content: center;
  text-align: center;

  strong {
    font-weight: 700;
    letter-spacing: -0.2px;
  }
  span.sep {
    opacity: 0.4;
    font-weight: 300;
    flex-shrink: 0;
  }
  span.desc {
    opacity: 0.9;
    font-weight: 400;
  }

  @media (max-width: 1100px) {
    gap: 4px 6px;
  }
`;
const SecondaryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "ProximaSoft", sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover {
    color: #ffffff;
    svg {
      transform: translateX(2px);
    }
  }
  svg {
    transition: transform 0.2s ease;
  }
`;

// --- FIX: FrozenContent Component ---
// This ensures that when AnimatePresence is removing the "old" field,
// it doesn't try to render the content of the "new" field causing crashes.
const FrozenContent = ({
  field,
  renderLocation,
  renderDate,
  renderCollectionPicker,
}) => {
  // Capture the field value only on mount.
  // When AnimatePresence renders the exiting component, it passes the *new* field prop,
  // but this state will remain at the *old* field value.
  const [frozenField] = useState(field);

  if (frozenField === "location") return renderLocation();
  if (frozenField === "date") return renderDate();
  if (frozenField === "collection") return renderCollectionPicker();
  return null;
};

const POPUP_SIZES = { location: 400, date: 660, collection: 400 };

function getMobileExploreLocationTitle(selectedLocation, searchTerm) {
  const city = formatSearchLocationCityName({
    displayName: selectedLocation?.displayName,
    searchTerm,
    city: selectedLocation?.city,
    state: selectedLocation?.state,
  });
  if (!city) return "Start your search";
  return `Experiences in ${city}`;
}

function formatMobileExploreDateSummary(datePickerValue) {
  if (!datePickerValue) return "Anytime";
  if (datePickerValue.start && datePickerValue.end) {
    const a = dayjs(datePickerValue.start);
    const b = dayjs(datePickerValue.end);
    if (a.isValid() && b.isValid()) {
      if (a.isSame(b, "day")) return a.format("MMM D");
      return `${a.format("MMM D")} – ${b.format("MMM D")}`;
    }
  }
  if (typeof datePickerValue?.format === "function") {
    return datePickerValue.format("MMM D");
  }
  if (typeof datePickerValue === "string" && datePickerValue) {
    const d = dayjs(datePickerValue);
    return d.isValid() ? d.format("MMM D") : "Anytime";
  }
  return "Anytime";
}

export default function BannerSearchClient({ mode }) {
  const {
    searchTerm,
    selectedLocation,
    datePickerValue,
    setDatePickerValue,
    selectedCollections,
    setSelectedCollections,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    performSearch,
    setIsDrawerOpen,
  } = useSearch();

  const iWantCollections = useIWantCollections();
  const [activeField, setActiveField] = useState(null);
  const [popupConfig, setPopupConfig] = useState({ left: 0, width: 400 });
  const [isSwitching, setIsSwitching] = useState(false);
  const [modeHeight, setModeHeight] = useState(76);

  const containerRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const collectionRef = useRef(null);
  const guidedModeRef = useRef(null);

  useClickOutside(containerRef, () => {
    setActiveField(null);
    setIsSwitching(false);
  });

  const calculatePosition = useCallback((field) => {
    // --- FIX: Added safety check for refs ---
    if (!field || !containerRef.current) return { left: 0, width: 400 };

    const refs = {
      location: locationRef,
      date: dateRef,
      collection: collectionRef,
    };
    const targetRef = refs[field];

    if (targetRef?.current && containerRef.current) {
      const buttonRect = targetRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const width = POPUP_SIZES[field] || 400;

      let left = 0;
      if (field === "location") {
        left = buttonRect.left - containerRect.left;
      } else if (field === "date") {
        left =
          buttonRect.left -
          containerRect.left +
          buttonRect.width / 2 -
          width / 2;
      } else if (field === "collection") {
        left = buttonRect.right - containerRect.left - width;
      }

      const absoluteLeft = containerRect.left + left;
      const viewportPadding = 24;
      const windowWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;

      if (absoluteLeft + width > windowWidth - viewportPadding) {
        left -= absoluteLeft + width - (windowWidth - viewportPadding);
      }
      if (absoluteLeft < viewportPadding) {
        left += viewportPadding - absoluteLeft;
      }

      return { left, width };
    }
    return { left: 0, width: 400 };
  }, []);

  useLayoutEffect(() => {
    if (activeField) {
      const newConfig = calculatePosition(activeField);
      setPopupConfig(newConfig);
    }
    const handleResize = () => {
      if (activeField) {
        setPopupConfig(calculatePosition(activeField));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeField, calculatePosition]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch();
    setActiveField(null);
    setIsSwitching(false);
  };

  const handleFieldClick = (field) => {
    const newConfig = calculatePosition(field);
    setPopupConfig(newConfig);
    setIsSwitching(!!(activeField && activeField !== field));
    setActiveField(field);
  };

  const scrollToHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  useLayoutEffect(() => {
    const activeModeElement = guidedModeRef.current;

    if (!activeModeElement) return;

    const updateHeight = () => {
      const nextHeight = activeModeElement.offsetHeight;
      if (nextHeight > 0) {
        setModeHeight(nextHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(activeModeElement);
    return () => observer.disconnect();
  }, [activeField]);

  const collectionDisplay = (() => {
    const list = selectedCollections || [];
    if (!list.length) return "Anything";
    if (list.length === 1) {
      return formatCollectionDisplayName(list[0].name || list[0].slug);
    }
    return summarizeCollectionsForPill(list);
  })();

  const getDateDisplay = () => {
    if (!datePickerValue) return "Any date";
    if (datePickerValue.start && datePickerValue.end) {
      const s = dayjs(datePickerValue.start);
      const e = dayjs(datePickerValue.end);
      if (s.month() === e.month())
        return `${s.format("MMM D")} - ${e.format("D")}`;
      return `${s.format("MMM D")} - ${e.format("MMM D")}`;
    }
    return dayjs(datePickerValue).format("MMM DD");
  };

  const renderLocationSuggestions = () => {
    const safeResults = Array.isArray(geocodedAddressResults)
      ? geocodedAddressResults
      : [];
    if (searchTerm && safeResults.length > 0) {
      return safeResults.map((result, idx) => (
        <LocationOption
          key={idx}
          onClick={() => {
            handleLocationSelect(result.displayName, {
              coordinates: result.coordinates,
              citySlug: result.citySlug,
              provinceSlug: result.provinceSlug,
              city: result.city,
              state: result.state,
            });
            setActiveField(null);
            setIsSwitching(false);
          }}
        >
          <IconBox>
            <MapPin size={20} />
          </IconBox>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
            }}
          >
            <span style={{ fontWeight: 600, color: "#111" }}>
              {formatSearchLocationCityName({
                displayName: result.displayName,
                city: result.city,
                state: result.state,
              }) || result.displayName.split(",")[0]}
            </span>
            <span style={{ fontSize: 13, color: "#717171" }}>
              {result.displayName}
            </span>
          </div>
        </LocationOption>
      ));
    }
    return SUGGESTED_AREAS.map((area, idx) => (
      <LocationOption
        key={idx}
        onClick={() => {
          handleLocationSelect(area.displayName || area.name, {
            coordinates: area.coords,
            citySlug: area.citySlug,
            provinceSlug: area.provinceSlug,
          });
          setActiveField(null);
          setIsSwitching(false);
        }}
      >
        {area.icon ? (
          <IconBox>{area.icon}</IconBox>
        ) : (
          <IconBox
            $bgColor={area.lucideColorTheme?.bg}
            $iconColor={area.lucideColorTheme?.icon}
          >
            <MapPin size={20} strokeWidth={2.5} />
          </IconBox>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
          }}
        >
          <span style={{ fontWeight: 600, color: "#111" }}>{area.displayName || area.name}</span>
          <span style={{ fontSize: 13, color: "#717171" }}>
            {area.description}
          </span>
        </div>
      </LocationOption>
    ));
  };

  const contentVariants = {
    enter: { opacity: 0, scale: 0.98 },
    center: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.1, duration: 0.3, ease: "easeOut" },
    },
    exit: { opacity: 0, transition: { duration: 0 } },
  };

  if (mode === "announcement") {
    return (
      <div style={{ position: "relative", width: "100%", zIndex: 90 }}>
        <BannerWrapper>
          <BannerContainer>
            <LeftContent>
              <lord-icon
                src="https://cdn.lordicon.com/ajzwsrcs.json"
                trigger="in"
                state="in-reveal"
                colors="primary:#f4dc9c,secondary:#ebe6ef,tertiary:#ffc738,quaternary:#f9c9c0,quinary:#629110"
                style={{ width: "20px", height: "20px", flexShrink: 0 }}
              />
              <TextContent>
                <NewBadge>New</NewBadge>
                <strong>First booking? Get a gift card for your next one</strong>
                <span className="sep">|</span>
                <span className="desc">
                  Get $10–$20 after your first booking to use on your next experience. 
                </span>
              </TextContent>
            </LeftContent>
          </BannerContainer>
        </BannerWrapper>
      </div>
    );
  }

  if (mode === "mobile") {
    return (
      <MobileHeroSearchPill
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        whileTap={{ scale: 0.98 }}
        aria-label="Edit search"
      >
        <MobileHeroPillLine1>
          {getMobileExploreLocationTitle(selectedLocation, searchTerm)}
        </MobileHeroPillLine1>
        <MobileHeroPillMetaRow>
          <span>{formatMobileExploreDateSummary(datePickerValue)}</span>
          <span className="meta-sep" aria-hidden>
            ·
          </span>
          <span>{summarizeCollectionsForPill(selectedCollections)}</span>
        </MobileHeroPillMetaRow>
      </MobileHeroSearchPill>
    );
  }

  return (
    <>
      <GlobalOverrides />
      <SearchModeHeightAnimator
        animate={{ height: modeHeight }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <SearchModeStage>
          <motion.div
            ref={guidedModeRef}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
                <SearchFormWrapper
                  ref={containerRef}
                  onSubmit={handleSearchSubmit}
                  layout
                  animate={{ backgroundColor: activeField ? "#ebebeb" : "#ffffff" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                <SearchPillRow>
                <SectionButton
                  ref={locationRef}
                  $isActive={activeField === "location"}
                  onClick={() => handleFieldClick("location")}
                  style={{ width: "300px", flexShrink: 0 }}
                >
                  {activeField === "location" && (
                    <ActivePill
                      layoutId="search-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Label>Location</Label>
                  {activeField === "location" ? (
                    <LocationInput
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      placeholder="Where are you looking?"
                    />
                  ) : (
                    <ValueDisplay $hasValue={!!searchTerm}>
                      {searchTerm || "Where are you looking?"}
                    </ValueDisplay>
                  )}
                </SectionButton>
                <Divider
                  $isHidden={activeField === "location" || activeField === "date"}
                />

                <SectionButton
                  ref={dateRef}
                  $isActive={activeField === "date"}
                  onClick={() => handleFieldClick("date")}
                  style={{ minWidth: "192px" }}
                >
                  {activeField === "date" && (
                    <ActivePill
                      layoutId="search-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Label>Date</Label>
                  <ValueDisplay $hasValue={!!datePickerValue}>
                    {getDateDisplay()}
                  </ValueDisplay>
                </SectionButton>
                <Divider
                  $isHidden={activeField === "date" || activeField === "collection"}
                />

                <SectionButton
                  ref={collectionRef}
                  $isActive={activeField === "collection"}
                  onClick={() => handleFieldClick("collection")}
                  style={{ minWidth: "200px", flex: 1 }}
                >
                  {activeField === "collection" && (
                    <ActivePill
                      layoutId="search-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Label>I want…</Label>
                  <ValueDisplay $hasValue={(selectedCollections || []).length > 0}>
                    {collectionDisplay}
                  </ValueDisplay>
                </SectionButton>

                <SearchButton
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={22} strokeWidth={2.5} />
                </SearchButton>
                </SearchPillRow>

                <AnimatePresence>
                  {activeField && (
                    <UnifiedPopupContainer
                      key="popup-container"
                      layout
                      initial={{
                        opacity: 0,
                        y: 10,
                        scale: 0.95,
                        left: popupConfig.left,
                        width: popupConfig.width,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        left: popupConfig.left,
                        width: popupConfig.width,
                      }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{
                        layout: { duration: 0.4, ease: "easeInOut" },
                        left: { duration: isSwitching ? 0.4 : 0, ease: "easeInOut" },
                        width: { duration: isSwitching ? 0.4 : 0, ease: "easeInOut" },
                        opacity: { duration: 0.25 },
                        scale: { duration: 0.25 },
                      }}
                    >
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activeField}
                          layout="position"
                          variants={contentVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={{
                            width: POPUP_SIZES[activeField] || 400,
                            padding: activeField === "collection" ? 0 : POPUP_CONTENT_PADDING,
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0
                          }}
                        >
                          <FrozenContent
                            field={activeField}
                            renderLocation={() => (
                              <>
                                <PopupSectionLabel>
                                  SUGGESTED
                                </PopupSectionLabel>
                                <LocationList>
                                  {renderLocationSuggestions()}
                                </LocationList>
                              </>
                            )}
                            renderDate={() => (
                              <CustomCalendar
                                value={datePickerValue}
                                onChange={setDatePickerValue}
                                onClose={() => setActiveField(null)}
                              />
                            )}
                            renderCollectionPicker={() => (
                              <ExploreDropdownTypeChipFlow>
                                {iWantCollections.map((c) => {
                                  const title = formatCollectionDisplayName(
                                    c.name || c.slug,
                                  );
                                  const isSelected = (selectedCollections || []).some(
                                    (x) => x.slug === c.slug,
                                  );
                                  return (
                                    <ExploreDropdownTypeChip
                                      key={c.id ?? c.slug}
                                      type="button"
                                      $selected={isSelected}
                                      onClick={() => {
                                        setSelectedCollections((prev) => {
                                          const exists = prev.some(
                                            (x) => x.slug === c.slug,
                                          );
                                          if (exists) {
                                            return prev.filter(
                                              (x) => x.slug !== c.slug,
                                            );
                                          }
                                          return [
                                            ...prev,
                                            {
                                              slug: c.slug,
                                              name: c.name || title,
                                              icon_name: c.icon_name || "",
                                              color: c.color || "",
                                            },
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
                            )}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </UnifiedPopupContainer>
                  )}
                </AnimatePresence>
                </SearchFormWrapper>
              </motion.div>
        </SearchModeStage>
      </SearchModeHeightAnimator>

    </>
  );
}
