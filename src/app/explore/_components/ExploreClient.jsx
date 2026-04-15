"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
// useReplaceSearchParams removed — no longer updating explore_page in URL
// (it was the root cause of the infinite scroll cascade).
import styled from "styled-components";
import dynamic from "next/dynamic";
import ExploreHeader from "../../../components/explore/ExploreHeader";
import { classService } from "@/services/apiService";
import Breadcrumbs from "@/services/Breadcrumbs";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";
import { useSearch } from "@/context/SearchContext";

const ClassesDisplay = dynamic(() => import("./ClassesDisplay"), {
  loading: () => null,
});

const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: ${(props) => props.theme.token.colorBgContainer};
`;

const ContentArea = styled.main`
  flex-grow: 1;
  overflow: hidden;
  position: relative;
`;

const FetchErrorBanner = styled.div`
  flex-shrink: 0;
  padding: 10px 16px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #fecaca;
`;

const BreadcrumbContainer = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;

  @media (max-width: 1048px) {
    padding: 0 1rem;
  }
`;

/** Build API params from URL search params. */
function buildApiParamsFromSearchParams(sp) {
  const apiParams = {};
  const defaultMaxPrice = 500;
  const defaultMaxDistance = 50;

  const lat = sp.get("lat");
  const lng = sp.get("lng");
  const location = sp.get("location");

  if (lat && lng) {
    apiParams.lat = parseFloat(lat);
    apiParams.lng = parseFloat(lng);
  }
  if (location) apiParams.location_search = location;

  const collection = sp.get("collection");
  if (collection) apiParams.collection = collection;

  const tag = sp.get("tag");
  if (tag) apiParams.tag = tag;

  const keyword = sp.get("keyword");
  if (keyword) apiParams.keyword = keyword;

  const priceMax = parseInt(sp.get("price_max") || String(defaultMaxPrice), 10);
  if (priceMax < defaultMaxPrice) apiParams.price_max = priceMax;

  const radiusRaw =
    sp.get("radius") || sp.get("distance_max") || String(defaultMaxDistance);
  const radius = parseInt(radiusRaw, 10);
  if (radius > 0) apiParams.radius = radius;

  const startDate = sp.get("start_date") || "";
  const endDate = sp.get("end_date") || "";
  const date = sp.get("date") || "";
  if (startDate && endDate) {
    apiParams.start_date = startDate;
    apiParams.end_date = endDate;
  } else if (date) {
    apiParams.date = date;
  }

  const participants = parseInt(sp.get("participants") || "1", 10);
  if (participants > 0) apiParams.participants = participants;

  const timePrefs = sp.getAll("time_preference");
  if (timePrefs.length > 0) apiParams.time_preference = timePrefs;

  const sortBy = sp.get("sort_by") || "relevance";
  if (sortBy && sortBy !== "relevance") apiParams.sort_by = sortBy;

  const days = sp.getAll("days");
  if (days.length > 0) apiParams.days = days;

  return apiParams;
}

/** Strip the `explore_page` key so we can compare "real" filter changes. */
function stripPageKey(queryString) {
  const p = new URLSearchParams(queryString);
  p.delete("explore_page");
  return p.toString();
}

