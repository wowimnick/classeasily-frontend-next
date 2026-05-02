// ClassOptionsContainer.jsx
"use client";

import React from "react";
import styled from "styled-components";
import dynamic from "next/dynamic";

// Dynamic import with loading state
const ClassOptionCard = dynamic(() => import("./ClassOptionCard"), {
  loading: () => <CardSkeleton />,
  ssr: false,
});


const Container = styled.div`
  width: 100%;
`;

const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const CardWrapper = styled.div`
  width: 100%;
  position: relative;
`;

const CardSkeleton = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  height: 320px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #767676;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px dashed #d1d1d1;
`;

const ClassOptionsContainer = ({
  options,
  classTitle,
  classImages,
  currency = "$",
  onBookNow,
  onSelectSlot,
  businessTimeZone,
}) => {
  if (!options || options.length === 0) {
    return (
      <Container>
        <EmptyState>
          <h3>No class options available</h3>
          <p>This class doesn't have any booking options set up yet.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <OptionsGrid>
        {options.map((option) => (
          <CardWrapper key={option.optionId}>
            <ClassOptionCard
              option={option}
              classTitle={classTitle}
              classImages={classImages}
              currency={currency}
              onBookNow={onBookNow}
              onSelectSlot={onSelectSlot}
              businessTimeZone={businessTimeZone}
            />
          </CardWrapper>
        ))}
      </OptionsGrid>
    </Container>
  );
};

export default ClassOptionsContainer;
