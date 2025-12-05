"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

// --- Animations (Copied from ExplorePageSkeleton) ---
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
  border-radius: ${(props) => props.$radius || "4px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "20px"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

// --- Layout Wrapper ---
const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 4rem;
  margin: 1rem auto;
  width: 100%;
  margin-top: 3rem;
  box-sizing: border-box;

  @media (max-width: 1425px) { padding: 0 3rem; }
  @media (max-width: 768px) { padding: 0 1.5rem; margin: 1.5rem auto; }
  @media (max-width: 616px) { padding: 0 1rem; }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  margin-bottom: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const CarouselContainer = styled.div`
  display: flex;
  gap: 24px;
  width: 100%;
  overflow: hidden;
  padding: 4px;
  margin: -4px;
`;

const CardSkeleton = styled.div`
  flex: 0 0 auto;
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// Image Container to match ExplorePage styling
const CardImageContainer = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  margin-bottom: 6px;
  overflow: hidden;
  position: relative;
`;

const CardImage = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
  border-radius: 10px;
`;

export function FindClassSkeleton({ style }) {
  return (
    <SkeletonWrapper style={style}>
      <HeaderContainer>
        <HeaderLeft>
          {/* Title Line */}
          <SkeletonBase $width="200px" $height="28px" $radius="6px" />
          {/* Subtitle Line */}
          <SkeletonBase $width="280px" $height="16px" $radius="4px" />
        </HeaderLeft>
        
        {/* Buttons Placeholder (Desktop only) */}
        <div style={{ display: 'flex', gap: '8px' }}>
           <SkeletonBase $width="32px" $height="32px" $radius="50%" className="mobile-hide" />
           <SkeletonBase $width="32px" $height="32px" $radius="50%" className="mobile-hide" />
        </div>
      </HeaderContainer>

      <CarouselContainer>
        {[1, 2, 3, 4, 5].map((i) => (
          <CardSkeleton key={i}>
            <CardImageContainer>
              <CardImage />
            </CardImageContainer>
            {/* Title & Rating Row */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <SkeletonBase $width="65%" $height="16px" />
              <SkeletonBase $width="15%" $height="16px" />
            </div>
            {/* Business Name */}
            <SkeletonBase $width="50%" $height="14px" />
            {/* Price */}
            <SkeletonBase $width="35%" $height="14px" />
          </CardSkeleton>
        ))}
      </CarouselContainer>
      
      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-hide { display: none; }
        }
      `}</style>
    </SkeletonWrapper>
  );
}

// Fallbacks for other specific loaders
export const CategorySkeleton = () => (
    <SkeletonWrapper>
        <SkeletonBase $width="300px" $height="32px" $mb="1rem" />
        <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
            {[1,2,3,4,5].map(i => (
                <SkeletonBase key={i} $width="250px" $height="250px" $radius="12px" style={{ flexShrink: 0 }} />
            ))}
        </div>
    </SkeletonWrapper>
);