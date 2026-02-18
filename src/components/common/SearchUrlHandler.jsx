"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import dayjs from "dayjs";

const SearchUrlHandler = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    setIsDrawerOpen,
    setSearchTerm,
    setSelectedLocation,
    setDatePickerValue,
    setParticipantCount,
  } = useSearch();

  // We use a ref to track the last URL string we processed.
  // This ensures we only update Global State if the URL *actually* changed,
  // preventing the "typing overwrite" bug.
  const prevParamsString = useRef("");

  // 1. Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname, setIsDrawerOpen]);

  // 2. Sync URL params to Global State (Only on URL change)
  useEffect(() => {
    const currentParamsString = searchParams.toString();

    // If the URL params haven't changed since the last run, DO NOTHING.
    // This allows the user to type in the input (changing State) without
    // the URL (which is still the old value) overwriting them immediately.
    if (currentParamsString === prevParamsString.current) {
      return;
    }

    // Update the ref so we don't run this again for the same URL
    prevParamsString.current = currentParamsString;

    const locParam = searchParams.get("location");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");

    const participantsParam = searchParams.get("participants");

    // --- LOCATION ---
    // Only update context when URL has location; when missing, leave context unchanged
    // so that search term/location persist in header and full-screen drawer.
    if (locParam) {
      setSearchTerm(locParam);

      if (latParam && lngParam) {
        setSelectedLocation((prev) => ({
          ...prev,
          displayName: locParam,
          coordinates: { lat: parseFloat(latParam), lng: parseFloat(lngParam) },
        }));
      }
    }

    // --- DATE ---
    if (startDateParam && endDateParam) {
      setDatePickerValue({
        start: startDateParam,
        end: endDateParam,
      });
    } else if (dateParam) {
      const parsedDate = dayjs(dateParam);
      if (parsedDate.isValid()) setDatePickerValue(parsedDate);
    }

    // --- PARTICIPANTS ---
    if (participantsParam) {
      const count = parseInt(participantsParam, 10);
      if (!isNaN(count) && count > 0) setParticipantCount(count);
    }
  }, [
    searchParams,
    setSearchTerm,
    setSelectedLocation,
    setDatePickerValue,
    setParticipantCount,
  ]);

  return null;
};

export default SearchUrlHandler;
