import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, List, SearchX } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import HomeClassCard from "../../../components/homepage/HomeClassCard.jsx";
import {
  registerScrollGetter,
  restoreScroll,
} from "@/lib/scrollRestoration";
import ExploreCategories from "./ExploreCategories.jsx";
import {
  ClassesContentSkeleton,
  SkeletonClassSingleCard,
} from "./ExplorePageSkeleton.jsx";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader.jsx";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";
import { BP, down, up } from "@/styles/breakpoints";
import { formatCollectionDisplayName } from "@/context/SearchContext";

// Lazy load map component
const MapDisplay = dynamic(() => import("./MapDisplay.jsx"), {
  ssr: false,
  loading: () => (
    <LoadingContainer>
      <GlobalLoaderWithoutInlineStyles />
    </LoadingContainer>
  ),
});

const GridContainer = styled.div`
  display: grid;
  /* Desktop: keep two tracks so the map column can slide in; collapse to 0fr when hidden */
  grid-template-columns: ${({ $isMapVisible }) =>
    $isMapVisible
      ? "minmax(0, 1fr) minmax(200px, 40%)"
      : "minmax(0, 1fr) minmax(0, 0fr)"};
  width: 100%;
  flex: 1 1 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
  /* No transition on grid-template-columns: animating column widths reflows the
     class card grid on every frame while the map also slides — feels broken.
     Layout snaps; only the map panel uses motion (slide in/out). */

  ${down(BP.EXPLORE_NARROW)} {
    grid-template-columns: ${({ $isMapVisible }) =>
      $isMapVisible
        ? "minmax(0, 1fr) minmax(200px, 35%)"
        : "minmax(0, 1fr) minmax(0, 0fr)"};
  }
  ${down(BP.TABLET)} {
    grid-template-columns: 1fr;
  }
`;

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
`;

const CategoriesWrapper = styled.div`
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 90;
  background-color: #ffffff;
  transition: background-color 0.35s ease;
`;

const ClassGridWrapper = styled.div`
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.5rem 2.5rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
  position: relative;
  background: #ffffff;
  /* Size container so card columns respond to this pane (e.g. map open), not only viewport */
  container-type: inline-size;
  container-name: explore-cards;
  &::-webkit-scrollbar {
    display: none;
  }

  ${down(BP.MOBILE)} {
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
  }

  ${down(BP.TABLET)} {
    padding: 24px;
  }
