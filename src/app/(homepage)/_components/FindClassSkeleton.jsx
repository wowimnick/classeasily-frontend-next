"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

// --- Shared Animations & Primitives ---

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const ShimmerBlock = styled.div`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: ${(props) => props.$radius || "4px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "20px"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

const SkeletonWrapper = styled.div`
  width: 100%;
  max-width: 1200px; /* Matches main content max-width */
  margin: 0 auto;
  padding: 4rem 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 3rem 1.5rem;
  }
`;

const HeaderGroup = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CarouselRow = styled.div`
  display: flex;
  gap: 24px;
  overflow: hidden;
  width: 100%;
  padding-bottom: 1rem;
`;

// --- 1. Find Class Skeleton (Matches HomeClassCard) ---

const ClassCardSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 250px;
  gap: 8px;
`;

const ClassImage = styled(ShimmerBlock)`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
`;

export function FindClassSkeleton() {
  return (
    <SkeletonWrapper>
      <HeaderGroup>
        <ShimmerBlock $width="40%" $height="36px" $mb="8px" />
        <ShimmerBlock $width="60%" $height="20px" />
      </HeaderGroup>

      <CarouselRow>
        {[1, 2, 3, 4, 5].map((i) => (
          <ClassCardSkeleton key={i}>
            <ClassImage />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <ShimmerBlock $width="70%" $height="16px" />
              <ShimmerBlock $width="15%" $height="16px" />
            </div>
            <ShimmerBlock $width="50%" $height="14px" />
            <ShimmerBlock $width="40%" $height="14px" />
          </ClassCardSkeleton>
        ))}
      </CarouselRow>
      
      <ShimmerBlock $width="150px" $height="20px" $mb="0" style={{marginTop: '1rem'}} />
    </SkeletonWrapper>
  );
}

// --- 2. Category Skeleton (Matches CategoryCard) ---

const CategoryCardSkeleton = styled(ShimmerBlock)`
  width: 250px;
  height: 250px;
  border-radius: 12px;
  flex-shrink: 0;
`;

export function CategorySkeleton() {
  return (
    <SkeletonWrapper>
      <HeaderGroup>
        <ShimmerBlock $width="35%" $height="36px" $mb="8px" />
        <ShimmerBlock $width="50%" $height="20px" />
      </HeaderGroup>

      <CarouselRow>
        {[1, 2, 3, 4, 5].map((i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </CarouselRow>
    </SkeletonWrapper>
  );
}

// --- 3. Testimonial Skeleton (Matches Testimonials.jsx) ---

const TestimonialCardSkeleton = styled.div`
  width: 400px;
  height: 280px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 1rem;
  
  @media (max-width: 480px) {
    width: 300px;
  }
`;

const TestimonialUserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
`;

export function TestimonialSkeleton() {
  return (
    <SkeletonWrapper>
      <HeaderGroup>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ShimmerBlock $width="30%" $height="36px" />
          <div style={{ display: 'flex', gap: '10px' }}>
             <ShimmerBlock $width="40px" $height="40px" $radius="50%" />
             <ShimmerBlock $width="40px" $height="40px" $radius="50%" />
          </div>
        </div>
      </HeaderGroup>

      <CarouselRow>
        {[1, 2, 3].map((i) => (
          <TestimonialCardSkeleton key={i}>
            {/* Stars & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <ShimmerBlock $width="100px" $height="16px" />
              <ShimmerBlock $width="80px" $height="16px" />
            </div>
            {/* Quote Lines */}
            <ShimmerBlock $width="100%" $height="16px" />
            <ShimmerBlock $width="95%" $height="16px" />
            <ShimmerBlock $width="90%" $height="16px" />
            
            {/* User Info */}
            <TestimonialUserRow>
              <ShimmerBlock $width="40px" $height="40px" $radius="50%" />
              <div style={{ flex: 1 }}>
                <ShimmerBlock $width="60%" $height="14px" $mb="4px" />
                <ShimmerBlock $width="40%" $height="12px" />
              </div>
            </TestimonialUserRow>
          </TestimonialCardSkeleton>
        ))}
      </CarouselRow>
    </SkeletonWrapper>
  );
}

// --- 4. Gift Card CTA Skeleton ---

const GiftSplitLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 5rem;
  align-items: center;
  width: 100%;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

const GiftLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const GiftRight = styled.div`
  height: 450px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 1024px) {
    height: 300px;
  }
`;

export function GiftCardSkeleton() {
  return (
    <SkeletonWrapper>
      <GiftSplitLayout>
        <GiftLeft>
          <ShimmerBlock $width="80%" $height="48px" />
          <ShimmerBlock $width="100%" $height="20px" />
          <ShimmerBlock $width="90%" $height="20px" />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <ShimmerBlock $width="100px" $height="20px" />
            <ShimmerBlock $width="100px" $height="20px" />
            <ShimmerBlock $width="100px" $height="20px" />
          </div>
          
          <ShimmerBlock $width="200px" $height="50px" $radius="8px" style={{marginTop: '1rem'}} />
        </GiftLeft>
        
        <GiftRight>
           {/* Mimics the tilted cards */}
           <ShimmerBlock 
             $width="350px" 
             $height="220px" 
             $radius="12px" 
             style={{ transform: 'rotate(-5deg) translateY(-20px)', opacity: 0.5 }} 
           />
           <ShimmerBlock 
             $width="350px" 
             $height="220px" 
             $radius="12px" 
             style={{ position: 'absolute', transform: 'rotate(5deg) translateY(20px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
           />
        </GiftRight>
      </GiftSplitLayout>
    </SkeletonWrapper>
  );
}