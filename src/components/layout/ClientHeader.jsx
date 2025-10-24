"use client";

// src/components/explore/ExploreHeader.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// CRITICAL: Only defer CustomUserMenu, not the entire header
// This allows the header to render immediately while menu waits for auth state
const CustomUserMenu = dynamic(
  () => import("@/components/header/CustomUserMenu.jsx"),
  {
    ssr: false,
    loading: () => null, // Return null during loading so button is visible
  }
);
import {
  Menu,
  MapPin,
  Search as SearchIcon,
  X,
  Users,
  CalendarDays,
} from "lucide-react";
import styled, { createGlobalStyle } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const UserAvatar = dynamic(() => import("@/components/common/UserAvatar"), {
  ssr: false,
  loading: () => (
    <img
      src="/icons/explore/user-circle.svg"
      alt="User"
      style={{ width: "28px", height: "28px", borderRadius: "50%" }}
    />
  ),
});
const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  DatePicker,
  AutoComplete,
  ConfigProvider,
  Select as AntdSelect,
  Spin,
} from "antd";
import message from "@/lib/message";
import dayjs from "dayjs";
const SettingsModal = dynamic(
  () => import("@/components/header/SettingsDrawer"),
  {
    ssr: false,
    // Optional: Add a loading component while the drawer is being loaded on the client
    loading: () => <p>Loading...</p>,
  }
);
import debounce from "lodash/debounce";
import { theme as exploreHeaderTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

// AWS Lambda endpoint for address search
const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// Data for suggested destinations, replaced with BannerSearch data
const suggestedAreas = [
  {
    name: "Toronto, ON",
    description: "Popular area",
    coords: { lat: 43.6532, lng: -79.3832 },
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/luvlauio.json"
        trigger="in"
        delay="1500"
        state="in-reveal"
        colors="primary:#3a3347,secondary:#e4e4e4,tertiary:#ffc738"
        style={{ width: 50, height: 50 }}
      />
    ),
    iconBg: "#DBEAFE",
    provinceSlug: "ontario",
    citySlug: "toronto",
  },
  {
    name: "Hamilton, ON",
    description: "Popular area",
    coords: { lat: 43.2557, lng: -79.8711 },
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/bpmglzll.json"
        trigger="in"
        delay="1500"
        state="in-reveal"
        colors="primary:#ee6d66,secondary:#ee6d66,tertiary:#b26836,quaternary:#e4e4e4,quinary:#646e78,senary:#e4e4e4"
        style={{ width: 50, height: 40 }}
      />
    ),
    iconBg: "#D1FAE5",
    provinceSlug: "ontario",
    citySlug: "hamilton",
  },
  {
    name: "Mississauga, ON",
    description: "Growing area",
    coords: { lat: 45.4215, lng: -75.6972 },
    icon: (
      <LordIcon
        src="https://cdn.lordicon.com/bpmglzll.json"
        trigger="in"
        delay="1500"
        state="in-reveal"
        colors="primary:#ee6d66,secondary:#ee6d66,tertiary:#b26836,quaternary:#e4e4e4,quinary:#646e78,senary:#e4e4e4"
        style={{ width: 50, height: 40 }}
      />
    ),
    iconBg: "#F3F4F6",
    provinceSlug: "ontario",
    citySlug: "ottawa",
  },
];

const provinceMap = {
  on: "ontario",
  bc: "british-columbia",
  qc: "quebec",
  ab: "alberta",
  mb: "manitoba",
  sk: "saskatchewan",
  ns: "nova-scotia",
  nb: "new-brunswick",
  nl: "newfoundland-and-labrador",
  pe: "prince-edward-island",
};

