"use client";

import { useEffect } from "react";
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

  // 1. Close drawer on route change to prevent freezing
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname, setIsDrawerOpen]);

  // 2. Sync URL params to Global State
  useEffect(() => {
    const locParam = searchParams.get("location");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    // Date Params
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");

    const participantsParam = searchParams.get("participants");

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

    // HANDLE DATE RANGES vs SINGLE DATES
    if (startDateParam && endDateParam) {
      setDatePickerValue({
        start: startDateParam,
        end: endDateParam,
      });
    } else if (dateParam) {
      const parsedDate = dayjs(dateParam);
      if (parsedDate.isValid()) setDatePickerValue(parsedDate);
    } else {
      setDatePickerValue(null);
    }

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
