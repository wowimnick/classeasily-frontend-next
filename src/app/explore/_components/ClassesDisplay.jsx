import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { Map as MapIcon, List, SearchX } from "lucide-react";
import dynamic from "next/dynamic";
import HomeClassCard from "../../../components/homepage/HomeClassCard.jsx";
import ExploreCategories from "./ExploreCategories.jsx";
import {
  ClassesContentSkeleton,
  SkeletonClassSingleCard,
} from "./ExplorePageSkeleton.jsx";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader.jsx";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";

// Removed framer-motion import - using CSS animations instead for better performance

// Lazy load map component with significant delay to prevent map tiles from becoming LCP
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
  grid-template-columns: ${({ $isMapVisible }) =>
    $isMapVisible ? "minmax(0, 1fr) minmax(200px, 40%)" : "1fr"};
  width: 100%;
  height: calc(100vh - 130px);
  position: relative;
  overflow: hidden;
  transition: grid-template-columns 0.4s ease-in-out;
  will-change: grid-template-columns;

  @media (max-width: 1100px) {
    grid-template-columns: ${({ $isMapVisible }) =>
      $isMapVisible ? "minmax(0, 1fr) minmax(200px, 35%)" : "1fr"};
  }
  @media (max-width: 1048px) {
    grid-template-columns: 1fr;
    height: calc(100vh - 110px);
  }
`;

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
  height: 100%;
  overflow: hidden;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  border-right: 1px solid #e8e8e8;
`;

const CategoriesWrapper = styled.div`
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 90;
  background-color: #fff;
`;

const ClassGridWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem 2.5rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
  position: relative;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 1048px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const ClassGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;

  @media (max-width: 1400px) {
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  }

  @media (max-width: 1048px) {
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  @media (max-width: 600px) {
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const MapContainer = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  padding: 25px;
  box-sizing: border-box;

  @media (min-width: 1049px) {
    display: ${({ $isMapVisible }) => ($isMapVisible ? "block" : "none")};
  }

  @media (max-width: 1048px) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    padding: 0;
    visibility: ${(props) => (props.$showMap ? "visible" : "hidden")};
    opacity: ${(props) => (props.$showMap ? 1 : 0)};
    transition: opacity 0.2s, visibility 0.2s;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
`;

const MobileMapToggle = styled.button`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: #333;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: none;
  align-items: center;
  gap: 8px;
  z-index: 1001;
  &:hover {
    background-color: #555;
  }
  @media (max-width: 1048px) {
    display: inline-flex;
  }
`;

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
  categories = [],
  collections = [],
  loading,
  isNavigating,
  userLocation,
  filters,
  onFiltersChange,
  currentCategory,
  currentSubcategory,
  onCategoryChange,
  currentCollection,
  onCollectionChange,
  currentSortBy,
  onApplyModalChanges,
  observerTargetRef,
  hasMorePages,
  isLoadingMore,
  province,
  city,
  tag,
  totalClassesCount,
}) => {
  const applyRandomReviewOffset = (reviewCount, classId) => {
    const offset = classId % 10;
    return Math.max(0, reviewCount + offset);
  };

  // Use geolocation hook but don't block rendering on it
  const { location: ipLocationHook } = useIpGeolocation();
  // Prefer userLocation from parent, fallback to hook
  const ipLocation = userLocation || ipLocationHook;

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1048;
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
    if (isMobile && showMap) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, showMap]);

  // Defer map initialization significantly to prioritize LCP
  // Wait for LCP to complete (typically 2-3 seconds) before loading map
  useEffect(() => {
    // Delay map loading to ensure class card images become LCP element
    // Use requestIdleCallback if available, otherwise setTimeout
    const loadMap = () => {
      // Additional delay to ensure LCP has completed
      setTimeout(() => setShouldLoadMap(true), 2500);
    };

    if (typeof window !== "undefined" && window.requestIdleCallback) {
      window.requestIdleCallback(loadMap, { timeout: 3000 });
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
        totalReviews: applyRandomReviewOffset(
          classItem.review_count,
          classItem.classId
        ),
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
          <div
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
              totalReviews={applyRandomReviewOffset(
                classItem.review_count,
                classItem.classId
              )}
              business_name={classItem.business_name}
              city={classItem.city}
              state={classItem.state}
              coordinates={classItem.coordinates}
              distance={classItem.distance}
              isSelected={selectedClassId === classItem.classId}
              is_favorited={classItem.is_favorited}
              priority={index < 6}
            />
          </div>
        ))}
        {isLoadingMore &&
          [...Array(6)].map((_, i) => (
            <SkeletonClassSingleCard key={`skeleton-${i}`} />
          ))}
      </ClassGrid>
    );
  };

  return (
    <GridContainer $isMapVisible={!isMobile && isMapVisible}>
      <LeftContainer style={{ display: isMobile && showMap ? "none" : "flex" }}>
        <CategoriesWrapper>
          <ExploreCategories
            classes={classesWithDistance}
            categories={categories}
            collections={collections}
            filters={filters}
            onFiltersChange={onFiltersChange}
            currentCategory={currentCategory}
            currentSubcategory={currentSubcategory}
            onCategoryChange={onCategoryChange}
            currentCollection={currentCollection}
            onCollectionChange={onCollectionChange}
            currentSortBy={currentSortBy}
            onApplyModalChanges={onApplyModalChanges}
            isFilterModalOpen={isFilterModalOpen}
            setIsFilterModalOpen={setIsFilterModalOpen}
            isMapVisible={isMapVisible}
            onShowMap={() => setIsMapVisible(true)}
          />
        </CategoriesWrapper>
        <ClassGridWrapper>
          {renderContent()}

          {classesWithDistance.length > 0 && hasMorePages && !isLoadingMore && (
            <div
              ref={observerTargetRef}
              style={{
                height: "1px",
                marginTop: "1px",
                background: "transparent",
              }}
            />
          )}
        </ClassGridWrapper>
      </LeftContainer>

      <MapContainer
        $isMapVisible={!isMobile && isMapVisible}
        $showMap={isMobile && showMap}
      >
        {shouldLoadMap && ((isMobile && showMap) || (!isMobile && isMapVisible)) && (
          <MapDisplay
            key={mapKey}
            markers={mapMarkers}
            selectedClassId={selectedClassId}
            onMarkerClick={handleMarkerClick}
            userLocation={ipLocation || userLocation}
            showMap={showMap}
            onHideMap={() => setIsMapVisible(false)}
          />
        )}
      </MapContainer>

      {isMobile && !isFilterModalOpen && (
        <MobileMapToggle onClick={() => setShowMap(!showMap)}>
          {showMap ? (
            <>
              <List size={16} /> Show List
            </>
          ) : (
            <>
              <MapIcon size={16} /> Show Map
            </>
          )}
        </MobileMapToggle>
      )}
    </GridContainer>
  );
};

export default ClassesDisplay;