const provinceNameMap = {
  ON: "Ontario",
  BC: "British Columbia",
  QC: "Quebec",
  AB: "Alberta",
  MB: "Manitoba",
  SK: "Saskatchewan",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  PE: "Prince Edward Island",
  YT: "Yukon",
  NT: "Northwest Territories",
  NU: "Nunavut",
  // Add reverse mappings for consistency
  Ontario: "Ontario",
  "British Columbia": "British Columbia",
  Quebec: "Quebec",
  Alberta: "Alberta",
  Manitoba: "Manitoba",
  Saskatchewan: "Saskatchewan",
  "Nova Scotia": "Nova Scotia",
  "New Brunswick": "New Brunswick",
  "Newfoundland and Labrador": "Newfoundland and Labrador",
  "Prince Edward Island": "Prince Edward Island",
  Yukon: "Yukon",
  "Northwest Territories": "Northwest Territories",
  Nunavut: "Nunavut",
};

const CustomDropdownStyles = createGlobalStyle`
  /* --- GENERAL & DESKTOP STYLES --- */
  .explore-header-location-search-dropdown.ant-select-dropdown,
  .ant-picker-dropdown {
    transform: translateZ(0); /* Hardware acceleration hint */
    -webkit-font-smoothing: subpixel-antialiased;
    z-index: 1052 !important; /* Higher than modal overlay (1050) */
  }

  .explore-header-location-search-dropdown {
    min-width: 400px !important;
    max-width: 90vw !important;
    border-radius: 16px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid #e5e7eb !important;
    /* Use padding on the overall dropdown to create consistent outer spacing */
    padding: 8px !important;
    

    
    .ant-select-item-group { 
      font-weight: 700;
      font-size: 13px;
      color: #374151; 
      padding: 12px 12px 8px 12px; /* Adjusted padding */
      margin: 0;
      
      background: transparent !important; /* Title should not have a background */
      border: none !important; /* Title should not have a border */
      text-transform: uppercase;
      letter-spacing: 0.5px;
      /* FIX: Make title completely non-interactive */
      pointer-events: none !important; 
      cursor: default !important;
    }
    
    .ant-select-item {
      padding: 0 !important;
      border-radius: 12px !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: 1px solid transparent !important;
      
      /* The group title is a sibling, not a parent, so this hover does not apply to it */
      &:hover {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        border-color: #e2e8f0 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
      }
      
      &.ant-select-item-option-selected {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
        border-color: #3b82f6 !important;
        
        .option-primary-text {
          color: #1d4ed8 !important;
          font-weight: 600 !important;
        }
      }
    }
  }

  /* Loading container styling */
  .dropdown-loader-container {
    padding: 24px 20px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    min-height: 80px !important;
    background: #fafafa !important;
    border-radius: 12px !important;
    margin: 8px 4px !important; /* Adjusted horizontal margin */
  }
  
  .dropdown-no-results {
    padding: 24px 20px !important;
    text-align: center !important;
    color: #6b7280 !important;
    font-size: 14px !important;
    border-radius: 12px !important;
    margin: 8px 4px !important; /* Adjusted horizontal margin */
  }

  /* --- MOBILE DROPDOWN OVERLAYS --- */
  @media (max-width: 768px) {
    /* Mobile AutoComplete Dropdown */
    .explore-header-location-search-dropdown.ant-select-dropdown {
      position: fixed !important;
      left: 2.5vw !important;
      right: 2.5vw !important;
      width: 95vw !important;
      max-width: 95vw !important;
      transform: none !important;
      top: auto !important;
      bottom: 20vh !important; /* Position above keyboard area */
      border-radius: 12px !important;
      box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.2) !important;
      max-height: 45vh !important;
      overflow-y: auto !important;
    }

    /* Mobile DatePicker Calendar */
    .ant-picker-dropdown {
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 95vw !important;
      max-width: 400px !important;
      position: fixed !important;
      
      /* Reset any container-specific positioning */
      bottom: auto !important;
      right: auto !important;
      margin: 0 !important;
      
      .ant-picker-panel-container {
        width: 100% !important;
        box-shadow: none !important;
      }
       .ant-picker-panel { width: 100% !important; }
       .ant-picker-content, .ant-picker-body { width: 100% !important; }
    }
  }
  
  /* Font fix for mobile inputs to prevent zoom */
  @media (max-width: 768px) {
    .ant-select-selection-item,
    .ant-select-selection-placeholder,
    .ant-picker-input > input,
    .ant-select-selection-search-input {
      font-size: 16px !important;
      font-family: "Proxima Soft", sans-serif !important;
    }
     .ant-picker-input > input::placeholder {
       font-size: 16px !important;
       font-family: "Proxima Soft", sans-serif !important;
     }
  }
`;

const StyledMobileDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1050;
`;

const StyledMobileDrawerContent = styled(Drawer.Content)`
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
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

const MobileSearchHeader = styled.div`
  position: relative;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MobileSearchTitle = styled.h2`
  font-family: "Proxima Soft", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
`;

const CloseButton = styled.button`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const MobileSearchContent = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex-grow: 1;
`;

const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionLabel = styled.label`
  font-family: "Proxima Soft", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  padding-left: 4px;
`;

const InputContainer = styled.div`
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 18px;
  &:focus-within {
    border-color: #ff385c;
    background: white;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
  }
  .ant-select,
  .ant-picker {
    width: 100%;
    height: 100%;
  }
  .ant-select-selector,
  .ant-picker {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 0 0 12px !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
  }
  .ant-picker-input {
    position: relative;
  }

  /* Mobile DatePicker Fade Logic */
  &.mobile-date-picker-container:focus-within
    .ant-picker-input:has(.ant-picker-clear:not(:hidden))::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 60px;
    background: linear-gradient(to right, hsla(0, 100%, 100%, 0), white 50%);
    pointer-events: none;
    z-index: 1;
  }

  &.mobile-date-picker-container .ant-picker-clear {
    z-index: 2;
    background: white;
    border-radius: 50%;
  }
`;

const SearchButtonContainer = styled.div`
  padding: 16px 24px 24px;
  margin-top: auto;
  background: white;
  border-top: 1px solid #f0f0f0;
`;

const EnhancedSearchButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #ff385c 0%, #e91e63 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: "Proxima Soft", sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.3);
  min-height: 56px;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 56, 92, 0.4);
    background: linear-gradient(135deg, #e91e63 0%, #ff385c 100%);
  }
  &:disabled {
    background: #e0e0e0;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const InputIcon = styled.div`
  color: #717171;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// STYLED COMPONENTS REPLACED WITH BannerSearch VERSIONS
const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  min-width: 52px;
  border-radius: 12px;
  transition: all 0.2s ease;
`;

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px !important;
  cursor: pointer;
  width: 100%;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover ${IconWrapper} {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  gap: 2px;
`;

const PrimaryText = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  font-size: 15px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: "Proxima Soft", sans-serif;
  transition: color 0.2s ease;
`;

const SecondaryText = styled.div`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: "Proxima Soft", sans-serif;
  font-weight: 500;
`;

const HeaderWrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #bababa;
  background-color: #fff;
  border-bottom: 1px solid #f1f1f1;
  position: ${({ isFixed }) => (isFixed ? "sticky" : "relative")};
  top: ${({ isFixed }) => (isFixed ? "0" : "auto")};
  height: 80px;
  padding: 0 2rem;
  transition: background-color 0.3s, border-bottom 0.3s;
  z-index: 98;
  @media (max-width: 768px) {
    height: 60px;
    padding: 0 1rem;
    z-index: 99;
    gap: 0.5rem;
  }
`;

const Selection = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  @media (max-width: 768px) {
    padding-left: 0;
    flex-shrink: 0;
  }
