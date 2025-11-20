"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
const CustomUserMenu = dynamic(
  () => import("@/components/header/CustomUserMenu.jsx"),
  {
    ssr: false,
    loading: () => null,
  }
);
import {
  Menu,
  MapPin,
  Search as SearchIcon,
  Users,
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
} from "antd";
import dayjs from "dayjs";
const SettingsModal = dynamic(
  () => import("@/components/header/SettingsDrawer"),
  {
    ssr: false,
  }
);
import { theme as exploreHeaderTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
} from "@/components/common/GlobalLoader";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";
import SearchDrawer from "@/components/common/SearchDrawer";
import { LordIcon } from "@/services/ReactUtils";

// --- STYLES ---

const CustomDropdownStyles = createGlobalStyle`
  /* --- GENERAL & DESKTOP STYLES --- */
  .explore-header-location-search-dropdown.ant-select-dropdown,
  .ant-picker-dropdown {
    transform: translateZ(0);
    -webkit-font-smoothing: subpixel-antialiased;
    z-index: 1052 !important;
  }

  .explore-header-location-search-dropdown {
    min-width: 400px !important;
    max-width: 90vw !important;
    border-radius: 16px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid #e5e7eb !important;
    padding: 8px !important;

    .ant-select-item-group { 
      font-weight: 700;
      font-size: 13px;
      color: #374151; 
      padding: 12px 12px 8px 12px; 
      margin: 0;
      background: transparent !important; 
      border: none !important; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
      pointer-events: none !important; 
      cursor: default !important;
    }
    
    .ant-select-item {
      padding: 0 !important;
      border-radius: 12px !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: 1px solid transparent !important;
      
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

  .dropdown-loader-container {
    padding: 24px 20px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    min-height: 80px !important;
    background: #fafafa !important;
    border-radius: 12px !important;
    margin: 8px 4px !important;
  }
  
  .dropdown-no-results {
    padding: 24px 20px !important;
    text-align: center !important;
    color: #6b7280 !important;
    font-size: 14px !important;
    border-radius: 12px !important;
    margin: 8px 4px !important;
  }

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

// --- OTHER COMPONENT STYLES ---

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
    font-family: "Proxima Soft", sans-serif !important;
    font-size: 13px !important;
  }
  .ant-select-selection-placeholder {
    color: #595959 !important;
  }
  .ant-select-selection-item,
  .ant-select-selection-search-input {
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
    color: #1a1a1a; 

    &::placeholder {
      color: #595959; 
    }
  }
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
    color: #1a1a1a !important; 
  }
`;

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
  label: i + 1 === 10 ? "10+ People" : `${i + 1} ${i === 0 ? 'Person' : 'People'}`,
}));

const formatDisplayName = (nameOrSlug) => {
  if (!nameOrSlug) return "";
  const unslugged = nameOrSlug
    .replace(/-/g, " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  return unslugged; // Simplified for shared component usage
};

function ExploreHeaderContent({ showOptionsWrapper = true, isFixed = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthUser();
  const menuTriggerRef = useRef(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mount tracking for Antd hydration
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    searchTerm, setSearchTerm,
    datePickerValue, setDatePickerValue,
    participantCount, setParticipantCount,
    geocoding, geocodedAddressResults,
    handleLocationChange, handleLocationSelect,
    performSearch, setIsDrawerOpen,
    setSelectedLocation
  } = useSearch();

  // --- SYNC URL PARAMS TO SHARED STATE ---
  useEffect(() => {
    const locParam = searchParams.get("location");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const dateParam = searchParams.get("date");
    const participantsParam = searchParams.get("participants");

    if (locParam) {
      setSearchTerm(locParam);
      if (latParam && lngParam) {
        setSelectedLocation({
          displayName: locParam,
          coordinates: { lat: parseFloat(latParam), lng: parseFloat(lngParam) },
          citySlug: null,
          provinceSlug: null,
        });
      }
    } else {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 1 && segments[0] === 'explore') {
        // Not fully parsing slugs here for brevity
      }
    }

    if (dateParam) {
      const parsedDate = dayjs(dateParam);
      setDatePickerValue(parsedDate.isValid() ? parsedDate : null);
    }
    if (participantsParam) {
      const numParticipants = parseInt(participantsParam, 10);
      setParticipantCount(!isNaN(numParticipants) && numParticipants > 0 ? numParticipants : 1);
    }
  }, [searchParams, pathname, setSearchTerm, setDatePickerValue, setParticipantCount, setSelectedLocation]);

  // Compute options for Desktop AutoComplete
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
        options: SUGGESTED_AREAS.map((dest, index) => ({
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

  const handleNavigate = (path) => {
    setIsMenuOpen(false);
    setSettingsDrawerVisible(false);
    setTimeout(() => {
      router.push(path);
    }, 100);
  };

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
              {/* Desktop Search Bar - Hidden until mounted */}
              <OptionsWrapper style={{ visibility: isMounted ? "visible" : "hidden" }}>
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
                    onChange={setDatePickerValue}
                  />
                </Option>
                <Option className="participants-option">
                  <Users />
                  <StyledSelect
                    variant="borderless"
                    value={participantCount}
                    onChange={setParticipantCount}
                    aria-label="Participants"
                    options={PARTICIPANT_OPTIONS}
                  />
                </Option>
                <Option>
                  <SearchButton onClick={performSearch}>
                    <img
                      src="/icons/explore/searchWhite.svg"
                      alt="Search Action"
                    />
                  </SearchButton>
                </Option>
              </OptionsWrapper>

              {/* Mobile Trigger - Hidden until mounted */}
              <MobileSearchTrigger
                onClick={() => setIsDrawerOpen(true)}
                style={{ visibility: isMounted ? "visible" : "hidden" }}
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
              onShowSettings={() => { setIsMenuOpen(false); setSettingsDrawerVisible(true); }}
              triggerRef={menuTriggerRef}
            />
          </div>
        </Selection>
      </HeaderWrapper>

      <SettingsModal
        open={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
        loading={settingsLoading}
      />
    </>
  );
}

export default ExploreHeaderContent;