`;

/**
 * Equal-width columns from container inline-size (no ragged auto-fill mins).
 * Thresholds: n × ~260px min card + (n−1) × 24px gap — columns jump only when another fits.
 */
const ClassGrid = styled.div`
  display: grid;
  width: 100%;
  column-gap: 24px;
  row-gap: 40px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

  @supports (container-type: inline-size) {
    grid-template-columns: 1fr;

    @container explore-cards (min-width: 544px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @container explore-cards (min-width: 828px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @container explore-cards (min-width: 1112px) {
      grid-template-columns: repeat(4, 1fr);
    }
    @container explore-cards (min-width: 1396px) {
      grid-template-columns: repeat(5, 1fr);
    }
    @container explore-cards (min-width: 1680px) {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  ${down(BP.TABLET)} {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
`;

/* Cards fill grid cells; width comes from the column track. */
const CardGridItem = styled.div`
  width: 100%;
  min-width: 0;

  & > a,
  & > div {
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
`;

const MapContainer = styled.div`
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 25px;
  box-sizing: border-box;
  min-width: 0;

  ${up(BP.TABLET)} {
    display: block;
    opacity: ${({ $isMapVisible }) => ($isMapVisible ? 1 : 0)};
    pointer-events: ${({ $isMapVisible }) => ($isMapVisible ? "auto" : "none")};
    transition: opacity 0.25s ease;
  }

  ${down(BP.TABLET)} {
    /* Mobile map mounts in a dedicated motion shell (shared layout with FAB). */
    display: none;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
`;

const mobileExploreMapFabBase = css`
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.75);
  color: #222;
  border: 1px solid rgba(255, 255, 255, 0.125);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  align-items: center;
  gap: 8px;
  &:hover {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  }
`;

const MobileMapToggle = styled.button`
  ${mobileExploreMapFabBase}
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  width: max-content;
  z-index: 1001;
  display: none;
  isolation: isolate;
  ${down(BP.TABLET)} {
    display: inline-flex;
  }
`;

/** Same chrome as the FAB; sits inside the fullscreen map shell (absolute, not fixed). */
const MobileMapListFab = styled.button`
  ${mobileExploreMapFabBase}
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  width: max-content;
  z-index: 2;
  display: inline-flex;
`;

const MobileMapFullscreenShell = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  border-radius: 0;
  will-change: transform;
`;

const exploreMobileMapMorphTransition = {
  type: "spring",
  stiffness: 440,
  damping: 40,
};

// --- New No Results Styled Components (without framer-motion for better performance) ---

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  min-height: 400px;
  margin-top: 40px;
  opacity: 1;
  animation: fadeIn 0.4s ease-in;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const EmptyIconWrapper = styled.div`
  color: #dddddd;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
`;

const EmptyHeading = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #222222;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
`;

const EmptySubtext = styled.p`
  font-size: 16px;
  color: #717171;
  max-width: 380px;
  margin: 0;
  line-height: 1.5;
`;

// --- Updated No Results Component (simplified, no framer-motion) ---

const NoResultsView = () => {
  return (
    <EmptyStateContainer>
      <EmptyIconWrapper>
        <SearchX size={48} strokeWidth={1.5} />
      </EmptyIconWrapper>

      <EmptyHeading>
        No exact matches
      </EmptyHeading>

      <EmptySubtext>
        Try changing or removing some of your filters to find the perfect
        experience.
      </EmptySubtext>
    </EmptyStateContainer>
  );
};

const ClassesDisplay = ({
  classes = [],
  collections = [],
  collectionsIWant = [],
  loading,
  isNavigating,
  userLocation,
  filters,
  onFiltersChange,
  currentCollections = [],
  onCollectionChange,
  currentSortBy,
  onApplyModalChanges,
  onApplyTimePreferences,
  observerTargetRef,
  onClassListScrollRootReady,
  hasMorePages,
  isLoadingMore,
  province,
  city,
  tag,
  totalClassesCount,
  isFilterModalOpen,
  setIsFilterModalOpen,
  previewExploreBarCount,
  previewFilterModalCount,
}) => {
  // Use geolocation hook but don't block rendering on it
  const { location: ipLocationHook } = useIpGeolocation();
  // Prefer userLocation from parent, fallback to hook
  const ipLocation = userLocation || ipLocationHook;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gridWrapperRef = useRef(null);

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  /** Keeps the desktop two-column grid until the map panel finishes sliding out (see AnimatePresence onExitComplete). */
  const [holdDesktopMapSlot, setHoldDesktopMapSlot] = useState(false);

  const pathnameWithSearch = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

  const desktopMapUsesGridSlot =
    !isMobile && (isMapVisible || holdDesktopMapSlot);

  const collectionDisplayName = useMemo(() => {
    const slugs = (currentCollections || []).filter(Boolean);
    if (!slugs.length) return null;
    const labels = slugs.map((slug) => {
      const fromFeatured = collections?.find((c) => c.slug === slug);
      if (fromFeatured?.name) return fromFeatured.name;
      const fromWant = collectionsIWant?.find((c) => c.slug === slug);
      if (fromWant?.name) return fromWant.name;
      return formatCollectionDisplayName(slug);
    });
    if (labels.length === 1) return labels[0];
    return `${labels.slice(0, 2).join(" · ")}${labels.length > 2 ? ` +${labels.length - 2}` : ""}`;
  }, [currentCollections, collections, collectionsIWant]);

  useEffect(() => {
    const unregister = registerScrollGetter(
      () => gridWrapperRef.current?.scrollTop ?? 0
    );
    return unregister;
  }, []);

  useLayoutEffect(() => {
    onClassListScrollRootReady?.(gridWrapperRef.current);
    return () => onClassListScrollRootReady?.(null);
  }, [onClassListScrollRootReady]);

  useEffect(() => {
    restoreScroll(pathnameWithSearch, gridWrapperRef);
    // Only run on mount: we have one saved position per path when returning from class page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll list back to top when collection selection changes
  useEffect(() => {
    gridWrapperRef.current?.scrollTo(0, 0);
  }, [currentCollections.join("|")]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= BP.TABLET;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMap(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMapVisible) setHoldDesktopMapSlot(false);
  }, [isMapVisible]);

  useEffect(() => {
    if (isMobile) setHoldDesktopMapSlot(false);
  }, [isMobile]);

  // Defer map briefly to prioritize LCP, then load map sooner for better UX
  useEffect(() => {
    const loadMap = () => {
      setTimeout(() => setShouldLoadMap(true), 800);
    };

    if (typeof window !== "undefined" && window.requestIdleCallback) {
      window.requestIdleCallback(loadMap, { timeout: 1200 });
    } else {
      loadMap();
    }
  }, []);

  // Only load map when actually visible to improve initial page load
  useEffect(() => {
    if (!isMobile && isMapVisible) {
      setMapKey((prev) => prev + 1);
    }
  }, [isMapVisible, isMobile]);

  useEffect(() => {
    if (isMobile && showMap) {
      setMapKey((prev) => prev + 1);
    }
  }, [showMap, isMobile]);

  const uniqueClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    
    const seen = new Set();
    const result = [];
    // Use for loop for better performance
    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
      if (!seen.has(classItem.classId)) {
        seen.add(classItem.classId);
        result.push(classItem);
      }
    }
    return result;
  }, [classes]);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null)
      return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const classesWithDistance = useMemo(() => {
    if (!uniqueClasses || uniqueClasses.length === 0) return [];
    
    // Always return classes immediately, even without location
    // Distance calculation can happen later without blocking render
    if (!ipLocation) return uniqueClasses;
    
    return uniqueClasses.map((classItem) => {
      // Skip calculation if distance already exists
      if (classItem.distance !== undefined && classItem.distance !== null) {
        return classItem;
      }

      if (classItem.coordinates) {
        const coords = classItem.coordinates.split(",");
        if (coords.length === 2) {
          const lat = parseFloat(coords[0].trim());
          const lng = parseFloat(coords[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            const distance = calculateDistance(
              ipLocation.lat,
              ipLocation.lng,
              lat,
              lng
            );
            return { ...classItem, distance };
          }
        }
      }

      return classItem;
    });
  }, [uniqueClasses, ipLocation, calculateDistance]);

  const mapMarkers = useMemo(() => {
    if (!classesWithDistance || classesWithDistance.length === 0) return [];
    
    const markers = [];
    // Use for loop for better performance
    for (let i = 0; i < classesWithDistance.length; i++) {
      const classItem = classesWithDistance[i];
      const coords = classItem.coordinates;
      if (!coords || typeof coords !== "string") continue;
      const parts = coords.split(",");
      if (parts.length !== 2) continue;
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (isNaN(lat) || isNaN(lng)) continue;

      markers.push({
        id: classItem.classId,
        lat,
        lng,
        title: classItem.title,
        slug: classItem.slug,
        business_name: classItem.business_name,
        location: classItem.location,
        min_session_price: classItem.min_session_price,
        min_course_price: classItem.min_course_price,
        distance: classItem.distance,
        coordinates: classItem.coordinates,
        images: classItem.images,
        options: classItem.options,
        rating: classItem.average_rating,
        totalReviews: Math.max(0, Number(classItem.review_count) || 0),
      });
    }
    return markers;
  }, [classesWithDistance]);

  const handleMarkerClick = useCallback((classId) => {
    setSelectedClassId(classId);
    const listElement = document.getElementById(`class-${classId}`);
    if (listElement) {
      listElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const renderContent = () => {
    // 1. Force skeleton if navigation/loading is explicitly happening
    if (isNavigating || loading) {
      return <ClassesContentSkeleton />;
    }

    // Use uniqueClasses directly for initial render to avoid waiting for distance calculation
    const classesToRender = classesWithDistance.length > 0 ? classesWithDistance : uniqueClasses;

    if (classesToRender.length === 0) {
      return <NoResultsView />;
    }

    return (
      <ClassGrid>
        {classesToRender.map((classItem, index) => (
          <CardGridItem
            id={`class-${classItem.classId}`}
            key={classItem.classId}
            onMouseEnter={() => setSelectedClassId(classItem.classId)}
            onMouseLeave={() => setSelectedClassId(null)}
          >
            <HomeClassCard
              classId={classItem.classId}
              slug={classItem.slug}
              images={classItem.images || []}
              title={classItem.title}
              rating={classItem.average_rating}
              min_session_price={classItem.min_session_price}
              min_course_price={classItem.min_course_price}
              totalReviews={Math.max(0, Number(classItem.review_count) || 0)}
              business_name={classItem.business_name}
              city={classItem.city}
              state={classItem.state}
              location={classItem.location}
              listing_duration_minutes={classItem.listing_duration_minutes}
              coordinates={classItem.coordinates}
              distance={classItem.distance}
              is_favorited={classItem.is_favorited}
              priority={index < 6}
              exploreLayout
              categoryLabel={collectionDisplayName}
              showPopularBadge={
                Number(classItem.review_count) >= 75 &&
                Number(classItem.average_rating) >= 4.7
              }
            />
          </CardGridItem>
        ))}
        {isLoadingMore &&
          [...Array(6)].map((_, i) => (
            <SkeletonClassSingleCard key={`skeleton-${i}`} />
          ))}
      </ClassGrid>
    );
  };

  return (
    <GridContainer $isMapVisible={desktopMapUsesGridSlot}>
      <LeftContainer style={{ display: isMobile && showMap ? "none" : "flex" }}>
        <CategoriesWrapper>
          <ExploreCategories
            classes={classesWithDistance}
            collections={collections}
            collectionsIWant={collectionsIWant}
            filters={filters}
            onFiltersChange={onFiltersChange}
            currentCollections={currentCollections}
            onCollectionChange={onCollectionChange}
            currentSortBy={currentSortBy}
            onApplyModalChanges={onApplyModalChanges}
            onApplyTimePreferences={onApplyTimePreferences}
            isFilterModalOpen={isFilterModalOpen}
            setIsFilterModalOpen={setIsFilterModalOpen}
            /* Desktop: keep true while map slides out (holdDesktopMapSlot) so Map chip
               only appears after the grid expands — avoids chip animation + column jump. */
            isMapVisible={
              isMobile ? isMapVisible : isMapVisible || holdDesktopMapSlot
            }
            onShowMap={() => {
              setIsMapVisible(true);
              setShowMap(true);
            }}
            totalClassesCount={totalClassesCount}
            previewExploreBarCount={previewExploreBarCount}
            previewFilterModalCount={previewFilterModalCount}
          />
        </CategoriesWrapper>
        <ClassGridWrapper ref={gridWrapperRef}>
          {renderContent()}

          {/* Sentinel for IntersectionObserver — always in DOM so the
              observer (created once) has a stable target. */}
          <div
            ref={observerTargetRef}
            aria-hidden
            style={{
              height: "1px",
              width: "100%",
              background: "transparent",
              pointerEvents: "none",
            }}
          />
        </ClassGridWrapper>
      </LeftContainer>

      <MapContainer $isMapVisible={desktopMapUsesGridSlot}>
        {shouldLoadMap && !isMobile && (
          <AnimatePresence
            mode="wait"
            onExitComplete={() => setHoldDesktopMapSlot(false)}
          >
            {isMapVisible && (
              <motion.div
                key="explore-map-desktop"
                style={{
                  height: "100%",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 32,
                  mass: 0.85,
                }}
              >
                <MapDisplay
                  key={mapKey}
                  markers={mapMarkers}
                  selectedClassId={selectedClassId}
                  onMarkerClick={handleMarkerClick}
                  userLocation={ipLocation || userLocation}
                  showMap={showMap}
                  onHideMap={() => {
                    setHoldDesktopMapSlot(true);
                    setIsMapVisible(false);
                  }}
                  isMobile={isMobile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </MapContainer>

      <AnimatePresence initial={false}>
        {isMobile && !isFilterModalOpen && !showMap && (
          <MobileMapToggle
            key="explore-map-fab"
            type="button"
            onClick={() => setShowMap(true)}
            aria-label="Show map"
          >
            <motion.span
              key="fab-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <MapIcon size={16} aria-hidden /> Show Map
            </motion.span>
          </MobileMapToggle>
        )}
        {isMobile && showMap && (
          <motion.div
            key="explore-map-fullscreen"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={exploreMobileMapMorphTransition}
            style={{ position: "fixed", inset: 0, zIndex: 1000 }}
          >
            <MobileMapFullscreenShell>
              {shouldLoadMap ? (
                <motion.div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    position: "relative",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.06, duration: 0.22, ease: "easeOut" }}
                >
                  <MapDisplay
                    key={mapKey}
                    markers={mapMarkers}
                    selectedClassId={selectedClassId}
                    onMarkerClick={handleMarkerClick}
                    userLocation={ipLocation || userLocation}
                    showMap={showMap}
                    onHideMap={() => {
                      setShowMap(false);
                      setIsMapVisible(false);
                    }}
                    isMobile={isMobile}
                  />
                </motion.div>
              ) : (
                <LoadingContainer
                  style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                  }}
                >
                  <GlobalLoaderWithoutInlineStyles />
                </LoadingContainer>
              )}
              {!isFilterModalOpen && (
                <MobileMapListFab
                  type="button"
                  onClick={() => setShowMap(false)}
                  aria-label="Show list"
                >
                  <List size={16} aria-hidden /> Show List
                </MobileMapListFab>
              )}
            </MobileMapFullscreenShell>
          </motion.div>
        )}
      </AnimatePresence>
    </GridContainer>
  );
};

export default ClassesDisplay;
