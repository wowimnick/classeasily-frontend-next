"use client";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const SkeletonBase = styled.div`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 104px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(props) => props.$radius || "6px"};
`;

const SkeletonCard = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  height: 340px; /* Significantly shorter to match compact card */
  display: flex;
  flex-direction: column;
`;

const SkeletonImageArea = styled(SkeletonBase)`
  width: 100%;
  height: 140px; /* Matches new compact image height */
  border-radius: 0;
`;

const SkeletonContent = styled.div`
  padding: 12px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SkeletonFooter = styled.div`
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CardSkeleton = () => (
  <SkeletonCard>
    <SkeletonImageArea />
    <SkeletonContent>
      <SkeletonBase
        style={{ width: "40px", height: "20px", marginBottom: "4px" }}
      />
      {/* Badge/Price */}
      <SkeletonBase style={{ width: "90%", height: "20px" }} /> {/* Title */}
      <SkeletonBase
        style={{ width: "50%", height: "14px", marginBottom: "8px" }}
      />
      {/* Business */}
      <div style={{ display: "flex", gap: 8 }}>
        <SkeletonBase style={{ width: 16, height: 16 }} />
        <SkeletonBase style={{ flex: 1, height: 16 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <SkeletonBase style={{ width: 16, height: 16 }} />
        <SkeletonBase style={{ flex: 1, height: 16 }} />
      </div>
    </SkeletonContent>
    <SkeletonFooter>
      <SkeletonBase style={{ width: "80px", height: "32px" }} />
    </SkeletonFooter>
  </SkeletonCard>
);

const BookingsListSkeleton = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </>
  );
};

export default BookingsListSkeleton;