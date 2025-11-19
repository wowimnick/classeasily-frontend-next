"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Typography, Select, DatePicker, AutoComplete } from "antd";
import {
  Search,
  CalendarSearch,
  Users,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import Image from "next/image";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { useSearch, SUGGESTED_AREAS } from "@/context/SearchContext";
import SearchDrawer from "@/components/common/SearchDrawer";

// --- GLOBAL STYLES (Desktop Specific) ---

const BannerSearchDropdownStyles = createGlobalStyle`
  /* Desktop Styles */
  .banner-search-location-dropdown.ant-select-dropdown,
  .banner-search-datepicker.ant-picker-dropdown {
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
  min-height: 85vh;
  background-color: #000;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 1088px) {
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

  @media (min-width: 1089px) {
    display: none;
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

  @media (max-width: 1088px) {
    display: none;
  }
`;

// --- DESKTOP COMPONENT STYLES ---

const DesktopContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  @media (max-width: 1088px) {
    display: none;
  }
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
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
  align-items: flex-start;
  justify-content: center;
  color: ${(props) => props.theme.token.colorHeaderText};
  z-index: 1;
  padding: 5rem 0;
`;

const HeroText = styled.h1`
  font-weight: 900;
  font-size: 6.5rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.1;
  color: inherit;
`;

const SubText = styled.p`
  margin: 0;
  margin-bottom: 3rem;
  font-size: 1.4rem;
  font-weight: 500;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  color: inherit;
`;

const InputsWrapper = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  gap: 0.4rem;
  z-index: 1;
`;

const ClippedBackground = styled.div`
  position: absolute;
  top: -5px;
  left: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 10px);
  background-color: ${(props) => props.theme.token.colorBgContainer};
  z-index: -1;
  border-radius: 10px;
  clip-path: path(
    "M 190,65 L 130,65 A 30,30 0 0,1 111,45 L 110,30 A 30,30 0 0,0 85,0 L 10,0 A 10,10 0 0,0 0,10 L 0,190 A 10,10 0 0,0 10,200 L 150,210 A 10,10 0 0,0 200,190 L 200,65 A 10,10 0 0,0 230,65 Z"
  );

  @supports not (clip-path: path("")) {
    border-radius: 30px;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

const ParticipantInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: fit-content;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem;
  padding-left: 1.8rem;
  top: 7px;
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 10rem;
  color: ${(props) => props.theme.token.colorText};
  z-index: 1;
  position: relative;
`;

const StyledParticipantSelect = styled(Select)`
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  background: transparent !important;
  top: 7px !important;
  min-width: 40px;
  color: ${(props) => props.theme.token.colorText} !important;

  .ant-select-selector {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    padding: 0 0 0 3px !important;
    height: 25px !important;
    padding-left: 9px !important;
    min-height: 25px !important;
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder} !important;
    border-radius: 0 !important;
    display: flex;
    align-items: center;
    font-size: 14px !important;
  }
`;

const SelectorsWrapper = styled.div`
  display: flex;
  justify-content: left;
  gap: 1rem;
  align-items: center;
  background: ${(props) => props.theme.token.colorBgContainer};
  width: fit-content;
  padding: 0.5rem;
  padding-right: 1rem;
  border-radius: 10rem;
  position: relative;
  z-index: 1;
`;

const LocationSearchWrapper = styled.div`
  flex-grow: 1;
`;

const LocationWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0.9rem;
  padding-left: 1.4rem;
  border-radius: 40px;
  background-color: #fff;
  color: #000;
  overflow: hidden;
  min-width: 220px;
  max-width: 220px;
  transition: 0.3s all;

  .ant-select {
    width: 100%;
    height: 25px !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
    border-radius: 0 !important;
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder} !important;

    &.ant-select-focused,
    &:focus-within {
      border-bottom-color: ${(props) => props.theme.token.colorPrimary} !important;
    }

    .ant-select-selector {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  }
`;

const DateAndSearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border-left: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  padding-left: 0.7rem;
`;

const DatePickerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.7rem;
  border-radius: 10rem;
  background: ${(props) => props.theme.token.colorBgContainer};
  padding: 1rem;
  width: auto;
`;

const DatePickerInputArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;

  .ant-picker {
    padding-left: 2px !important;
    border-radius: 0rem !important;
    height: 25px !important;
    width: 120px !important;
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder} !important;
  }

  .ant-picker-input > input {
    height: 23px !important;
    padding-bottom: 2px;
    color: ${(props) => props.theme.token.colorText} !important;
    font-size: 14px;
  }
`;

const DatePickerLabel = styled(Typography.Text)`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${(props) => props.theme.token.colorTextPrimary};
  margin-bottom: -2px;
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
  scale: 1.3;
  margin-left: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
  border: none;
  outline: none;

  &:hover {
    scale: 1.35;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ButtonText = styled.div`
  display: flex;
  justify-content: space-between;
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
  
  @media (max-width: 1088px) {
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
  font-family: 'Proxima Soft', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PillSubtext = styled.div`
  font-family: 'Proxima Soft', sans-serif;
  font-size: 13px;
  color: #717171;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const participantOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: i === 0 ? "1 Person" : i === 9 ? "10+ People" : `${i + 1} People`,
}));

const BLACK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const BannerSearch = () => {
  const router = useRouter();
  const { 
    // We primarily use the context for Mobile Drawer sync and triggering.
    // For desktop, we can use local state or shared state. 
    // To keep the desktop form feeling responsive and independent until search, 
    // we will use the context hook methods for the drawer, but duplicate logic for the desktop inline form to keep it cleanly separated as requested in strict refactorings, 
    // OR we can wire the desktop form to the context.
    // Given the requirement "Ensure state is maintained between them", we will sync the desktop inputs to the context on change.
    searchTerm, setSearchTerm,
    datePickerValue, setDatePickerValue,
    participantCount, setParticipantCount,
    geocoding, geocodedAddressResults,
    handleLocationChange, handleLocationSelect,
    performSearch, setIsDrawerOpen
  } = useSearch();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAntdReady, setIsAntdReady] = useState(false);
  
  // Computed options for Desktop AutoComplete (duplicating the logic from context/drawer for the inline display)
  // In a deeper refactor, we'd export this generator from context too, but here we'll just access what we have.
  const [locationOptions, setLocationOptions] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    setIsAntdReady(true);
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 1088);
    checkIsMobile();
    
    window.addEventListener("resize", checkIsMobile);
    return () => {
        window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

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

  // Helper for mobile pill label (Reading from Shared Context)
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
    <Banner aria-labelledby="banner-heading">
      <BannerSearchDropdownStyles />
      <SearchDrawer />

      {isMounted && isMobile && (
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
      )}

      {isMounted && !isMobile && (
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
      )}

      {/* --- DESKTOP LAYOUT --- */}
      {!isMobile && (
        <DesktopContainer>
            <MainWrapper>
                <MainContent>
                <HeroText id="banner-heading">
                    Learn locally
                </HeroText>
                <SubText>
                    Explore What Ignites Your Mind. Discover Countless Local Classes &
                    Workshops.
                </SubText>
                {isAntdReady ? (
                    <InputsWrapper onSubmit={handleDesktopSubmit}>
                    <ClippedBackground />
                    <ParticipantInputContainer>
                        <Users size={20} color="#000" aria-hidden="true" />
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

                    <SelectorsWrapper>
                        <LocationSearchWrapper>
                        <LocationWrapper>
                            <MapPin
                            style={{
                                marginRight: "0.5rem",
                                marginTop: "0.5rem",
                                flexShrink: 0,
                            }}
                            color="black"
                            size={25}
                            />
                            <div style={{ width: "100%" }}>
                            <ButtonText>
                                <Typography.Text
                                style={{ fontSize: "0.9rem", fontWeight: "700" }}
                                >
                                Location
                                </Typography.Text>
                            </ButtonText>
                            <AutoComplete
                                value={searchTerm}
                                options={locationOptions}
                                onSelect={handleLocationSelect}
                                onChange={handleLocationChange}
                                filterOption={false}
                                style={{
                                width: "100%",
                                height: "25px",
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
                                placeholder="City or address"
                                style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    fontSize: "14px",
                                    color: "inherit",
                                    fontFamily: "inherit",
                                    outline: "none",
                                    padding: "0",
                                }}
                                />
                            </AutoComplete>
                            </div>
                        </LocationWrapper>
                        </LocationSearchWrapper>

                        <DateAndSearchWrapper>
                        <DatePickerWrapper>
                            <CalendarSearch color="#000" size={20} aria-hidden="true" />
                            <DatePickerInputArea>
                            <DatePickerLabel htmlFor="date-picker">
                                Date
                            </DatePickerLabel>
                            <DatePicker
                                id="date-picker"
                                name="date-picker"
                                variant="borderless"
                                placeholder="Whenever"
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

                        <RoundedSearchButton
                            type="submit"
                            aria-label="Search classes"
                        >
                            <Search size={20} />
                        </RoundedSearchButton>
                        </DateAndSearchWrapper>
                    </SelectorsWrapper>
                    </InputsWrapper>
                ) : (
                    <div style={{ height: "56px" }}></div>
                )}
                </MainContent>
            </MainWrapper>
        </DesktopContainer>
      )}

      {/* --- MOBILE CONTENT (Improved Layout) --- */}
      {isMobile && (
        <>
            <MobileContainer>
                <HeroTextMobile>Learn locally</HeroTextMobile>
                <SubTextMobile>Discover unique classes & workshops near you.</SubTextMobile>
                
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
            </MobileContainer>
        </>
      )}
    </Banner>
  );
};

export default BannerSearch;