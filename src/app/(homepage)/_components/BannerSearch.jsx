"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { Typography, Select, DatePicker, AutoComplete } from 'antd';
import message from '@/lib/message';
import { Search, CalendarSearch, Users, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import Image from "next/image";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

// AWS Lambda endpoint URL for address search
const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// Province map
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

// Helper function to parse display names into URL slugs
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
    const city = slugify(parts[0]);
    return `/${city}`;
  }
  return "";
};

// Styled Components (keeping all your existing styled components)
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
    height: 25px !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
    border-radius: 0 !important;
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder} !important;

    &.ant-select-focused,
    &:focus-within {
      border-bottom-color: ${(props) =>
        props.theme.token.colorPrimary} !important;
    }

    .ant-select-selector {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  }

  @media (max-width: 1084px) {
    padding-right: 0.5rem;
  }

  @media (max-width: 556px) {
    padding-left: 0.9rem;
    min-width: 100%;
    max-width: 100%;
  }
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

const ButtonText = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Banner = styled.section`
  display: flex;
  position: relative;
  min-height: 85vh;
  background-color: #000;
  background-size: cover;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 1088px) {
    padding-top: 10rem;
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
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
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

const BLACK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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

  @media (max-width: 1088px) {
    flex-direction: column;
    gap: 2rem;
    padding: 0 1rem;
    text-align: center;
    justify-content: center;
    padding-top: 5rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  color: ${(props) => props.theme.token.colorHeaderText};
  z-index: 1;
  width: ${(props) => (props.$isMobile ? "100%" : "auto")};
  padding: ${(props) => (props.$isMobile ? "2rem 0" : "5rem 0")};

  @media (max-width: 1088px) {
    justify-content: center;
    align-items: center;
  }
`;

const HeroText = styled.h1`
  font-weight: 900;
  font-size: ${(props) => (props.$isMobile ? "2.8rem" : "6.5rem")};
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.1;
  color: inherit;

  @media (max-width: 480px) {
    font-size: 2.2rem;
  }
`;

const SubText = styled.p`
  margin: 0;
  margin-bottom: 3rem;
  font-size: ${(props) => (props.$isMobile ? "1.1rem" : "1.4rem")};
  font-weight: 500;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  color: inherit;

  @media (max-width: 1088px) {
    margin-bottom: 2rem;
  }
  @media (max-width: 480px) {
    font-size: 1rem;
  }
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

  @media (max-width: 556px) {
    justify-content: center;
  }
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

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }

  .ant-select-selection-item {
    line-height: 23px !important;
    color: inherit !important;
    font-size: 14px;
    text-align: center;
    flex-grow: 1;

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }

  .ant-select-selection-placeholder {
    line-height: 23px !important;
    text-align: center;
    flex-grow: 1;
    padding-left: 3px !important;

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }

  .ant-select-arrow {
    color: ${(props) => props.theme.token.colorTextSecondary} !important;
    inset-inline-end: 2px !important;
    margin-top: -15px;
    width: auto;
    font-size: 9px;
  }

  &.ant-select-focused .ant-select-selector,
  &:focus .ant-select-selector,
  &:hover .ant-select-selector {
    border-color: transparent !important;
    border-bottom-color: ${(props) =>
      props.theme.token.colorPrimary} !important;
    box-shadow: none !important;
    outline: none !important;
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

  @media (max-width: 556px) {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    width: 100%;
    border-radius: 0px 24px 24px 24px;
  }
`;

const LocationSearchWrapper = styled.div`
  flex-grow: 1;

  @media (max-width: 1088px) {
    width: 100%;
    flex-grow: 0;
    .ant-select,
    .ant-input-search {
      width: 100% !important;
    }
  }
`;

const DateAndSearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border-left: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  padding-left: 0.7rem;

  @media (max-width: 556px) {
    border-left: none;
    padding-left: 0;
    margin-top: 0.5rem;
    width: 100%;
  }
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

  @media (max-width: 556px) {
    flex-grow: 1;
    width: 100%;
  }
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

    @media (max-width: 556px) {
      width: 100% !important;
      min-width: 100px !important;
    }

    &.ant-picker-focused,
    &:focus,
    &:focus-within {
      border-bottom-color: ${(props) =>
        props.theme.token.colorPrimary} !important;
      box-shadow: none !important;
      outline: none !important;
    }
  }

  .ant-picker-input > input {
    height: 23px !important;
    padding-bottom: 2px;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    color: ${(props) => props.theme.token.colorText} !important;
    font-size: 14px;

    @media (max-width: 768px) {
      font-size: 16px !important;
    }

    &::placeholder {
      color: #9a9a9a;
      font-size: 14px;
      opacity: 1;

      @media (max-width: 768px) {
        font-size: 16px !important;
      }
    }
  }