`;

const StyledAutoComplete = styled(AutoComplete)`
  width: 100%;
  .ant-select-selector {
    padding-right: 10px !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    display: flex;
    align-items: center;
    height: 100%;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder,
  .ant-select-selection-search-input {
    /* Ensure all text states (placeholder, selected, and input) share the same base styles */
    font-family: "Proxima Soft", sans-serif !important;
    font-size: 13px !important;
  }
  .ant-select-selection-placeholder {
    color: #595959 !important;
  }
  .ant-select-selection-item,
  .ant-select-selection-search-input {
    /* Set a darker color for typed or selected text for readability */
    color: #1a1a1a !important;
  }
`;

const StyledCalendar = styled(DatePicker)`
  width: 100%;
  padding-bottom: 6px;
  .ant-picker-input {
    display: flex;
    align-items: center;
    height: 100%;
  }
  .ant-picker-input > input {
    font-family: "Proxima Soft", sans-serif;
    font-size: 13px;
    color: #1a1a1a; /* Dark color for the selected date */

    &::placeholder {
      color: #595959; /* Lighter color for placeholder text */
    }
  }

  /* Hide the clear (X) button to prevent it from overlapping the date text */
  .ant-picker-clear {
    display: none !important;
  }
`;

const StyledSelect = styled(AntdSelect)`
  width: 100%;
  .ant-select-selector {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    display: flex;
    align-items: center;
  }

  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    font-family: "Proxima Soft", sans-serif;
    font-size: 13px;
  }

  .ant-select-selection-placeholder {
    color: #595959;
  }

  .ant-select-selection-item {
    color: #1a1a1a !important; /* Dark color for the selected item */
  }
`;

// ACCESSIBILITY FIX: Changed from a div to a semantic button to match its ARIA role.
const RoundedButton = styled(motion.button)`
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 30px;
  background-color: transparent;
  cursor: pointer;
  overflow: hidden;
  color: #000;
  gap: 0.5rem;
  margin-left: 1rem;
  padding-left: 1rem;
  transition: box-shadow 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  img.user-placeholder-icon {
    width: 32px;
    height: 32px;
  }
`;

const SearchButton = styled(RoundedButton)`
  background-color: #ff385c;
  border: 1px solid #ff385c;
  border-radius: 50%;
  padding: 8px;
  transition: all 0.3s ease;
  margin-left: 0;
  padding-left: 8px;
  gap: 0;
  &:hover {
    background-color: rgb(255, 80, 112);
    border: 1px solid rgb(255, 80, 112);
    transform: scale(1.05) translateZ(0);
    box-shadow: none;
  }
`;

const OptionsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 550px;
  gap: 0.5rem;
  padding: 0.3rem 0.3rem;
  border-radius: 40px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  @media (max-width: 768px) {
    display: none;
  }
`;

