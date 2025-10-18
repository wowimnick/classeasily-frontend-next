"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: ${(props) => props.$radius || "8px"};
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #fff;
`;

const Header = styled.div`
  height: 80px;
  border-bottom: 1px solid #eee;
  background: white;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

// Title section (desktop only)
const TitleSection = styled.div`
  padding: 1rem;
  margin: 1rem 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const TitleSkeleton = styled(SkeletonBase)`
  height: 48px;
  width: 60%;

  @media (max-width: 768px) {
    width: 80%;
    height: 32px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButtonSkeleton = styled(SkeletonBase)`
  width: 100px;
  height: 40px;
  border-radius: 8px;

  @media (max-width: 768px) {
    width: 40px;
  }
`;

// Images section
const ImagesContainer = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const DesktopImagesWrapper = styled.div`
  display: flex;
  gap: 8px;
  height: 500px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const LargeImageSkeleton = styled(SkeletonBase)`
  flex: 0 0 60%;
  border-radius: 12px 0 0 12px;
`;

const ImagesGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
`;

const SmallImageSkeleton = styled(SkeletonBase)`
  &:nth-child(1) {
    border-radius: 0 12px 0 0;
  }
  &:nth-child(4) {
    border-radius: 0 0 12px 0;
  }
`;

const MobileImageSkeleton = styled(SkeletonBase)`
  display: none;
  aspect-ratio: 1 / 1;
  border-radius: 0;

  @media (max-width: 768px) {
    display: block;
  }
`;

// Main content layout
const MainContentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 4rem;
  padding: 2rem 0;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 350px;
    gap: 2rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const PrimaryContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

// Mobile title section
const MobileTitleSection = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0.75rem;
  }
`;

const MobileTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const MobileTitleSkeleton = styled(SkeletonBase)`
  height: 32px;
  flex: 1;
`;

const MobileActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const MobileActionButton = styled(SkeletonBase)`
  width: 48px;
  height: 48px;
  border-radius: 8px;
`;

// Business section
const BusinessSection = styled.div`
  padding: 0 0 1.5rem 0;
  border-bottom: 1px solid #eaeaea;

  @media (max-width: 768px) {
    padding: 0 0.75rem 1.25rem;
  }
`;

const BusinessInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BusinessAvatar = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const BusinessDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BusinessNameSkeleton = styled(SkeletonBase)`
  height: 20px;
  width: 200px;
`;

const BusinessSubtextSkeleton = styled(SkeletonBase)`
  height: 16px;
  width: 150px;