`;

const DatePickerLabel = styled(Typography.Text)`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${(props) => props.theme.token.colorTextPrimary};
  margin-bottom: -2px;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
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

  @media (max-width: 1088px) {
    scale: 1;
    margin-left: 0;
  }

  &:hover {
    scale: 1.35;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    background: linear-gradient(
      135deg,
      ${(props) => props.theme.token.colorPrimaryHover} 0%,
      ${(props) => props.theme.token.colorPrimary} 100%
    );
    @media (max-width: 1088px) {
      scale: 1.05;
    }
  }
`;

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
    name: "Ottawa, ON",
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

const participantOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: i + 1 === 10 ? "10+" : `${i + 1}`,
}));

const BannerSearch = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isAntdReady, setIsAntdReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    displayName: "",
    coordinates: null,
    citySlug: null,
    provinceSlug: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [locationOptions, setLocationOptions] = useState([]);
  const [hasValidLocationSelection, setHasValidLocationSelection] =
    useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedAddressResults, setGeocodedAddressResults] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    setIsAntdReady(true);
    setIsMobile(window.innerWidth <= 1088);

    const checkIsMobile = () => setIsMobile(window.innerWidth <= 1088);
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleDatePickerChange = (date) => setDatePickerValue(date);
  const handleParticipantChange = (value) => setParticipantCount(value);
  const handleSubmit = (e) => {
    e.preventDefault();
    redirectToExplore();
  };

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
        if (Array.isArray(data)) {
          setGeocodedAddressResults(data);
        } else {
          setGeocodedAddressResults([]);
        }
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

  const generateLocationOptions = useCallback(() => {
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

    setLocationOptions(options);
  }, [searchTerm, geocodedAddressResults]);

  useEffect(() => {
    generateLocationOptions();
  }, [generateLocationOptions]);

  const handleLocationSelect = (value, option) => {
    setSearchTerm(value);
    setGeocodedAddressResults([]);
    setHasValidLocationSelection(true);
    setSelectedLocation({
      displayName: value,
      coordinates: option.coordinates,
      citySlug: option.citySlug,
      provinceSlug: option.provinceSlug,
    });
  };

  const handleLocationChange = (newValue) => {
    setSearchTerm(newValue);
    setHasValidLocationSelection(false);
    setSelectedLocation({
      displayName: "",
      coordinates: null,
      citySlug: null,
      provinceSlug: null,
    });
    if (!newValue) {
      setGeocodedAddressResults([]);
    } else {
      debouncedGeocodeTrigger(newValue);
    }
  };

  const redirectToExplore = () => {
    const { displayName, coordinates, citySlug, provinceSlug } =
      selectedLocation;
    const params = new URLSearchParams();

    if (datePickerValue) {
      params.set("date", datePickerValue.format("YYYY-MM-DD"));
    }
    params.set("participants", participantCount.toString());

    // FIXED: Use Toronto as default (matching suggestedAreas[0])
    if (!searchTerm.trim()) {
      params.set("location", "Toronto, ON");
      params.set("lat", "43.6532");
      params.set("lng", "-79.3832");
      router.push(`/explore?${params.toString()}`);
      return;
    }

    const locationForParam = displayName || searchTerm;
    if (locationForParam) {
      params.set("location", locationForParam);
    }

    if (coordinates) {
      params.set("lat", coordinates.lat.toString());
      params.set("lng", coordinates.lng.toString());
    }

    // Check if this matches a preset area for better coordinates
    const searchTermToMatch = searchTerm || displayName;
    const matchedPreset = suggestedAreas.find((area) =>
      searchTermToMatch.startsWith(area.name)
    );

    if (matchedPreset && matchedPreset.coords && !coordinates) {
      params.set("lat", matchedPreset.coords.lat.toString());
      params.set("lng", matchedPreset.coords.lng.toString());
    }

    router.push(`/explore?${params.toString()}`);
  };

  return (
    <Banner aria-labelledby="banner-heading">
      <style jsx global>{`
        .explore-header-location-search-dropdown.ant-select-dropdown,
        .ant-picker-dropdown {
          transform: translateZ(0);
          -webkit-font-smoothing: subpixel-antialiased;
          z-index: 1052 !important;
        }

        .explore-header-location-search-dropdown {
          min-width: 450px !important;
          max-width: 90vw !important;
          border-radius: 16px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12),
            0 4px 8px rgba(0, 0, 0, 0.08) !important;
          border: 1px solid #e5e7eb !important;
          padding: 8px !important;
        }

        @media (max-width: 768px) {
          .explore-header-location-search-dropdown {
            min-width: 0px !important;
          }
          .ant-select-selection-item,
          .ant-select-selection-placeholder,
          .ant-picker-input > input,
          .ant-select-selection-search-input {
            font-size: 16px !important;
            font-family: "Proxima Soft", sans-serif !important;
          }
        }

        .rc-virtual-list-holder {
          padding-bottom: 8px;
        }

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
        }

        .ant-select-item:hover {
          background: linear-gradient(
            135deg,
            #f8fafc 0%,
            #f1f5f9 100%
          ) !important;
          border-color: #e2e8f0 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
        }

        .ant-select-item-option-selected {
          background: linear-gradient(
            135deg,
            #eff6ff 0%,
            #dbeafe 100%
          ) !important;
          border-color: #3b82f6 !important;
        }

        .ant-select-item-option-selected .option-primary-text {
          color: #1d4ed8 !important;
          font-weight: 600 !important;
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
          background: #f9fafb !important;
          border-radius: 12px !important;
          margin: 8px 4px !important;
          border: 1px dashed #d1d5db !important;
        }

        @media (max-width: 768px) {
          .explore-header-location-search-dropdown.ant-select-dropdown {
            position: fixed !important;
            left: 2.5vw !important;
            right: 2.5vw !important;
            width: 95vw !important;
            max-width: 95vw !important;
            transform: none !important;
            top: auto !important;
            bottom: 20vh !important;
            border-radius: 12px !important;
            box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.2) !important;
            max-height: 45vh !important;
            overflow-y: auto !important;
          }

          .ant-picker-dropdown {
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 95vw !important;
            max-width: 400px !important;
            position: fixed !important;
            bottom: auto !important;
            right: auto !important;
            margin: 0 !important;
          }

          .ant-picker-panel-container {
            width: 100% !important;
            box-shadow: none !important;
          }

          .ant-picker-panel {
            width: 100% !important;
          }

          .ant-picker-content,
          .ant-picker-body {
            width: 100% !important;
          }
        }
      `}</style>

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

      <MainWrapper>
        <MainContent $isMobile={isMobile}>
          <HeroText id="banner-heading" $isMobile={isMobile}>
            Learn locally
          </HeroText>
          <SubText $isMobile={isMobile}>
            Explore What Ignites Your Mind. Discover Countless Local Classes &
            Workshops.
          </SubText>
          {isAntdReady ? (
            <InputsWrapper onSubmit={handleSubmit}>
              <ClippedBackground />
              <ParticipantInputContainer>
                <Users size={20} color="#000" aria-hidden="true" />
                <StyledParticipantSelect
                  id="participant-count"
                  value={participantCount}
                  onChange={handleParticipantChange}
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
                        popupClassName="explore-header-location-search-dropdown"
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
                        onChange={handleDatePickerChange}
                        format="YYYY-MM-DD"
                        value={datePickerValue}
                        allowClear={true}
                        inputReadOnly={isMobile}
                      />
                    </DatePickerInputArea>
                  </DatePickerWrapper>

                  <RoundedSearchButton
                    type="submit"
                    aria-label="Search classes"
                  >
                    <Search size={isMobile ? 25 : 20} />
                  </RoundedSearchButton>
                </DateAndSearchWrapper>
              </SelectorsWrapper>
            </InputsWrapper>
          ) : (
            <div style={{ height: "56px" }}></div>
          )}
        </MainContent>
      </MainWrapper>
    </Banner>
  );
};

export default BannerSearch;
