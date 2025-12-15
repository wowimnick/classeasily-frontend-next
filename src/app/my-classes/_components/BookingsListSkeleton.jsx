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
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(props) => props.$radius || "6px"};
`;

// Matches FlippableCard / FaceBase styles
const SkeletonCard = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 20px; /* Matched to BookingClassCard */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const SkeletonImageArea = styled(SkeletonBase)`
  width: 100%;
  height: 150px; /* Matched to ImageContainer */
  border-radius: 0;
  flex-shrink: 0;
`;

const SkeletonContent = styled.div`
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Divider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 10px 0;
`;

const SkeletonFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CardSkeleton = () => (
  <SkeletonCard>
    <SkeletonImageArea />
    <SkeletonContent>
      {/* Session Tag (optional usually, but placeholder space) */}
      <SkeletonBase
        style={{ width: "30%", height: "16px", marginBottom: "8px", borderRadius: "12px" }}
      />

      {/* Title */}
      <SkeletonBase style={{ width: "90%", height: "20px", marginBottom: "6px" }} />

      {/* Business Name */}
      <SkeletonBase style={{ width: "60%", height: "14px", marginBottom: "12px" }} />

      {/* Price Tag */}
      <SkeletonBase style={{ width: "40px", height: "18px", borderRadius: "4px" }} />

      <Divider />

      {/* Date/Time Row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
        <SkeletonBase style={{ width: 16, height: 16, borderRadius: "50%" }} />
        <SkeletonBase style={{ flex: 1, height: 14 }} />
      </div>

      {/* Location Row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
        <SkeletonBase style={{ width: 16, height: 16, borderRadius: "50%" }} />
        <SkeletonBase style={{ width: "70%", height: 14 }} />
      </div>

      {/* Participants Row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <SkeletonBase style={{ width: 16, height: 16, borderRadius: "50%" }} />
        <SkeletonBase style={{ width: "40%", height: 14 }} />
      </div>
    </SkeletonContent>

    <SkeletonFooter>
      <SkeletonBase style={{ width: "80px", height: "28px", borderRadius: "14px" }} />
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