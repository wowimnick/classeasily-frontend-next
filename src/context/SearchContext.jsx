"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation"; // Removed usePathname, useSearchParams
import { LordIcon } from "@/services/ReactUtils";
import { publicAnalyticsService } from "@/services/adminDash";

function getSearchLogSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem("ce_search_session");
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("ce_search_session", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Fire-and-forget analytics when user runs a location-based explore search. */
function logExploreSearchFromParams(params, { searchTerm, selectedLocation }) {
  let keyword = "";
  if (typeof window !== "undefined" && window.location.pathname === "/explore") {
    const cur = new URLSearchParams(window.location.search);
    keyword =
      cur.get("keyword") ||
      cur.get("collection") ||
      cur.get("category") ||
      "";
  }
  const locStr = params.get("location") || "";
  const lat = params.get("lat");
  const lng = params.get("lng");
  let province = "";
  const m = locStr.match(/\b([A-Z]{2})\s*$/);
  if (m) province = m[1];
  else if (selectedLocation?.displayName) {
    const m2 = String(selectedLocation.displayName).match(/\b([A-Z]{2})\s*$/);
    if (m2) province = m2[1];
  }
  void publicAnalyticsService.logSearch({
    query: String(keyword || searchTerm || "").trim().slice(0, 255),
    location: locStr.slice(0, 255),
    province: province.slice(0, 50),
    latitude: lat != null && lat !== "" ? Number.parseFloat(lat) : null,
    longitude: lng != null && lng !== "" ? Number.parseFloat(lng) : null,
    session_id: getSearchLogSessionId().slice(0, 100),
    results_count: 0,
  });
}

const SearchContext = createContext();

const SEARCH_STORAGE_KEY = "classeasily_search_state";

function getStoredSearchState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SEARCH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function saveSearchState(state) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// Toronto only: LordIcon for desktop suggested areas; rest use Lucide + color palette (like mobile)
const LORDICON_TORONTO = (
  <LordIcon
    src="https://cdn.lordicon.com/luvlauio.json"
    trigger="in"
    delay="1500"
    state="in-reveal"
    colors="primary:#3a3347,secondary:#e4e4e4,tertiary:#ffc738"
    style={{ width: 40, height: 40 }}
  />
);

// Same palette as mobile (SearchFullScreen) for Lucide MapPin icons
export const ICON_PALETTE = [
  { bg: "#fff1f2", icon: "#e11d48" }, // Rose
  { bg: "#fff7ed", icon: "#ea580c" }, // Orange
  { bg: "#eff6ff", icon: "#2563eb" }, // Blue
  { bg: "#f0fdf4", icon: "#16a34a" }, // Green
  { bg: "#faf5ff", icon: "#9333ea" }, // Purple
];

// Toronto / GTA towns for full-screen location presets (mobile drawer + desktop banner).
// Keep displayName values in sync with backend quickstart/constants/search_location_presets.py (admin search analytics).
export const GTA_PRESETS = [
  { name: "Toronto", displayName: "Toronto, ON", description: "Downtown & neighbourhoods", coords: { lat: 43.6532, lng: -79.3832 }, provinceSlug: "ontario", citySlug: "toronto" },
  { name: "Mississauga", displayName: "Mississauga, ON", description: "West of Toronto", coords: { lat: 43.589, lng: -79.6441 }, provinceSlug: "ontario", citySlug: "mississauga" },
  { name: "Brampton", displayName: "Brampton, ON", description: "Peel Region", coords: { lat: 43.7315, lng: -79.7624 }, provinceSlug: "ontario", citySlug: "brampton" },
  { name: "Vaughan", displayName: "Vaughan, ON", description: "North of Toronto", coords: { lat: 43.8367, lng: -79.4982 }, provinceSlug: "ontario", citySlug: "vaughan" },
  { name: "Markham", displayName: "Markham, ON", description: "York Region", coords: { lat: 43.8561, lng: -79.337 }, provinceSlug: "ontario", citySlug: "markham" },
  { name: "Richmond Hill", displayName: "Richmond Hill, ON", description: "York Region", coords: { lat: 43.8828, lng: -79.4403 }, provinceSlug: "ontario", citySlug: "richmond-hill" },
  { name: "Oakville", displayName: "Oakville, ON", description: "Halton Region", coords: { lat: 43.4675, lng: -79.6877 }, provinceSlug: "ontario", citySlug: "oakville" },
  { name: "Burlington", displayName: "Burlington, ON", description: "Halton Region", coords: { lat: 43.3255, lng: -79.799 }, provinceSlug: "ontario", citySlug: "burlington" },
  { name: "Hamilton", displayName: "Hamilton, ON", description: "Popular area", coords: { lat: 43.2557, lng: -79.8711 }, provinceSlug: "ontario", citySlug: "hamilton" },
  { name: "Ottawa", displayName: "Ottawa, ON", description: "Growing area", coords: { lat: 45.4215, lng: -75.6972 }, provinceSlug: "ontario", citySlug: "ottawa" },
  { name: "Pickering", displayName: "Pickering, ON", description: "Durham Region", coords: { lat: 43.8374, lng: -79.0863 }, provinceSlug: "ontario", citySlug: "pickering" },
  { name: "Ajax", displayName: "Ajax, ON", description: "Durham Region", coords: { lat: 43.8501, lng: -79.0329 }, provinceSlug: "ontario", citySlug: "ajax" },
  { name: "Whitby", displayName: "Whitby, ON", description: "Durham Region", coords: { lat: 43.8762, lng: -78.9413 }, provinceSlug: "ontario", citySlug: "whitby" },
  { name: "Oshawa", displayName: "Oshawa, ON", description: "Durham Region", coords: { lat: 43.8971, lng: -78.8658 }, provinceSlug: "ontario", citySlug: "oshawa" },
  { name: "Milton", displayName: "Milton, ON", description: "Halton Region", coords: { lat: 43.5183, lng: -79.8774 }, provinceSlug: "ontario", citySlug: "milton" },
  { name: "Newmarket", displayName: "Newmarket, ON", description: "York Region", coords: { lat: 44.0553, lng: -79.4593 }, provinceSlug: "ontario", citySlug: "newmarket" },
  { name: "Aurora", displayName: "Aurora, ON", description: "York Region", coords: { lat: 44.0056, lng: -79.4663 }, provinceSlug: "ontario", citySlug: "aurora" },
  { name: "Etobicoke", displayName: "Etobicoke, ON", description: "West Toronto", coords: { lat: 43.6532, lng: -79.5672 }, provinceSlug: "ontario", citySlug: "toronto" },
  { name: "Scarborough", displayName: "Scarborough, ON", description: "East Toronto", coords: { lat: 43.7731, lng: -79.2574 }, provinceSlug: "ontario", citySlug: "toronto" },
  { name: "North York", displayName: "North York, ON", description: "North Toronto", coords: { lat: 43.7615, lng: -79.4111 }, provinceSlug: "ontario", citySlug: "toronto" },
];

// Desktop banner: same neighborhoods as mobile; Toronto gets LordIcon, rest get Lucide MapPin + colored theme
export const SUGGESTED_AREAS = GTA_PRESETS.map((preset, idx) => ({
  name: preset.name,
  displayName: preset.displayName || `${preset.name}, ON`,
  description: preset.description,
  coords: preset.coords,
  icon: idx === 0 ? LORDICON_TORONTO : null,
  lucideColorTheme: idx === 0 ? null : ICON_PALETTE[(idx - 1) % ICON_PALETTE.length],
  provinceSlug: preset.provinceSlug,
  citySlug: preset.citySlug,
}));

export const SearchProvider = ({ children }) => {
  const router = useRouter();
  // REMOVED: usePathname and useSearchParams to prevent build errors on static pages

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search Data State — initialize from sessionStorage so search persists when closing drawer / navigating
  const [searchTerm, setSearchTerm] = useState(() => {
    const stored = getStoredSearchState();
    return (stored && stored.searchTerm) || "";
  });
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const stored = getStoredSearchState();
    if (stored && stored.selectedLocation && typeof stored.selectedLocation === "object") {
      return {
        displayName: stored.selectedLocation.displayName || "",
        coordinates: stored.selectedLocation.coordinates || null,
        citySlug: stored.selectedLocation.citySlug || null,
        provinceSlug: stored.selectedLocation.provinceSlug || null,
      };
    }
    return {
      displayName: "",
      coordinates: null,
      citySlug: null,
      provinceSlug: null,
    };
  });
  const [datePickerValue, setDatePickerValue] = useState(() => {
    const stored = getStoredSearchState();
    if (stored && stored.datePickerValue != null) return stored.datePickerValue;
    return null;
  });
  const [participantCount, setParticipantCount] = useState(() => {
    const stored = getStoredSearchState();
    if (stored && typeof stored.participantCount === "number" && stored.participantCount >= 1) {
      return Math.min(20, stored.participantCount);
    }
    return 1;
  });

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
          `${AWS_LOCATION_API_URL}?text=${encodedAddress}`,
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
        setGeocodedAddressResults([]);
      } finally {
        setGeocoding(false);
      }
    }, 300),
    [],
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
    setSelectedLocation({
      displayName: "",
      coordinates: null,
      citySlug: null,
      provinceSlug: null,
    });
    setDatePickerValue(null);
    setParticipantCount(1);
    setGeocodedAddressResults([]);
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(SEARCH_STORAGE_KEY);
    } catch (_) {}
  };

  // Persist search state so it survives closing the drawer and shows in ExploreHeader
  useEffect(() => {
    saveSearchState({
      searchTerm,
      selectedLocation,
      datePickerValue,
      participantCount,
    });
  }, [searchTerm, selectedLocation, datePickerValue, participantCount]);

  const performSearch = () => {
    const { displayName, coordinates } = selectedLocation;
    const params = new URLSearchParams();

    // When already on explore, preserve current category/collection/filters so location change doesn't reset them
    if (typeof window !== "undefined" && window.location.pathname === "/explore" && window.location.search) {
      const current = new URLSearchParams(window.location.search);
      const preserveKeys = [
        "category",
        "subcategory",
        "collection",
        "tag",
        "sort_by",
        "keyword",
        "price_min",
        "price_max",
        "radius",
        "distance_max",
        "class_type",
        "date",
        "start_date",
        "end_date",
      ];
      preserveKeys.forEach((key) => {
        const value = current.get(key);
        if (value != null && value !== "") params.set(key, value);
      });
      current.getAll("time_preference").forEach((v) => params.append("time_preference", v));
      current.getAll("days").forEach((v) => params.append("days", v));
    }

    // HANDLE DATE (Range or Single)
    if (datePickerValue) {
      if (datePickerValue.start && datePickerValue.end) {
        params.set("start_date", datePickerValue.start);
        params.set("end_date", datePickerValue.end);
      } else if (datePickerValue.format) {
        // Single date object
        params.set("date", datePickerValue.format("YYYY-MM-DD"));
      } else {
        // Fallback for string
        params.set("date", datePickerValue.toString());
      }
    }

    params.set("participants", participantCount.toString());

    // Default fallback logic if everything is empty
    if (!searchTerm.trim() && !displayName) {
      if (!params.get("lat")) {
        params.set("location", "Toronto, ON");
        params.set("lat", "43.6532");
        params.set("lng", "-79.3832");
      }

      const newUrl = `/explore?${params.toString()}`;

      logExploreSearchFromParams(params, { searchTerm, selectedLocation });
      setIsSearching(true);
      router.push(newUrl);

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

    const newUrl = `/explore?${params.toString()}`;

    logExploreSearchFromParams(params, { searchTerm, selectedLocation });
    // Trigger global loading state immediately
    setIsSearching(true);
    router.push(newUrl);

    setIsDrawerOpen(false);
  };

  // Prefetch explore page when user has a location so it loads instantly on Search
  useEffect(() => {
    const { displayName, coordinates } = selectedLocation;
    const hasLocation = (displayName || searchTerm.trim()) && coordinates;
    if (!hasLocation) return;
    const params = new URLSearchParams();
    params.set("location", (displayName || searchTerm.trim()).replace(/,?\s*ON\s*$/, "").trim() || "Toronto");
    params.set("lat", coordinates.lat.toString());
    params.set("lng", coordinates.lng.toString());
    params.set("participants", participantCount.toString());
    if (datePickerValue) {
      if (datePickerValue.start && datePickerValue.end) {
        params.set("start_date", datePickerValue.start);
        params.set("end_date", datePickerValue.end);
      } else if (datePickerValue.format) {
        params.set("date", datePickerValue.format("YYYY-MM-DD"));
      }
    }
    const exploreUrl = `/explore?${params.toString()}`;
    router.prefetch(exploreUrl);
  }, [selectedLocation, searchTerm, participantCount, datePickerValue, router]);

  const value = {
    isDrawerOpen,
    setIsDrawerOpen,
    isSearching,
    setIsSearching,
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

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
