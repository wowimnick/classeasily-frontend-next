// components/explore/ClassesDisplay.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  Map as MapIcon,
  List,
  BookOpen,
  Palette,
  Music,
  Code as TechnologyIcon,
  Dumbbell,
  PersonStanding,
} from "lucide-react";
import dynamic from "next/dynamic";
import HomeClassCard from "../../../components/homepage/HomeClassCard.jsx";
import ExploreCategories from "./ExploreCategories.jsx";
import {
  ClassesContentSkeleton,
  ClassesHeaderSkeleton,
  SkeletonClassSingleCard,
} from "./ExplorePageSkeleton.jsx";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader.jsx";
import { useIpGeolocation } from "@/hooks/useIpGeolocation";

const MapDisplay = dynamic(() => import("./MapDisplay.jsx"), {
  ssr: false,
  loading: () => (
    <LoadingContainer>
      <GlobalLoaderWithoutInlineStyles />
    </LoadingContainer>
  ),
});

const unslugify = (slug) => {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: ${({ $isMapVisible }) =>
    $isMapVisible ? "minmax(0, 1fr) minmax(200px, 40%)" : "1fr"};
  width: 100%;
  height: calc(100vh - 130px);
  position: relative;
  overflow: hidden;
  transition: grid-template-columns 0.4s ease-in-out;

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
  z-index: 101;
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
    padding: 0.5rem !important;
  }
`;

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(max(140px, calc((100% - 72px) / 4)), 1fr)
  );
  gap: clamp(16px, 3vw, 24px);

  @media (max-width: 1048px) {
    gap: 12px;
    grid-template-columns: repeat(
      auto-fill,
      minmax(max(140px, calc((100% - 36px) / 3)), 1fr)
    );
  }

  @media (max-width: 600px) {
    gap: 10px;
    grid-template-columns: repeat(
      auto-fill,
      minmax(max(140px, calc((100% - 10px) / 2)), 1fr)
    );
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

const NoResultsContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;
  text-align: center;
  min-height: 400px;
  width: 100%;
  margin: auto;
`;

const IconGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
`;

const EmptyIcon = styled(motion.div)`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${(props) => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.8;
`;

const NoResultsTitle = styled(motion.h2)`
  font-size: 24px;
  font-weight: 700;
  color: #484848;
  margin: 0 0 16px 0;
`;

const NoResultsText = styled(motion.p)`
  font-size: 16px;
  color: #6b7280;
  max-width: 400px;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const NoResultsButton = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff385c 0%, #ff1447 100%);
  border: none;
  border-radius: 24px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
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

const NoResultsAnimation = ({ onReset }) => {
  const gridVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const iconVariants = {
    hidden: { opacity: 0, y: 20, rotate: -10 },
    visible: {
      opacity: 0.8,
      y: 0,
      rotate: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } },
  };
  const icons = [
    { Icon: BookOpen, color: "#FF385C" },
    { Icon: Palette, color: "#00A699" },
    { Icon: Music, color: "#FC642D" },
    { Icon: TechnologyIcon, color: "#767676" },
    { Icon: Dumbbell, color: "#FF5A5F" },
    { Icon: PersonStanding, color: "#008489" },
  ];

  return (
    <NoResultsContainer
      initial="hidden"
      animate="visible"
      variants={contentVariants}
    >
      <IconGrid variants={gridVariants}>
        {icons.map(({ Icon, color }, index) => (
          <EmptyIcon
            key={index}
            variants={iconVariants}
            $color={color}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon size={32} strokeWidth={2} />
          </EmptyIcon>
        ))}
      </IconGrid>
      <NoResultsTitle>No classes found</NoResultsTitle>
      <NoResultsText>
        We couldn't find any classes matching your criteria. Try adjusting your
        filters or exploring different categories.
      </NoResultsText>
      <NoResultsButton whileHover={{ scale: 1.05 }} onClick={onReset}>
        Clear Filters
      </NoResultsButton>
    </NoResultsContainer>
  );
};

const ClassesDisplay = ({
  classes = [],
  categories = [],
  loading,
  isNavigating,
  userLocation,
  filters,
  onFiltersChange,
  currentCategory,
  currentSubcategory,
  onCategoryChange,
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

  const { location: ipLocation, loading: locationLoading } = useIpGeolocation();

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [mapKey, setMapKey] = useState(0);

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
    const seen = new Set();
    return classes.filter((classItem) => {
      if (seen.has(classItem.classId)) {
        return false;
      }
      seen.add(classItem.classId);
      return true;
    });
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
    return uniqueClasses.map((classItem) => {
      if (classItem.distance !== undefined && classItem.distance !== null) {
        return classItem;
      }

      if (ipLocation && classItem.coordinates) {
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
    return classesWithDistance
      .map((classItem) => {
        const coords = classItem.coordinates;
        if (!coords || typeof coords !== "string") return null;
        const parts = coords.split(",");
        if (parts.length !== 2) return null;
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (isNaN(lat) || isNaN(lng)) return null;

        return {
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
        };
      })
      .filter((marker) => marker !== null);
  }, [classesWithDistance]);

  const handleMarkerClick = useCallback((classId) => {
    setSelectedClassId(classId);
    const listElement = document.getElementById(`class-${classId}`);
    if (listElement) {
      listElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleResetFilters = () => {
    if (onApplyModalChanges) {
      onApplyModalChanges(
        {
          pricePerClass: [0, 500],
          distance: [0, 0],
          timePreference: [],
          days: [],
          classType: "class",
          keyword: "",
          date: filters.date || "",
          participants: filters.participants || 0,
        },
        "relevance"
      );
    }
    onCategoryChange("all", "");
  };

  const renderContent = () => {
    if (isNavigating) {
      return <ClassesContentSkeleton />;
    }

    if (loading && classesWithDistance.length === 0) {
      return <ClassesContentSkeleton />;
    }

    if (!loading && classesWithDistance.length === 0) {
      return <NoResultsAnimation onReset={handleResetFilters} />;
    }

    return (
      <>
        <ClassGrid>
          {classesWithDistance.map((classItem, index) => (
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
                priority={index < 4}
              />
            </div>
          ))}
          {isLoadingMore &&
            [...Array(6)].map((_, i) => (
              <SkeletonClassSingleCard key={`skeleton-${i}`} />
            ))}
        </ClassGrid>
      </>
    );
  };

  return (
    <GridContainer $isMapVisible={!isMobile && isMapVisible}>
      <LeftContainer style={{ display: isMobile && showMap ? "none" : "flex" }}>
        <CategoriesWrapper>
          <ExploreCategories
            classes={classesWithDistance}
            categories={categories}
            filters={filters}
            onFiltersChange={onFiltersChange}
            currentCategory={currentCategory}
            currentSubcategory={currentSubcategory}
            onCategoryChange={onCategoryChange}
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
        {((isMobile && showMap) || (!isMobile && isMapVisible)) && (
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