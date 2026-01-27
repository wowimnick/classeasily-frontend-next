"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import ReactPixel from "react-facebook-pixel";
import { useRouter, useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { useAuthUser } from "@/hooks/useAuthUser";
import confetti from "canvas-confetti";
import dynamic from "next/dynamic";

import ClassPageImagesTitle from "./ClassPageImagesTitle";
import ClassInformation from "./ClassInformation";
import { classService } from "@/services/apiService.js";
import { Alert, Button as AntButton } from "antd";
import message from "@/lib/message";

// Dynamic imports for better code splitting
const ClassOffers = dynamic(() => import("./ClassOffers"));
const Reviews = dynamic(() => import("./ClassReviews"));
const HostInfo = dynamic(() => import("./ClassHostInfo"));
const ClassPageMap = dynamic(() => import("./ClassPageMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "400px", background: "#f0f0f0", borderRadius: "14px" }}
    />
  ),
});

// Dynamic import for booking components - only load when needed
const BookingModal = dynamic(() => import("./BookingModal"), {
  ssr: false,
  loading: () => null,
});

const ClassOptionsContainer = dynamic(() => import("./ClassOptionsContainer"), {
  ssr: false,
});

// Skeleton loader styles (ORIGINAL)
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const Skel_Base = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 2000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: ${(props) => props.$radius || "8px"};
`;

const Skel_MapSection = styled.div`
  background: white;
  border-radius: 14px;
  overflow: hidden;
  height: 400px;
  margin-top: 2.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    height: 300px;
    border-radius: 12px;
    margin-top: 0;
    margin-bottom: 0;
    padding: 2rem 0.75rem;
  }
`;

const Skel_Map = styled(Skel_Base)`
  width: 100%;
  height: 100%;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    border-radius: 12px;
  }
`;

const Skel_FeaturesSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const Skel_FeatureTitle = styled(Skel_Base)`
  height: 32px;
  width: 300px;
  margin-bottom: 1.5rem;
`;

const Skel_FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const Skel_FeatureTag = styled(Skel_Base)`
  height: 56px;
  border-radius: 12px;
`;

const Skel_ReviewsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const Skel_ReviewsTitle = styled(Skel_Base)`
  height: 32px;
  width: 200px;
  margin-bottom: 1.5rem;
`;

const Skel_ReviewCard = styled.div`
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const Skel_ReviewHeader = styled.div`
  display: flex;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
`;

const Skel_ReviewAvatar = styled(Skel_Base)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const Skel_ReviewInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Skel_ReviewName = styled(Skel_Base)`
  height: 18px;
  width: 150px;
`;

const Skel_ReviewRating = styled(Skel_Base)`
  height: 14px;
  width: 100px;
`;

const Skel_ReviewComment = styled(Skel_Base)`
  height: 60px;
  margin-bottom: 0.5rem;
`;

const Skel_HostSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const Skel_HostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
`;

const Skel_HostAvatar = styled(Skel_Base)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const Skel_HostDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Skel_HostName = styled(Skel_Base)`
  height: 24px;
  width: 200px;
`;

const Skel_HostSubtext = styled(Skel_Base)`
  height: 16px;
  width: 150px;
`;

const Skel_HostStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`;

const Skel_HostStatBlock = styled(Skel_Base)`
  height: 80px;
  border-radius: 12px;
`;

const Skel_BookingCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 1.25rem;
  box-shadow: 0px 7px 12px 4px #0000000a;
`;

const Skel_Disclaimer = styled(Skel_Base)`
  height: 48px;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const Skel_Price = styled(Skel_Base)`
  height: 36px;
  width: 120px;
  margin-bottom: 1rem;
`;

const Skel_Details = styled(Skel_Base)`
  height: 40px;
  margin-bottom: 1rem;
`;

const Skel_Schedule = styled(Skel_Base)`
  height: 120px;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const Skel_Button = styled(Skel_Base)`
  height: 48px;
  border-radius: 14px;
`;

// Styled Components (original)
const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const MainContentLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
  gap: 5rem;
  padding: 0 0 4rem 0;
  position: relative;
  z-index: 5;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding-bottom: 3rem;
    padding-top: 0;
    align-items: stretch;
    margin-top: -3rem;
  }
`;

