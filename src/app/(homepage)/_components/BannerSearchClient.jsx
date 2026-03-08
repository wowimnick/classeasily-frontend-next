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
  Star,
  Minus,
  Plus,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";

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
  max-width: 650px;
  z-index: 50;
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
  width: 60px;
  height: 60px;
  margin-right: 8px;
  margin-left: 8px;
  cursor: pointer;
  flex-shrink: 0;
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

const PopupContentPadding = styled.div`
  padding: 24px;
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
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #f3f4f6;
  }
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

// --- PARTICIPANT COMPONENT ---
const ParticipantRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
`;

const CounterBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #374151;
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: #111;
    color: #111;
  }
`;

const CustomParticipant = ({ count, onChange }) => (
  <ParticipantRow>
    <div
      style={{ display: "flex", flexDirection: "column", textAlign: "left" }}
    >
      <span style={{ fontWeight: 700, color: "#111", fontSize: 16 }}>
        Participants
      </span>
      <span style={{ fontSize: 13, color: "#717171" }}>Join the class</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <CounterBtn
        type="button"
        disabled={count <= 1}
        onClick={() => onChange(Math.max(1, count - 1))}
      >
        <Minus size={16} />
      </CounterBtn>
      <span
        style={{
          width: 24,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 16,
          color: "#222",
        }}
      >
        {count}
      </span>
      <CounterBtn
        type="button"
        disabled={count >= 20}
        onClick={() => onChange(count + 1)}
      >
        <Plus size={16} />
      </CounterBtn>
    </div>
  </ParticipantRow>
);

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
  renderParticipants,
}) => {
  // Capture the field value only on mount.
  // When AnimatePresence renders the exiting component, it passes the *new* field prop,
  // but this state will remain at the *old* field value.
  const [frozenField] = useState(field);

  if (frozenField === "location") return renderLocation();
  if (frozenField === "date") return renderDate();
  if (frozenField === "participants") return renderParticipants();
  return null;
};

const POPUP_SIZES = { location: 400, date: 660, participants: 340 };

export default function BannerSearchClient({ mode }) {
  const {
    searchTerm,
    datePickerValue,
    setDatePickerValue,
    participantCount,
    setParticipantCount,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    performSearch,
    setIsDrawerOpen,
  } = useSearch();

  const [activeField, setActiveField] = useState(null);
  const [popupConfig, setPopupConfig] = useState({ left: 0, width: 400 });
  const [isSwitching, setIsSwitching] = useState(false);

  const containerRef = useRef(null);
  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const participantsRef = useRef(null);

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
      participants: participantsRef,
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
      } else if (field === "participants") {
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

  const participantDisplay =
    participantCount === 1
      ? "1 participant"
      : `${participantCount} participants`;

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
                <strong>First class? Get a gift card for your next one</strong>
                <span className="sep">|</span>
                <span className="desc">
                  Get $10–$20 after your first booking to use on your next booking. 
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
      const pCount = Math.max(1, participantCount);
      if (pCount > 1) parts.push(`${pCount} people`);
      else parts.push("1 person");
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
      <SearchFormWrapper
        ref={containerRef}
        onSubmit={handleSearchSubmit}
        layout
        animate={{ backgroundColor: activeField ? "#ebebeb" : "#ffffff" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
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
          $isHidden={activeField === "date" || activeField === "participants"}
        />

        <SectionButton
          ref={participantsRef}
          $isActive={activeField === "participants"}
          onClick={() => handleFieldClick("participants")}
          style={{ minWidth: "140px" }}
        >
          {activeField === "participants" && (
            <ActivePill
              layoutId="search-pill"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Label>Who</Label>
          <ValueDisplay $hasValue={true}>{participantDisplay}</ValueDisplay>
        </SectionButton>

        <SearchButton
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          layout
        >
          <Search size={22} strokeWidth={2.5} />
        </SearchButton>

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
                    style={{ width: (POPUP_SIZES[activeField] || 400) - 48 }}
                  >
                    {/* --- FIX: Use FrozenContent to prevent crash during exit --- */}
                    <FrozenContent
                      field={activeField}
                      renderLocation={() => (
                        <>
                          <Label
                            style={{
                              paddingBottom: 8,
                              color: "#999",
                              textAlign: "left",
                            }}
                          >
                            SUGGESTED
                          </Label>
                          <LocationList>
                            {renderLocationSuggestions()}
                          </LocationList>
                        </>
                      )}
                      renderDate={() => (
                        <CustomCalendar
                          value={datePickerValue}
                          onChange={setDatePickerValue}
                          onClose={() => handleFieldClick("participants")}
                        />
                      )}
                      renderParticipants={() => (
                        <CustomParticipant
                          count={Math.max(1, participantCount)}
                          onChange={setParticipantCount}
                        />
                      )}
                    />
                  </motion.div>
                </AnimatePresence>
              </PopupContentPadding>
            </UnifiedPopupContainer>
          )}
        </AnimatePresence>
      </SearchFormWrapper>

      <HowItWorksButton onClick={scrollToHowItWorks}>
        How ClassEasily works <ChevronRight size={16} />
      </HowItWorksButton>
    </>
  );
}
