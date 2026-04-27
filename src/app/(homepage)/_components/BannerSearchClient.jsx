"use client";

import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  lazy,
  memo,
  Suspense,
} from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  ChevronRight,
  Box,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useSearch,
  SUGGESTED_AREAS,
  formatCollectionDisplayName,
} from "@/context/SearchContext";
import { collectionService } from "@/services/apiService";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";

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
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  /* Wider than sum of segment min-widths + search button so the button stays inside the pill */
  max-width: min(720px, calc(100vw - 32px));
  /* Popup sits below the pill — must not clip it (overflow hidden lives on SearchPillRow only). */
  overflow: visible;
  z-index: 50;
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
  max-width: 200px;
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
  background: white;
  border-radius: 32px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 100;
`;

const SearchModeStage = styled.div`
  width: 100%;
  max-width: 720px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const KeywordModeShell = styled(motion.div)`
  width: 100%;
  max-width: 520px;
`;

const POPUP_CONTENT_PADDING = 16;

const PopupContentPadding = styled.div`
  padding: ${POPUP_CONTENT_PADDING}px;
`;

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

const collectionIconCache = new Map();

const IconFallback = ({ size = 20, strokeWidth = 2.5 }) => (
  <Box size={size} strokeWidth={strokeWidth} />
);

const normalizeCollectionIconExportName = (raw) => {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
};

const getLazyCollectionIcon = (iconName) => {
  const exportName = normalizeCollectionIconExportName(iconName);
  if (!exportName) return null;
  if (!collectionIconCache.has(exportName)) {
    collectionIconCache.set(
      exportName,
      lazy(async () => {
        try {
          const module = await import("lucide-react");
          return { default: module[exportName] || Box };
        } catch {
          return { default: Box };
        }
      }),
    );
  }
  return collectionIconCache.get(exportName);
};

const CollectionIcon = memo(({ iconName, size = 20, strokeWidth = 2.5 }) => {
  const LazyIcon = getLazyCollectionIcon(iconName);
  if (!LazyIcon) return <IconFallback size={size} strokeWidth={strokeWidth} />;
  return (
    <Suspense fallback={<IconFallback size={size} strokeWidth={strokeWidth} />}>
      <LazyIcon size={size} strokeWidth={strokeWidth} />
    </Suspense>
  );
});

const resolveCollectionTheme = (hexColor) => {
  const normalized = String(hexColor ?? "").trim();
  const validHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)
    ? normalized
    : null;
  if (!validHex) {
    return { bg: "#f3f4f6", icon: "#374151" };
  }
  const short = validHex.length === 4;
  const toInt = (index) =>
    parseInt(short ? validHex[index] + validHex[index] : validHex.slice(index, index + 2), 16);
  const r = toInt(1);
  const g = toInt(short ? 2 : 3);
  const b = toInt(short ? 3 : 5);
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.14)`,
    icon: validHex,
  };
};

// --- MOBILE COMPONENTS ---
const StaticSearchPill = styled(motion.button)`
  background: #ffffff;
  border: none;
  border-radius: 100px;
  padding: 10px 16px 10px 20px;
  width: 100%;
  max-width: 360px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  .content {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    flex: 1;
    min-width: 0;
  }
  .icon-circle {
    width: 36px;
    height: 36px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #222;
  }
`;

const PillText = styled.div`
  font-family: "ProximaSoft", sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PillSubtext = styled.div`
  font-family: "ProximaSoft", sans-serif;
  font-size: 13px;
  color: #717171;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// --- ANNOUNCEMENT & TRUST STYLES ---
const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  background: linear-gradient(90deg, #6b0f1a 0%, #850d19 50%, #6b0f1a 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  padding: 12px 20px;
  min-height: 52px;
  box-shadow:
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.12);

  @media (max-width: 850px) {
    display: none;
  }
`;
const BannerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
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
  color: #850d19;
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
  font-size: clamp(12px, 1.35vw + 11px, 14px);
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

  /* When wrapped to 2 rows, reduce text size */
  @media (max-width: 1100px) {
    font-size: 12px;
    gap: 4px 6px;
  }
  @media (max-width: 950px) {
    font-size: 11px;
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

// Trust Strip
const TrustStripWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  background: rgba(0, 0, 0, 0.27);
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  padding: 0.5rem 1.5rem;

  @media (max-width: 850px) {
    display: none;
  }
`;
const WaveContainer = styled.div`
  position: absolute;
  top: -25px;
  left: 0;
  width: 100%;
  height: 25px;
  overflow: hidden;
  z-index: 11;
  pointer-events: none;
  svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: rgba(0, 0, 0, 0.27);
  }
`;
const TrustContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  max-width: 1200px;
  width: 100%;
  position: relative;
  @media (max-width: 800px) {
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
`;
const AvatarPile = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 0;
  @media (max-width: 600px) {
    display: none;
  }
