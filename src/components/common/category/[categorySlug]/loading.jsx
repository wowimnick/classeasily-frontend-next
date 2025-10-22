"use client";
import React from "react";
import styled, { keyframes } from "styled-components";

// --- Styled Components for Skeleton Loading ---
const shimmer = keyframes`
  100% {
    transform: translateX(100%);
  }
`;

const SkeletonWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
`;

const SkeletonHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4rem;
`;

const SkeletonTitle = styled.div`
  width: 60%;
  height: 48px;
  background: #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: ${shimmer} 1.5s infinite;
  }
`;

const SkeletonSubtitle = styled(SkeletonTitle)`
  width: 80%;
  height: 24px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
`;

const SkeletonCard = styled.div`
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
  overflow: hidden;
`;

const SkeletonImage = styled.div`
  height: 200px;
  background: #e0e0e0;
  position: relative;
  overflow: hidden;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: ${shimmer} 1.5s infinite;
  }
`;

const SkeletonContent = styled.div`
  padding: 1.5rem;
`;

const SkeletonLine = styled(SkeletonTitle)`
  height: 16px;
  margin-bottom: 0.75rem;
  width: ${(props) => props.width || "100%"};
`;

export default function Loading() {
  return (
    <SkeletonWrapper>
      <SkeletonHeader>
        <SkeletonTitle />
        <SkeletonSubtitle />
      </SkeletonHeader>
      <SkeletonGrid>
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonImage />
            <SkeletonContent>
              <SkeletonLine width="40%" />
              <SkeletonLine width="80%" />
              <SkeletonLine width="70%" />
            </SkeletonContent>
          </SkeletonCard>
        ))}
      </SkeletonGrid>
    </SkeletonWrapper>
  );
}
