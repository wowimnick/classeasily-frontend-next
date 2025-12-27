"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

// --- ANIMATIONS ---
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: ${(props) => props.$radius || "4px"};
`;

// --- LAYOUT WRAPPERS ---
const SkeletonPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #fff;
`;

// --- EXACT HEADER SKELETON STYLES ---

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  padding: 0 2rem;
  border-bottom: 1px solid #f1f1f1;
  background-color: #fff;
  position: relative;
  z-index: 98;

  @media (max-width: 768px) {
    height: 60px;
    padding: 0 1rem;
    gap: 0.5rem;
  }
`;

const LogoPlaceholder = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%; /* Mimics the Logo Icon shape */
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

// --- DESKTOP SEARCH PILL SKELETON ---
const DesktopSearchPill = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 100px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: auto;
  padding: 0 8px; /* Padding for the search button */

  @media (max-width: 768px) {
    display: none;
  }
`;

const SectionPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 0 20px;
  gap: 4px;
`;

const LabelSkeleton = styled(SkeletonBase)`
  height: 10px;
  width: 30px;
`;

const ValueSkeleton = styled(SkeletonBase)`
  height: 14px;
  width: ${(props) => props.$width || "80px"};
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0;
  flex-shrink: 0;
`;

const SearchCircle = styled.div`
  width: 40px;
  height: 40px;
  background-color: #ff385c; /* Brand color to look realistic */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 8px;
`;

const SearchIconPlaceholder = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-radius: 50%;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 10px;
    left: 10px;
    width: 4px;
    height: 2px;
    background: white;
    transform: rotate(45deg);
  }
`;

// --- MOBILE SEARCH SKELETON ---
const MobileSearchPill = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    flex: 1;
    height: 44px; /* Matches mobile trigger height */
    padding: 0 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 40px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    gap: 12px;
  }
`;

const MobileIconSkeleton = styled(SkeletonBase)`
  width: 18px;
  height: 18px;
  border-radius: 50%;
`;

const MobileTextSkeleton = styled(SkeletonBase)`
  height: 14px;
  width: 120px;
`;

// --- USER MENU SKELETON ---
const RightSection = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  flex-shrink: 0;
  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const UserMenuPill = styled.div`
  height: 48px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px 4px 14px;
  border-radius: 28px;
  background-color: transparent;
  gap: 10px;
`;

const MenuIconLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const MenuLine = styled(SkeletonBase)`
  width: 14px;
  height: 2px;
  background: #222; /* Darker to mimic real icon */
  opacity: 0.3;
`;

const AvatarCircle = styled(SkeletonBase)`
  width: 30px;
  height: 30px;
  border-radius: 50%;
`;

// --- PREVIOUSLY DEFINED MAIN CONTENT SKELETONS (UNCHANGED) ---
// (Included here for context so the file is complete)

const SkeletonGridContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 40%);
  width: 100%;
  height: calc(100vh - 130px);
  position: relative;
  overflow: hidden;
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 35%);
  }
  @media (max-width: 1048px) {
    grid-template-columns: 1fr;
    height: calc(100vh - 110px);
  }
`;

const SkeletonLeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #e8e8e8;
`;

const SkeletonCategoriesWrapper = styled.div`
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 101;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.03);
`;

const SkeletonTopSection = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  position: relative;
  height: 72px;
  @media (max-width: 768px) {
    height: 64px;
  }
`;

const SkeletonCategoriesScrollArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 1.5rem;
  overflow: hidden;
  @media (max-width: 768px) {
    padding-left: 1rem;
  }
`;

const SkeletonCategoriesList = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 100%;
`;

const SkeletonCollectionPill = styled(SkeletonBase)`
  height: 32px;
  width: ${(props) => props.$width || "80px"};
  border-radius: 20px;
  flex-shrink: 0;
  @media (max-width: 768px) {
    height: 30px;
  }
`;

const SkeletonVerticalSeparator = styled.div`
  width: 1px;
  height: 24px;
  background-color: #eaeaea;
  margin: 0 8px;
  flex-shrink: 0;
`;

const SkeletonCategoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 64px;
  height: 100%;
  padding-top: 8px;
  gap: 4px;
  @media (max-width: 768px) {
    width: 60px;
  }
`;

const SkeletonCategoryIcon = styled(SkeletonBase)`
  width: 24px;
  height: 24px;
  border-radius: 4px;
`;

const SkeletonCategoryText = styled(SkeletonBase)`
  width: 48px;
  height: 10px;
  border-radius: 4px;
  margin-top: 2px;
`;

const SkeletonFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  flex-shrink: 0;
  gap: 12px;
  height: 100%;
  background: white;
  box-shadow: -10px 0 20px white;
  z-index: 2;
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const SkeletonFilterButton = styled(SkeletonBase)`
  height: 44px;
  width: 90px;
  border-radius: 20px;
  @media (max-width: 768px) {
    height: 40px;
    width: 40px;
  }
`;

const SkeletonMapButton = styled(SkeletonBase)`
  height: 44px;
  width: 80px;
  border-radius: 20px;
  @media (max-width: 1048px) {
    display: none;
  }
`;

const SkeletonSubCategories = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  padding: 0.5rem 1.5rem;
  gap: 0.5rem;
  width: 100%;
  border-top: 1px solid #f0f0f0;
  @media (max-width: 768px) {
    padding: 0.4rem 1rem;
    gap: 0.4rem;
  }
`;

const SkeletonSubCategoryPill = styled(SkeletonBase)`
  height: 32px;
  width: ${(props) => props.$width || "100px"};
  border-radius: 16px;
  flex-shrink: 0;
  @media (max-width: 768px) {
    height: 30px;
  }
`;

const SkeletonClassGridWrapper = styled.div`
  flex-grow: 1;
  padding: 1.5rem 2.5rem;
  overflow: hidden;
  @media (max-width: 1048px) {
    padding: 1rem;
  }
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const SkeletonClassGrid = styled.div`
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

const SkeletonClassCard = styled.div`
  display: flex;
  flex-direction: column;
  height: min-content;
  width: 100%;
  border-radius: 12px;
  border: 2px solid transparent;
  padding: 2px;
`;

const SkeletonCardImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  @media (max-width: 600px) {
    margin-bottom: 8px;
  }
`;

const SkeletonCardImage = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
`;

const SkeletonCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SkeletonTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 2px;
`;

const SkeletonCardTitle = styled(SkeletonBase)`
  height: 16px;
  width: 75%;
  border-radius: 4px;
`;

const SkeletonRating = styled(SkeletonBase)`
  height: 14px;
  width: 40px;
  border-radius: 4px;
  flex-shrink: 0;
`;

const SkeletonCompanyInfo = styled(SkeletonBase)`
  height: 14px;
  width: 60%;
  border-radius: 4px;
  margin-bottom: 2px;
`;

const SkeletonLocationRow = styled(SkeletonBase)`
  height: 14px;
  width: 45%;
  border-radius: 4px;
`;

const SkeletonPriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
`;

const SkeletonPrice = styled(SkeletonBase)`
  height: 16px;
  width: 70px;
  border-radius: 4px;
`;

const SkeletonMapContainer = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  padding: 25px;
  box-sizing: border-box;
  background: #fff;
  @media (max-width: 1048px) {
    display: none;
  }
`;

const SkeletonMapContent = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
  border-radius: 30px;
`;

const SkeletonMapFloatButton = styled(SkeletonBase)`
  position: absolute;
  top: 37px;
  left: 37px;
  width: 120px;
  height: 48px;
  border-radius: 20px;
  z-index: 2;
`;

const SimpleBreadcrumbPlaceholder = styled.div`
  height: 50px;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fff;
  flex-shrink: 0;
`;

// --- EXPORTED COMPONENTS ---

export function ClassesContentSkeleton() {
  return (
    <SkeletonClassGrid>
      {[...Array(8)].map((_, i) => (
        <SkeletonClassSingleCard key={i} />
      ))}
    </SkeletonClassGrid>
  );
}

