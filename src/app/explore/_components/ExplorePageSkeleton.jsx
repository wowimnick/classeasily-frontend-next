"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

// Shimmer animation
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
  animation: ${shimmer} 2s infinite;
  border-radius: ${(props) => props.$radius || "8px"};
`;

// --- HEADER SKELETON STYLES ---
const SkeletonHeaderWrapper = styled.div`
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
  }
`;

const SkeletonLogo = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const SkeletonSearchBar = styled(SkeletonBase)`
  width: 550px;
  height: 48px;
  border-radius: 40px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);

  @media (max-width: 768px) {
    display: none;
  }
`;

const SkeletonMobileSearchTrigger = styled(SkeletonBase)`
  display: none;
  @media (max-width: 768px) {
    display: block;
    flex: 1;
    margin: 0 0.75rem;
    height: 40px;
    border-radius: 40px;
  }
`;

const SkeletonUserSection = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const SkeletonUserPill = styled(SkeletonBase)`
  width: 80px;
  height: 40px;
  border-radius: 30px;
`;

// --- MAIN CONTENT SKELETONS ---

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
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
`;

const SkeletonCategoriesWrapper = styled.div`
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 101;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0px 8px 17px 5px rgb(0 0 0 / 2%);
`;

const SkeletonTopSection = styled.div`
  display: flex;
  align-items: stretch;
  background: #ffffff;
  position: relative;
`;

const SkeletonCategoriesScrollArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: stretch;
`;

const SkeletonCategories = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 1.2rem 1.5rem 1.2rem 1.5rem;
  align-items: center;
  background: #ffffff;

  @media (max-width: 767px) {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
`;

const SkeletonCategoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 80px;
  min-height: 48px;
  padding: 8px 4px;
  gap: 4px;

  @media (max-width: 768px) {
    width: 75px;
  }
`;

const SkeletonCategoryIcon = styled(SkeletonBase)`
  width: 48px;
  height: 48px;
  border-radius: 16px;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const SkeletonCategoryText = styled(SkeletonBase)`
  width: 60px;
  height: 12px;
  border-radius: 4px;
`;

const SkeletonFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  flex-shrink: 0;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const SkeletonFilterButton = styled(SkeletonBase)`
  height: 44px;
  width: 100px;
  border-radius: 20px;

  @media (max-width: 768px) {
    height: 40px;
    width: 40px;
  }
`;

const SkeletonSubCategories = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  padding: 0.5rem 1.5rem;
  gap: 0.75rem;
  width: 100%;
  border-top: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    gap: 0.5rem;
  }
`;

const SkeletonSubCategoryPill = styled(SkeletonBase)`
  height: 36px;
  width: ${(props) => props.$width || "120px"};
  border-radius: 20px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    height: 32px;
  }
`;

const SkeletonClassGridWrapper = styled.div`
  flex-grow: 1;
  padding: 1.5rem 2.5rem;
  overflow: hidden;

  @media (max-width: 1048px) {
    padding: 0.5rem;
  }
`;

const SkeletonClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(max(140px, calc((100% - 72px) / 4)), 1fr)
  );
  gap: clamp(16px, 3vw, 24px);
  overflow: hidden;

  @media (max-width: 1048px) {
    gap: 12px;
    grid-template-columns: repeat(
      auto-fit,
      minmax(max(140px, calc((100% - 36px) / 3)), 1fr)
    );
  }

  @media (max-width: 600px) {
    gap: 10px;
    grid-template-columns: repeat(
      auto-fit,
      minmax(max(140px, calc((100% - 10px) / 2)), 1fr)
    );
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
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 6px;

  @media (max-width: 600px) {
    margin-bottom: 4px;
    border-radius: 8px;
  }
`;

const SkeletonCardImage = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
  border-radius: 10px;

  @media (max-width: 600px) {
    border-radius: 8px;
  }
`;

const SkeletonCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;

  @media (max-width: 600px) {
    gap: 0.5px;
  }
`;

const SkeletonTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 1px;
`;

const SkeletonCardTitle = styled(SkeletonBase)`
  height: 18px;
  width: 70%;
  flex: 1;
  border-radius: 4px;

  @media (max-width: 600px) {
    height: 15px;
  }
