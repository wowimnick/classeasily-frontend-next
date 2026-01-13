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
import styled from "styled-components";
import ExploreHeader from "../../../components/explore/ExploreHeader";
import ClassesDisplay from "./ClassesDisplay";
import { classService } from "@/services/apiService";
import Breadcrumbs from "@/services/Breadcrumbs";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";
import { useSearch } from "@/context/SearchContext"; // IMPORT SEARCH CONTEXT

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

const BreadcrumbContainer = styled.div`
  padding: 0 2.5rem;
  border-bottom: 1px solid #f0f0f0;

  @media (max-width: 1048px) {
    padding: 0 1rem;
  }
`;

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

  // Use Global Search Context to handle header search loading state
  const { isSearching, setIsSearching } = useSearch();

  const { location: userLocation } = useIpGeolocation();

  // --- STATE ---
  const [displayClasses, setDisplayClasses] = useState(initialClasses);
  const [totalClassesCount, setTotalClassesCount] = useState(initialTotalCount);
  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const observerTarget = useRef(null);
  const apiParamsRef = useRef({});
  const isInitialMount = useRef(true);
  const previousSearchParamsRef = useRef(searchParams.toString());

  // --- DERIVED DATA FROM URL ---
  const currentCategory = searchParams.get("category") || "all";
  const currentSubcategory = searchParams.get("subcategory") || "";
  const currentCollection = searchParams.get("collection") || "";
  const tag = searchParams.get("tag") || "";
  const currentSortBy = searchParams.get("sort_by") || "relevance";

  const currentFilters = useMemo(() => {
    const defaultMaxPrice = 500;
    const defaultMaxDistance = 0;
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
      setDisplayClasses(initialClasses);
      setTotalClassesCount(initialTotalCount);
      setNextPageUrl(initialNextPageUrl);
      setIsNavigating(false);
      setLoading(false);
      // STOP GLOBAL SEARCH LOADING
      setIsSearching(false);
      previousSearchParamsRef.current = searchParams.toString();
    }
  }, [
    initialClasses,
    initialTotalCount,
    initialNextPageUrl,
    searchParams,
    setIsSearching,
  ]);

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
      } catch (error) {
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("Error fetching classes:", error);
        }
      } finally {
        if (signal && signal.aborted) return;
        setLoading(false);
        setLoadingMore(false);
        setIsNavigating(false);
        setIsSearching(false);
      }
    },
    [setIsSearching]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentParamsStr = searchParams.toString();
    const prevParamsStr = previousSearchParamsRef.current;

    if (currentParamsStr === prevParamsStr) return;

    const currentObj = Object.fromEntries(searchParams.entries());
    const prevObj = Object.fromEntries(
      new URLSearchParams(prevParamsStr).entries()
    );

    const isNavChange =
      currentObj.category !== prevObj.category ||
      currentObj.subcategory !== prevObj.subcategory ||
      currentObj.collection !== prevObj.collection;

    if (isNavChange) {
      return;
    }

    // Force explicit loading for client-side filter changes
    setLoading(true);

    const apiParams = {};

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const location = searchParams.get("location");

    if (lat && lng) {
      apiParams.lat = parseFloat(lat);
      apiParams.lng = parseFloat(lng);
    }
    if (location) apiParams.location_search = location;

    if (currentCollection) {
      apiParams.collection = currentCollection;
    } else if (currentCategory && currentCategory !== "all") {
      apiParams.category_key = currentCategory;
      if (currentSubcategory) {
        apiParams.subcategory_key = currentSubcategory;
      }
    }

    if (tag) apiParams.tag = tag;
    if (currentFilters.keyword) apiParams.keyword = currentFilters.keyword;
    if (currentFilters.pricePerClass[1] < 500)
      apiParams.price_max = currentFilters.pricePerClass[1];
    if (currentFilters.distance[1] > 0)
      apiParams.radius = currentFilters.distance[1];

    // --- UPDATED: Add Date Ranges to Client API Params ---
    if (currentFilters.startDate && currentFilters.endDate) {
      apiParams.start_date = currentFilters.startDate;
      apiParams.end_date = currentFilters.endDate;
    } else if (currentFilters.date) {
      apiParams.date = currentFilters.date;
    }

    if (currentFilters.participants > 0)
      apiParams.participants = currentFilters.participants;
    if (currentFilters.timePreference.length > 0)
      apiParams.time_preference = currentFilters.timePreference;
    if (currentSortBy && currentSortBy !== "relevance") {
      apiParams.sort_by = currentSortBy;
    }

    apiParamsRef.current = apiParams;
    previousSearchParamsRef.current = currentParamsStr;

    fetchClassesApi(apiParams, 1, false, controller.signal);

    return () => controller.abort();
  }, [
    searchParams,
    currentCategory,
    currentSubcategory,
    currentCollection,
    tag,
    currentSortBy,
    currentFilters,
    fetchClassesApi,
  ]);

  useEffect(() => {
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
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [nextPageUrl, loadingMore, fetchClassesApi]);

  const handleCategoryChange = useCallback(
    (newCategoryKey, newSubcategoryKey) => {
      setIsNavigating(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("collection");

      if (newCategoryKey && newCategoryKey !== "all") {
        newParams.set("category", newCategoryKey);
      } else {
        newParams.delete("category");
      }

      if (newSubcategoryKey) {
        newParams.set("subcategory", newSubcategoryKey);
      } else {
        newParams.delete("subcategory");
      }

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleCollectionChange = useCallback(
    (collectionSlug) => {
      setIsNavigating(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("category");
      newParams.delete("subcategory");

      if (collectionSlug) {
        newParams.set("collection", collectionSlug);
      } else {
        newParams.delete("collection");
      }

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
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
      const defaultMaxDistance = 0;

      if (newFilters.pricePerClass[0] > 0)
        newParams.set("price_min", newFilters.pricePerClass[0].toString());
      if (newFilters.pricePerClass[1] < defaultMaxPrice)
        newParams.set("price_max", newFilters.pricePerClass[1].toString());
      if (newFilters.distance[1] > defaultMaxDistance)
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

  return (
    <PageLayout>
      <ExploreHeader showOptionsWrapper={true} />
      <BreadcrumbContainer>
        <Breadcrumbs />
      </BreadcrumbContainer>
      <ContentArea>
        <ClassesDisplay
          classes={displayClasses}
          categories={initialCategories}
          collections={initialCollections}
          loading={showSkeleton}
          isNavigating={isNavigating} // Still pass explicitly if needed, but 'loading' covers it now
          userLocation={userLocation}
          filters={currentFilters}
          onFiltersChange={() => {}}
          currentCategory={currentCategory}
          currentSubcategory={currentSubcategory}
          onCategoryChange={handleCategoryChange}
          currentCollection={currentCollection}
          onCollectionChange={handleCollectionChange}
          currentSortBy={currentSortBy}
          onApplyModalChanges={handleApplyModalChanges}
          observerTargetRef={observerTarget}
          hasMorePages={!!nextPageUrl}
          isLoadingMore={loadingMore}
          province={routeParams.province}
          city={routeParams.city}
          tag={tag}
          totalClassesCount={totalClassesCount}
        />
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