export function SkeletonClassSingleCard() {
  return (
    <SkeletonClassCard>
      <SkeletonCardImageContainer>
        <SkeletonCardImage />
      </SkeletonCardImageContainer>
      <SkeletonCardContent>
        <SkeletonTopRow>
          <SkeletonCardTitle />
          <SkeletonRating />
        </SkeletonTopRow>
        <SkeletonCompanyInfo />
        <SkeletonLocationRow />
        <SkeletonPriceRow>
          <SkeletonPrice />
        </SkeletonPriceRow>
      </SkeletonCardContent>
    </SkeletonClassCard>
  );
}

// ----------------------------------------------------------------
// EXACT REPLICA HEADER SKELETON
// ----------------------------------------------------------------
export function ExploreHeaderSkeleton() {
  return (
    <HeaderWrapper>
      {/* 1. Logo */}
      <LogoPlaceholder />

      {/* 2. Desktop Search Pill (Hidden on Mobile) */}
      <DesktopSearchPill>
        {/* Where */}
        <SectionPlaceholder style={{ width: 140 }}>
          <LabelSkeleton />
          <ValueSkeleton $width="90px" />
        </SectionPlaceholder>
        <Divider />
        {/* Date */}
        <SectionPlaceholder style={{ width: 110 }}>
          <LabelSkeleton />
          <ValueSkeleton $width="60px" />
        </SectionPlaceholder>
        <Divider />
        {/* Who */}
        <SectionPlaceholder style={{ width: 100 }}>
          <LabelSkeleton />
          <ValueSkeleton $width="50px" />
        </SectionPlaceholder>
        {/* Pink Search Button */}
        <SearchCircle>
          <SearchIconPlaceholder />
        </SearchCircle>
      </DesktopSearchPill>

      {/* 3. Mobile Search Pill (Hidden on Desktop) */}
      <MobileSearchPill>
        <MobileIconSkeleton />
        <MobileTextSkeleton />
      </MobileSearchPill>

      {/* 4. User Menu (Right Side) */}
      <RightSection>
        <UserMenuPill>
          <MenuIconLines>
            <MenuLine />
            <MenuLine />
            <MenuLine />
          </MenuIconLines>
          <AvatarCircle />
        </UserMenuPill>
      </RightSection>
    </HeaderWrapper>
  );
}

export default function ExplorePageSkeleton() {
  return (
    <SkeletonPageWrapper>
      <ExploreHeaderSkeleton />
      <SimpleBreadcrumbPlaceholder />

      <SkeletonGridContainer>
        <SkeletonLeftContainer>
          <SkeletonCategoriesWrapper>
            <SkeletonTopSection>
              <SkeletonCategoriesScrollArea>
                <SkeletonCategoriesList>
                  {/* Collection Pills */}
                  <SkeletonCollectionPill $width="90px" />
                  <SkeletonCollectionPill $width="110px" />
                  <SkeletonCollectionPill $width="80px" />

                  <SkeletonVerticalSeparator />

                  {/* Categories */}
                  {[...Array(8)].map((_, i) => (
                    <SkeletonCategoryItem key={i}>
                      <SkeletonCategoryIcon />
                      <SkeletonCategoryText />
                    </SkeletonCategoryItem>
                  ))}
                </SkeletonCategoriesList>
              </SkeletonCategoriesScrollArea>

              <SkeletonFilterWrapper>
                <SkeletonFilterButton />
                <SkeletonMapButton />
              </SkeletonFilterWrapper>
            </SkeletonTopSection>

            <SkeletonSubCategories>
              <SkeletonSubCategoryPill $width="100px" />
              <SkeletonSubCategoryPill $width="130px" />
              <SkeletonSubCategoryPill $width="110px" />
              <SkeletonSubCategoryPill $width="90px" />
              <SkeletonSubCategoryPill $width="120px" />
            </SkeletonSubCategories>
          </SkeletonCategoriesWrapper>

          <SkeletonClassGridWrapper>
            <ClassesContentSkeleton />
          </SkeletonClassGridWrapper>
        </SkeletonLeftContainer>

        <SkeletonMapContainer>
          <SkeletonMapFloatButton />
          <SkeletonMapContent />
        </SkeletonMapContainer>
      </SkeletonGridContainer>
    </SkeletonPageWrapper>
  );
}
