"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Typography, Select, DatePicker, AutoComplete } from "antd";
import {
  Search,
  MapPin,
  ChevronDown,
  ArrowRight,
  Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import Image from "next/image";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";
import SearchDrawer from "@/components/common/SearchDrawer";
import Link from "next/link";

// --- GLOBAL STYLES (Desktop Specific) ---

const BannerSearchDropdownStyles = createGlobalStyle`
  /* Desktop Styles */
  .banner-search-location-dropdown.ant-select-dropdown,
  .banner-search-datepicker.ant-picker-dropdown,
  .participant-count-dropdown {
    z-index: 10005 !important;
  }

  .banner-search-location-dropdown {
    min-width: 450px !important;
    max-width: 90vw !important;
    border-radius: 16px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid #e5e7eb !important;
    padding: 8px !important;
  }

  .banner-search-location-dropdown .rc-virtual-list-holder {
    padding-bottom: 8px;
  }

  .banner-search-location-dropdown .ant-select-item-group {
    font-weight: 700;
    font-size: 13px;
    color: #374151;
    padding: 12px 12px 8px 12px;
    background: transparent !important;
    cursor: default !important;
  }

  .banner-search-location-dropdown .ant-select-item {
    border-radius: 12px !important;
    padding: 4px !important;
  }

  .banner-search-location-dropdown .ant-select-item-option-selected {
    background: #eff6ff !important;
  }

  /* Shared Utilities */
  .dropdown-loader-container {
    padding: 24px 20px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    min-height: 80px !important;
  }

  .dropdown-no-results {
    padding: 24px 20px !important;
    text-align: center !important;
    color: #6b7280 !important;
  }
`;

// --- SHARED STYLED COMPONENTS ---

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 10px;
  background: ${(props) => props.bg || "#f3f4f6"};
  margin-right: 12px;
`;

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 4px !important;
  width: 100%;
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
`;

const PrimaryText = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SecondaryText = styled.div`
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// --- LAYOUT COMPONENTS ---

const Banner = styled.section`
  display: flex;
  position: relative;
  min-height: 65vh;
  background-color: #000;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 760px) {
    min-height: 45vh;
    padding-top: 5rem;
    justify-content: flex-start;
    padding-bottom: 2rem;
  }
`;

const FilteredBackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(2px) hue-rotate(350deg) saturate(1.5);
  scale: 1.05;
  z-index: 0;
  opacity: 0;
  animation: fadeIn 0.6s ease-in forwards;
  animation-delay: 0.1s;
  
  display: none;
  @media (max-width: 760px) {
    display: block;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100px;
    background: linear-gradient(to bottom, transparent, white);
    z-index: 1;
  }
`;

const Video = styled.video`
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  transform: scale(1.1);
  filter: brightness(0.8) blur(5px);
  background-color: #000;
  z-index: 0;

  display: block;
  @media (max-width: 760px) {
    display: none;
  }
`;

// --- DESKTOP COMPONENT STYLES ---

const DesktopContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  
  @media (max-width: 760px) {
    display: none;
  }
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 5rem;
  color: ${(props) => props.theme.token.colorHeaderText};
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  padding: 0 2rem;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${(props) => props.theme.token.colorHeaderText};
  z-index: 1;
  padding: 5rem 0;
  width: 100%;
`;

const HeroText = styled.h1`
  font-weight: 900;
  letter-spacing: -1px;
  font-size: 4rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.1;
  color: inherit;
`;

const SubText = styled.p`
  margin: 0;
  margin-bottom: 2rem;
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: -1px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  color: inherit;
  margin-left: auto;
  margin-right: auto;
`;

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
  text-underline-offset: 2px;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.3s ease;
  text-decoration: underline;
  text-underline-offset: 5px;

  /* Ensures the icon sits perfectly centered relative to the text cap-height */
  svg {
    display: block;
    transform: translateY(1px); 
  }

  &:hover {
    opacity: 0.8;
  }
`;

const InputsWrapper = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  gap: 0.4rem;
  z-index: 1;
  width: 100%;
`;

const SearchBarContainer = styled.div`
  display: flex;
  justify-content: left;
  gap: 0;
  align-items: center;
  background: ${(props) => props.theme.token.colorBgContainer};
  width: fit-content;
  padding: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 100px;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