`;

const SkeletonRating = styled(SkeletonBase)`
  height: 16px;
  width: 45px;
  border-radius: 4px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    height: 14px;
    width: 38px;
  }
`;

const SkeletonCompanyInfo = styled(SkeletonBase)`
  height: 16px;
  width: 60%;
  border-radius: 4px;
  margin: 2px 0;

  @media (max-width: 600px) {
    height: 14px;
    margin: 1px 0;
  }
`;

const SkeletonLocationRow = styled(SkeletonBase)`
  height: 16px;
  width: 50%;
  border-radius: 4px;
  margin: 2px 0;

  @media (max-width: 600px) {
    height: 14px;
    margin: 1px 0;
  }
`;

const SkeletonPriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
`;

const SkeletonPrice = styled(SkeletonBase)`
  height: 16px;
  width: 65px;
  border-radius: 4px;

  @media (max-width: 600px) {
    height: 14px;
    width: 55px;
  }
`;

const SkeletonPriceSeparator = styled(SkeletonBase)`
  height: 10px;
  width: 10px;
  border-radius: 50%;

  @media (max-width: 600px) {
    height: 8px;
    width: 8px;
  }
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

const SkeletonMapButton = styled(SkeletonBase)`
  position: absolute;
  top: 37px;
  left: 37px;
  width: 120px;
  height: 48px;
  border-radius: 20px;
  z-index: 2;
`;

export function ClassesContentSkeleton() {
  return (
    <SkeletonClassGrid>
      {[...Array(12)].map((_, i) => (
        <SkeletonClassCard key={i}>
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
              <SkeletonPriceSeparator />
              <SkeletonPrice />
            </SkeletonPriceRow>
          </SkeletonCardContent>
        </SkeletonClassCard>
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
          <SkeletonPriceSeparator />
          <SkeletonPrice />
        </SkeletonPriceRow>
      </SkeletonCardContent>
    </SkeletonClassCard>
  );
}

// Header skeleton with search bar included (visual placeholder)
export function ExploreHeaderSkeleton() {
  return (
    <SkeletonHeaderWrapper>
      <SkeletonLogo />
      <SkeletonSearchBar />
      <SkeletonMobileSearchTrigger />
      <SkeletonUserSection>
        <SkeletonUserPill />
      </SkeletonUserSection>
    </SkeletonHeaderWrapper>
  );
}

export default function ExplorePageSkeleton() {
  return (
    <SkeletonGridContainer>
      <SkeletonLeftContainer>
        <SkeletonCategoriesWrapper>
          <SkeletonTopSection>
            <SkeletonCategoriesScrollArea>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  padding: "0 1.5rem",
                }}
              >
                <SkeletonCategories>
                  {[...Array(8)].map((_, i) => (
                    <SkeletonCategoryItem key={i}>
                      <SkeletonCategoryIcon />
                      <SkeletonCategoryText />
                    </SkeletonCategoryItem>
                  ))}
                </SkeletonCategories>
              </div>
            </SkeletonCategoriesScrollArea>
            <SkeletonFilterWrapper>
              <SkeletonFilterButton />
            </SkeletonFilterWrapper>
          </SkeletonTopSection>

          <SkeletonSubCategories>
            <SkeletonSubCategoryPill $width="100px" />
            <SkeletonSubCategoryPill $width="130px" />
            <SkeletonSubCategoryPill $width="110px" />
            <SkeletonSubCategoryPill $width="95px" />
            <SkeletonSubCategoryPill $width="120px" />
            <SkeletonSubCategoryPill $width="105px" />
          </SkeletonSubCategories>
        </SkeletonCategoriesWrapper>

        <SkeletonClassGridWrapper>
          <ClassesContentSkeleton />
        </SkeletonClassGridWrapper>
      </SkeletonLeftContainer>

      <SkeletonMapContainer>
        <SkeletonMapButton />
        <SkeletonMapContent />
      </SkeletonMapContainer>
    </SkeletonGridContainer>
  );
}