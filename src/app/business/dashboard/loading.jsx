// src/app/business/dashboard/loading.jsx

"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  height: 100vh;
  background: #f5f5f5;
`;

const SidebarSkeleton = styled.div`
  width: 280px;
  background: #fff;
  padding: 20px;
  border-right: 1px solid #f0f0f0;
`;

const MainContentSkeleton = styled.div`
  flex: 1;
  padding: 20px;
`;

const SkeletonBlock = styled.div`
  background: #f0f0f0;
  border-radius: 4px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SidebarLogoSkeleton = styled(SkeletonBlock)`
  width: 40px;
  height: 40px;
  margin-bottom: 20px;
`;

const SidebarLinkSkeleton = styled(SkeletonBlock)`
  height: 16px;
  margin-bottom: 12px;
  width: ${(props) => props.width || "90%"};
  animation-delay: ${(props) => props.delay || "0s"};
`;

const MainHeaderSkeleton = styled(SkeletonBlock)`
  width: 200px;
  height: 32px;
  margin-bottom: 20px;
`;

const MainLineSkeleton = styled(SkeletonBlock)`
  height: 16px;
  margin-bottom: 12px;
  width: ${(props) => props.width || "95%"};
  animation-delay: ${(props) => props.delay || "0s"};
`;

export default function Loading() {
  return (
    <LoadingWrapper>
      {/* Sidebar skeleton */}
      <SidebarSkeleton>
        <SidebarLogoSkeleton />
        {[...Array(8)].map((_, i) => (
          <SidebarLinkSkeleton
            key={i}
            width={i % 3 === 0 ? "60%" : "90%"}
            delay={`${i * 0.1}s`}
          />
        ))}
      </SidebarSkeleton>

      {/* Main content skeleton */}
      <MainContentSkeleton>
        <MainHeaderSkeleton />
        {[...Array(12)].map((_, i) => (
          <MainLineSkeleton
            key={i}
            width={i % 4 === 0 ? "40%" : "95%"}
            delay={`${i * 0.1}s`}
          />
        ))}
      </MainContentSkeleton>
    </LoadingWrapper>
  );
}
