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
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import HomeClassCard from "@/components/homepage/HomeClassCard";

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

const RowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
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
  const [loading, setLoading] = useState(!initialClasses.length);
  const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isInitialLoad = useRef(true);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // First row carousel
  const [emblaRef1, emblaApi1] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  });

  // Second row carousel
  const [emblaRef2, emblaApi2] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: true,
  });

  const [prevBtnDisabled1, setPrevBtnDisabled1] = useState(true);
  const [nextBtnDisabled1, setNextBtnDisabled1] = useState(true);
  const [prevBtnDisabled2, setPrevBtnDisabled2] = useState(true);
  const [nextBtnDisabled2, setNextBtnDisabled2] = useState(true);
  const [showButtons1, setShowButtons1] = useState(false);
  const [showButtons2, setShowButtons2] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Step 1: ALWAYS attempt to get user location (client-side only)
  useEffect(() => {
    if (!isMounted) return;

    if (!ENABLE_IP_GEOLOCATION) {
      setLoadingLocation(false);
      return;
    }

    const fetchUserLocationFromIP = async () => {
      try {
        setLoadingLocation(true);
        const response = await fetch(`${AWS_LOCATION_API_URL}/user-location`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.lat && data.lng) {
          const locationData = {
            lat: data.lat,
            lng: data.lng,
            city: data.city || null,
            region: data.region || null,
            region_code: data.region_code || null,
          };
          setUserLocation(locationData);
          setLocationError(null);
        } else {
          throw new Error("Location data incomplete");
        }
      } catch (error) {
        console.error("Error fetching user location from IP:", error);
        setLocationError(error.message);
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchUserLocationFromIP();
  }, [isMounted]);

  // Step 2: Fetch classes if not provided by SSR
  useEffect(() => {
    if (!isMounted) return;

    if (initialClasses && initialClasses.length > 0) {
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      let isComponentMounted = true;

      try {
        const response = await classService.fetchClasses({}, nextPageUrl);
        if (isComponentMounted) {
          setClasses(response?.results || []);
          setNextPageUrl(response?.next || null);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        if (isComponentMounted) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    fetchClasses();
  }, [isMounted, initialClasses]);

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

  // Embla Carousel Hooks for Row 1
  const handleScroll1 = useCallback(async () => {
    if (!emblaApi1 || !nextPageUrl || isFetchingMore) return;
    const lastSlideIndex = emblaApi1.scrollSnapList().length - 1;
    if (emblaApi1.selectedScrollSnap() >= lastSlideIndex - 2) {
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
  }, [emblaApi1, nextPageUrl, isFetchingMore]);

  const scrollPrev1 = useCallback(
    () => emblaApi1 && emblaApi1.scrollPrev(),
    [emblaApi1]
  );
  const scrollNext1 = useCallback(() => {
    if (emblaApi1) {
      emblaApi1.scrollNext();
      handleScroll1();
    }
  }, [emblaApi1, handleScroll1]);

  const scrollPrev2 = useCallback(
    () => emblaApi2 && emblaApi2.scrollPrev(),
    [emblaApi2]
  );
  const scrollNext2 = useCallback(() => {
    if (emblaApi2) {
      emblaApi2.scrollNext();
    }
  }, [emblaApi2]);

  const updateButtonStates1 = useCallback(() => {
    if (emblaApi1) {
      setPrevBtnDisabled1(!emblaApi1.canScrollPrev());
      setNextBtnDisabled1(!emblaApi1.canScrollNext());
    }
  }, [emblaApi1]);

  const updateButtonStates2 = useCallback(() => {
    if (emblaApi2) {
      setPrevBtnDisabled2(!emblaApi2.canScrollPrev());
      setNextBtnDisabled2(!emblaApi2.canScrollNext());
    }
  }, [emblaApi2]);

  const checkScrollabilityAndVisibility1 = useCallback(() => {
    if (emblaApi1 && !loading) {
      const isScrollable =
        emblaApi1.canScrollNext() || emblaApi1.canScrollPrev();
      setShowButtons1(isScrollable);
      updateButtonStates1();
    } else {
      setShowButtons1(false);
    }
  }, [emblaApi1, loading, updateButtonStates1]);

  const checkScrollabilityAndVisibility2 = useCallback(() => {
    if (emblaApi2 && !loading) {
      const isScrollable =
        emblaApi2.canScrollNext() || emblaApi2.canScrollPrev();
      setShowButtons2(isScrollable);
      updateButtonStates2();
    } else {
      setShowButtons2(false);
    }
  }, [emblaApi2, loading, updateButtonStates2]);

  useEffect(() => {
    if (!isMounted || !emblaApi1) return;

    emblaApi1.on("scroll", handleScroll1);
    emblaApi1.on("select", updateButtonStates1);
    emblaApi1.on("reInit", checkScrollabilityAndVisibility1);
    window.addEventListener("resize", checkScrollabilityAndVisibility1);
    checkScrollabilityAndVisibility1();

    return () => {
      emblaApi1.off("scroll", handleScroll1);
      emblaApi1.off("select", updateButtonStates1);
      emblaApi1.off("reInit", checkScrollabilityAndVisibility1);
      window.removeEventListener("resize", checkScrollabilityAndVisibility1);
    };
  }, [
    isMounted,
    emblaApi1,
    handleScroll1,
    updateButtonStates1,
    checkScrollabilityAndVisibility1,
  ]);

  useEffect(() => {
    if (!isMounted || !emblaApi2) return;

    emblaApi2.on("select", updateButtonStates2);
    emblaApi2.on("reInit", checkScrollabilityAndVisibility2);
    window.addEventListener("resize", checkScrollabilityAndVisibility2);
    checkScrollabilityAndVisibility2();

    return () => {
      emblaApi2.off("select", updateButtonStates2);
      emblaApi2.off("reInit", checkScrollabilityAndVisibility2);
      window.removeEventListener("resize", checkScrollabilityAndVisibility2);
    };
  }, [
    isMounted,
    emblaApi2,
    updateButtonStates2,
    checkScrollabilityAndVisibility2,
  ]);

  // Split classes into two rows
  const firstRowClasses = useMemo(() => {
    const halfLength = Math.ceil(classes.length / 2);
    return classes.slice(0, halfLength);
  }, [classes]);

  const secondRowClasses = useMemo(() => {
    const halfLength = Math.ceil(classes.length / 2);
    return classes.slice(halfLength);
  }, [classes]);

  // Memoized class cards with distance calculation
  const createClassCards = useCallback(
    (classList, priorityOffset = 0) => {
      return classList.map((classItem, index) => {
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
                priority={index + priorityOffset < 3} // PRIORITY LOADING FOR FIRST 3 CARDS
              />
            </div>
          </div>
        );
      });
    },
    [userLocation]
  );

  const firstRowCards = useMemo(() => {
    return createClassCards(firstRowClasses, 0);
  }, [firstRowClasses, createClassCards]);

  const secondRowCards = useMemo(() => {
    return createClassCards(secondRowClasses, firstRowClasses.length);
  }, [secondRowClasses, createClassCards, firstRowClasses.length]);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
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
          {(showButtons1 || showButtons2) && !loading && (
            <ButtonContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScrollButton
                onClick={scrollPrev1}
                disabled={prevBtnDisabled1 || loading}
                aria-label="Scroll previous classes"
              >
                <ChevronLeft />
              </ScrollButton>
              <ScrollButton
                onClick={scrollNext1}
                disabled={nextBtnDisabled1 || loading}
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

      {loading ? (
        <CarouselContainer>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "380px",
            }}
          >
            <GlobalLoaderWithoutInlineStyles />
          </div>
        </CarouselContainer>
      ) : classes.length === 0 ? (
        <NoClassesFound>No nearby classes found at the moment.</NoClassesFound>
      ) : (
        <RowContainer>
          {/* First Row */}
          <CarouselContainer>
            <EmblaViewport ref={emblaRef1}>
              <EmblaContainer>
                {firstRowCards}
                {isFetchingMore && (
                  <div className="embla__slide">
                    <LoadingOverlay
                      style={{ position: "relative", height: "380px" }}
                    >
                      <GlobalLoaderWithoutInlineStyles size="30px" />
                    </LoadingOverlay>
                  </div>
                )}
              </EmblaContainer>
            </EmblaViewport>
          </CarouselContainer>

          {/* Second Row */}
          {secondRowClasses.length > 0 && (
            <CarouselContainer>
              <EmblaViewport ref={emblaRef2}>
                <EmblaContainer>{secondRowCards}</EmblaContainer>
              </EmblaViewport>
            </CarouselContainer>
          )}
        </RowContainer>
      )}

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
