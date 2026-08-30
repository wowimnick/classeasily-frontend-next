"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  gap: 6px;
  cursor: default;
`;

const SkeletonPulse = styled.div`
  background: #f0f0f0;
  background-image: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #f8f8f8 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

const ImageSkeleton = styled(SkeletonPulse)`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  margin-bottom: 6px;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleSkeleton = styled(SkeletonPulse)`
  height: 16px;
  width: 85%;
  margin-bottom: 2px;
`;

const SubtitleSkeleton = styled(SkeletonPulse)`
  height: 13px;
  width: 50%;
`;

const LocationSkeleton = styled(SkeletonPulse)`
  height: 13px;
  width: 60%;
`;

const PriceSkeleton = styled(SkeletonPulse)`
  height: 14px;
  width: 40%;
  margin-top: 2px;
`;

const ClassCardSkeleton = () => {
  return (
    <SkeletonWrapper>
      <ImageSkeleton />
      <ContentContainer>
        <TitleSkeleton />
        <SubtitleSkeleton />
        <LocationSkeleton />
        <PriceSkeleton />
      </ContentContainer>
    </SkeletonWrapper>
  );
};

export default ClassCardSkeleton;