`;

// Stats section
const StatsSection = styled.div`
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;

  @media (max-width: 768px) {
    padding: 0 0.75rem 1.5rem;
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const StatSkeleton = styled(SkeletonBase)`
  height: 20px;
  width: 120px;
`;

// Description section
const DescriptionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
`;

const DescriptionLine = styled(SkeletonBase)`
  height: 16px;
  width: ${(props) => props.$width || "100%"};
`;

// Map section
const MapSection = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  height: 450px;

  @media (max-width: 768px) {
    height: 350px;
    border-radius: 12px;
  }
`;

const MapSkeleton = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
  border-radius: 16px;

  @media (max-width: 768px) {
    border-radius: 12px;
  }
`;

// Features section
const FeaturesSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const FeatureTitle = styled(SkeletonBase)`
  height: 32px;
  width: 300px;
  margin-bottom: 1.5rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureTag = styled(SkeletonBase)`
  height: 56px;
  border-radius: 12px;
`;

// Reviews section
const ReviewsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const ReviewsTitle = styled(SkeletonBase)`
  height: 32px;
  width: 200px;
  margin-bottom: 1.5rem;
`;

const ReviewCard = styled.div`
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const ReviewHeader = styled.div`
  display: flex;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
`;

const ReviewAvatar = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const ReviewInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ReviewName = styled(SkeletonBase)`
  height: 18px;
  width: 150px;
`;

const ReviewRating = styled(SkeletonBase)`
  height: 14px;
  width: 100px;
`;

const ReviewComment = styled(SkeletonBase)`
  height: 60px;
  margin-bottom: 0.5rem;
`;

// Host info section
const HostSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const HostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
`;

const HostAvatar = styled(SkeletonBase)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const HostDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const HostName = styled(SkeletonBase)`
  height: 24px;
  width: 200px;
`;

const HostSubtext = styled(SkeletonBase)`
  height: 16px;
  width: 150px;
`;

const HostStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`;

const HostStatBlock = styled(SkeletonBase)`
  height: 80px;
  border-radius: 12px;
`;

// Sidebar (booking section)
const Sidebar = styled.div`
  @media (max-width: 768px) {
    order: -1;
  }
`;

const BookingCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 1.25rem;
  box-shadow: 0px 7px 12px 4px #0000000a;
`;

const DisclaimerSkeleton = styled(SkeletonBase)`
  height: 48px;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const PriceSkeleton = styled(SkeletonBase)`
  height: 36px;
  width: 120px;
  margin-bottom: 1rem;
`;

const DetailsSkeleton = styled(SkeletonBase)`
  height: 40px;
  margin-bottom: 1rem;
`;

const ScheduleSkeleton = styled(SkeletonBase)`
  height: 120px;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const ButtonSkeleton = styled(SkeletonBase)`
  height: 48px;
  border-radius: 14px;
`;

export default function ClassPageSkeleton() {
  return (
    <PageWrapper>
      <Header />

      <ContentWrapper>
        {/* Desktop Title */}
        <TitleSection>
          <TitleRow>
            <TitleSkeleton />
            <ActionButtons>
              <ActionButtonSkeleton />
              <ActionButtonSkeleton />
            </ActionButtons>
          </TitleRow>
        </TitleSection>

        {/* Images */}
        <ImagesContainer>
          <DesktopImagesWrapper>
            <LargeImageSkeleton />
            <ImagesGrid>
              <SmallImageSkeleton />
              <SmallImageSkeleton />
              <SmallImageSkeleton />
              <SmallImageSkeleton />
            </ImagesGrid>
          </DesktopImagesWrapper>
          <MobileImageSkeleton />
        </ImagesContainer>

        {/* Main Layout */}
        <MainContentLayout>
          <PrimaryContent>
            {/* Mobile Title */}
            <MobileTitleSection>
              <MobileTitleRow>
                <MobileTitleSkeleton />
                <MobileActions>
                  <MobileActionButton />
                  <MobileActionButton />
                </MobileActions>
              </MobileTitleRow>
            </MobileTitleSection>

            {/* Business Info */}
            <BusinessSection>
              <BusinessInfo>
                <BusinessAvatar />
                <BusinessDetails>
                  <BusinessNameSkeleton />
                  <BusinessSubtextSkeleton />
                </BusinessDetails>
              </BusinessInfo>
            </BusinessSection>

            {/* Stats */}
            <StatsSection>
              <StatsRow>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </StatsRow>
            </StatsSection>

            {/* Description */}
            <DescriptionSection>
              <DescriptionLine $width="100%" />
              <DescriptionLine $width="95%" />
              <DescriptionLine $width="98%" />
              <DescriptionLine $width="90%" />
              <DescriptionLine $width="85%" />
            </DescriptionSection>

            {/* Map */}
            <MapSection>
              <MapSkeleton $radius="16px" />
            </MapSection>

            {/* Features */}
            <FeaturesSection>
              <FeatureTitle />
              <FeaturesGrid>
                <FeatureTag />
                <FeatureTag />
                <FeatureTag />
                <FeatureTag />
                <FeatureTag />
                <FeatureTag />
              </FeaturesGrid>
            </FeaturesSection>

            {/* Reviews */}
            <ReviewsSection>
              <ReviewsTitle />
              {[1, 2, 3].map((i) => (
                <ReviewCard key={i}>
                  <ReviewHeader>
                    <ReviewAvatar />
                    <ReviewInfo>
                      <ReviewName />
                      <ReviewRating />
                    </ReviewInfo>
                  </ReviewHeader>
                  <ReviewComment />
                </ReviewCard>
              ))}
            </ReviewsSection>

            {/* Host Info */}
            <HostSection>
              <HostHeader>
                <HostAvatar />
                <HostDetails>
                  <HostName />
                  <HostSubtext />
                </HostDetails>
              </HostHeader>
              <HostStatsGrid>
                <HostStatBlock />
                <HostStatBlock />
                <HostStatBlock />
              </HostStatsGrid>
            </HostSection>
          </PrimaryContent>

          {/* Booking Sidebar */}
          <Sidebar>
            <BookingCard>
              <DisclaimerSkeleton />
              <PriceSkeleton />
              <DetailsSkeleton />
              <ScheduleSkeleton />
              <ButtonSkeleton />
            </BookingCard>
          </Sidebar>
        </MainContentLayout>
      </ContentWrapper>
    </PageWrapper>
  );
}