const PrimaryContentArea = styled.main`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const StickySidebar = styled.aside`
  position: sticky;
  top: 1rem;
  align-self: start;
  height: fit-content;
  max-height: calc(100vh - 8rem);

  @media (max-width: 1024px) {
    display: none;
  }
`;

const MobileBookingFooterContainer = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    width: auto;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(8px) saturate(180%);
    -webkit-backdrop-filter: blur(8px) saturate(180%);
    padding: 0.7rem 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.125);
    border-radius: 16px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
    z-index: 100;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s ease;

    &[data-hidden="true"] {
      transform: translateY(calc(100% + 2rem));
      opacity: 0;
      pointer-events: none;
    }
  }
`;

const FooterPriceInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 2rem;
  line-height: 1.2;
`;

const FooterPrice = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #222;

  span {
    font-size: 0.875rem;
    font-weight: 400;
    color: #717171;
  }
`;

const MapSectionWrapper = styled.section`
  margin-top: 2.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    padding: 2rem 0.75rem;
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const MapInnerContainer = styled.div`
  height: 400px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    height: 300px;
  }
`;

const AddressDisplay = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1rem;
  padding: 0 1rem;
`;

const MobileBookingFooter = ({ option, onBookNow, hidden }) => {
  if (!option) return null;

  const { schedules, booking_type } = option;
  const isCourse = booking_type === "Full Course";

  const getPriceDisplay = () => {
    if (!schedules || schedules.length === 0)
      return { display: "N/A", per: "" };
    const prices = schedules
      .map((s) => parseFloat(s.price || 0))
      .filter((p) => p > 0);
    if (prices.length === 0) return { display: "Free", per: "" };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const priceDisplay =
      min === max
        ? `$${min.toFixed(0)}`
        : `$${min.toFixed(0)} - ${max.toFixed(0)}`;
    const perWhat = isCourse ? "course" : "session";
    return { display: priceDisplay, per: perWhat };
  };

  const { display, per } = getPriceDisplay();
  const buttonText = isCourse ? "View Dates" : "Select Time";

  return (
    <MobileBookingFooterContainer data-hidden={hidden}>
      <FooterPriceInfo>
        <FooterPrice>
          {display} {per && <span>/ {per}</span>}
        </FooterPrice>
      </FooterPriceInfo>
      <AntButton
        type="primary"
        size="large"
        onClick={() => onBookNow(option.optionId)}
        style={{ borderRadius: "8px", fontWeight: 600 }}
      >
        {buttonText}
      </AntButton>
    </MobileBookingFooterContainer>
  );
};

