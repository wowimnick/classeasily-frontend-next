"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
  useTransition,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styled from "styled-components";
import ExploreHeader from "../../../components/explore/ExploreHeader";
import ClassesDisplay from "./ClassesDisplay";
import { classService } from "@/services/apiService";
import Breadcrumbs from "@/services/Breadcrumbs";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";
import { searchClassesAction } from "../actions";

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
  routeParams,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { location: userLocation, loading: locationLoading } =
    useIpGeolocation();

  const [displayClasses, setDisplayClasses] = useState(initialClasses);
  const [totalClassesCount, setTotalClassesCount] = useState(initialTotalCount);

  const availableCategories = useMemo(
    () => initialCategories,
    [initialCategories]
  );

  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const observerTarget = useRef(null);
  const apiParamsRef = useRef({});
  const isInitialMount = useRef(true);
  const previousSearchParamsRef = useRef(searchParams.toString());

  const currentCategory = useMemo(
    () => searchParams.get("category") || "all",
    [searchParams]
  );
  const currentSubcategory = useMemo(
    () => searchParams.get("subcategory") || "",
    [searchParams]
  );
  const tag = useMemo(() => searchParams.get("tag") || "", [searchParams]);
  const currentSortBy = useMemo(
    () => searchParams.get("sort_by") || "relevance",
    [searchParams]
  );
  const currentParticipants = useMemo(() => {
    const p = parseInt(searchParams.get("participants") || "1", 10);
    return Number.isInteger(p) && p > 0 ? p : 1;
  }, [searchParams]);

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
      date: searchParams.get("date") || "",
      participants: currentParticipants,
    };
  }, [searchParams, currentParticipants]);

  const fetchClassesApi = useCallback(
    async (params, pageToFetch, isLoadMoreRequest, signal) => {
      if (isLoadMoreRequest) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setDisplayClasses([]);
        setCurrentPage(1);
        setNextPageUrl(null);
        setTotalClassesCount(0);
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
        setCurrentPage(pageToFetch);
      } catch (error) {
        if (error.name === "AbortError" || error.name === "CanceledError") {
          console.log("Fetch request was aborted.");
          return;
        }
        console.error("Error fetching classes:", error);
        if (!isLoadMoreRequest) {
          setDisplayClasses([]);
          setTotalClassesCount(0);
        }
      } finally {
        if (signal && signal.aborted) return;

        setIsNavigating(false);
        if (isLoadMoreRequest) {
          setLoadingMore(false);
        } else {
          setTimeout(() => setLoading(false), 150);
        }
      }
    },
    []
  );

  // CRITICAL FIX: Only fetch on filter changes, NOT on category/subcategory changes
  // Category/subcategory changes should trigger server-side navigation
  useEffect(() => {
    const controller = new AbortController();

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialClasses.length > 0) {
        previousSearchParamsRef.current = searchParams.toString();
        return;
      }
    }

    // Check what changed
    const currentParams = searchParams.toString();
    const previousParams = previousSearchParamsRef.current;

    if (currentParams === previousParams) {
      return;
    }

    const currentParamsObj = Object.fromEntries(searchParams.entries());
    const previousParamsObj = Object.fromEntries(
      new URLSearchParams(previousParams).entries()
    );

    // Check if only category or subcategory changed
    const categoryChanged =
      currentParamsObj.category !== previousParamsObj.category;
    const subcategoryChanged =
      currentParamsObj.subcategory !== previousParamsObj.subcategory;

    // If ONLY category/subcategory changed, DON'T fetch client-side
    // The page will be re-rendered server-side with fresh cached data
    const otherParamsChanged = Object.keys(currentParamsObj).some((key) => {
      if (key === "category" || key === "subcategory") return false;
      return currentParamsObj[key] !== previousParamsObj[key];
    });

    if ((categoryChanged || subcategoryChanged) && !otherParamsChanged) {
      console.log(
        "[ExploreClient] Category/subcategory changed - relying on server-side data"
      );
      // BUG FIX: Do NOT update previousSearchParamsRef here. 
      // We must let the prop-sync effect handle the update once data arrives.
      return;
    }

    // For other filter changes, fetch client-side
    const apiParams = {};

    const latFromUrl = searchParams.get("lat");
    const lngFromUrl = searchParams.get("lng");
    const locationDisplayNameFromUrl = searchParams.get("location");

    if (latFromUrl && lngFromUrl) {
      apiParams.lat = parseFloat(latFromUrl);
      apiParams.lng = parseFloat(lngFromUrl);
    }

    if (locationDisplayNameFromUrl) {
      apiParams.location_search = locationDisplayNameFromUrl;
    }

    if (currentCategory && currentCategory !== "all") {
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
    if (currentFilters.date) apiParams.date = currentFilters.date;
    if (currentFilters.participants > 0)
      apiParams.participants = currentFilters.participants;
    if (currentFilters.timePreference.length > 0)
      apiParams.time_preference = currentFilters.timePreference;

    if (currentSortBy && currentSortBy !== "relevance") {
      apiParams.sort_by = currentSortBy;
    }

    apiParamsRef.current = apiParams;

    console.log("[ExploreClient] Fetching with filters:", apiParams);
    setCurrentPage(1);
    setNextPageUrl(null);
    previousSearchParamsRef.current = currentParams;

    fetchClassesApi(apiParams, 1, false, controller.signal);

    return () => controller.abort();
  }, [
    searchParams,
    fetchClassesApi,
    currentCategory,
    currentSubcategory,
    tag,
    currentSortBy,
    currentFilters,
    initialClasses.length,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && nextPageUrl && !loadingMore) {
          const url = new URL(nextPageUrl);
          const nextPageToFetch = parseInt(url.searchParams.get("page"), 10);
          if (!isNaN(nextPageToFetch)) {
            console.log(`[ExploreClient] Loading page ${nextPageToFetch}`);
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
    async (newCategoryKey, newSubcategoryKey) => {
      setIsNavigating(true);

      const newParams = new URLSearchParams(searchParams.toString());

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

      // Build API params for server action
      const apiParams = {};

      const latFromUrl = searchParams.get("lat");
      const lngFromUrl = searchParams.get("lng");
      const locationDisplayNameFromUrl = searchParams.get("location");

      if (latFromUrl && lngFromUrl) {
        apiParams.lat = parseFloat(latFromUrl);
        apiParams.lng = parseFloat(lngFromUrl);
      }

      if (locationDisplayNameFromUrl) {
        apiParams.location_search = locationDisplayNameFromUrl;
      }

      if (newCategoryKey && newCategoryKey !== "all") {
        apiParams.category_key = newCategoryKey;
        if (newSubcategoryKey) {
          apiParams.subcategory_key = newSubcategoryKey;
        }
      }

      console.log(
        "[ExploreClient] Fetching category data via server action:",
        apiParams
      );

      // Use server action to get cached data
      startTransition(async () => {
        try {
          const result = await searchClassesAction(apiParams);

          if (result.success) {
            setDisplayClasses(result.results);
            setTotalClassesCount(result.count);
            setNextPageUrl(result.next);
            setCurrentPage(1);
            apiParamsRef.current = apiParams;
          }
        } catch (error) {
          console.error("[ExploreClient] Server action error:", error);
        } finally {
          setIsNavigating(false);
        }
      });

      // Update URL without navigation
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, startTransition]
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
      if (newFilters.date) newParams.set("date", newFilters.date);
      if (newFilters.participants > 0)
        newParams.set("participants", newFilters.participants.toString());

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Update display when server provides new initial data
  useEffect(() => {
    // BUG FIX: Removed restrictive conditions that prevented updates if props changed
    // but ref was already updated.
    if (!loading && !isNavigating && initialClasses) {
      const currentParams = searchParams.toString();
      const previousParams = previousSearchParamsRef.current;

      if (currentParams !== previousParams) {
        console.log("[ExploreClient] Using fresh server data");
        setDisplayClasses(initialClasses);
        setTotalClassesCount(initialTotalCount);
        setNextPageUrl(initialNextPageUrl);
        // Sync ref here to verify we have displayed the data for this URL
        previousSearchParamsRef.current = currentParams;
      }
    }
  }, [
    initialClasses,
    initialTotalCount,
    initialNextPageUrl,
    loading,
    isNavigating,
    searchParams,
  ]);

  return (
    <PageLayout>
      <ExploreHeader showOptionsWrapper={true} />
      <BreadcrumbContainer>
        <Breadcrumbs />
      </BreadcrumbContainer>
      <ContentArea>
        <ClassesDisplay
          classes={displayClasses}
          categories={availableCategories}
          loading={loading && !loadingMore}
          isNavigating={isNavigating}
          userLocation={userLocation}
          filters={currentFilters}
          onFiltersChange={() => {}}
          currentCategory={currentCategory}
          currentSubcategory={currentSubcategory}
          onCategoryChange={handleCategoryChange}
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