`;
const AvatarItem = styled.div`
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  background: #333;

  /* Add these lines: */
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;
const CenterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
`;
const StarCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  svg {
    fill: #ffd700;
    color: #ffd700;
    filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.5));
  }
`;
const TrustText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  .title {
    color: #fff;
    font-family: "ProximaSoft", sans-serif;
    font-size: 14px;
    font-weight: 700;
  }
  .subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-family: "ProximaSoft", sans-serif;
    font-size: 13px;
    font-weight: 500;
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

export default function BannerSearchClient({ mode }) {
  const {
    searchTerm,
    datePickerValue,
    setDatePickerValue,
    selectedCollection,
    setSelectedCollection,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    performSearch,
    setIsDrawerOpen,
  } = useSearch();

  const [iWantCollections, setIWantCollections] = useState([]);
  const [isKeywordMode, setIsKeywordMode] = useState(false);
  const [searchModeDirection, setSearchModeDirection] = useState(1);
  const [activeField, setActiveField] = useState(null);
  const [popupConfig, setPopupConfig] = useState({ left: 0, width: 400 });
  const [isSwitching, setIsSwitching] = useState(false);

  const containerRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const collectionRef = useRef(null);

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

  const switchSearchMode = (toKeywordMode) => {
    setSearchModeDirection(toKeywordMode ? 1 : -1);
    setIsKeywordMode(toKeywordMode);
    setActiveField(null);
    setIsSwitching(false);
  };

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

  const collectionDisplay = selectedCollection
    ? formatCollectionDisplayName(
        selectedCollection.name || selectedCollection.slug,
      )
    : "Anything";

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
              {result.displayName.split(",")[0]}
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
          handleLocationSelect(area.name, {
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
          <span style={{ fontWeight: 600, color: "#111" }}>{area.name}</span>
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

  const modeSwapVariants = {
    enter: (direction) => ({
      opacity: 0,
      y: direction > 0 ? 20 : -20,
      scale: 0.965,
      filter: "blur(8px)",
    }),
    center: {
      opacity: 1,
      y: [0, -3, 0],
      scale: [0.985, 1.01, 1],
      filter: "blur(0px)",
      transition: {
        y: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.32 },
        filter: { duration: 0.28 },
      },
    },
    exit: (direction) => ({
      opacity: 0,
      y: direction > 0 ? -16 : 16,
      scale: 0.97,
      filter: "blur(6px)",
      transition: {
        duration: 0.28,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
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

  if (mode === "trust") {
    const activityImagesLeft = [
      {
        src: "https://i.ytimg.com/vi/Z39AeBVCQu0/maxresdefault.jpg",
        alt: "Neon Sign Making",
        x: 0,
        y: -3,
        z: 2,
      },
    ];
    const activityImagesRight = [
      {
        src: "https://media.istockphoto.com/id/1413388346/vector/white-maple-leaf-on-a-red-background-the-symbol-of-canada.jpg?s=170667a&w=0&k=20&c=n9Vf1HXscEwD-4lAbnZvfhHW0Mdi6sL2wYGPHpQ344I=",
        alt: "Maple Leaf",
        x: 0,
        y: 3,
        z: 2,
      },
    ];
    return (
      <TrustStripWrapper>
        <WaveContainer>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,100 C150,200 350,0 500,100 C650,200 800,0 1000,100 C1100,150 1200,100 1200,100 V120 H0 V100 Z"></path>
          </svg>
        </WaveContainer>
        <TrustContent>
          <AvatarPile>
            {activityImagesLeft.map((item, i) => (
              <AvatarItem
                key={i}
                style={{
                  zIndex: item.z,
                  marginLeft: i === 0 ? 0 : `${item.x}px`,
                  transform: `translateY(${item.y}px)`,
                }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={44}
                  height={44}
                  style={{ objectFit: "cover" }}
                />
              </AvatarItem>
            ))}
          </AvatarPile>
          <CenterInfo>
            <StarCluster>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} strokeWidth={0} />
              ))}
            </StarCluster>
            <TrustText>
              <span className="title">Thousands of 5-star reviews</span>
              <span className="subtitle">
                A growing community of people booking fun local experiences.
              </span>
            </TrustText>
          </CenterInfo>
          <AvatarPile>
            {activityImagesRight.map((item, i) => (
              <AvatarItem
                key={i}
                style={{
                  zIndex: item.z,
                  marginLeft: i === 0 ? 0 : `${item.x}px`,
                  transform: `translateY(${item.y}px)`,
                }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={44}
                  height={44}
                  style={{ objectFit: "cover" }}
                />
              </AvatarItem>
            ))}
          </AvatarPile>
        </TrustContent>
      </TrustStripWrapper>
    );
  }

  if (mode === "mobile") {
    const getPillLabel = () => searchTerm || "Search around?";
    const getPillSubLabel = () => {
      let parts = [];
      if (datePickerValue) {
        if (datePickerValue.start && datePickerValue.end) {
          const s = dayjs(datePickerValue.start);
          const e = dayjs(datePickerValue.end);
          if (s.month() === e.month())
            parts.push(`${s.format("MMM D")} - ${e.format("D")}`);
          else parts.push(`${s.format("MMM D")} - ${e.format("MMM D")}`);
        } else {
          parts.push(dayjs(datePickerValue).format("MMM D"));
        }
      } else parts.push("Any week");
      if (selectedCollection?.slug) {
        parts.push(
          formatCollectionDisplayName(
            selectedCollection.name || selectedCollection.slug,
          ),
        );
      } else {
        parts.push("Any experience");
      }
      return parts.join(" • ");
    };
    return (
      <StaticSearchPill
        onClick={() => setIsDrawerOpen(true)}
        whileTap={{ scale: 0.95 }}
      >
        <div className="icon-circle">
          <Search size={22} strokeWidth={2.5} />
        </div>
        <div className="content">
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <PillText>{getPillLabel()}</PillText>
            <PillSubtext>{getPillSubLabel()}</PillSubtext>
          </div>
        </div>
      </StaticSearchPill>
    );
  }

  return (
    <>
      <GlobalOverrides />
      <SearchModeStage>
        <AnimatePresence custom={searchModeDirection} mode="wait" initial={false}>
          {isKeywordMode ? (
            <KeywordModeShell
              key="keyword-mode"
              custom={searchModeDirection}
              variants={modeSwapVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <GlobalSearchBar variant="home-keyword" inverseColors={false} />
            </KeywordModeShell>
          ) : (
            <motion.div
              key="pill-mode"
              custom={searchModeDirection}
              variants={modeSwapVariants}
              initial="enter"
              animate="center"
              exit="exit"
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
                  style={{ width: "260px", flexShrink: 0 }}
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
                  style={{ minWidth: "170px" }}
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
                  style={{ minWidth: "160px" }}
                >
                  {activeField === "collection" && (
                    <ActivePill
                      layoutId="search-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Label>I want…</Label>
                  <ValueDisplay $hasValue={!!selectedCollection}>
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
                      <PopupContentPadding>
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={activeField}
                            layout="position"
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            style={{
                              width:
                                (POPUP_SIZES[activeField] || 400) -
                                POPUP_CONTENT_PADDING * 2,
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
                                <>
                                  <PopupSectionLabel>
                                    SUGGESTED
                                  </PopupSectionLabel>
                                  <LocationList>
                                    <LocationOption
                                      key="__any__"
                                      onClick={() => {
                                        setSelectedCollection(null);
                                        setActiveField(null);
                                        setIsSwitching(false);
                                      }}
                                    >
                                      <IconBox $bgColor="#f3f4f6" $iconColor="#374151">
                                        <Box size={20} strokeWidth={2.5} />
                                      </IconBox>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          textAlign: "left",
                                        }}
                                      >
                                        <span
                                          style={{ fontWeight: 600, color: "#111" }}
                                        >
                                          Any experience
                                        </span>
                                        <span style={{ fontSize: 13, color: "#717171" }}>
                                          Show all categories
                                        </span>
                                      </div>
                                    </LocationOption>
                                    {iWantCollections.map((c) => {
                                      const title = formatCollectionDisplayName(
                                        c.name || c.slug,
                                      );
                                      const theme = resolveCollectionTheme(c.color);
                                      const secondary =
                                        (c.description && String(c.description).trim()) ||
                                        "Curated experiences";
                                      return (
                                        <LocationOption
                                          key={c.id ?? c.slug}
                                          onClick={() => {
                                            setSelectedCollection({
                                              slug: c.slug,
                                              name: c.name || title,
                                              icon_name: c.icon_name || "",
                                              color: c.color || "",
                                            });
                                            setActiveField(null);
                                            setIsSwitching(false);
                                          }}
                                        >
                                          <IconBox
                                            $bgColor={theme.bg}
                                            $iconColor={theme.icon}
                                          >
                                            <CollectionIcon
                                              iconName={c.icon_name}
                                              size={20}
                                              strokeWidth={2.5}
                                            />
                                          </IconBox>
                                          <div
                                            style={{
                                              display: "flex",
                                              flexDirection: "column",
                                              textAlign: "left",
                                            }}
                                          >
                                            <span
                                              style={{ fontWeight: 600, color: "#111" }}
                                            >
                                              {title}
                                            </span>
                                            <span
                                              style={{ fontSize: 13, color: "#717171" }}
                                            >
                                              {secondary}
                                            </span>
                                          </div>
                                        </LocationOption>
                                      );
                                    })}
                                  </LocationList>
                                </>
                              )}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </PopupContentPadding>
                    </UnifiedPopupContainer>
                  )}
                </AnimatePresence>
              </SearchFormWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </SearchModeStage>

      <div
        style={{
          width: "100%",
          maxWidth: 650,
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => switchSearchMode(!isKeywordMode)}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: 4,
            cursor: "pointer",
          }}
        >
          {isKeywordMode ? "switch back to guided search" : "or search with keyword"}
        </button>
      </div>

    </>
  );
}
