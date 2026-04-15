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
import { useReplaceSearchParams } from "@/hooks/useUrlState";
import styled from "styled-components";
import dynamic from "next/dynamic";
import ExploreHeader from "../../../components/explore/ExploreHeader";
import { classService } from "@/services/apiService";
import Breadcrumbs from "@/services/Breadcrumbs";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";
import { useSearch } from "@/context/SearchContext"; // IMPORT SEARCH CONTEXT

// Lazy load ClassesDisplay to reduce initial bundle size
const ClassesDisplay = dynamic(() => import("./ClassesDisplay"), {
  loading: () => null, // Use parent loading state instead
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
  /* Visually hidden but kept in DOM for SEO and screen readers */
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

/** Build `/classes/search/` params from explore query (must match client refetch effect). */
function buildExploreClassSearchParamsFromSp(sp) {
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

  const priceMax = parseInt(
    sp.get("price_max") || String(defaultMaxPrice),
    10,
  );
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

function stripExplorePageQuery(queryString) {
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
  const replaceExploreParams = useReplaceSearchParams();

  // Use Global Search Context for loading state and to preserve header location when switching category/collection
  const { isSearching, setIsSearching, selectedLocation, searchTerm } = useSearch();

  // Use geolocation hook - it's non-blocking as it uses async fetch
  const { location: userLocation } = useIpGeolocation();

  // --- STATE ---
  const [displayClasses, setDisplayClasses] = useState(initialClasses);
  const [totalClassesCount, setTotalClassesCount] = useState(initialTotalCount);
  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const observerTarget = useRef(null);
  /** Scroll container for class list (set by ClassesDisplay). IO must use this root — not the viewport. */
  const infiniteScrollRootRef = useRef(null);
  const apiParamsRef = useRef({});
  const isInitialMount = useRef(true);
  const previousSearchParamsRef = useRef(searchParams.toString());

  /** `explore_page` is only for deep-linking; it must not trigger a full refetch (that breaks infinite scroll). */
  const exploreQueryKeySansPage = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("explore_page");
    return p.toString();
  }, [searchParams]);

  /** Keep pagination requests aligned with current filters (independent of `explore_page` in the URL). */
  useEffect(() => {
    const sp = new URLSearchParams(exploreQueryKeySansPage);
    apiParamsRef.current = buildExploreClassSearchParamsFromSp(sp);
  }, [exploreQueryKeySansPage]);

  const [infiniteScrollRootVersion, setInfiniteScrollRootVersion] = useState(0);
  const onClassListScrollRootReady = useCallback((el) => {
    infiniteScrollRootRef.current = el;
    if (el) setInfiniteScrollRootVersion((n) => n + 1);
  }, []);

  // --- DERIVED DATA FROM URL ---
  const currentCollection = searchParams.get("collection") || "";
  const tag = searchParams.get("tag") || "";
  const currentSortBy = searchParams.get("sort_by") || "relevance";

  const currentFilters = useMemo(() => {
    const defaultMaxPrice = 500;
    const defaultMaxDistance = 50; // 50 km default; 0 was misleading (no radius sent)
    return {
      pricePerClass: [
        parseInt(searchParams.get("price_min") || "0", 10),
        parseInt(searchParams.get("price_max") || String(defaultMaxPrice), 10),
      ],
      distance: [
        0,
        parseInt(
          searchParams.get("radius") ||
            searchParams.get("distance_max") ||
            String(defaultMaxDistance),
          10
        ),
      ],
      timePreference: searchParams.getAll("time_preference") || [],
      days: searchParams.getAll("days") || [],
      classType: searchParams.get("class_type") || "class",
      keyword: searchParams.get("keyword") || "",
      // --- UPDATED: Date Handling ---
      date: searchParams.get("date") || "",
      startDate: searchParams.get("start_date") || "",
      endDate: searchParams.get("end_date") || "",
      participants: parseInt(searchParams.get("participants") || "1", 10),
    };
  }, [searchParams]);

  useEffect(() => {
    if (initialClasses) {
      // Keep in sync with the URL that produced these server props so the
      // client fetch effect does not mis-detect duplicate or stale navigations.
      previousSearchParamsRef.current = searchParams.toString();
      setDisplayClasses(initialClasses);
      setTotalClassesCount(initialTotalCount);
      setNextPageUrl(initialNextPageUrl);
      setIsNavigating(false);
      setLoading(false);
      setFetchError(null);
      // STOP GLOBAL SEARCH LOADING
      setIsSearching(false);
    }
    // searchParams read synchronously when server props update; omit from deps so
    // client-only query changes do not re-apply stale initialClasses.
  }, [initialClasses, initialTotalCount, initialNextPageUrl, setIsSearching]);

  const fetchClassesApi = useCallback(
    async (params, pageToFetch, isLoadMoreRequest, signal) => {
      if (isLoadMoreRequest) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const apiCallParams = { ...params, page: pageToFetch };

      try {
        const response = await classService.searchClasses(
          apiCallParams,
          signal
        );

        if (isLoadMoreRequest) {
          setDisplayClasses((prev) => [...prev, ...(response.results || [])]);
        } else {
          setDisplayClasses(response.results || []);
          setTotalClassesCount(response.count || 0);
        }
        setNextPageUrl(response.next);
        if (!isLoadMoreRequest) {
          replaceExploreParams({ explore_page: null });
        } else if (pageToFetch) {
          replaceExploreParams({ explore_page: pageToFetch });
        }
        if (!isLoadMoreRequest) setFetchError(null);
      } catch (error) {
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("Error fetching classes:", error);
          if (!isLoadMoreRequest) {
            setFetchError(
              "We couldn’t refresh results. Check your connection and try again."
            );
          }
        }
      } finally {
        if (signal && signal.aborted) return;
        setLoading(false);
        setLoadingMore(false);
        setIsNavigating(false);
        setIsSearching(false);
      }
    },
    [setIsSearching, replaceExploreParams]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentParamsStr = searchParams.toString();
    const prevParamsStr = previousSearchParamsRef.current;

    // Early return if params haven't changed
    if (currentParamsStr === prevParamsStr) return;

    // Pagination-only URL updates must not reset results (causes flash / broken infinite scroll).
    if (
      stripExplorePageQuery(currentParamsStr) ===
      stripExplorePageQuery(prevParamsStr)
    ) {
      previousSearchParamsRef.current = currentParamsStr;
      return;
    }

    const currentObj = Object.fromEntries(searchParams.entries());
    const prevObj = Object.fromEntries(
      new URLSearchParams(prevParamsStr).entries()
    );

    const isNavChange = currentObj.collection !== prevObj.collection;

    if (isNavChange) {
      previousSearchParamsRef.current = currentParamsStr;
      return;
    }

    // Force explicit loading for client-side filter changes
    setLoading(true);

    const sp = new URLSearchParams(exploreQueryKeySansPage);
    const apiParams = buildExploreClassSearchParamsFromSp(sp);
    apiParamsRef.current = apiParams;
    previousSearchParamsRef.current = currentParamsStr;

    fetchClassesApi(apiParams, 1, false, controller.signal);

    return () => controller.abort();
  }, [searchParams, exploreQueryKeySansPage, fetchClassesApi]);

  useEffect(() => {
    const root = infiniteScrollRootRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && nextPageUrl && !loadingMore) {
          const url = new URL(nextPageUrl);
          const nextPageToFetch = parseInt(url.searchParams.get("page"), 10);
          if (!isNaN(nextPageToFetch)) {
            fetchClassesApi(apiParamsRef.current, nextPageToFetch, true, null);
          }
        }
      },
      {
        root: root || null,
        rootMargin: "400px",
        threshold: 0,
      },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [nextPageUrl, loadingMore, fetchClassesApi, infiniteScrollRootVersion]);

  // Read current URL at call time to avoid stale closure when child calls this after location change
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

      // Keep location consistent: use actual current URL (avoids stale closure)
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
    [getCurrentSearchString, router, pathname, selectedLocation, searchTerm]
  );

  const handleApplyModalChanges = useCallback(
    (newFilters, newSort) => {
      setIsNavigating(true);
      const newParams = new URLSearchParams(searchParams.toString());

      // Clear existing filter keys
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
      // Only put radius in URL when different from default (cleaner URLs)
      if (newFilters.distance[1] !== defaultMaxDistance)
        newParams.set("radius", newFilters.distance[1].toString());
      newFilters.timePreference.forEach((tp) =>
        newParams.append("time_preference", tp)
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

      // --- UPDATED: Update URL with Range Params ---
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
    [searchParams, pathname, router]
  );

  // Combine all loading states
  const effectiveLoading = loading && !loadingMore;
  const showSkeleton = effectiveLoading || isNavigating || isSearching;

  // Memoize classes display props to prevent unnecessary re-renders
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
      observerTargetRef: observerTarget,
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
      observerTarget,
      onClassListScrollRootReady,
      nextPageUrl,
      loadingMore,
      routeParams.province,
      routeParams.city,
      tag,
      totalClassesCount,
    ]
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
