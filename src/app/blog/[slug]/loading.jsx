"use client";
import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  100% {
    transform: translateX(100%);
  }
`;

const SkeletonWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 4rem;
`;

const SkeletonArticle = styled.div``;

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: #e0e0e0;
  border-radius: 4px;
  margin-bottom: ${(props) => props.mb || "1rem"};
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

const SkeletonSidebar = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
`;

export default function Loading() {
  return (
    <SkeletonWrapper>
      <SkeletonArticle>
        <SkeletonLine height="20px" width="30%" mb="1.5rem" />
        <SkeletonLine height="48px" width="90%" mb="0.5rem" />
        <SkeletonLine height="48px" width="70%" mb="2rem" />
        <SkeletonLine height="24px" width="50%" mb="4rem" />
        <SkeletonLine mb="1rem" />
        <SkeletonLine mb="1rem" />
        <SkeletonLine width="80%" mb="2rem" />
        <SkeletonLine mb="1rem" />
        <SkeletonLine width="90%" mb="1rem" />
      </SkeletonArticle>
      <SkeletonSidebar>
        <SkeletonLine height="24px" width="60%" mb="2rem" />
        <SkeletonLine height="16px" width="80%" mb="1.5rem" />
        <SkeletonLine height="16px" width="80%" mb="1.5rem" />
        <SkeletonLine height="16px" width="80%" mb="1.5rem" />
      </SkeletonSidebar>
    </SkeletonWrapper>
  );
}
