"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { LordIcon } from "@/services/ReactUtils";

const SearchContext = createContext();

const AWS_LOCATION_API_URL = "https://geocoding.classeasily.com/address-autocomplete-proxy";

export const SUGGESTED_AREAS = [
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
        style={{ width: 40, height: 40 }}
      />
    ),
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
        style={{ width: 40, height: 35 }}
      />
    ),
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
        style={{ width: 40, height: 35 }}
      />
    ),
    provinceSlug: "ontario",
    citySlug: "ottawa",
  },
];

export const SearchProvider = ({ children }) => {
  const router = useRouter();
  
  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search Data State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    displayName: "",
    coordinates: null,
    citySlug: null,
    provinceSlug: null,
  });
  const [datePickerValue, setDatePickerValue] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);

  // Geocoding State
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedAddressResults, setGeocodedAddressResults] = useState([]);

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
        if (!response.ok) throw new Error(`Geocoding request failed: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setGeocodedAddressResults(data);
        } else {
          setGeocodedAddressResults([]);
        }
      } catch (error) {
        console.error("AWS Geocoding error:", error);
        setGeocodedAddressResults([]);
      } finally {
        setGeocoding(false);
      }
    }, 300),
    []
  );

  const handleLocationChange = (value) => {
    setSearchTerm(value);
    setSelectedLocation({
      displayName: "",
      coordinates: null,
      citySlug: null,
      provinceSlug: null,
    });
    if (!value) {
      setGeocodedAddressResults([]);
    } else {
      debouncedGeocodeTrigger(value);
    }
  };

  const handleLocationSelect = (value, option) => {
    setSearchTerm(value);
    setGeocodedAddressResults([]);
    setSelectedLocation({
      displayName: value,
      coordinates: option.coordinates,
      citySlug: option.citySlug,
      provinceSlug: option.provinceSlug,
    });
  };

  const clearAll = () => {
    setSearchTerm("");
    setSelectedLocation({ displayName: "", coordinates: null, citySlug: null, provinceSlug: null });
    setDatePickerValue(null);
    setParticipantCount(1);
    setGeocodedAddressResults([]);
  };

  const performSearch = () => {
    const { displayName, coordinates } = selectedLocation;
    const params = new URLSearchParams();

    if (datePickerValue) {
      params.set("date", datePickerValue.format("YYYY-MM-DD"));
    }
    params.set("participants", participantCount.toString());

    // Default fallback logic if everything is empty
    if (!searchTerm.trim() && !displayName) {
      params.set("location", "Toronto, ON");
      params.set("lat", "43.6532");
      params.set("lng", "-79.3832");
      router.push(`/explore?${params.toString()}`);
      setIsDrawerOpen(false);
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

    router.push(`/explore?${params.toString()}`);
    setIsDrawerOpen(false);
  };

  const value = {
    isDrawerOpen,
    setIsDrawerOpen,
    searchTerm,
    setSearchTerm,
    selectedLocation,
    setSelectedLocation,
    datePickerValue,
    setDatePickerValue,
    participantCount,
    setParticipantCount,
    geocoding,
    geocodedAddressResults,
    handleLocationChange,
    handleLocationSelect,
    clearAll,
    performSearch,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};