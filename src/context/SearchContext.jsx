"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation"; // Removed usePathname, useSearchParams
import { LordIcon } from "@/services/ReactUtils";
import generatedLocationPresets from "@/_generated/locationPresets.json";
import { FALLBACK_GTA_PRESETS } from "@/data/locationPresets.fallback";
import { publicAnalyticsService } from "@/services/adminDash";
import {
  formatSearchLocationDisplayLabel,
  normalizeSearchLocationState,
} from "@/lib/formatSearchLocationDisplay";
import {
  readContinueSearchSnapshot,
  writeContinueSearchSnapshot,
} from "@/lib/continueSearchStorage";

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
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/explore")
  ) {
    const cur = new URLSearchParams(window.location.search);
    keyword =
      cur.get("keyword") ||
      (cur.getAll("collection").filter(Boolean)[0] ?? "") ||
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

/** In-tab search restore (explore refresh). Homepage pill stays empty — see continueSearchStorage. */
export const SEARCH_STATE_STORAGE_KEY = "classeasily_search_state";

function getStoredSearchState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SEARCH_STATE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSearchState(state) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SEARCH_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

/** Apply persisted search fields from storage (client-only, after mount). */
function readSearchTermFromStored(stored) {
  if (stored && typeof stored.searchTerm === "string" && stored.searchTerm.trim()) {
    return normalizeSearchLocationState({
      displayName: stored.searchTerm,
      searchTerm: stored.searchTerm,
      city: stored.selectedLocation?.city,
      state: stored.selectedLocation?.state,
    }).searchTerm;
  }
  if (
    stored?.selectedLocation &&
    typeof stored.selectedLocation.displayName === "string" &&
    stored.selectedLocation.displayName.trim()
  ) {
    return normalizeSearchLocationState({
      displayName: stored.selectedLocation.displayName,
      city: stored.selectedLocation?.city,
      state: stored.selectedLocation?.state,
    }).displayName;
  }
  return "";
}

function readSelectedLocationFromStored(stored) {
  if (stored && stored.selectedLocation && typeof stored.selectedLocation === "object") {
    const dn = String(stored.selectedLocation.displayName || "").trim();
    const coords = stored.selectedLocation.coordinates;
    if (dn && coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
      const normalized = normalizeSearchLocationState({
        displayName: dn,
        city: stored.selectedLocation.city,
        state: stored.selectedLocation.state,
      }).displayName;
      return {
        displayName: normalized,
        coordinates: coords,
        citySlug: stored.selectedLocation.citySlug || null,
        provinceSlug: stored.selectedLocation.provinceSlug || null,
        city: stored.selectedLocation.city || null,
        state: stored.selectedLocation.state || null,
      };
    }
  }
  return { ...EMPTY_SEARCH_LOCATION };
}

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// Toronto only: LordIcon for desktop suggested areas; rest use Lucide + color palette (like mobile)
const LORDICON_TORONTO = (
  <LordIcon
    src="https://cdn.lordicon.com/luvlauio.json"
    trigger="in"
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

/** Short label for header pill / mobile meta from 0..n collection picks. */
export function summarizeCollectionsForPill(collections) {
  const list = Array.isArray(collections) ? collections.filter((c) => c?.slug) : [];
  if (!list.length) return "Any experience";
  if (list.length === 1) {
    return formatCollectionDisplayName(list[0].name || list[0].slug);
  }
  const first = formatCollectionDisplayName(list[0].name || list[0].slug);
  return `${first} · +${list.length - 1}`;
}

function normalizeStoredCollections(stored) {
  if (stored?.selectedCollections && Array.isArray(stored.selectedCollections)) {
    return stored.selectedCollections.filter(
      (c) => c && typeof c.slug === "string" && String(c.slug).trim(),
    );
  }
  if (stored?.selectedCollection?.slug) {
    return [
      {
        slug: stored.selectedCollection.slug,
        name: stored.selectedCollection.name || stored.selectedCollection.slug,
      },
    ];
  }
  return [];
}

export function formatCollectionDisplayName(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const hasSlugSeparators = /[-_]/.test(s);
  /** One all-lowercase URL slug token (e.g. `wellness`) — hyphenated slugs use the branch above */
  const singleLowercaseSlugToken = /^[a-z][a-z0-9]*$/.test(s);
  if (hasSlugSeparators) {
    return s
      .replace(/[-_]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  if (singleLowercaseSlugToken) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  // Preserve editorial casing (e.g., DIY, 2SLGBTQ+, iPhone) for admin-provided names.
  return s.replace(/\s+/g, " ");
}

// Explore location presets — generated at build from /search/location-presets/ (boundary coverage).
// Keep displayName values aligned with backend quickstart/constants/explore_location_presets.py.
const _generatedPresetList = Array.isArray(generatedLocationPresets?.presets)
  ? generatedLocationPresets.presets
  : [];

export const GTA_PRESETS =
  _generatedPresetList.length > 0 ? _generatedPresetList : FALLBACK_GTA_PRESETS;

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

/** Broad search — Toronto centroid + explicit 100 km radius on submit (see performSearch). */
export const ANYWHERE_EXPLORE_AREA = {
  name: "Anywhere",
  displayName: "Anywhere",
  description: "Within 100 km of Toronto",
  coords: { lat: GTA_PRESETS[0].coords.lat, lng: GTA_PRESETS[0].coords.lng },
  provinceSlug: GTA_PRESETS[0].provinceSlug,
  citySlug: GTA_PRESETS[0].citySlug,
};

/** Default GTA hub used when submitting explore search with no location picked (see performSearch). */
export function getDefaultTorontoSearchLocation() {
  const t = GTA_PRESETS[0];
  return {
    displayName: t.displayName,
    coordinates: { lat: t.coords.lat, lng: t.coords.lng },
    citySlug: t.citySlug,
    provinceSlug: t.provinceSlug,
  };
}

/** Fresh session / cleared search — no preset shown in UI; Toronto is applied on submit via performSearch. */
const EMPTY_SEARCH_LOCATION = {
  displayName: "",
  coordinates: null,
  citySlug: null,
  provinceSlug: null,
  city: null,
  state: null,
};

export const SearchProvider = ({ children }) => {
  const router = useRouter();
  // REMOVED: usePathname and useSearchParams to prevent build errors on static pages

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search Data State — empty on SSR/first paint; restore from storage after mount (avoids hydration mismatch).
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(() => ({
    ...EMPTY_SEARCH_LOCATION,
  }));
  const [datePickerValue, setDatePickerValue] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [hasRestoredSearchState, setHasRestoredSearchState] = useState(false);
  const [continueSearchSnapshot, setContinueSearchSnapshot] = useState(null);

  useEffect(() => {
    const isHomepage =
      typeof window !== "undefined" && window.location.pathname === "/";

    if (isHomepage) {
      setContinueSearchSnapshot(readContinueSearchSnapshot());
    } else {
      const stored = getStoredSearchState();
      if (stored) {
        setSearchTerm(readSearchTermFromStored(stored));
        setSelectedLocation(readSelectedLocationFromStored(stored));
        if (stored.datePickerValue != null) setDatePickerValue(stored.datePickerValue);
        if (typeof stored.participantCount === "number" && stored.participantCount >= 1) {
          setParticipantCount(Math.min(20, stored.participantCount));
        }
        setSelectedCollections(normalizeStoredCollections(stored));
      }
    }
    setHasRestoredSearchState(true);
  }, []);

  // Geocoding State
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedAddressResults, setGeocodedAddressResults] = useState([]);
  const [geocodingError, setGeocodingError] = useState(null);

  const geocodeSeqRef = useRef(0);
  const geocodeAbortRef = useRef(null);

  const debouncedGeocodeTrigger = useCallback(
    debounce(async (addr) => {
      if (!addr || addr.length < 3) {
        geocodeAbortRef.current?.abort();
        setGeocodedAddressResults([]);
        setGeocoding(false);
        setGeocodingError(null);
        return;
      }
      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      const seq = ++geocodeSeqRef.current;
      setGeocoding(true);
      setGeocodingError(null);
      try {
        const encodedAddress = encodeURIComponent(addr);
        const response = await fetch(
          `${AWS_LOCATION_API_URL}?text=${encodedAddress}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(`Geocoding request failed: ${response.status}`);
        const data = await response.json();
        if (seq !== geocodeSeqRef.current) return;
        if (Array.isArray(data)) {
          setGeocodedAddressResults(data);
          setGeocodingError(null);
        } else {
          setGeocodedAddressResults([]);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("AWS Geocoding error:", error);
        if (seq !== geocodeSeqRef.current) return;
        setGeocodedAddressResults([]);
        setGeocodingError(
          "Location lookup is temporarily unavailable. Try a suggested area or search again.",
        );
      } finally {
        if (seq === geocodeSeqRef.current) {
          setGeocoding(false);
        }
      }
    }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedGeocodeTrigger.cancel();
      geocodeAbortRef.current?.abort();
    };
  }, [debouncedGeocodeTrigger]);

  const handleLocationChange = useCallback(
    (value) => {
      setSearchTerm(value);
      setSelectedLocation({
        displayName: "",
        coordinates: null,
        citySlug: null,
        provinceSlug: null,
        city: null,
        state: null,
      });
      if (!value) {
        setGeocodedAddressResults([]);
        setGeocodingError(null);
      } else {
        debouncedGeocodeTrigger(value);
      }
    },
    [debouncedGeocodeTrigger],
  );

  const handleLocationSelect = useCallback((value, option) => {
    const displayLabel = formatSearchLocationDisplayLabel({
      displayName: value,
      city: option?.city,
      state: option?.state,
      location: value,
    });
    setSearchTerm(displayLabel);
    setGeocodedAddressResults([]);
    setGeocodingError(null);
    setSelectedLocation({
      displayName: displayLabel,
      coordinates: option.coordinates,
      citySlug: option.citySlug,
      provinceSlug: option.provinceSlug,
      city: option?.city || null,
      state: option?.state || null,
    });
  }, []);

  const clearAll = useCallback(() => {
    setSearchTerm("");
    setSelectedLocation({ ...EMPTY_SEARCH_LOCATION });
    setDatePickerValue(null);
    setParticipantCount(1);
    setSelectedCollections([]);
    setGeocodedAddressResults([]);
    setGeocodingError(null);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SEARCH_STATE_STORAGE_KEY);
      }
    } catch (_) {}
  }, []);

  // Persist search state so it survives closing the drawer and shows in ExploreHeader
  useEffect(() => {
    if (!hasRestoredSearchState) return;
    if (typeof window !== "undefined" && window.location.pathname === "/") return;
    saveSearchState({
      searchTerm,
      selectedLocation,
      datePickerValue,
      participantCount,
      selectedCollections,
    });
  }, [
    searchTerm,
    selectedLocation,
    datePickerValue,
    participantCount,
    selectedCollections,
    hasRestoredSearchState,
  ]);

  const performSearch = useCallback((overrides) => {
    const toronto = getDefaultTorontoSearchLocation();
    const activeSearchTerm =
      overrides?.searchTerm != null ? overrides.searchTerm : searchTerm;
    const activeLocation =
      overrides?.selectedLocation != null ? overrides.selectedLocation : selectedLocation;
    const activeDate =
      overrides?.datePickerValue !== undefined
        ? overrides.datePickerValue
        : datePickerValue;
    const activeCollections =
      overrides?.selectedCollections != null
        ? overrides.selectedCollections
        : selectedCollections;

    let term = String(activeSearchTerm || "").trim();
    let loc = { ...activeLocation };
    let displayName = String(loc.displayName || "").trim();
    let coordinates = loc.coordinates;

    if (!term && !displayName) {
      term = toronto.displayName;
      loc = { ...toronto };
      displayName = toronto.displayName;
      coordinates = toronto.coordinates;
      if (!overrides) {
        setSearchTerm(term);
        setSelectedLocation(loc);
      }
    }

    const params = new URLSearchParams();

    // When already on explore, preserve current category/collection/filters so location change doesn't reset them
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/explore") &&
      window.location.search
    ) {
      const current = new URLSearchParams(window.location.search);
      const preserveKeys = [
        "category",
        "subcategory",
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
        "participants",
      ];
      preserveKeys.forEach((key) => {
        const value = current.get(key);
        if (value != null && value !== "") params.set(key, value);
      });
      current.getAll("time_preference").forEach((v) => params.append("time_preference", v));
      current.getAll("days").forEach((v) => params.append("days", v));
    }

    params.delete("collection");
    (activeCollections || []).forEach((c) => {
      if (c?.slug) params.append("collection", c.slug);
    });

    // HANDLE DATE (Range or Single)
    if (activeDate) {
      if (activeDate.start && activeDate.end) {
        params.set("start_date", activeDate.start);
        params.set("end_date", activeDate.end);
      } else if (typeof activeDate?.format === "function") {
        // Single date object (dayjs)
        params.set("date", activeDate.format("YYYY-MM-DD"));
      } else if (typeof activeDate === "string") {
        params.set("date", activeDate);
      }
    }

    const locationForParam = (displayName || term).trim() || toronto.displayName;
    params.set("location", locationForParam);

    if (coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number") {
      params.set("lat", coordinates.lat.toString());
      params.set("lng", coordinates.lng.toString());
    }

    if ((displayName || term).trim() === ANYWHERE_EXPLORE_AREA.displayName) {
      params.set("radius", "100");
    }

    let path = "/explore";
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p.startsWith("/explore/") && p.length > "/explore/".length) {
        path = p;
      }
    }

    const newUrl = `${path}?${params.toString()}`;

    writeContinueSearchSnapshot({
      searchTerm: term,
      selectedLocation: loc,
      datePickerValue: activeDate,
      selectedCollections: activeCollections,
    });

    logExploreSearchFromParams(params, { searchTerm: term, selectedLocation: loc });
    // Trigger global loading state immediately
    setIsSearching(true);
    router.push(newUrl);

    setIsDrawerOpen(false);
  }, [selectedLocation, searchTerm, datePickerValue, selectedCollections, router]);

  const continuePreviousSearch = useCallback(() => {
    const snapshot = continueSearchSnapshot || readContinueSearchSnapshot();
    if (!snapshot) return;

    const restoredTerm = readSearchTermFromStored(snapshot);
    const restoredLocation = readSelectedLocationFromStored(snapshot);
    const restoredCollections = normalizeStoredCollections(snapshot);
    const restoredDate = snapshot.datePickerValue ?? null;

    setSearchTerm(restoredTerm);
    setSelectedLocation(restoredLocation);
    setDatePickerValue(restoredDate);
    setSelectedCollections(restoredCollections);

    performSearch({
      searchTerm: restoredTerm,
      selectedLocation: restoredLocation,
      datePickerValue: restoredDate,
      selectedCollections: restoredCollections,
    });
  }, [continueSearchSnapshot, performSearch]);

  const refreshContinueSearchSnapshot = useCallback(() => {
    setContinueSearchSnapshot(readContinueSearchSnapshot());
  }, []);

  const debouncedPrefetchExplore = useMemo(
    () =>
      debounce((url) => {
        router.prefetch(url);
      }, 450),
    [router],
  );

  useEffect(() => {
    return () => debouncedPrefetchExplore.cancel();
  }, [debouncedPrefetchExplore]);

  // Prefetch explore page when user has a location (debounced to avoid storms while typing).
  // Corporate shortlist/checkout uses the header without the search pill — skip prefetch so we
  // do not warm the explore RSC (and homepage-content fetches) on those routes.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/corporate/shortlist")) {
      return;
    }
    const { displayName, coordinates } = selectedLocation;
    const hasLocation = (displayName || searchTerm.trim()) && coordinates;
    if (!hasLocation) return;
    const params = new URLSearchParams();
    params.set(
      "location",
      (displayName || searchTerm.trim()).replace(/,?\s*ON\s*$/, "").trim() ||
        "Toronto",
    );
    params.set("lat", coordinates.lat.toString());
    params.set("lng", coordinates.lng.toString());
    if (datePickerValue) {
      if (datePickerValue.start && datePickerValue.end) {
        params.set("start_date", datePickerValue.start);
        params.set("end_date", datePickerValue.end);
      } else if (typeof datePickerValue?.format === "function") {
        params.set("date", datePickerValue.format("YYYY-MM-DD"));
      } else if (typeof datePickerValue === "string") {
        params.set("date", datePickerValue);
      }
    }
    (selectedCollections || []).forEach((c) => {
      if (c?.slug) params.append("collection", c.slug);
    });
    const exploreUrl = `/explore?${params.toString()}`;
    debouncedPrefetchExplore(exploreUrl);
  }, [
    selectedLocation,
    searchTerm,
    datePickerValue,
    selectedCollections,
    debouncedPrefetchExplore,
  ]);

  const value = useMemo(
    () => ({
      isDrawerOpen,
      setIsDrawerOpen,
      isSearching,
      setIsSearching,
      hasRestoredSearchState,
      continueSearchSnapshot,
      searchTerm,
      setSearchTerm,
      selectedLocation,
      setSelectedLocation,
      datePickerValue,
      setDatePickerValue,
      participantCount,
      setParticipantCount,
      selectedCollections,
      setSelectedCollections,
      geocoding,
      geocodedAddressResults,
      geocodingError,
      handleLocationChange,
      handleLocationSelect,
      clearAll,
      performSearch,
      continuePreviousSearch,
      refreshContinueSearchSnapshot,
    }),
    [
      isDrawerOpen,
      isSearching,
      hasRestoredSearchState,
      continueSearchSnapshot,
      searchTerm,
      selectedLocation,
      datePickerValue,
      participantCount,
      selectedCollections,
      geocoding,
      geocodedAddressResults,
      geocodingError,
      handleLocationChange,
      handleLocationSelect,
      clearAll,
      performSearch,
      continuePreviousSearch,
      refreshContinueSearchSnapshot,
    ],
  );

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

/** Session memo for explore results (see ExploreClient + exploreResultsCache). */
export {
  peekExploreSearchResults,
  stashExploreSearchResults,
} from "@/lib/exploreResultsCache";