`;

const LabelText = styled.div`
  font-size: 0.75rem; /* Smaller size */
  font-weight: 500; /* Reduced weight from 700 */
  color: #5e5e5e; /* Lighter gray */
  margin-bottom: 0px;
  line-height: 1.2;
`;

/* Location Field Styles */
const LocationSearchWrapper = styled.div`
  flex-grow: 1;
`;

const LocationWrapper = styled.div`
  display: flex;
  flex-direction: column; /* Stack label and input */
  align-items: flex-start;
  justify-content: center;
  padding: 0.5rem 1rem;
  padding-left: 1.5rem; /* Extra padding since icon is gone */
  background-color: transparent;
  color: #000;
  overflow: visible;
  min-width: 240px;
  max-width: 240px;
  transition: 0.3s all;

  .ant-select-clear {
    display: none !important;
  }

  .ant-select {
    width: 100%;
    height: 24px !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
    border-radius: 0 !important;
    /* Removed border-bottom to match clean style */
    border-bottom: 1px solid transparent !important; 
    transition: border-bottom-color 0.3s;

    &.ant-select-focused,
    &:focus-within,
    &:hover {
      border-bottom-color: ${(props) => props.theme.token.colorPrimary} !important;
    }

    .ant-select-selector {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  }

  .banner-search-input {
    width: 100%;
    border: none;
    background: transparent;
    outline: none;
    padding: 0;
    font-size: 15px !important; /* Slightly larger input text */
    font-weight: 600; /* Bold input text */
    font-family: inherit !important;
    color: ${(props) => props.theme.token.colorText} !important;

    &::placeholder {
      color: #bfbfbf !important; 
      font-weight: 400;
      opacity: 1;
    }
  }
`;

/* Date Field Styles */
const DatePickerWrapper = styled.div`
  display: flex;
  flex-direction: column; /* Stack label and input */
  align-items: flex-start;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: transparent;
  width: auto;
  min-width: 150px;
  border-left: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
`;

const DatePickerInputArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
  width: 100%;

  .ant-picker {
    padding-left: 0px !important;
    border-radius: 0rem !important;
    height: 24px !important;
    width: 100% !important;
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
    border-bottom: 1px solid transparent !important;
    transition: border-bottom-color 0.3s;

    &.ant-picker-focused,
    &:focus,
    &:focus-within,
    &:hover {
      box-shadow: none !important;
      outline: none !important;
      border-bottom-color: ${(props) => props.theme.token.colorPrimary} !important;
    }
  }

  .ant-picker-input > input {
    height: 24px !important;
    font-size: 15px !important;
    font-weight: 600;
    font-family: inherit !important;
    color: ${(props) => props.theme.token.colorText} !important;

    &::placeholder {
      color: #bfbfbf !important;
      font-weight: 400;
    }
  }
`;

const DatePickerLabel = styled(LabelText)`
  cursor: pointer;
  display: block;
  font-family: "ProximaSoft", sans-serif;
`;

/* Participants Field Styles */
const ParticipantInputContainer = styled.div`
  display: flex;
  flex-direction: column; /* Stack label and input */
  align-items: flex-start;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: transparent;
  color: ${(props) => props.theme.token.colorText};
  position: relative;
  min-width: 120px;
  border-left: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
`;

const StyledParticipantSelect = styled(Select)`
  width: 100%;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  background: transparent !important;
  color: ${(props) => props.theme.token.colorText} !important;
  font-family: inherit !important;

  /* Fix for alignment and height */
  &.ant-select-single {
    height: 24px !important; 
    margin-left: -1px; /* Micro-adjustment to align perfectly with plain text labels */
  }

  /* Target the selector container */
  .ant-select-selector {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    
    /* Reset all padding variations */
    padding: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-inline-start: 0 !important;
    padding-inline-end: 0 !important;
    
    height: 24px !important;
    border-bottom: 1px solid transparent !important;
    display: flex;
    align-items: center;
    font-size: 15px !important;
    font-family: inherit !important;
  }

  /* Target the visible text */
  .ant-select-selection-item {
    /* Remove internal offsets */
    padding: 0 !important;
    padding-inline-start: 0 !important;
    padding-left: 0 !important;
    margin: 0 !important;
    
    /* Force position to left */
    inset-inline-start: 0 !important;
    left: 0 !important;
    
    line-height: 24px !important;
    font-family: inherit !important;
    font-weight: 600 !important;
    color: ${(props) => props.theme.token.colorText} !important;
    
    /* Ensure flex alignment behavior */
    display: flex !important;
    align-items: center;
  }

  /* Target the hidden search input which sometimes reserves space */
  .ant-select-selection-search {
    inset-inline-start: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 0 !important; /* Collapse width if not searching */
  }

  .ant-select-selection-search-input {
    padding: 0 !important;
    margin: 0 !important;
  }

  .ant-select-arrow {
    right: -5px !important;
    color: #bfbfbf;
  }
`;

// Placeholder for SSR to avoid FOUC
const ParticipantPlaceholder = styled.div`
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  height: 24px;
  padding-left: 0;
  min-width: 80px;
  color: ${(props) => props.theme.token.colorText};
  font-family: inherit;
`;

const InputPlaceholder = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  align-items: left;
  font-size: 15px;
  color: #bfbfbf; 
`;

const RoundedSearchButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.token.colorPrimary} 0%,
    ${(props) => props.theme.token.colorPrimaryHover} 100%
  );
  color: ${(props) => props.theme.token.colorHeaderText};
  cursor: pointer;
  scale: 1.1;
  margin-left: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
  border: none;
  outline: none;

  &:hover {
    scale: 1.15;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ButtonText = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

// --- MOBILE SPECIFIC COMPONENTS ---

const MobileContainer = styled.div`
  width: 100%;
  padding: 1rem 1.5rem;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 2;
  margin-top: 1rem;
  
  @media (max-width: 760px) {
    display: flex;
  }
`;

const HeroTextMobile = styled.h1`
  font-weight: 900;
  font-size: 2.2rem;
  text-align: center;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  margin: 0;
  line-height: 1.1;
`;

const SubTextMobile = styled.p`
  font-size: 0.95rem;
  color: rgba(255,255,255,0.95);
  text-align: center;
  margin: 0;
  max-width: 90%;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
`;

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
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
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
  font-family: 'ProximaSoft', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PillSubtext = styled.div`
  font-family: 'ProximaSoft', sans-serif;
  font-size: 13px;
  color: #717171;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const participantOptions = Array.from({ length: 9 }, (_, i) => ({
  value: i + 1,
  label: i === 0 ? "1 Person" : i === 8 ? "9+ People" : `${i + 1} People`,
}));

