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
import ClassCardSkeleton from "@/components/common/ClassCardSkeleton";

// --- STYLED COMPONENTS ---
const { Title: AntTitle, Paragraph } = Typography;

const MainWrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  /* Restore original padding */
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
    /* Restore mobile padding so text aligns correctly */
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
  min-height: 60px; 
`;

const SectionHeader = styled.div``;

const StyledTitle = styled(AntTitle)`
  &.ant-typography {
    font-size: clamp(1.8rem, 4vw, 2.2rem);
    font-weight: 700;
    margin-bottom: 0.5rem !important;
    color: #000;
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
  min-height: 380px;
  will-change: transform; 

  /* 
     Updated: Removed negative margins and added left padding 
     to ensure the first card isn't cut off.
  */
  padding: 1rem 0.5rem 1rem 1rem; 

  @media (max-width: 768px) {
    min-height: auto; /* Remove forced height on mobile so short cards fit tightly */
    gap: 12px; /* Reduce gap to fit 2 items better */
  }

  @media (max-width: 616px) {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

const SlideWrapper = styled.div`
  flex: 0 0 auto;
  position: relative;
  
  /* Desktop Width */
  width: 250px;
  min-width: 250px;

  /* 
     Mobile Optimization:
     ~165px allows 2 cards to fit on a standard 375px/390px mobile screen
     with a slight peek of the 3rd card, or a clean 2-column feel.
     Reducing the width automatically scales down the image height 
     (assuming aspect-ratio is preserved in HomeClassCard).
  */
  @media (max-width: 616px) {
    width: 165px;
    min-width: 165px;
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

// --- CONFIGURATION ---
const ENABLE_IP_GEOLOCATION = true;
const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// --- CONSTANTS ---
const CAROUSEL_OPTIONS = {
  align: "start",
  containScroll: false, 
  loop: false,
  dragFree: true,
  slidesToScroll: "auto",
};

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

  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS);

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let isComponentMounted = true;

    const fetchIpLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("IP API failed");
        const data = await response.json();
        if (data && data.latitude && data.longitude && isComponentMounted) {
          setUserLocation({
            lat: data.latitude,
            lng: data.longitude,
            city: data.city,
            region: data.region,
            region_code: data.region_code,
          });
        }
      } catch (err) {
        if (isComponentMounted) setLocationError(err.message);
      } finally {
        if (isComponentMounted) setLoadingLocation(false);
      }
    };

    const fetchBrowserLocation = () => {
      if (!navigator.geolocation) {
        if (isComponentMounted) {
          setLocationError("Geolocation is not supported.");
          setLoadingLocation(false);
        }
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isComponentMounted) return;
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `${AWS_LOCATION_API_URL}?lat=${latitude}&lng=${longitude}&reverse=true`
            );
            if (!response.ok) throw new Error("Reverse geocoding failed");
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
              const place = data[0];
              setUserLocation({
                lat: latitude,
                lng: longitude,
                city: place.city || place.locality || place.place || null,
                region: place.state || place.region || null,
                region_code: place.state || place.region || "",
              });
            } else {
              setUserLocation({
                lat: latitude,
                lng: longitude,
                city: null,
                region: null,
                region_code: "",
              });
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            setUserLocation({
              lat: latitude,
              lng: longitude,
              city: null,
              region: null,
              region_code: "",
            });
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          if (isComponentMounted) {
            setLocationError(error.message);
            setLoadingLocation(false);
          }
        }
      );
    };

    if (ENABLE_IP_GEOLOCATION) fetchIpLocation();
    else fetchBrowserLocation();

    return () => {
      isComponentMounted = false;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || initialClasses.length > 0) return;

    const fetchClasses = async () => {
      setLoading(true);
      try {
        const response = await classService.fetchClasses({}, nextPageUrl);
        if (isMounted) {
          setClasses(response?.results || []);
          setNextPageUrl(response?.next || null);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    fetchClasses();
  }, [isMounted, initialClasses]);

  const handleScroll = useCallback(async () => {
    if (!emblaApi || !nextPageUrl || isFetchingMore) return;

    if (emblaApi.scrollProgress() > 0.7) {
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
    emblaApi.on("resize", checkScrollabilityAndVisibility);
    checkScrollabilityAndVisibility();

    return () => {
      emblaApi.off("scroll", handleScroll);
      emblaApi.off("select", updateButtonStates);
      emblaApi.off("reInit", checkScrollabilityAndVisibility);
      emblaApi.off("resize", checkScrollabilityAndVisibility);
    };
  }, [
    isMounted,
    emblaApi,
    handleScroll,
    updateButtonStates,
    checkScrollabilityAndVisibility,
  ]);

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
        <SlideWrapper key={classItem.classId}>
          <HomeClassCard
            {...classItem}
            rating={classItem.average_rating}
            totalReviews={adjustedReviewCount}
            distance={calculatedDistance}
            priority={index < 3}
          />
        </SlideWrapper>
      );
    });
  }, [classes, userLocation]);

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
        params.set("location", `${city}, ${region_code}`);

        const participants = searchParams.get("participants");
        if (participants) params.set("participants", participants);

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

  const linkText = useMemo(() => {
    if (loadingLocation) return "Locating...";
    if (userLocation?.city) return `See all classes in ${userLocation.city}`;
    if (userLocation) return "See all classes near me";
    return "See all classes";
  }, [userLocation, loadingLocation]);

  if (!isMounted) return null;

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
          {showButtons && !loading && (
            <ButtonContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScrollButton
                onClick={scrollPrev}
                disabled={prevBtnDisabled || loading}
                aria-label="Scroll previous"
              >
                <ChevronLeft />
              </ScrollButton>
              <ScrollButton
                onClick={scrollNext}
                disabled={nextBtnDisabled || loading}
                aria-label="Scroll next"
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
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SlideWrapper key={`skeleton-init-${index}`}>
                  <ClassCardSkeleton />
                </SlideWrapper>
              ))
            ) : classes.length === 0 ? (
              <NoClassesFound>
                No nearby classes found at the moment.
              </NoClassesFound>
            ) : (
              <>
                {classCards}
                {nextPageUrl && (
                  <>
                    <SlideWrapper key="skeleton-1">
                      <ClassCardSkeleton />
                    </SlideWrapper>
                    <SlideWrapper key="skeleton-2">
                      <ClassCardSkeleton />
                    </SlideWrapper>
                    <SlideWrapper key="skeleton-3">
                      <ClassCardSkeleton />
                    </SlideWrapper>
                  </>
                )}
              </>
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

FindClass.displayName = "FindClass";

export default FindClass;