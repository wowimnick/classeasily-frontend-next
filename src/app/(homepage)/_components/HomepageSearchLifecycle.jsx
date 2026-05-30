"use client";

import { useEffect, useRef } from "react";
import { useSearch } from "@/context/SearchContext";
import {
  readContinueSearchSnapshot,
  writeContinueSearchSnapshot,
} from "@/lib/continueSearchStorage";

const EMPTY_SEARCH_LOCATION = {
  displayName: "",
  coordinates: null,
  citySlug: null,
  provinceSlug: null,
  city: null,
  state: null,
};

function hasMeaningfulSearch({ selectedLocation }) {
  const displayName = String(selectedLocation?.displayName || "").trim();
  const coords = selectedLocation?.coordinates;
  return (
    Boolean(displayName) &&
    coords &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number"
  );
}

function buildContinueSnapshot({
  searchTerm,
  selectedLocation,
  datePickerValue,
  selectedCollections,
}) {
  return {
    searchTerm,
    selectedLocation,
    datePickerValue,
    selectedCollections,
  };
}

/**
 * Homepage-only lifecycle: reset the search pill once on mount, save continue-search on unmount.
 * Avoids usePathname so global providers stay compatible with static prerender.
 */
export default function HomepageSearchLifecycle() {
  const {
    searchTerm,
    selectedLocation,
    datePickerValue,
    selectedCollections,
    hasRestoredSearchState,
    setSearchTerm,
    setSelectedLocation,
    setDatePickerValue,
    setSelectedCollections,
    refreshContinueSearchSnapshot,
  } = useSearch();

  const liveSearchRef = useRef({
    searchTerm,
    selectedLocation,
    datePickerValue,
    selectedCollections,
  });
  const didInitializeRef = useRef(false);

  useEffect(() => {
    liveSearchRef.current = {
      searchTerm,
      selectedLocation,
      datePickerValue,
      selectedCollections,
    };
  }, [searchTerm, selectedLocation, datePickerValue, selectedCollections]);

  // Run once when persisted state is ready — do not re-run when the user edits the pill.
  useEffect(() => {
    if (!hasRestoredSearchState || didInitializeRef.current) return;
    didInitializeRef.current = true;

    refreshContinueSearchSnapshot();
    setSearchTerm("");
    setSelectedLocation({ ...EMPTY_SEARCH_LOCATION });
    setDatePickerValue(null);
    setSelectedCollections([]);
  }, [hasRestoredSearchState]);

  // Save continue-search when leaving the homepage (component unmount).
  useEffect(() => {
    return () => {
      if (hasMeaningfulSearch(liveSearchRef.current)) {
        writeContinueSearchSnapshot(buildContinueSnapshot(liveSearchRef.current));
      }
    };
  }, []);

  return null;
}
