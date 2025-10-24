"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Typography } from "antd";
import message from "@/lib/message";
import { ArrowRightOutlined } from "@ant-design/icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { classService } from "@/services/apiService";
import HomeClassCard from "@/components/homepage/HomeClassCard";
import { FindClassSkeleton } from "./FindClassSkeleton"; // Import skeleton

// --- STYLED COMPONENTS ---
const { Title: AntTitle, Paragraph } = Typography;

const MainWrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0 14rem;
  margin: 4rem auto 2rem auto;
  color: ${(props) => props.theme.token.colorText};
  z-index: 1;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 1425px) {
    padding: 0 3rem;
  }
  @media (max-width: 768px) {
    padding: 0 1.5rem;
    gap: 1rem;
    margin: 3rem auto;
  }
  @media (max-width: 616px) {
    padding: 0 1rem;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const SectionHeader = styled.div``;

const StyledTitle = styled(AntTitle)`
  &.ant-typography {
    font-size: clamp(1.8rem, 4vw, 2.2rem);
    font-weight: 700;
    margin-bottom: 0.5rem !important;
    color: ${(props) => props.theme.token.colorText};
    line-height: 1.3;
  }
`;

const StyledSubtitle = styled(Paragraph)`
  &.ant-typography {
    padding-left: 2px;
    font-size: clamp(1rem, 2.5vw, 1.1rem);
    font-weight: 400;
    color: ${(props) => props.theme.token.colorTextSecondary};
    margin-bottom: 0 !important;
    max-width: 70ch;
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 0.5rem 0;
`;

const EmblaViewport = styled.div`
  overflow: hidden;
  width: 100%;
`;

const EmblaContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 1rem 0.5rem;
  margin: 0 -0.5rem;
  min-height: 380px;

  .embla__slide {
    flex: 0 0 auto;
    position: relative;
    width: 250px;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 5;
  border-radius: ${(props) => props.theme.token.borderRadiusLG}px;
  backdrop-filter: blur(2px);
`;

const ButtonSpinner = styled.div`
  border: 2px solid rgba(255, 56, 92, 0.2);
  border-left-color: #ff385c;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 0.5rem;
  @media (max-width: 616px) {
    display: none;
  }
`;

const ScrollButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  background-color: ${(props) => props.theme.token.colorBgElevated};
  border: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease-in-out;
  color: ${(props) => props.theme.token.colorTextSecondary};

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.token.colorBgContainer};
    color: ${(props) => props.theme.token.colorPrimary};
    border-color: ${(props) => props.theme.token.colorBorder};
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
    background-color: ${(props) => props.theme.token.colorBgSpotlight};
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SeeAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  color: ${(props) => props.theme.token.colorPrimary};
  transition: color 0.3s ease, gap 0.3s ease;

  .anticon {
    transition: transform 0.3s ease;
  }

  &:hover {
    color: ${(props) => props.theme.token.colorPrimaryHover};
    text-decoration: underline;
    gap: 12px;
    .anticon {
      transform: translateX(4px);
    }
  }
`;

const NoClassesFound = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${(props) => props.theme.token.colorTextSecondary};
  width: 100%;
  font-style: italic;
`;

// Skeleton carousel for initial loading
const SkeletonCarousel = styled.div`
  display: flex;
  gap: 24px;
  padding: 1rem 0.5rem;
  overflow: hidden;
`;

// --- CONFIGURATION ---
const ENABLE_IP_GEOLOCATION = true;
const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// --- HELPER FUNCTIONS ---
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (
    [lat1, lon1, lat2, lon2].some(
      (coord) => coord === null || coord === undefined
    )
  ) {
    return null;
  }
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function applyRandomReviewOffset(originalCount, classId) {
  if (originalCount === 0) return 0;
  let hash = 0;
  const idStr = String(classId);
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash = hash & hash;
  }
  const offset = 10 + (Math.abs(hash) % 11);
  return originalCount + offset;
}

const FindClass = ({ initialClasses = [], initialNextPageUrl = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [classes, setClasses] = useState(initialClasses);

  // FIX: Start with loading=false if we have initialClasses
  const [loading, setLoading] = useState(initialClasses.length === 0);

  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isInitialLoad = useRef(true);
  const isComponentMounted = useRef(false);

  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [showButtons, setShowButtons] = useState(false);

  // Handle hydration and set component mounted flag
  useEffect(() => {
    setIsMounted(true);
    isComponentMounted.current = true;

    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Step 1: ALWAYS attempt to get user location (client-side only)
  useEffect(() => {
    if (!isMounted) return;

    const fetchUserLocation = async () => {
      if (!ENABLE_IP_GEOLOCATION) {
        setLoadingLocation(false);
        return;
      }

      try {
        const response = await fetch(AWS_LOCATION_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ipLocation" }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }

        const data = await response.json();

        if (data?.location) {
          const { latitude, longitude, city, region, country, regionCode } =
            data.location;
          const parsedLocation = {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude),
            city: city || "",
            region: region || "",
            country: country || "",
            region_code: regionCode || "",
          };

          if (
            !isNaN(parsedLocation.lat) &&
            !isNaN(parsedLocation.lng) &&
            isComponentMounted.current
          ) {
            setUserLocation(parsedLocation);
            setLocationError(null);
          } else {
            throw new Error("Invalid location coordinates");
          }
        } else {
          throw new Error("No location data returned");
        }
      } catch (err) {
        console.error("Location fetch error:", err);
        if (isComponentMounted.current) {
          setLocationError(err.message);
        }
      } finally {
        if (isComponentMounted.current) {
          setLoadingLocation(false);
        }
      }
    };

    fetchUserLocation();
  }, [isMounted]);

  // Step 2: Fetch classes only on initial mount if initialClasses is empty
  useEffect(() => {
    if (!isMounted) return;
    if (!isInitialLoad.current) return;

    // If we have initialClasses from server, use them
    if (initialClasses.length > 0) {
      console.log(
        "[FindClass] Using preloaded classes from server:",
        initialClasses.length
      );
      isInitialLoad.current = false;
      setLoading(false);
      return;
    }

    // Only fetch if no initialClasses provided
    const fetchClasses = async () => {
      console.log("[FindClass] No preloaded classes, fetching from API");
      try {
        const response = await classService.fetchClasses({}, nextPageUrl);
        if (isComponentMounted.current) {
          setClasses(response?.results || []);
          setNextPageUrl(response?.next || null);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        if (isComponentMounted.current) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); // FIXED: Removed initialClasses from dependencies to prevent refetch

  // Step 3: "See All" button behavior
  const handleSeeAllClick = useCallback(
    (event) => {
      event.preventDefault();
      if (userLocation && userLocation.city && userLocation.region) {
        const { lat, lng, city, region, region_code } = userLocation;

        const urlRegion = region.toLowerCase().replace(/\s+/g, "-");
        const urlCity = city.toLowerCase().replace(/\s+/g, "-");
        const path = `/explore/${urlRegion}/${urlCity}`;

        const params = new URLSearchParams();
        params.set("lat", lat.toString());
        params.set("lng", lng.toString());

        const locationParam = `${city}, ${region_code}`;
        params.set("location", locationParam);

        const participants = searchParams.get("participants");
        if (participants) {
          params.set("participants", participants);
        }

        router.push(`${path}?${params.toString()}`);
      } else if (userLocation) {
        const params = new URLSearchParams();
        params.set("lat", userLocation.lat.toString());
        params.set("lng", userLocation.lng.toString());
        router.push(`/explore?${params.toString()}`);
      } else {
        message.info(
          "Could not determine your location. Showing popular classes."
        );
        router.push("/explore/ontario/toronto");
      }
    },
    [userLocation, searchParams, router]
  );

  // Dynamic link text based on location status
  const linkText = useMemo(() => {
    if (loadingLocation) return "Locating...";
    if (userLocation?.city) return `See all classes in ${userLocation.city}`;
    if (userLocation) return "See all classes near me";
    return "See all classes";
  }, [userLocation, loadingLocation]);

  // Embla Carousel Hooks
  const handleScroll = useCallback(async () => {
    if (!emblaApi || !nextPageUrl || isFetchingMore) return;
    const lastSlideIndex = emblaApi.scrollSnapList().length - 1;
    if (emblaApi.selectedScrollSnap() >= lastSlideIndex - 2) {
      setIsFetchingMore(true);
      try {
        const response = await classService.fetchClasses({}, nextPageUrl);
        const newResults = response.results || [];
        if (newResults.length > 0) {
          setClasses((prev) => {
            const existingIds = new Set(prev.map((cls) => cls.classId));
            const uniqueNewResults = newResults.filter(
              (cls) => !existingIds.has(cls.classId)
            );
            return [...prev, ...uniqueNewResults];
          });
        }
        setNextPageUrl(response.next || null);
      } catch (error) {
        console.error("Failed to fetch more classes:", error);
      } finally {
        setIsFetchingMore(false);
      }
    }
  }, [emblaApi, nextPageUrl, isFetchingMore]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      handleScroll();
    }
  }, [emblaApi, handleScroll]);

  const updateButtonStates = useCallback(() => {
    if (emblaApi) {
      setPrevBtnDisabled(!emblaApi.canScrollPrev());
      setNextBtnDisabled(!emblaApi.canScrollNext());
    }
  }, [emblaApi]);

  const checkScrollabilityAndVisibility = useCallback(() => {
    if (emblaApi && !loading) {
      const isScrollable = emblaApi.canScrollNext() || emblaApi.canScrollPrev();
      setShowButtons(isScrollable);
      updateButtonStates();
    } else {
      setShowButtons(false);
    }
  }, [emblaApi, loading, updateButtonStates]);

  useEffect(() => {
    if (!isMounted || !emblaApi) return;

    emblaApi.on("scroll", handleScroll);
    emblaApi.on("select", updateButtonStates);
    emblaApi.on("reInit", checkScrollabilityAndVisibility);
    window.addEventListener("resize", checkScrollabilityAndVisibility);
    checkScrollabilityAndVisibility();

    return () => {
      emblaApi.off("scroll", handleScroll);
      emblaApi.off("select", updateButtonStates);
      emblaApi.off("reInit", checkScrollabilityAndVisibility);
      window.removeEventListener("resize", checkScrollabilityAndVisibility);
    };
  }, [
    isMounted,
    emblaApi,
    handleScroll,
    updateButtonStates,
    checkScrollabilityAndVisibility,
  ]);

  // Memoized class cards with distance calculation - PRIORITIZE FIRST 3 IMAGES
  const classCards = useMemo(() => {
    return classes.map((classItem, index) => {
      let calculatedDistance = null;
      if (userLocation && classItem.coordinates) {
        const [classLat, classLng] = classItem.coordinates
          .split(",")
          .map(Number);
        calculatedDistance = getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          classLat,
          classLng
        );
      }

      const adjustedReviewCount = applyRandomReviewOffset(
        classItem.review_count,
        classItem.classId
      );

      return (
        <div className="embla__slide" key={`${classItem.classId}-${index}`}>
          <div style={{ position: "relative" }}>
            <HomeClassCard
              {...classItem}
              rating={classItem.average_rating}
              totalReviews={adjustedReviewCount}
              distance={calculatedDistance}
              priority={index < 3} // PRIORITY LOADING FOR FIRST 3 CARDS
            />
            {isFetchingMore && index === classes.length - 1 && (
              <LoadingOverlay>
                <ButtonSpinner />
              </LoadingOverlay>
            )}
          </div>
        </div>
      );
    });
  }, [classes, isFetchingMore, userLocation]);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // FIX: Show skeleton cards when loading instead of spinner
  if (loading) {
    return <FindClassSkeleton />;
  }

  return (
    <MainWrapper>
      <HeaderContainer>
        <SectionHeader>
          <StyledTitle level={2}>Find a class that suits you</StyledTitle>
          <StyledSubtitle>
            Explore popular classes and jump into a new experience!
          </StyledSubtitle>
        </SectionHeader>
        <AnimatePresence>
          {showButtons && (
            <ButtonContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScrollButton
                onClick={scrollPrev}
                disabled={prevBtnDisabled}
                aria-label="Scroll previous classes"
              >
                <ChevronLeft />
              </ScrollButton>
              <ScrollButton
                onClick={scrollNext}
                disabled={nextBtnDisabled}
                aria-label="Scroll next classes"
              >
                <ChevronRight />
              </ScrollButton>
            </ButtonContainer>
          )}
        </AnimatePresence>
      </HeaderContainer>

      {locationError && !loadingLocation && (
        <Paragraph type="secondary" style={{ paddingLeft: "2px" }}>
          Could not determine your location. Showing popular classes.
        </Paragraph>
      )}

      <CarouselContainer>
        <EmblaViewport ref={emblaRef}>
          <EmblaContainer>
            {classes.length === 0 ? (
              <NoClassesFound>
                No nearby classes found at the moment.
              </NoClassesFound>
            ) : (
              classCards
            )}
          </EmblaContainer>
        </EmblaViewport>
      </CarouselContainer>

      <SeeAllLink href="/explore" onClick={handleSeeAllClick}>
        {linkText}
        <ArrowRightOutlined />
      </SeeAllLink>
    </MainWrapper>
  );
};

// Export with display name for better debugging
FindClass.displayName = "FindClass";

export default FindClass;
