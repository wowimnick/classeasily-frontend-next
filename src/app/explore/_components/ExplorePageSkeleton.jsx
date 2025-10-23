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

// Main container matching GridContainer
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

// Left container
const SkeletonLeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
`;

// Categories skeleton
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

// Subcategories skeleton
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

// Content area skeleton
const SkeletonClassGridWrapper = styled.div`
  flex-grow: 1;
  padding: 1.5rem 2.5rem;
  overflow: hidden;

  @media (max-width: 1048px) {
    padding: 1rem;
  }
`;

const SkeletonHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebebeb;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`;

const SkeletonTitle = styled(SkeletonBase)`
  height: 24px;
  width: 300px;
  max-width: 100%;

  @media (max-width: 768px) {
    height: 20px;
    width: 200px;
  }
`;

const SkeletonCount = styled(SkeletonBase)`
  height: 20px;
  width: 80px;

  @media (max-width: 768px) {
    height: 18px;
  }
`;

const SkeletonClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: clamp(16px, 3vw, 24px);
  overflow: hidden;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
`;

// Updated Class card skeleton to match HomeClassCard exactly
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
`;

const SkeletonCardImage = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
  border-radius: 10px;
`;

const SkeletonCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
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
`;

const SkeletonRating = styled(SkeletonBase)`
  height: 16px;
  width: 45px;
  border-radius: 4px;
  flex-shrink: 0;
`;

const SkeletonCompanyInfo = styled(SkeletonBase)`
  height: 16px;
  width: 60%;
  border-radius: 4px;
  margin: 2px 0;
`;

const SkeletonLocationRow = styled(SkeletonBase)`
  height: 16px;
  width: 50%;
  border-radius: 4px;
  margin: 2px 0;
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
`;

const SkeletonPriceSeparator = styled(SkeletonBase)`
  height: 10px;
  width: 10px;
  border-radius: 50%;
`;

// Map skeleton
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

// Compact skeleton for content area only
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

// Header skeleton
export function ClassesHeaderSkeleton() {
  return (
    <SkeletonHeaderContainer>
      <SkeletonTitle />
      <SkeletonCount />
    </SkeletonHeaderContainer>
  );
}

// Full page skeleton
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