export default function ClassPageClient({
  classData,
  businessData,
  initialReviews,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // We use `mounted` only for client-specific portals or overlays (like BookingModal)
  // The main content is rendered immediately for SEO.
  const [mounted, setMounted] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedOptionIdForModal, setSelectedOptionIdForModal] =
    useState(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(classData.is_favorited);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

  // Simulate booking options loading state if needed, or derived from props
  // Since options come from server props, they are technically loaded.
  // We keep this state to maintain existing logic if desired, or set true immediately.
  const [bookingOptionsLoaded, setBookingOptionsLoaded] = useState(
    !!(classData.options && classData.options.length > 0),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 1. Determine a price to send to Pixel (matches your card display logic)
    let pixelPrice = 0;

    if (classData?.options?.length > 0) {
      // Find the first option that has a valid price
      const bestOption =
        classData.options.find((opt) =>
          opt.schedules?.some(
            (s) => s.price != null && parseFloat(s.price) > 0,
          ),
        ) || classData.options[0];

      // Extract price from schedule or fallback to option level
      if (bestOption) {
        const validSchedule = bestOption.schedules?.find(
          (s) => parseFloat(s.price) > 0,
        );
        const rawPrice = validSchedule ? validSchedule.price : bestOption.price;
        pixelPrice = parseFloat(rawPrice);
      }
    }

    // 2. Fire the Event
    // We check for NaN just in case parsing failed
    const finalValue = isNaN(pixelPrice) ? 0 : pixelPrice;

    ReactPixel.track("ViewContent", {
      content_name: classData.title,
      content_ids: [classData.classId], // Matches the ID in your catalog
      content_type: "product",
      value: finalValue,
      currency: classData.currency_code || "CAD", // Fallback to CAD if missing
      content_category: classData.category_name,
    });
  }, [classData]);

  const { user: currentUser } = useAuthUser();
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const handleReviewsModalChange = (event) => {
      setIsReviewsModalOpen(event.detail.isOpen);
    };
    window.addEventListener(
      "reviewsModalStateChange",
      handleReviewsModalChange,
    );
    return () => {
      window.removeEventListener(
        "reviewsModalStateChange",
        handleReviewsModalChange,
      );
    };
  }, []);

  const handleBusinessClick = () => {
    if (businessData?.slug) {
      router.push(`/business/${businessData.slug}`);
    }
  };

  const handleFavoriteClick = useCallback(
    async (event) => {
      const buttonElement = event?.currentTarget;
      if (!isAuthenticated)
        return message.info("Please log in to save favorites.");
      if (isTogglingFavorite || !classData) return;

      setIsTogglingFavorite(true);
      const originalState = isFavorite;
      setIsFavorite(!originalState);

      try {
        const result = await classService.toggleFavoriteClass(
          classData.classId,
        );
        if (result.success) {
          if (!originalState && buttonElement) {
            const rect = buttonElement.getBoundingClientRect();
            const origin = {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            };
            confetti({
              particleCount: 80,
              spread: 70,
              origin: origin,
              colors: ["#FF385C", "#FF7A9E", "#FFFFFF", "#FEDADD"],
              zIndex: 10000,
            });
          }
        } else {
          setIsFavorite(originalState);
          message.error(result.error || "Could not update favorite status.");
        }
      } catch (error) {
        setIsFavorite(originalState);
        message.error("An error occurred. Please try again.");
      } finally {
        setIsTogglingFavorite(false);
      }
    },
    [isAuthenticated, isTogglingFavorite, isFavorite, classData],
  );

  const handleOpenShareModal = () => setIsShareModalVisible(true);
  const handleCloseShareModal = () => setIsShareModalVisible(false);

  const fullAddress = useMemo(() => {
    if (!classData) return null;
    const { location, unit_number } = classData;
    return [location, unit_number].filter(Boolean).join(", ");
  }, [classData]);

  const handleOpenBookingModal = (optionId) => {
    if (!classData) return;
    setSelectedOptionIdForModal(optionId);
    setIsBookingModalOpen(true);
  };

  const optionToDisplayOnCard = useMemo(() => {
    if (!classData?.options || classData.options.length === 0) return null;
    return (
      classData.options.find((opt) =>
        opt.schedules?.some((s) => s.price != null && parseFloat(s.price) > 0),
      ) || classData.options[0]
    );
  }, [classData]);

  const locationText =
    classData?.business_city && classData?.business_state
      ? `${classData.business_city}, ${classData.business_state}`
      : classData?.business_state || classData?.business_city || null;

  return (
    <>
      <ContentWrapper>
        {/* Render Title & Images immediately for SEO */}
        <ClassPageImagesTitle
          title={classData.title}
          images={classData.images || []}
          rating={classData.average_rating}
          business_name={businessData?.businessName}
          categoryName={classData.category_name}
          location={locationText}
          isShareModalVisible={isShareModalVisible}
          onShareModalClose={handleCloseShareModal}
          isFavorite={isFavorite}
          isTogglingFavorite={isTogglingFavorite}
          onFavoriteClick={handleFavoriteClick}
          onShareClick={handleOpenShareModal}
        />

        <MainContentLayout>
          <PrimaryContentArea>
            {/* Render Description immediately for SEO */}
            <ClassInformation
              title={classData.title}
              description={classData.description}
              reviewCount={classData.review_count || 0}
              averageRating={classData.average_rating || 0}
              categoryName={classData.category_name}
              subcategoryName={classData.subcategory_name}
              businessData={businessData}
              onBusinessClick={businessData ? handleBusinessClick : undefined}
              partnerTierName={businessData?.partner_tier_name}
              isFavorite={isFavorite}
              isTogglingFavorite={isTogglingFavorite}
              onFavoriteClick={handleFavoriteClick}
              onShareClick={handleOpenShareModal}
            />

            {/* Suspense fallback for client-heavy components */}
            <Suspense
              fallback={
                <>
                  <Skel_MapSection>
                    <Skel_Map $radius="14px" />
                  </Skel_MapSection>
                  <Skel_FeaturesSection>
                    <Skel_FeatureTitle />
                    <Skel_FeaturesGrid>
                      <Skel_FeatureTag />
                      <Skel_FeatureTag />
                      <Skel_FeatureTag />
                      <Skel_FeatureTag />
                      <Skel_FeatureTag />
                      <Skel_FeatureTag />
                    </Skel_FeaturesGrid>
                  </Skel_FeaturesSection>
                  <Skel_ReviewsSection>
                    <Skel_ReviewsTitle />
                    {[1, 2, 3].map((i) => (
                      <Skel_ReviewCard key={i}>
                        <Skel_ReviewHeader>
                          <Skel_ReviewAvatar />
                          <Skel_ReviewInfo>
                            <Skel_ReviewName />
                            <Skel_ReviewRating />
                          </Skel_ReviewInfo>
                        </Skel_ReviewHeader>
                        <Skel_ReviewComment />
                      </Skel_ReviewCard>
                    ))}
                  </Skel_ReviewsSection>
                  <Skel_HostSection>
                    <Skel_HostHeader>
                      <Skel_HostAvatar />
                      <Skel_HostDetails>
                        <Skel_HostName />
                        <Skel_HostSubtext />
                      </Skel_HostDetails>
                    </Skel_HostHeader>
                    <Skel_HostStatsGrid>
                      <Skel_HostStatBlock />
                      <Skel_HostStatBlock />
                      <Skel_HostStatBlock />
                    </Skel_HostStatsGrid>
                  </Skel_HostSection>
                </>
              }
            >
              {classData.coordinates && (
                <MapSectionWrapper>
                  <MapInnerContainer>
                    <ClassPageMap
                      coordinates={classData.coordinates}
                      saltLocation={classData.saltLocation}
                      businessName={
                        businessData?.businessName || classData.title
                      }
                      fullAddress={!classData.saltLocation ? fullAddress : null}
                    />
                  </MapInnerContainer>
                  {!classData.saltLocation && fullAddress && (
                    <AddressDisplay>{fullAddress}</AddressDisplay>
                  )}
                </MapSectionWrapper>
              )}
              <ClassOffers
                features={
                  Array.isArray(classData.features) ? classData.features : []
                }
              />
              <Reviews
                slug={classData.slug}
                initialRating={classData.average_rating || 0}
                initialReviewCount={classData.review_count || 0}
                platformReviewCount={classData.platform_review_count || 0}
                serverReviews={initialReviews || null}
              />
              {businessData && (
                <HostInfo
                  businessData={businessData}
                  onHostClick={handleBusinessClick}
                />
              )}
            </Suspense>
          </PrimaryContentArea>

          <StickySidebar>
            {!bookingOptionsLoaded ? (
              <Skel_BookingCard>
                <Skel_Disclaimer />
                <Skel_Price />
                <Skel_Details />
                <Skel_Schedule />
                <Skel_Button />
              </Skel_BookingCard>
            ) : optionToDisplayOnCard ? (
              <ClassOptionsContainer
                options={[optionToDisplayOnCard]}
                classTitle={classData.title}
                classImages={classData.images}
                currency={classData.currency_code || "$"}
                onBookNow={handleOpenBookingModal}
              />
            ) : null}
          </StickySidebar>
        </MainContentLayout>
      </ContentWrapper>
      {/* Render portals / overlays only after mount to avoid hydration mismatch on body append */}
      {mounted && (
        <>
          {optionToDisplayOnCard && (
            <MobileBookingFooter
              option={optionToDisplayOnCard}
              onBookNow={handleOpenBookingModal}
              hidden={isReviewsModalOpen}
            />
          )}

          {isBookingModalOpen && (
            <BookingModal
              isOpen={isBookingModalOpen}
              onClose={() => setIsBookingModalOpen(false)}
              classData={classData}
              optionId={selectedOptionIdForModal}
              initialParticipantCount={1}
            />
          )}
        </>
      )}
    </>
  );
}