function ExploreClientContent({
  initialCategories,
  initialClasses,
  initialTotalCount,
  initialNextPageUrl,
  initialCollections = [],
  routeParams,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isSearching, setIsSearching, selectedLocation, searchTerm } =
    useSearch();
  const { location: userLocation } = useIpGeolocation();

  // --- STATE ---
  const [displayClasses, setDisplayClasses] = useState(initialClasses);
  const [totalClassesCount, setTotalClassesCount] = useState(initialTotalCount);
  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // --- REFS (used by the IO callback so it never needs to be recreated) ---
  const scrollRootRef = useRef(null);
  const observerRef = useRef(null);
  const apiParamsRef = useRef({});
  const isInitialMount = useRef(true);
  const previousSearchParamsRef = useRef(searchParams.toString());
  const loadingMoreRef = useRef(false);
  const nextPageUrlRef = useRef(initialNextPageUrl);

  /** Stable key for "real" query params (excludes explore_page). */
  const filterKey = useMemo(
    () => stripPageKey(searchParams.toString()),
    [searchParams],
  );

  // Keep apiParamsRef in sync with the current filter key.
  useEffect(() => {
    apiParamsRef.current = buildApiParamsFromSearchParams(
      new URLSearchParams(filterKey),
    );
  }, [filterKey]);

  // ClassesDisplay reports its scroll container.
  const onClassListScrollRootReady = useCallback((el) => {
    scrollRootRef.current = el;
  }, []);

  // --- DERIVED DATA FROM URL ---
  const currentCollection = searchParams.get("collection") || "";
  const tag = searchParams.get("tag") || "";
  const currentSortBy = searchParams.get("sort_by") || "relevance";

  const currentFilters = useMemo(() => {
    const defaultMaxPrice = 500;
    const defaultMaxDistance = 50;
    return {
      pricePerClass: [
        parseInt(searchParams.get("price_min") || "0", 10),
        parseInt(
          searchParams.get("price_max") || String(defaultMaxPrice),
          10,
        ),
      ],
      distance: [
        0,
        parseInt(
          searchParams.get("radius") ||
            searchParams.get("distance_max") ||
            String(defaultMaxDistance),
          10,
        ),
      ],
      timePreference: searchParams.getAll("time_preference") || [],
      days: searchParams.getAll("days") || [],
      classType: searchParams.get("class_type") || "class",
      keyword: searchParams.get("keyword") || "",
      date: searchParams.get("date") || "",
      startDate: searchParams.get("start_date") || "",
      endDate: searchParams.get("end_date") || "",
      participants: parseInt(searchParams.get("participants") || "1", 10),
    };
  }, [searchParams]);

  // Sync server-provided initial data.
  useEffect(() => {
    if (initialClasses) {
      previousSearchParamsRef.current = searchParams.toString();
      setDisplayClasses(initialClasses);
      setTotalClassesCount(initialTotalCount);
      setNextPageUrl(initialNextPageUrl);
      nextPageUrlRef.current = initialNextPageUrl;
      setIsNavigating(false);
      setLoading(false);
      setFetchError(null);
      setIsSearching(false);
    }
  }, [initialClasses, initialTotalCount, initialNextPageUrl, setIsSearching]);

  // =====================================================================
  // FETCH — completely stable identity (no URL-derived deps).
  // The IO callback and filter effect both call this via ref.
  // =====================================================================
  const doFetch = useCallback(
    async (params, page, isMore, signal) => {
      if (isMore) {
        if (loadingMoreRef.current) return; // already loading
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await classService.searchClasses(
          { ...params, page },
          signal,
        );

        if (isMore) {
          setDisplayClasses((prev) => [...prev, ...(response.results || [])]);
        } else {
          setDisplayClasses(response.results || []);
          setTotalClassesCount(response.count || 0);
        }
        const newNext = response.next || null;
        setNextPageUrl(newNext);
        nextPageUrlRef.current = newNext;
        if (!isMore) setFetchError(null);
      } catch (error) {
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("Error fetching classes:", error);
          if (!isMore) {
            setFetchError(
              "We couldn't refresh results. Check your connection and try again.",
            );
          }
        }
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
        setIsNavigating(false);
        setIsSearching(false);
      }
    },
    [setIsSearching],
  );

  // Keep a ref so the IO callback always sees the latest without a dep.
  const doFetchRef = useRef(doFetch);
  useEffect(() => {
    doFetchRef.current = doFetch;
  }, [doFetch]);

  // =====================================================================
  // CLIENT-SIDE FILTER REFETCH — runs when real filter params change.
  // =====================================================================
  useEffect(() => {
    const controller = new AbortController();

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentStr = searchParams.toString();
    const prevStr = previousSearchParamsRef.current;

    if (currentStr === prevStr) return;

    // Only explore_page changed → not a real filter change.
    if (stripPageKey(currentStr) === stripPageKey(prevStr)) {
      previousSearchParamsRef.current = currentStr;
      return;
    }

    // Collection change is handled by server navigation, skip.
    const currentObj = Object.fromEntries(searchParams.entries());
    const prevObj = Object.fromEntries(
      new URLSearchParams(prevStr).entries(),
    );
    if (currentObj.collection !== prevObj.collection) {
      previousSearchParamsRef.current = currentStr;
      return;
    }

    setLoading(true);
    previousSearchParamsRef.current = currentStr;

    const apiParams = buildApiParamsFromSearchParams(
      new URLSearchParams(stripPageKey(currentStr)),
    );
    apiParamsRef.current = apiParams;

    doFetch(apiParams, 1, false, controller.signal);

    return () => controller.abort();
  }, [searchParams, doFetch]);

  // =====================================================================
  // INFINITE SCROLL — IntersectionObserver via callback ref.
  //
  // Using a callback ref guarantees the observer is created exactly when
  // the sentinel DOM node appears (even if ClassesDisplay is lazy-loaded).
  // The callback reads refs for ALL dynamic values so the observer never
  // needs to be torn down and recreated due to state changes.
  // =====================================================================
  const sentinelCallbackRef = useCallback((node) => {
    // Tear down previous observer if any.
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loadingMoreRef.current) return;
        const url = nextPageUrlRef.current;
        if (!url) return;
        try {
          const parsed = new URL(url);
          const page = parseInt(parsed.searchParams.get("page"), 10);
          if (!isNaN(page)) {
            doFetchRef.current(apiParamsRef.current, page, true, null);
          }
        } catch {
          /* bad URL */
        }
      },
      {
        root: scrollRootRef.current || null,
        rootMargin: "300px",
        threshold: 0,
      },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Clean up observer on unmount.
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // =====================================================================
  // HANDLERS (collection change, filter modal)
  // =====================================================================
  const getCurrentSearchString = useCallback(() => {
    if (typeof window === "undefined") return searchParams.toString();
    const q = window.location.search;
    return q ? q.slice(1) : "";
  }, [searchParams]);

  const handleCollectionChange = useCallback(
    (collectionSlug) => {
      setIsNavigating(true);
      const currentQuery = getCurrentSearchString();
      const newParams = new URLSearchParams(currentQuery);
      const currentParams = new URLSearchParams(currentQuery);

      const urlLocation = currentParams.get("location");
      const urlLat = currentParams.get("lat");
      const urlLng = currentParams.get("lng");
      if (urlLocation || urlLat || urlLng) {
        if (urlLocation) newParams.set("location", urlLocation);
        if (urlLat) newParams.set("lat", urlLat);
        if (urlLng) newParams.set("lng", urlLng);
      } else if (selectedLocation?.coordinates) {
        const loc = selectedLocation.displayName || searchTerm?.trim();
        if (loc) newParams.set("location", loc);
        newParams.set("lat", selectedLocation.coordinates.lat.toString());
        newParams.set("lng", selectedLocation.coordinates.lng.toString());
      }

      newParams.delete("category");
      newParams.delete("subcategory");

      if (collectionSlug) {
        newParams.set("collection", collectionSlug);
      } else {
        newParams.delete("collection");
      }

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [getCurrentSearchString, router, pathname, selectedLocation, searchTerm],
  );

  const handleApplyModalChanges = useCallback(
    (newFilters, newSort) => {
      setIsNavigating(true);
      const newParams = new URLSearchParams(searchParams.toString());

      [
        "price_min",
        "price_max",
        "radius",
        "distance_max",
        "time_preference",
        "days",
        "class_type",
        "keyword",
        "sort_by",
        "date",
        "start_date",
        "end_date",
        "participants",
      ].forEach((key) => newParams.delete(key));

      const defaultMaxPrice = 500;
      const defaultMaxDistance = 50;

      if (newFilters.pricePerClass[0] > 0)
        newParams.set("price_min", newFilters.pricePerClass[0].toString());
      if (newFilters.pricePerClass[1] < defaultMaxPrice)
        newParams.set("price_max", newFilters.pricePerClass[1].toString());
      if (newFilters.distance[1] !== defaultMaxDistance)
        newParams.set("radius", newFilters.distance[1].toString());
      newFilters.timePreference.forEach((tp) =>
        newParams.append("time_preference", tp),
      );
      newFilters.days.forEach((day) => newParams.append("days", day));
      if (
        newFilters.classType &&
        newFilters.classType.toLowerCase() !== "class" &&
        newFilters.classType.toLowerCase() !== "all"
      ) {
        newParams.set("class_type", newFilters.classType);
      }
      if (newFilters.keyword) newParams.set("keyword", newFilters.keyword);
      if (newSort && newSort !== "relevance") {
        newParams.set("sort_by", newSort);
      }

      if (newFilters.startDate && newFilters.endDate) {
        newParams.set("start_date", newFilters.startDate);
        newParams.set("end_date", newFilters.endDate);
      } else if (newFilters.date) {
        newParams.set("date", newFilters.date);
      }

      if (newFilters.participants > 0)
        newParams.set("participants", newFilters.participants.toString());

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // --- LOADING FLAGS ---
  const effectiveLoading = loading && !loadingMore;
  const showSkeleton = effectiveLoading || isNavigating || isSearching;

  const classesDisplayProps = useMemo(
    () => ({
      classes: displayClasses,
      collections: initialCollections,
      loading: showSkeleton,
      isNavigating,
      userLocation,
      filters: currentFilters,
      onFiltersChange: () => {},
      currentCollection,
      onCollectionChange: handleCollectionChange,
      currentSortBy,
      onApplyModalChanges: handleApplyModalChanges,
      observerTargetRef: sentinelCallbackRef,
      onClassListScrollRootReady,
      hasMorePages: !!nextPageUrl,
      isLoadingMore: loadingMore,
      province: routeParams.province,
      city: routeParams.city,
      tag,
      totalClassesCount,
    }),
    [
      displayClasses,
      initialCollections,
      showSkeleton,
      isNavigating,
      userLocation,
      currentFilters,
      currentCollection,
      handleCollectionChange,
      currentSortBy,
      handleApplyModalChanges,
      sentinelCallbackRef,
      onClassListScrollRootReady,
      nextPageUrl,
      loadingMore,
      routeParams.province,
      routeParams.city,
      tag,
      totalClassesCount,
    ],
  );

  return (
    <PageLayout>
      <ExploreHeader showOptionsWrapper={true} />
      <BreadcrumbContainer>
        <Breadcrumbs />
      </BreadcrumbContainer>
      <ContentArea>
        {fetchError && !showSkeleton && (
          <FetchErrorBanner role="alert">{fetchError}</FetchErrorBanner>
        )}
        <ClassesDisplay {...classesDisplayProps} />
      </ContentArea>
    </PageLayout>
  );
}

export default function ExploreClient(props) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <ExploreClientContent {...props} />
    </Suspense>
  );
}
