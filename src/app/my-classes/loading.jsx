"use client";

import BookingsListSkeleton from "./_components/BookingsListSkeleton";
import styled from "styled-components";

const LoadingContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 96px;

  @media (max-width: 768px) {
    padding: 24px 16px 96px;
  }
`;

const ContentContainer = styled.div`
  background: #f9f9f9;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
`;

const ContentHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: white;
`;

const BookingsList = styled.div`
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export default function Loading() {
  return (
    <LoadingContainer>
      <ContentContainer>
        <ContentHeader>
          <div
            style={{
              height: "28px",
              background: "#f0f0f0",
              width: "200px",
              borderRadius: "8px",
            }}
          />
        </ContentHeader>
        <BookingsList>
          <BookingsListSkeleton count={3} />
        </BookingsList>
      </ContentContainer>
    </LoadingContainer>
  );
}
