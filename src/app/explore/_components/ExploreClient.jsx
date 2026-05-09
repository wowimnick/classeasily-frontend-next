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
import { BP, down } from "@/styles/breakpoints";
import { filterCollectionsWithActiveClasses } from "@/lib/filterCollectionsWithActiveClasses";
import {
  peekExploreSearchResults,
  stashExploreSearchResults,
} from "@/lib/exploreResultsCache";

import { ClassesContentSkeleton } from "./ExploreCardsSkeletonClient";

const ClassesDisplay = dynamic(() => import("./ClassesDisplay"), {
  loading: () => <ClassesContentSkeleton />,
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

  ${down(BP.TABLET)} {
    padding: 0 1rem;
  }
`;

/** Map URL class_type to FilterModal option ids (canonical slugs + backend labels). */
function exploreClassTypeUrlToFilterId(raw) {
  if (!raw || typeof raw !== "string") return "class";
  const t = raw.trim();
  if (!t) return "class";
  const lower = t.toLowerCase();
  if (lower === "class" || lower === "all") return "class";
  if (lower === "single_session") return "single_session";
  if (lower === "full_course") return "full_course";
  if (t === "Single Session") return "single_session";
  if (t === "Full Course") return "full_course";
  if (lower === "single session") return "single_session";
  if (lower === "full course") return "full_course";
  if (lower === "single") return "single_session";
  if (lower === "course") return "full_course";
  return "class";
}

/** Build API params from URL search params. */
function buildApiParamsFromSearchParams(sp) {
  const apiParams = {};
  const defaultMaxPrice = 500;
  const defaultMaxDistance = 100;

  const lat = sp.get("lat");
  const lng = sp.get("lng");
  const location = sp.get("location");

  if (lat && lng) {
    apiParams.lat = parseFloat(lat);
    apiParams.lng = parseFloat(lng);
  }
  if (location) apiParams.location_search = location;

  const collectionSlugs = sp.getAll("collection").filter(Boolean);
  if (collectionSlugs.length === 1) {
    apiParams.collection = collectionSlugs[0];
  } else if (collectionSlugs.length > 1) {
    apiParams.collection = collectionSlugs;
  }

  const tag = sp.get("tag");
  if (tag) apiParams.tag = tag;

  const subs = sp.getAll("sub").filter(Boolean);
  if (subs.length) apiParams.sub = subs;

  const keyword = sp.get("keyword");
  if (keyword) apiParams.keyword = keyword;

  const priceMax = parseInt(sp.get("price_max") || String(defaultMaxPrice), 10);
  if (priceMax < defaultMaxPrice) apiParams.price_max = priceMax;

  const priceMin = parseInt(sp.get("price_min") || "0", 10);
  if (!Number.isNaN(priceMin) && priceMin > 0) apiParams.price_min = priceMin;

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

  const classTypeRaw = sp.get("class_type")?.trim();
  if (classTypeRaw) {
    const lower = classTypeRaw.toLowerCase();
    if (lower !== "class" && lower !== "all") {
      apiParams.class_type = classTypeRaw;
    }
  }

  return apiParams;
}

/** Match modal Apply — builds query string for preview/API without navigating. */
function mergeModalFiltersIntoSearchParams(baseSearchParams, newFilters, newSort) {
  const newParams = new URLSearchParams(baseSearchParams.toString());

  [
    "price_min",
    "price_max",
    "radius",
    "distance_max",
    "time_preference",
    "days",
    "class_type",
    "sort_by",
    "date",
    "start_date",
    "end_date",
    "participants",
  ].forEach((key) => newParams.delete(key));

  const defaultMaxPrice = 500;
  const defaultMaxDistance = 100;

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
    newFilters.classType !== "class" &&
    newFilters.classType !== "all"
  ) {
    newParams.set("class_type", newFilters.classType);
  }
  if (newSort && newSort !== "relevance") {
    newParams.set("sort_by", newSort);
  }

  if (newFilters.startDate && newFilters.endDate) {
    newParams.set("start_date", newFilters.startDate);
    newParams.set("end_date", newFilters.endDate);
  } else if (newFilters.date) {
    newParams.set("date", newFilters.date);
  }

  if (newFilters.participants > 1)
    newParams.set("participants", newFilters.participants.toString());

  return newParams;
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
  initialCollectionsIWant = [],
  routeParams,
}) {
  const collectionsIWantForExplore = useMemo(
    () => filterCollectionsWithActiveClasses(initialCollectionsIWant),
    [initialCollectionsIWant],
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isSearching, setIsSearching, selectedLocation, searchTerm } =
    useSearch();
  const { location: userLocation } = useIpGeolocation();

  const [displayClasses, setDisplayClasses] = useState(initialClasses);
  const [totalClassesCount, setTotalClassesCount] = useState(initialTotalCount);
  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
  const currentCollections = useMemo(
    () => [...searchParams.getAll("collection")].filter(Boolean),
    [searchParams],
  );
  const tag = searchParams.get("tag") || "";
  const currentSortBy = searchParams.get("sort_by") || "relevance";

  const currentFilters = useMemo(() => {
    const defaultMaxPrice = 500;
    const defaultMaxDistance = 100;
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
      classType: exploreClassTypeUrlToFilterId(
        searchParams.get("class_type") || "",
      ),
      keyword: "",
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

        if (!isMore && typeof window !== "undefined") {
          try {
            const canon = stripPageKey(window.location.search.slice(1) || "");
            stashExploreSearchResults(canon, {
              results: response.results || [],
              count: response.count || 0,
              next: newNext,
            });
          } catch {
            /* non-fatal */
          }
        }
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

    const collectionKeyFromSp = (sp) =>
      [...sp.getAll("collection").filter(Boolean)].sort().join("\u0001");

    if (collectionKeyFromSp(searchParams) !== collectionKeyFromSp(new URLSearchParams(prevStr))) {
      previousSearchParamsRef.current = currentStr;
      return;
    }

    previousSearchParamsRef.current = currentStr;

    const canonKey = stripPageKey(currentStr);
    const cached = peekExploreSearchResults(canonKey);
    if (cached?.results?.length) {
      setDisplayClasses(cached.results);
      setTotalClassesCount(cached.count ?? 0);
      setNextPageUrl(cached.next ?? null);
      nextPageUrlRef.current = cached.next ?? null;
    }

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
    (collectionSlugOrSlugs) => {
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
      newParams.delete("sub");

      newParams.delete("collection");
      const slugList = Array.isArray(collectionSlugOrSlugs)
        ? collectionSlugOrSlugs.filter(Boolean)
        : collectionSlugOrSlugs
          ? [collectionSlugOrSlugs]
          : [];
      slugList.forEach((slug) => newParams.append("collection", slug));

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [getCurrentSearchString, router, pathname, selectedLocation, searchTerm],
  );

  const handleApplyTimePreferences = useCallback(
    (timePreferenceIds) => {
      setIsNavigating(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("time_preference");
      (timePreferenceIds || []).forEach((id) => {
        if (id) newParams.append("time_preference", id);
      });
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const handleApplyModalChanges = useCallback(
    (newFilters, newSort) => {
      setIsNavigating(true);
      const newParams = mergeModalFiltersIntoSearchParams(
        searchParams,
        newFilters,
        newSort,
      );
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  /** Debounced preview for explore bar — merges draft collection or time prefs onto current URL. */
  const previewExploreBarCount = useCallback(
    async (overrides = {}, signal) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("explore_page");

      if (overrides.collectionSlugs !== undefined) {
        sp.delete("collection");
        (overrides.collectionSlugs || []).forEach((s) => {
          if (s) sp.append("collection", s);
        });
      } else if (overrides.collectionSlug !== undefined) {
        sp.delete("collection");
        if (overrides.collectionSlug) sp.append("collection", overrides.collectionSlug);
      }
      if (overrides.timePreferenceIds !== undefined) {
        sp.delete("time_preference");
        (overrides.timePreferenceIds || []).forEach((id) => {
          if (id) sp.append("time_preference", id);
        });
      }

      const apiParams = buildApiParamsFromSearchParams(sp);
      const response = await classService.searchClassesCount(
        { ...apiParams, page: 1 },
        signal,
      );
      return typeof response.count === "number" ? response.count : 0;
    },
    [searchParams],
  );

  /** Preview count for filter modal temp state (matches Apply merge rules). */
  const previewFilterModalCount = useCallback(
    async (newFilters, newSort, signal) => {
      const merged = mergeModalFiltersIntoSearchParams(
        searchParams,
        newFilters,
        newSort,
      );
      merged.delete("explore_page");
      const apiParams = buildApiParamsFromSearchParams(merged);
      const response = await classService.searchClassesCount(
        { ...apiParams, page: 1 },
        signal,
      );
      return typeof response.count === "number" ? response.count : 0;
    },
    [searchParams],
  );

  // --- LOADING FLAGS ---
  const effectiveLoading = loading && !loadingMore;
  const showSkeleton =
    isNavigating ||
    ((effectiveLoading || isSearching) && displayClasses.length === 0);

  const classesDisplayProps = useMemo(
    () => ({
      classes: displayClasses,
      collections: initialCollections,
      collectionsIWant: collectionsIWantForExplore,
      loading: showSkeleton,
      isNavigating,
      userLocation,
      filters: currentFilters,
      onFiltersChange: () => {},
      currentCollections,
      onCollectionChange: handleCollectionChange,
      currentSortBy,
      onApplyModalChanges: handleApplyModalChanges,
      onApplyTimePreferences: handleApplyTimePreferences,
      observerTargetRef: sentinelCallbackRef,
      onClassListScrollRootReady,
      hasMorePages: !!nextPageUrl,
      isLoadingMore: loadingMore,
      province: routeParams.province,
      city: routeParams.city,
      tag,
      totalClassesCount,
      isFilterModalOpen,
      setIsFilterModalOpen,
      previewExploreBarCount,
      previewFilterModalCount,
    }),
    [
      displayClasses,
      initialCollections,
      collectionsIWantForExplore,
      showSkeleton,
      isNavigating,
      userLocation,
      currentFilters,
      currentCollections,
      handleCollectionChange,
      currentSortBy,
      handleApplyModalChanges,
      handleApplyTimePreferences,
      sentinelCallbackRef,
      onClassListScrollRootReady,
      nextPageUrl,
      loadingMore,
      routeParams.province,
      routeParams.city,
      tag,
      totalClassesCount,
      isFilterModalOpen,
      setIsFilterModalOpen,
      previewExploreBarCount,
      previewFilterModalCount,
    ],
  );

  return (
    <PageLayout>
      {/* unifiedExploreChrome: header + filter bar chrome — Explore only (see ClientHeader). */}
      <ExploreHeader showOptionsWrapper unifiedExploreChrome />
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