const Option = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  height: 40px;
  justify-content: flex-start;
  gap: 0.5rem;
  padding: 0 0.5rem;
  border-radius: 30px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  &.location-option {
    flex: 2;
    min-width: 0;
  }
  &.date-option,
  &.participants-option {
    flex: 1.5;
  }
  &:not(:last-child):after {
    content: "";
    position: absolute;
    top: 50%;
    right: -4px;
    height: 24px;
    transform: translateY(-50%);
    border-right: 1px solid #e8e8e8;
  }
  > svg,
  > img {
    width: 20px;
    height: 20px;
    opacity: 0.7;
    color: #595959;
    flex-shrink: 0;
  }

  /* Desktop DatePicker Fade Logic */
  &.date-option:hover
    .ant-picker-input:has(.ant-picker-clear:not(:hidden))::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 60px;
    background: linear-gradient(to right, hsla(0, 0%, 96%, 0) 0%, #f5f5f5 50%);
    pointer-events: none;
    z-index: 1;
  }

  &.date-option .ant-picker-clear {
    z-index: 2;
    background: #f5f5f5;
    border-radius: 50%;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding-right: 1rem;

  /* Add this to control logo size */
  svg {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 768px) {
    padding-right: 0.5rem;
    flex-shrink: 0;

    svg {
      width: 32px; /* Smaller on mobile */
      height: 32px;
    }
  }
`;

const MobileSearchTrigger = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 40px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    flex: 1;
    min-width: 0;

    p {
      margin: 0;
      font-size: 14px;
      color: #595959;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    > svg {
      flex-shrink: 0;
    }
  }
`;

const PARTICIPANT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} ${i > 0 ? "people" : "person"}`,
}));

const MobileSearchModal = ({
  onClose,
  searchTerm,
  locationOptions,
  handleLocationSelect,
  handleLocationChange,
  geocoding,
  datePickerValue,
  handleDatePickerChange,
  participants,
  setParticipants,
  handleSearch,
  hasValidLocationSelection,
}) => (
  <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
    <Drawer.Portal>
      <StyledMobileDrawerOverlay />
      <StyledMobileDrawerContent>
        <DrawerHandle />

        <MobileSearchHeader>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
          <MobileSearchTitle>Edit your search</MobileSearchTitle>
        </MobileSearchHeader>

        <MobileSearchContent>
          {/* Location Search Section */}
          <SearchSection>
            <SectionLabel htmlFor="mobile-location-search">Where?</SectionLabel>
            <InputContainer>
              <InputIcon>
                <MapPin size={20} />
              </InputIcon>
              <AutoComplete
                id="mobile-location-search"
                variant="borderless"
                value={searchTerm}
                options={locationOptions}
                onSelect={handleLocationSelect}
                onChange={handleLocationChange}
                filterOption={false}
                placeholder="City or address"
                popupClassName="explore-header-location-search-dropdown"
                notFoundContent={
                  geocoding ? (
                    <div className="dropdown-loader-container">
                      <GlobalLoaderWithoutInlineStyles />
                    </div>
                  ) : searchTerm &&
                    !locationOptions.some(
                      (group) => group.options?.length > 0
                    ) ? (
                    <div className="dropdown-no-results">
                      No results found for "{searchTerm}"
                    </div>
                  ) : null
                }
                style={{ paddingLeft: 0 }}
              />
            </InputContainer>
          </SearchSection>

          {/* Date Section */}
          <SearchSection>
            <SectionLabel htmlFor="mobile-date-picker">When?</SectionLabel>
            <InputContainer className="mobile-date-picker-container">
              <InputIcon>
                <CalendarDays size={20} />
              </InputIcon>
              <DatePicker
                id="mobile-date-picker"
                variant="borderless"
                suffixIcon={null}
                allowClear={true}
                value={datePickerValue}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                onChange={handleDatePickerChange}
                placeholder="Whenever"
              />
            </InputContainer>
          </SearchSection>

          {/* Participants Section */}
          <SearchSection>
            <SectionLabel htmlFor="mobile-participants-select">
              Who?
            </SectionLabel>
            <InputContainer>
              <InputIcon>
                <Users size={20} />
              </InputIcon>
              <AntdSelect
                id="mobile-participants-select"
                variant="borderless"
                value={participants}
                onChange={setParticipants}
                options={PARTICIPANT_OPTIONS}
                placeholder="How many people?"
              />
            </InputContainer>
          </SearchSection>
        </MobileSearchContent>

        <SearchButtonContainer>
          <EnhancedSearchButton
            onClick={handleSearch}
            disabled={!hasValidLocationSelection}
          >
            <SearchIcon size={20} />
            Search
          </EnhancedSearchButton>
        </SearchButtonContainer>
      </StyledMobileDrawerContent>
    </Drawer.Portal>
  </Drawer.Root>
);

const createLocationPathFromDisplayName = (displayName) => {
  if (!displayName) return "";
  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  const parts = displayName.split(",").map((part) => part.trim());

  if (parts.length >= 2) {
    const city = slugify(parts[0]);
    const provinceAbbr = parts[1].toLowerCase();
    const province = provinceMap[provinceAbbr] || slugify(parts[1]);
    return `/${province}/${city}`;
  } else if (parts.length === 1) {
    const potentialProvinceSlug = slugify(parts[0]);
    const isProvince =
      Object.values(provinceMap).includes(potentialProvinceSlug) ||
      Object.keys(provinceMap).includes(potentialProvinceSlug);
    if (isProvince) {
      return `/${provinceMap[potentialProvinceSlug] || potentialProvinceSlug}`;
    }
    const city = slugify(parts[0]);
    return `/${city}`;
  }
  return "";
};

const formatDisplayName = (nameOrSlug) => {
  if (!nameOrSlug) return "";

  // FIX: Replaced the faulty regex `/\b\w/g` with a safer method that
  // correctly capitalizes words from slugs (e.g., 'arts-and-crafts') without
  // mangling names with special characters (e.g., 'L'Ange-Gardien').
  const unslugged = nameOrSlug
    .replace(/-/g, " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

  const parts = unslugged.split(",").map((p) => p.trim());

  const formattedParts = parts.map((part) => {
    // Check against the province map for full names or abbreviations.
    const upperPart = part.toUpperCase();
    return provinceNameMap[upperPart] || part;
  });

  return formattedParts.join(", ");
};

function ExploreHeaderContent({ showOptionsWrapper = true, isFixed = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user: currentUser } = useAuthUser();
  const menuTriggerRef = useRef(null);

  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    displayName: "",
    coordinates: null,
    citySlug: null,
    provinceSlug: null,
  });
  const [hasValidLocationSelection, setHasValidLocationSelection] =
    useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedAddressResults, setGeocodedAddressResults] = useState([]);

  useEffect(() => {
    const locParam = searchParams.get("location");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const dateParam = searchParams.get("date");
    const participantsParam = searchParams.get("participants");

    if (locParam) {
      const formattedLocation = formatDisplayName(locParam);
      setSearchTerm(formattedLocation);

      if (latParam && lngParam) {
        setSelectedLocation({
          displayName: locParam,
          formattedDisplayName: formattedLocation,
          coordinates: { lat: parseFloat(latParam), lng: parseFloat(lngParam) },
          citySlug: null,
          provinceSlug: null,
        });
        setHasValidLocationSelection(true);
      }
    } else {
      // Logic to populate search from URL path slugs
      // This part now uses pathname directly instead of a complex params object
      const segments = pathname.split("/").filter(Boolean);
      let province, city, identifier;
      if (segments[0] === "explore" && segments[1] !== "category") {
        if (segments.length === 2) identifier = segments[1];
        if (segments.length >= 3) {
          province = segments[1];
          city = segments[2];
        }
      }

      let displayParts = [];
      if (city) {
        displayParts.push(formatDisplayName(city));
      } else if (identifier) {
        displayParts.push(formatDisplayName(identifier));
      }
      if (province) {
        displayParts.push(formatDisplayName(province));
      }
      const display = displayParts.join(", ");

      if (display) {
        setSearchTerm(display);
        setHasValidLocationSelection(true);
      } else {
        setSearchTerm("");
        setSelectedLocation({
          displayName: "",
          formattedDisplayName: "",
          coordinates: null,
          citySlug: null,
          provinceSlug: null,
        });
        setHasValidLocationSelection(false);
      }
    }

    if (dateParam) {
      const parsedDate = dayjs(dateParam);
      setDatePickerValue(parsedDate.isValid() ? parsedDate : null);
    } else {
      setDatePickerValue(null);
    }
    if (participantsParam) {
      const numParticipants = parseInt(participantsParam, 10);
      setParticipants(
        !isNaN(numParticipants) && numParticipants > 0 ? numParticipants : 1
      );
    }
  }, [searchParams, pathname]);

  const debouncedGeocodeTrigger = useCallback(
    debounce(async (addr) => {
      if (!addr || addr.length < 3) {
        setGeocodedAddressResults([]);
        return;
      }
      setGeocoding(true);
      try {
        const encodedAddress = encodeURIComponent(addr);
        const response = await fetch(
          `${AWS_LOCATION_API_URL}?text=${encodedAddress}`
        );
        if (!response.ok)
          throw new Error(`Geocoding request failed: ${response.status}`);
        const data = await response.json();

        const formattedResults = Array.isArray(data)
          ? data.map((result) => ({
              ...result,
              displayName: formatDisplayName(result.displayName),
            }))
          : [];

        setGeocodedAddressResults(formattedResults);
      } catch (error) {
        console.error("AWS Geocoding error:", error);
        message.error("Could not fetch addresses.");
        setGeocodedAddressResults([]);
      } finally {
        setGeocoding(false);
      }
    }, 300),
    []
  );

  const locationOptions = useMemo(() => {
    let options = [];

    if (searchTerm && geocodedAddressResults.length > 0) {
      options.push({
        label: "Search Results",
        options: geocodedAddressResults.map((result, index) => ({
          value: result.displayName,
          label: (
            <OptionContainer>
              <IconWrapper color="#f0f9ff">
                <LordIcon
                  src="https://cdn.lordicon.com/innuazqa.json"
                  trigger="in"
                  delay="1500"
                  state="in-reveal"
                  colors="primary:#545454"
                  style={{ width: 25, height: 25 }}
                />
              </IconWrapper>
              <OptionText>
                <PrimaryText className="option-primary-text">
                  {result.displayName}
                </PrimaryText>
                <SecondaryText>Search result</SecondaryText>
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
        options: suggestedAreas.map((dest, index) => ({
          value: dest.name,
          label: (
            <OptionContainer>
              {dest.icon}
              <OptionText>
                <PrimaryText className="option-primary-text">
                  {dest.name}
                </PrimaryText>
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

    return options;
  }, [searchTerm, geocodedAddressResults]);

  const handleLocationSelect = useCallback((value, option) => {
    const formattedValue = formatDisplayName(value);

    setSearchTerm(formattedValue);
    setGeocodedAddressResults([]);
    setHasValidLocationSelection(true);

    setSelectedLocation({
      displayName: value,
      formattedDisplayName: formattedValue,
      coordinates: option.coordinates,
      citySlug: option.citySlug,
      provinceSlug: option.provinceSlug,
    });
  }, []);

  const handleLocationChange = useCallback(
    (newValue) => {
      setSearchTerm(newValue);
      setHasValidLocationSelection(false);
      setSelectedLocation({
        displayName: "",
        coordinates: null,
        citySlug: null,
        provinceSlug: null,
      });
      if (newValue && newValue.length >= 3) {
        debouncedGeocodeTrigger(newValue);
      } else {
        setGeocodedAddressResults([]);
      }
    },
    [debouncedGeocodeTrigger]
  );

  const handleSearch = useCallback(() => {
    if (!hasValidLocationSelection) {
      message.warning("Please select a location to search.");
      return;
    }

    const { displayName, coordinates } = selectedLocation;

    const newParams = new URLSearchParams();

    searchParams.forEach((value, key) => {
      // Copy over existing params, but exclude old location ones
      if (
        ![
          "location",
          "lat",
          "lng",
          "date",
          "participants",
          "location_search",
        ].includes(key)
      ) {
        newParams.append(key, value);
      }
    });

    if (datePickerValue?.isValid()) {
      newParams.set("date", datePickerValue.format("YYYY-MM-DD"));
    }
    if (participants > 0) {
      newParams.set("participants", participants.toString());
    }

    if (displayName) {
      newParams.set("location", displayName);
    }
    if (coordinates) {
      newParams.set("lat", coordinates.lat.toString());
      newParams.set("lng", coordinates.lng.toString());
    }

    // CHANGED: Path generation is now ONLY for the location.
    // It no longer adds category/subcategory to the slug.
    const generatedPath = createLocationPathFromDisplayName(displayName);
    let newPath = `/explore${generatedPath}`;

    router.push(`${newPath}?${newParams.toString()}`);
    setIsMobileSearchVisible(false);
  }, [
    hasValidLocationSelection,
    selectedLocation,
    datePickerValue,
    participants,
    router,
    searchParams,
  ]);

  const handleDatePickerChange = (date) => setDatePickerValue(date);
  const handleNavigate = (path) => {
    router.push(path);
    setIsMenuOpen(false);
  };
  const handleShowSettings = () => {
    showSettingsDrawer();
    setIsMenuOpen(false);
  };
  const showSettingsDrawer = () => {
    setSettingsDrawerVisible(true);
    setSettingsLoading(true);
    setTimeout(() => setSettingsLoading(false), 1000);
  };
  const onCloseSettingsDrawer = () => setSettingsDrawerVisible(false);

  return (
    <>
      <CustomDropdownStyles />
      <HeaderWrapper isFixed={isFixed}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <LogoContainer>
            <LogoIcon size={"2.5rem"} restingColor="#ff385c" />
          </LogoContainer>
        </Link>
        <ConfigProvider theme={exploreHeaderTheme}>
          {showOptionsWrapper && (
            <>
              {/* This is the original desktop wrapper */}
              <OptionsWrapper>
                <Option className="location-option">
                  <MapPin />
                  <StyledAutoComplete
                    variant="borderless"
                    value={searchTerm}
                    options={locationOptions}
                    onSelect={handleLocationSelect}
                    onChange={handleLocationChange}
                    filterOption={false}
                    placeholder="City, or address"
                    popupClassName="explore-header-location-search-dropdown"
                    aria-label="Search location"
                    notFoundContent={
                      geocoding ? (
                        <div className="dropdown-loader-container">
                          <GlobalLoaderWithInlineStyles />
                        </div>
                      ) : searchTerm &&
                        !locationOptions.some(
                          (group) => group.options?.length > 0
                        ) ? (
                        <div className="dropdown-no-results">
                          No results found for "{searchTerm}"
                        </div>
                      ) : null
                    }
                  />
                </Option>
                <Option className="date-option">
                  <img src="/icons/explore/calender.svg" alt="Calendar Icon" />
                  <StyledCalendar
                    variant="borderless"
                    suffixIcon={null}
                    allowClear={true}
                    value={datePickerValue}
                    placeholder="Whenever"
                    aria-label="Date"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                    onChange={handleDatePickerChange}
                  />
                </Option>
                <Option className="participants-option">
                  <Users />
                  <StyledSelect
                    variant="borderless"
                    value={participants}
                    onChange={setParticipants}
                    aria-label="Participants"
                    options={PARTICIPANT_OPTIONS}
                  />
                </Option>
                <Option>
                  <SearchButton onClick={handleSearch}>
                    <img
                      src="/icons/explore/searchWhite.svg"
                      alt="Search Action"
                    />
                  </SearchButton>
                </Option>
              </OptionsWrapper>

              {/* The MobileSearchTrigger is now also included in the conditional render */}
              <MobileSearchTrigger
                onClick={() => setIsMobileSearchVisible(true)}
              >
                <SearchIcon size={20} color="#ff385c" />
                <p>{searchTerm || "Start your search"}</p>
              </MobileSearchTrigger>
            </>
          )}
        </ConfigProvider>
        <Selection>
          <div style={{ position: "relative" }}>
            <RoundedButton
              ref={menuTriggerRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              aria-label="User menu"
            >
              <Menu strokeWidth={2.5} size={18} style={{ color: "inherit" }} />
              {currentUser?.avatar_url ? (
                <UserAvatar size={28} />
              ) : (
                <img src="/icons/explore/user-circle.svg" alt="User Menu" />
              )}
            </RoundedButton>
            <CustomUserMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onNavigate={handleNavigate}
              onShowSettings={handleShowSettings}
              triggerRef={menuTriggerRef}
            />
          </div>
        </Selection>
      </HeaderWrapper>

      <AnimatePresence>
        {isMobileSearchVisible && (
          <ConfigProvider theme={exploreHeaderTheme}>
            <MobileSearchModal
              onClose={() => setIsMobileSearchVisible(false)}
              searchTerm={searchTerm}
              locationOptions={locationOptions}
              handleLocationSelect={handleLocationSelect}
              handleLocationChange={handleLocationChange}
              geocoding={geocoding}
              datePickerValue={datePickerValue}
              handleDatePickerChange={handleDatePickerChange}
              participants={participants}
              setParticipants={setParticipants}
              handleSearch={handleSearch}
              hasValidLocationSelection={hasValidLocationSelection}
            />
          </ConfigProvider>
        )}
      </AnimatePresence>

      <SettingsModal
        open={settingsDrawerVisible}
        onClose={onCloseSettingsDrawer}
        loading={settingsLoading}
      />
    </>
  );
}

// Export the content directly as this is now a client component
// Suspense is handled by the parent server component (ExploreHeader.jsx)
export default ExploreHeaderContent;