const BLACK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ------------------------------------------------------------------------
//  ANNOUNCEMENT BANNER COMPONENTS
// ------------------------------------------------------------------------

const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  background-color: #7a1f2e; /* Muted deep red */
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center; /* Centered content max-width container */
  z-index: 1001;
  padding: 10px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-height: 56px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const BannerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  gap: 16px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const LeftContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  font-family: "ProximaSoft", sans-serif;
  font-size: 15px;
  line-height: 1.4;

  @media (max-width: 900px) {
    font-size: 13px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const IconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  margin-top: 2px; /* Visual alignment fix */
`;

const TextContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  strong {
    font-weight: 700;
  }
  
  span {
    opacity: 0.95;
  }
`;

const DesktopDescription = styled.span`
  display: inline;
  @media (max-width: 600px) {
    display: none; /* Hide long text on very small screens to save space */
  }
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const PillButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 100px;
  padding: 6px 20px;
  font-family: "ProximaSoft", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: transparent;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #ffffff;
    color: #7a1f2e;
    border-color: #ffffff;
  }
`;

const SecondaryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: "ProximaSoft", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: opacity 0.2s;
  white-space: nowrap;

  &:hover {
    opacity: 1;
    color: #ffffff;
    text-decoration: underline;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

export const AnnouncementBanner = () => {
  return (
    <BannerWrapper>
      <BannerContainer>
        {/* Left Side: Icon + Text */}
        <LeftContent>
          <IconBox>
            <lord-icon
              src="https://cdn.lordicon.com/yxsbonud.json"
              trigger="in"
              state="in-reveal"
              style={{ width: "24px", height: "24px" }}>
              
          </lord-icon>
          </IconBox>
          <TextContent>
            <strong>Introducing Courses</strong>
            <span>&mdash;</span>
            <DesktopDescription>
              Book courses with multiple sessions at once. Perfect for learning new skills. 🔥
            </DesktopDescription>
          </TextContent>
        </LeftContent>

        {/* Right Side: Buttons */}
        <ActionGroup>
          {/* Main Call to Action (The Pill Button) */}
          <PillButton href="/explore?type=course">
            Find a Course
          </PillButton>

          {/* Secondary Action (Text Link) */}
          <SecondaryLink href="/host/courses">
            Business? <ArrowRight size={14} />
          </SecondaryLink>
        </ActionGroup>
      </BannerContainer>
    </BannerWrapper>
  );
};

// ------------------------------------------------------------------------
//  BOTTOM TRUST BANNER STYLES
// ------------------------------------------------------------------------

const TrustStripWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  /* Glassmorphism base for the rectangle part */
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 1.25rem 1.5rem;
  
  @media (max-width: 600px) {
    padding: 1rem;
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
    
    fill: rgba(0, 0, 0, 0.45); 
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

// -- AVATAR PILE STYLES --

const AvatarPile = styled.div`
  display: flex;
  align-items: center;
  /* Add padding to account for the jittery offsets not getting cut off */
  padding: 5px 0;
  
  /* On very small screens, hide avatars to reduce clutter */
  @media (max-width: 600px) {
    display: none; 
  }
`;

const AvatarItem = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.8);
  overflow: hidden;
  margin-left: -12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  
  &:first-child {
    margin-left: 0;
  }
`;

// -- CENTER TEXT STYLES --

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
    fill: #FFD700;
    color: #FFD700;
    filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.5));
  }
`;

const TrustText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  .title {
    color: #fff;
    font-family: 'ProximaSoft', sans-serif;
    font-size: 16px;
    font-weight: 700;
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-family: 'ProximaSoft', sans-serif;
    font-size: 13px;
    font-weight: 500;
  }
`;

const BottomTrustBanner = () => {
  // Placeholder images for the "Community" vibe
  const avatarsLeft = [
    "https://i.pravatar.cc/150?img=32",
    "https://i.pravatar.cc/150?img=12",
    "https://i.pravatar.cc/150?img=5"
  ];
  
  const avatarsRight = [
    "https://i.pravatar.cc/150?img=9",
    "https://i.pravatar.cc/150?img=24",
    "https://i.pravatar.cc/150?img=68"
  ];

  // Helper to jitter avatars so they aren't a straight line
  const getRandomOffset = (index) => {
    // Simple deterministic pattern to avoid hydration mismatch random() issues
    const offsets = [0, -4, 3, -2, 5, -3]; 
    return offsets[index % offsets.length];
  };

  return (
    <TrustStripWrapper>
      {/* Decorative Uneven Glass Wave on Top */}
      <WaveContainer>
         <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
             <path d="M0,100 C150,200 350,0 500,100 C650,200 800,0 1000,100 C1100,150 1200,100 1200,100 V120 H0 V100 Z"></path>
         </svg>
      </WaveContainer>

      <TrustContent>
        {/* Left Side Faces */}
        <AvatarPile>
          {avatarsLeft.map((src, i) => (
            <AvatarItem key={i} style={{ transform: `translateY(${getRandomOffset(i)}px)` }}>
              <Image src={src} alt="User" width={36} height={36} style={{objectFit:'cover'}} />
            </AvatarItem>
          ))}
        </AvatarPile>

        {/* Center Text & Stars */}
        <CenterInfo>
          <StarCluster>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} strokeWidth={0} />
            ))}
          </StarCluster>
          <TrustText>
            {/* Swapped to a Statement of Fact (Social Proof) instead of an Invitation */}
            <span className="title">Thousands of 5-star experiences</span>
            <span className="subtitle">A growing community of learners & hosts</span>
          </TrustText>
        </CenterInfo>

        {/* Right Side Faces */}
        <AvatarPile>
          {avatarsRight.map((src, i) => (
            <AvatarItem key={i} style={{ transform: `translateY(${getRandomOffset(i + 3)}px)` }}>
              <Image src={src} alt="User" width={36} height={36} style={{objectFit:'cover'}} />
            </AvatarItem>
          ))}
        </AvatarPile>
      </TrustContent>
    </TrustStripWrapper>
  );
};


// ------------------------------------------------------------------------
//  INTERNAL COMPONENTS
// ------------------------------------------------------------------------

const DesktopSearchForm = () => {
  const {
    searchTerm,
    datePickerValue, setDatePickerValue,
    participantCount, setParticipantCount,
    geocoding, geocodedAddressResults,
    handleLocationChange, handleLocationSelect,
    performSearch
  } = useSearch();

  const [locationOptions, setLocationOptions] = useState([]);

  const generateLocationOptions = useCallback(() => {
    let options = [];
    if (searchTerm && geocodedAddressResults.length > 0) {
      options.push({
        label: "Search Results",
        options: geocodedAddressResults.map((result, index) => ({
          value: result.displayName,
          label: (
            <OptionContainer>
              <IconWrapper bg="#f0f9ff">
                <MapPin size={20} color="#545454" />
              </IconWrapper>
              <OptionText>
                <PrimaryText>{result.displayName}</PrimaryText>
                <SecondaryText>Address</SecondaryText>
              </OptionText>
            </OptionContainer>
          ),
          coordinates: result.coordinates,
          key: `geocoded-${index}`,
        })),
      });
    } else if (!searchTerm) {
      options.push({
        label: "Popular Areas",
        options: SUGGESTED_AREAS.map((dest, index) => ({
          value: dest.name,
          label: (
            <OptionContainer>
              <IconWrapper>
                {dest.icon}
              </IconWrapper>
              <OptionText>
                <PrimaryText>{dest.name}</PrimaryText>
                <SecondaryText>{dest.description}</SecondaryText>
              </OptionText>
            </OptionContainer>
          ),
          coordinates: dest.coords,
          citySlug: dest.citySlug,
          provinceSlug: dest.provinceSlug,
          key: `suggested-${index}`,
        })),
      });
    }
    setLocationOptions(options);
  }, [searchTerm, geocodedAddressResults]);

  useEffect(() => {
    generateLocationOptions();
  }, [generateLocationOptions]);

  const handleDesktopSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <InputsWrapper onSubmit={handleDesktopSubmit}>
      <SearchBarContainer>
        {/* SECTION 1: LOCATION */}
        <LocationSearchWrapper>
          <LocationWrapper>
            {/* REMOVED MapPin ICON */}
            <div style={{ width: "100%" }}>
              <ButtonText>
                <LabelText>Location</LabelText>
              </ButtonText>
              
              <AutoComplete
                value={searchTerm}
                options={locationOptions}
                onSelect={handleLocationSelect}
                onChange={handleLocationChange}
                filterOption={false}
                style={{
                  width: "100%",
                  height: "24px",
                }}
                popupClassName="banner-search-location-dropdown"
                notFoundContent={
                  geocoding ? (
                    <div className="dropdown-loader-container">
                      <GlobalLoaderWithInlineStyles />
                    </div>
                  ) : searchTerm &&
                    !locationOptions.some(
                      (group) => group.options.length > 0
                    ) ? (
                    <div className="dropdown-no-results">
                      No results found for &quot;{searchTerm}&quot;
                    </div>
                  ) : null
                }
              >
                <input
                  className="banner-search-input"
                  placeholder="Where are you looking?"
                />
              </AutoComplete>
            </div>
          </LocationWrapper>
        </LocationSearchWrapper>

        {/* SECTION 2: DATE */}
        <DatePickerWrapper>
          {/* REMOVED CalendarSearch ICON */}
          <DatePickerInputArea>
            <DatePickerLabel htmlFor="date-picker">
              Date
            </DatePickerLabel>
            <DatePicker
              id="date-picker"
              name="date-picker"
              variant="borderless"
              placeholder="Any date"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
              onChange={setDatePickerValue}
              format="YYYY-MM-DD"
              value={datePickerValue}
              allowClear={true}
              inputReadOnly={false}
              popupClassName="banner-search-datepicker"
            />
          </DatePickerInputArea>
        </DatePickerWrapper>

        {/* SECTION 3: PARTICIPANTS */}
        <ParticipantInputContainer>
          <LabelText>Participants</LabelText>
          <StyledParticipantSelect
            id="participant-count"
            value={participantCount}
            onChange={setParticipantCount}
            aria-label="Number of participants"
            options={participantOptions}
            variant="borderless"
            popupClassName="participant-count-dropdown"
            popupMatchSelectWidth={false}
            dropdownStyle={{ minWidth: "80px" }}
          />
        </ParticipantInputContainer>

        {/* SECTION 4: BUTTON */}
        <RoundedSearchButton
          type="submit"
          aria-label="Search classes"
        >
          <Search size={20} />
        </RoundedSearchButton>
      </SearchBarContainer>
    </InputsWrapper>
  );
};

// 2. Mobile Logic
const MobileSearchPill = () => {
  const {
    searchTerm,
    datePickerValue,
    participantCount,
    setIsDrawerOpen
  } = useSearch();

  const getPillLabel = () => {
    if (searchTerm) return searchTerm;
    return "Find a class?";
  };

  const getPillSubLabel = () => {
    let parts = [];
    if (datePickerValue) parts.push(dayjs(datePickerValue).format("MMM D"));
    else parts.push("Any week");

    if (participantCount > 1) parts.push(`${participantCount} people`);
    else parts.push("Add people");

    return parts.join(" • ");
  };

  return (
    <StaticSearchPill onClick={() => setIsDrawerOpen(true)} whileTap={{ scale: 0.95 }}>
      <div className="icon-circle">
        <Search size={22} strokeWidth={2.5} />
      </div>
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <PillText>{getPillLabel()}</PillText>
          <PillSubtext>{getPillSubLabel()}</PillSubtext>
        </div>
      </div>
    </StaticSearchPill>
  );
};

// --- MAIN EXPORT ---

const BannerSearch = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 3. Fallbacks (STATIC HTML ONLY)
  
  const DesktopFallback = () => (
    <InputsWrapper>
      <SearchBarContainer>
        <LocationSearchWrapper>
          <LocationWrapper>
            <div style={{ width: "100%" }}>
               <ButtonText>
                 <LabelText>Location</LabelText>
               </ButtonText>
               <InputPlaceholder>Where are you looking?</InputPlaceholder>
            </div>
          </LocationWrapper>
        </LocationSearchWrapper>
        
        <DatePickerWrapper>
          <DatePickerInputArea>
             <DatePickerLabel>Date</DatePickerLabel>
             <InputPlaceholder style={{ width: '120px' }}>Any date</InputPlaceholder>
          </DatePickerInputArea>
        </DatePickerWrapper>

        <ParticipantInputContainer>
          <LabelText>Participants</LabelText>
          <ParticipantPlaceholder>1 Person</ParticipantPlaceholder>
        </ParticipantInputContainer>

        <RoundedSearchButton type="button">
           <Search size={20} />
        </RoundedSearchButton>
      </SearchBarContainer>
    </InputsWrapper>
  );

  const MobileFallback = () => (
    <StaticSearchPill>
      <div className="icon-circle">
        <Search size={22} strokeWidth={2.5} />
      </div>
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <PillText>Find a class?</PillText>
          <PillSubtext>Any week • Add people</PillSubtext>
        </div>
      </div>
    </StaticSearchPill>
  );

  return (
    <Banner aria-labelledby="banner-heading">
      <BannerSearchDropdownStyles />

      <FilteredBackgroundImage>
        <Image
          src="/homepageMobile.webp"
          alt="Background"
          fill
          priority
          fetchPriority="high"
          quality={85}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLACK_PIXEL}
          style={{ objectFit: "cover" }}
        />
      </FilteredBackgroundImage>

      <Video
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/1.png"
        preload="none"
      >
        <source src="/videos/Classes.mp4" type="video/mp4" />
      </Video>

      <DesktopContainer>
        <MainWrapper>
          <MainContent>
            <HeroText id="banner-heading">
              Learn locally
            </HeroText>
            <SubText>
              Book unique classes & workshops near you. Instantly.
            </SubText>

            
            {/* SWAP: Fallback (SSR) vs Real Form (CSR) */}
            {isMounted ? <DesktopSearchForm /> : <DesktopFallback />}

            <HowItWorksButton onClick={scrollToHowItWorks}>
              How ClassEasily works <ChevronDown size={16} />
            </HowItWorksButton>

          </MainContent>
        </MainWrapper>
      </DesktopContainer>

      <MobileContainer>
        <HeroTextMobile>Learn locally</HeroTextMobile>
        <SubTextMobile>Discover unique classes & workshops near you.</SubTextMobile>

        {/* SWAP: Fallback (SSR) vs Real Pill (CSR) */}
        {isMounted ? <MobileSearchPill /> : <MobileFallback />}
      </MobileContainer>

      {/* NEW: Bottom Trust Strip */}
      <BottomTrustBanner />
    </Banner>
  );
};

export default BannerSearch;