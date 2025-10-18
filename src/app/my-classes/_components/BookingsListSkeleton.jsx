"use client";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #f8f8f8 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(props) => props.$radius || "8px"};
`;

const SkeletonContainer = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const SkeletonHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const SkeletonImage = styled(SkeletonBase)`
  width: 72px;
  height: 72px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 60px;
    height: 60px;
  }
`;

const SkeletonInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SkeletonTitle = styled(SkeletonBase)`
  height: 20px;
  width: 60%;
  margin-bottom: 8px;
`;

const SkeletonSubtitle = styled(SkeletonBase)`
  height: 16px;
  width: 40%;
  margin-bottom: 6px;
`;

const SkeletonBadge = styled(SkeletonBase)`
  height: 24px;
  width: 80px;
  margin-left: auto;
`;

const SkeletonDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 16px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const SkeletonDetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SkeletonIcon = styled(SkeletonBase)`
  width: 15px;
  height: 15px;
  flex-shrink: 0;
`;

const SkeletonText = styled(SkeletonBase)`
  height: 14px;
  flex: 1;
`;

const SkeletonFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const SkeletonPrice = styled(SkeletonBase)`
  height: 24px;
  width: 100px;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const SkeletonActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const SkeletonButton = styled(SkeletonBase)`
  height: 36px;
  width: 100px;

  @media (max-width: 640px) {
    flex: 1;
  }
`;

const BookingCardSkeleton = () => (
  <SkeletonContainer>
    <SkeletonHeader>
      <SkeletonImage $radius="8px" />
      <SkeletonInfo>
        <SkeletonTitle />
        <SkeletonSubtitle />
        <SkeletonSubtitle style={{ width: "50%", marginTop: "8px" }} />
      </SkeletonInfo>
      <SkeletonBadge $radius="18px" />
    </SkeletonHeader>

    <SkeletonDetailsGrid>
      {[1, 2, 3, 4].map((item) => (
        <SkeletonDetailItem key={item}>
          <SkeletonIcon $radius="4px" />
          <SkeletonText />
        </SkeletonDetailItem>
      ))}
    </SkeletonDetailsGrid>

    <SkeletonFooter>
      <SkeletonPrice />
      <SkeletonActions>
        <SkeletonButton />
        <SkeletonButton />
      </SkeletonActions>
    </SkeletonFooter>
  </SkeletonContainer>
);

const BookingsListSkeleton = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <BookingCardSkeleton key={index} />
      ))}
    </>
  );
};

export default BookingsListSkeleton;
