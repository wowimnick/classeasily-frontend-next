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

/** Canonical default when no location is chosen (header, explore, clear). */
export function getDefaultTorontoSearchLocation() {
  const t = GTA_PRESETS[0];
  return {
    displayName: t.displayName,
    coordinates: { lat: t.coords.lat, lng: t.coords.lng },
    citySlug: t.citySlug,
    provinceSlug: t.provinceSlug,
  };
}

export const SearchProvider = ({ children }) => {
  const router = useRouter();
  // REMOVED: usePathname and useSearchParams to prevent build errors on static pages

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search Data State — initialize from sessionStorage so search persists when closing drawer / navigating
  const [searchTerm, setSearchTerm] = useState(() => {
    const stored = getStoredSearchState();
    if (stored && typeof stored.searchTerm === "string" && stored.searchTerm.trim()) {
      return stored.searchTerm.trim();
    }
    if (
      stored?.selectedLocation &&
      typeof stored.selectedLocation.displayName === "string" &&
      stored.selectedLocation.displayName.trim()
    ) {
      return stored.selectedLocation.displayName.trim();
    }
    return getDefaultTorontoSearchLocation().displayName;
  });
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const stored = getStoredSearchState();
    if (stored && stored.selectedLocation && typeof stored.selectedLocation === "object") {
      const dn = String(stored.selectedLocation.displayName || "").trim();
      const coords = stored.selectedLocation.coordinates;
      if (dn && coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
        return {
          displayName: dn,
          coordinates: coords,
          citySlug: stored.selectedLocation.citySlug || null,
          provinceSlug: stored.selectedLocation.provinceSlug || null,
        };
      }
    }
    return getDefaultTorontoSearchLocation();
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
  const [selectedCollections, setSelectedCollections] = useState(() => {
    const stored = getStoredSearchState();
    return normalizeStoredCollections(stored);
  });

  // Geocoding State
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedAddressResults, setGeocodedAddressResults] = useState([]);

  const geocodeSeqRef = useRef(0);
  const geocodeAbortRef = useRef(null);

  const debouncedGeocodeTrigger = useCallback(
    debounce(async (addr) => {
      if (!addr || addr.length < 3) {
        geocodeAbortRef.current?.abort();
        setGeocodedAddressResults([]);
        setGeocoding(false);
        return;
      }
      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      const seq = ++geocodeSeqRef.current;
      setGeocoding(true);
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
        } else {
          setGeocodedAddressResults([]);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("AWS Geocoding error:", error);
        if (seq !== geocodeSeqRef.current) return;
        setGeocodedAddressResults([]);
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
      });
      if (!value) {
        setGeocodedAddressResults([]);
      } else {
        debouncedGeocodeTrigger(value);
      }
    },
    [debouncedGeocodeTrigger],
  );

  const handleLocationSelect = useCallback((value, option) => {
    setSearchTerm(value);
    setGeocodedAddressResults([]);
    setSelectedLocation({
      displayName: value,
      coordinates: option.coordinates,
      citySlug: option.citySlug,
      provinceSlug: option.provinceSlug,
    });
  }, []);

  const clearAll = useCallback(() => {
    const t = getDefaultTorontoSearchLocation();
    setSearchTerm(t.displayName);
    setSelectedLocation({ ...t });
    setDatePickerValue(null);
    setParticipantCount(1);
    setSelectedCollections([]);
    setGeocodedAddressResults([]);
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(SEARCH_STORAGE_KEY);
    } catch (_) {}
  }, []);

  // Persist search state so it survives closing the drawer and shows in ExploreHeader
  useEffect(() => {
    saveSearchState({
      searchTerm,
      selectedLocation,
      datePickerValue,
      participantCount,
      selectedCollections,
    });
  }, [searchTerm, selectedLocation, datePickerValue, participantCount, selectedCollections]);

  const performSearch = useCallback(() => {
    const toronto = getDefaultTorontoSearchLocation();
    let term = searchTerm.trim();
    let loc = { ...selectedLocation };
    let displayName = String(loc.displayName || "").trim();
    let coordinates = loc.coordinates;

    if (!term && !displayName) {
      term = toronto.displayName;
      loc = { ...toronto };
      displayName = toronto.displayName;
      coordinates = toronto.coordinates;
      setSearchTerm(term);
      setSelectedLocation(loc);
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
    (selectedCollections || []).forEach((c) => {
      if (c?.slug) params.append("collection", c.slug);
    });

    // HANDLE DATE (Range or Single)
    if (datePickerValue) {
      if (datePickerValue.start && datePickerValue.end) {
        params.set("start_date", datePickerValue.start);
        params.set("end_date", datePickerValue.end);
      } else if (typeof datePickerValue?.format === "function") {
        // Single date object (dayjs)
        params.set("date", datePickerValue.format("YYYY-MM-DD"));
      } else if (typeof datePickerValue === "string") {
        params.set("date", datePickerValue);
      }
    }

    const locationForParam = (displayName || term).trim() || toronto.displayName;
    params.set("location", locationForParam);

    if (coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number") {
      params.set("lat", coordinates.lat.toString());
      params.set("lng", coordinates.lng.toString());
    }

    let path = "/explore";
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p.startsWith("/explore/") && p.length > "/explore/".length) {
        path = p;
      }
    }

    const newUrl = `${path}?${params.toString()}`;

    logExploreSearchFromParams(params, { searchTerm: term, selectedLocation: loc });
    // Trigger global loading state immediately
    setIsSearching(true);
    router.push(newUrl);

    setIsDrawerOpen(false);
  }, [selectedLocation, searchTerm, datePickerValue, selectedCollections, router]);

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
      handleLocationChange,
      handleLocationSelect,
      clearAll,
      performSearch,
    }),
    [
      isDrawerOpen,
      isSearching,
      searchTerm,
      selectedLocation,
      datePickerValue,
      participantCount,
      selectedCollections,
      geocoding,
      geocodedAddressResults,
      handleLocationChange,
      handleLocationSelect,
      clearAll,
      performSearch,
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
