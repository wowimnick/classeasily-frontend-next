"use client";

import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic"; // Import dynamic
import ExploreHeader from "@/components/explore/ExploreHeader.jsx";
import FooterClient from "@/components/homepage/FooterClient";
import BusinessHero from "./BusinessHero";
import BusinessNavigation from "./BusinessNavigation";
import ClassesTab from "./ClassesTab";
import ReviewsTab from "./ReviewsTab";
// LocationTab is now imported dynamically below
import ContactTab from "./ContactTab";
import {
  BusinessHeroSkeleton,
  ClassesTabSkeleton,
  ReviewsTabSkeleton,
  LocationTabSkeleton, // We'll use this for the dynamic loading state
  ContactTabSkeleton,
} from "./BusinessSkeletons";

// --- START: Dynamic import for the Leaflet-based component ---
const LocationTab = dynamic(() => import("./LocationTab"), {
  ssr: false, // This is the key: disable server-side rendering
  loading: () => <LocationTabSkeleton />, // Show a skeleton while the component loads on the client
});
// --- END: Dynamic import ---

const LeafletMarkerStyles = createGlobalStyle`
  .leaflet-brand-marker {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #ff385c;
    border: 2px solid white;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .leaflet-brand-marker-icon {
    transform: rotate(45deg);
  }
`;

const BusinessPageWrapper = styled.div`
  background-color: #fafafa;
  min-height: 100vh;
`;

const ContentArea = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const BusinessPageClient = ({ initialData, slug }) => {
  const router = useRouter();
  const [businessData, setBusinessData] = useState(initialData);
  const [activeTab, setActiveTab] = useState("classes");
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);
  const [isTabContentLoaded, setIsTabContentLoaded] = useState(false);

  useEffect(() => {
    // Simulate hero loading complete
    const heroTimer = setTimeout(() => {
      setIsHeroLoaded(true);
    }, 100);

    return () => clearTimeout(heroTimer);
  }, []);

  useEffect(() => {
    // Reset tab content loading when tab changes
    setIsTabContentLoaded(false);
    const tabTimer = setTimeout(() => {
      setIsTabContentLoaded(true);
    }, 150);

    return () => clearTimeout(tabTimer);
  }, [activeTab]);

  const handleFavoriteChange = (classId, newIsFavorited) => {
    setBusinessData((currentData) => {
      if (!currentData) return null;
      const updatedClasses = currentData.classes.map((cls) =>
        cls.classId === classId ? { ...cls, is_favorited: newIsFavorited } : cls
      );
      return { ...currentData, classes: updatedClasses };
    });
  };

  if (!businessData) return null;

  const {
    businessName,
    businessDescription,
    business_image_medium_url,
    businessCity,
    businessState,
    businessAddress,
    average_rating,
    totalReviews,
    classes = [],
    businessHours,
    studentContactPhone,
    studentContactEmail,
    website,
    social_media_links = {},
    contact_privacy,
  } = businessData;

  const ratingAsNumber = average_rating ? parseFloat(average_rating) : 0;

  return (
    <BusinessPageWrapper>
      <LeafletMarkerStyles />
      <ExploreHeader showOptionsWrapper={false} />

      {isHeroLoaded ? (
        <BusinessHero
          businessName={businessName}
          businessDescription={businessDescription}
          business_image_medium_url={business_image_medium_url}
          businessCity={businessCity}
          businessState={businessState}
          businessAddress={businessAddress}
          ratingAsNumber={ratingAsNumber}
          totalReviews={totalReviews}
          classesCount={classes.length}
        />
      ) : (
        <BusinessHeroSkeleton />
      )}

      <BusinessNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <ContentArea>
        {!isTabContentLoaded ? (
          <>
            {activeTab === "classes" && <ClassesTabSkeleton />}
            {activeTab === "reviews" && <ReviewsTabSkeleton />}
            {activeTab === "location" && <LocationTabSkeleton />}
            {activeTab === "contact" && <ContactTabSkeleton />}
          </>
        ) : (
          <>
            {activeTab === "classes" && (
              <ClassesTab
                classes={classes}
                businessName={businessName}
                handleFavoriteChange={handleFavoriteChange}
              />
            )}

            {activeTab === "reviews" && (
              <ReviewsTab
                slug={slug}
                totalReviews={totalReviews}
                ratingAsNumber={ratingAsNumber}
              />
            )}

            {activeTab === "location" && (
              <LocationTab
                businessName={businessName}
                businessAddress={businessAddress}
                classes={classes}
                businessHours={businessHours}
              />
            )}

            {activeTab === "contact" && (
              <ContactTab
                businessName={businessName}
                studentContactPhone={studentContactPhone}
                studentContactEmail={studentContactEmail}
                website={website}
                social_media_links={social_media_links}
                contact_privacy={contact_privacy}
                businessHours={businessHours}
              />
            )}
          </>
        )}
      </ContentArea>

      <FooterClient />
    </BusinessPageWrapper>
  );
};

export default BusinessPageClient;
